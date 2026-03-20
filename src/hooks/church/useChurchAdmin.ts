"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ActivityEntry,
  AdminStats,
  AffiliationStat,
  CHURCH_AFFILIATIONS,
  ChurchAffiliation,
  UserRankStat,
  WeeklyTrend,
} from "@/types/church";

const TOTAL_VERSES = 18;

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function getWeekLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function computeStats(
  profiles: { id: string; name: string; affiliation: string; updated_at: string }[],
  allProgress: { user_id: string; status: string; updated_at: string | null }[]
): AdminStats {
  // ── Per-user tally ──────────────────────────────────────────
  const perUser: Record<string, { mastered: number; daily: number }> = {};
  allProgress.forEach((row) => {
    if (!perUser[row.user_id]) perUser[row.user_id] = { mastered: 0, daily: 0 };
    if (row.status === "mastered") perUser[row.user_id].mastered++;
    if (row.status === "daily_done" || row.status === "mastered")
      perUser[row.user_id].daily++;
  });

  // ── Overall mastery rate ────────────────────────────────────
  const totalMastered = Object.values(perUser).reduce(
    (sum, p) => sum + p.mastered,
    0
  );
  const totalMasteredRate =
    profiles.length > 0
      ? Math.round((totalMastered / (profiles.length * TOTAL_VERSES)) * 100)
      : 0;

  // ── Per-affiliation breakdown ───────────────────────────────
  const groups: Record<string, typeof profiles> = {};
  profiles.forEach((p) => {
    if (!groups[p.affiliation]) groups[p.affiliation] = [];
    groups[p.affiliation].push(p);
  });

  const byAffiliation: AffiliationStat[] = CHURCH_AFFILIATIONS.map(
    (affiliation) => {
      const members = groups[affiliation] ?? [];
      if (members.length === 0) {
        return { affiliation, userCount: 0, avgMasteredPct: 0, avgDailyPct: 0 };
      }
      const totalMasteredPct = members.reduce((sum, m) => {
        const prog = perUser[m.id] ?? { mastered: 0, daily: 0 };
        return sum + (prog.mastered / TOTAL_VERSES) * 100;
      }, 0);
      const totalDailyPct = members.reduce((sum, m) => {
        const prog = perUser[m.id] ?? { mastered: 0, daily: 0 };
        return sum + (prog.daily / TOTAL_VERSES) * 100;
      }, 0);
      return {
        affiliation,
        userCount: members.length,
        avgMasteredPct: Math.round(totalMasteredPct / members.length),
        avgDailyPct: Math.round(totalDailyPct / members.length),
      };
    }
  );

  // ── Personal Ranking ────────────────────────────────────────
  const ranking: UserRankStat[] = profiles
    .map((p) => {
      const prog = perUser[p.id] ?? { mastered: 0, daily: 0 };
      return {
        rank: 0,
        name: p.name,
        affiliation: p.affiliation as ChurchAffiliation,
        masteredCount: prog.mastered,
        masteredPct: Math.round((prog.mastered / TOTAL_VERSES) * 100),
      };
    })
    .sort(
      (a, b) =>
        b.masteredCount - a.masteredCount ||
        a.name.localeCompare(b.name, "ko")
    )
    .map((u, i) => ({ ...u, rank: i + 1 }));

  // ── Recent Activity ─────────────────────────────────────────
  const lastActivity: Record<string, string> = {};
  allProgress.forEach((r) => {
    if (r.updated_at) {
      if (
        !lastActivity[r.user_id] ||
        r.updated_at > lastActivity[r.user_id]
      ) {
        lastActivity[r.user_id] = r.updated_at;
      }
    }
  });

  const recentActivity: ActivityEntry[] = profiles
    .map((p) => {
      const prog = perUser[p.id] ?? { mastered: 0, daily: 0 };
      return {
        name: p.name,
        affiliation: p.affiliation as ChurchAffiliation,
        lastActiveAt: lastActivity[p.id] ?? p.updated_at,
        masteredCount: prog.mastered,
      };
    })
    .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))
    .slice(0, 10);

  // ── Weekly Trend (last 6 weeks) ─────────────────────────────
  const weekCounts: Record<string, number> = {};
  allProgress
    .filter((r) => r.status === "mastered" && r.updated_at)
    .forEach((r) => {
      const week = getWeekStart(new Date(r.updated_at!));
      weekCounts[week] = (weekCounts[week] ?? 0) + 1;
    });

  const now = new Date();
  const weeklyTrend: WeeklyTrend[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekKey = getWeekStart(d);
    weeklyTrend.push({
      weekLabel: getWeekLabel(weekKey),
      newMastered: weekCounts[weekKey] ?? 0,
    });
  }

  return {
    totalUsers: profiles.length,
    totalMasteredRate,
    byAffiliation,
    ranking,
    recentActivity,
    weeklyTrend,
  };
}

export function useChurchAdmin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdminStats() {
      setIsLoading(true);

      const { data: profiles, error: pErr } = await supabase
        .from("church_profiles")
        .select("id, name, affiliation, updated_at")
        .is("canonical_id", null);

      if (pErr) {
        setFetchError("멤버 데이터를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      const { data: allProgress, error: prErr } = await supabase
        .from("church_progress")
        .select("user_id, status, updated_at");

      if (prErr) {
        setFetchError("진도 데이터를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      const computed = computeStats(
        (profiles ?? []).map((p) => ({
          id: p.id as string,
          name: p.name as string,
          affiliation: p.affiliation as ChurchAffiliation,
          updated_at: p.updated_at as string,
        })),
        (allProgress ?? []).map((r) => ({
          user_id: r.user_id as string,
          status: r.status as string,
          updated_at: r.updated_at as string | null,
        }))
      );

      setStats(computed);
      setIsLoading(false);
    }

    fetchAdminStats();
  }, []);

  return { stats, isLoading, fetchError };
}
