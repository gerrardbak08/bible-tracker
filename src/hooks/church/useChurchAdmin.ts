"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AdminStats,
  AffiliationStat,
  CHURCH_AFFILIATIONS,
  ChurchAffiliation,
} from "@/types/church";

const TOTAL_VERSES = 18;

function computeStats(
  profiles: { id: string; affiliation: string }[],
  allProgress: { user_id: string; status: string }[]
): AdminStats {
  // Tally mastered / daily counts per user
  const perUser: Record<string, { mastered: number; daily: number }> = {};
  allProgress.forEach((row) => {
    if (!perUser[row.user_id]) perUser[row.user_id] = { mastered: 0, daily: 0 };
    if (row.status === "mastered") perUser[row.user_id].mastered++;
    if (row.status === "daily_done" || row.status === "mastered")
      perUser[row.user_id].daily++;
  });

  // Overall mastery rate
  const totalMastered = Object.values(perUser).reduce(
    (sum, p) => sum + p.mastered,
    0
  );
  const totalMasteredRate =
    profiles.length > 0
      ? Math.round((totalMastered / (profiles.length * TOTAL_VERSES)) * 100)
      : 0;

  // Per-affiliation breakdown
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

  return {
    totalUsers: profiles.length,
    totalMasteredRate,
    byAffiliation,
  };
}

export function useChurchAdmin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdminStats() {
      setIsLoading(true);

      // Fetch canonical profiles only (canonical_id IS NULL = not a duplicate)
      const { data: profiles, error: pErr } = await supabase
        .from("church_profiles")
        .select("id, affiliation")
        .is("canonical_id", null);

      if (pErr) {
        setFetchError("멤버 데이터를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      // Fetch all progress (admin RLS allows this)
      const { data: allProgress, error: prErr } = await supabase
        .from("church_progress")
        .select("user_id, status");

      if (prErr) {
        setFetchError("진도 데이터를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      const computed = computeStats(
        (profiles ?? []).map((p) => ({
          id: p.id as string,
          affiliation: p.affiliation as ChurchAffiliation,
        })),
        (allProgress ?? []).map((r) => ({
          user_id: r.user_id as string,
          status: r.status as string,
        }))
      );

      setStats(computed);
      setIsLoading(false);
    }

    fetchAdminStats();
  }, []);

  return { stats, isLoading, fetchError };
}
