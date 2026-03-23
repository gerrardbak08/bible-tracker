"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChurchProfile, MissionState, VerseStatus, WeeklyMissions } from "@/types/church";

// ── Week helpers (local timezone — consistent with user perception) ──

function getWeekStartLocal(nowMs: number = Date.now()): Date {
  const d = new Date(nowMs);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Mission computation (pure) ─────────────────────────────

function computeMissions(
  progressDates: Record<number, string>,
  getStatus: (id: number) => VerseStatus
): WeeklyMissions {
  const weekStart = getWeekStartLocal();
  const weekStartMs = weekStart.getTime();

  const activeDaysSet = new Set<string>();
  let dailyThisWeek = 0;
  let masteredThisWeek = 0;

  Object.entries(progressDates).forEach(([verseIdStr, updatedAt]) => {
    if (!updatedAt) return;
    const updatedMs = new Date(updatedAt).getTime();
    if (updatedMs < weekStartMs) return; // before this week

    // Local date string for the "active day" key
    const localDate = new Date(updatedAt);
    activeDaysSet.add(toLocalDateStr(localDate));

    const status = getStatus(Number(verseIdStr));
    if (status === "daily_done" || status === "mastered" || status === "mastered_daily_done") dailyThisWeek++;
    if (status === "mastered" || status === "mastered_daily_done") masteredThisWeek++;
  });

  const activeDays = activeDaysSet.size;

  const m1: MissionState = { done: activeDays >= 4, current: activeDays, target: 4 };
  const m2: MissionState = { done: dailyThisWeek >= 3, current: dailyThisWeek, target: 3 };
  const m3: MissionState = { done: masteredThisWeek >= 1, current: masteredThisWeek, target: 1 };

  const completedCount = Number(m1.done) + Number(m2.done) + Number(m3.done);

  return {
    consistency: m1,
    progress: m2,
    completion: m3,
    completedCount,
    allComplete: completedCount === 3,
  };
}

// ── Hook ───────────────────────────────────────────────────

export function useWeeklyChallenge(
  profile: ChurchProfile | null,
  progressDates: Record<number, string>,
  getStatus: (id: number) => VerseStatus,
  /** auth.uid() — always the current device's own profile id. */
  userId: string | null
) {
  const [localStreak, setLocalStreak] = useState(0);
  const [localLastWeek, setLocalLastWeek] = useState<string | null>(null);
  /** True when a streak was reset on mount (missed ≥ 1 week). */
  const [streakBroken, setStreakBroken] = useState(false);

  /** Guards against processing before the profile has been read. */
  const initializedRef = useRef(false);
  /** Prevents double-firing the streak increment within one render cycle. */
  const streakUpdatingRef = useRef(false);

  // ── 1. Initialize streak from profile; reset if streak is broken ──
  useEffect(() => {
    if (!profile || initializedRef.current) return;

    async function initStreak() {
      if (!profile || initializedRef.current) return;
      initializedRef.current = true;

      const prevWeekStr = toLocalDateStr(
        getWeekStartLocal(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      const lastWeek = profile.last_completed_week;

      // If last completion was more than 1 week ago, the streak is broken
      if (profile.streak_count > 0 && lastWeek && lastWeek < prevWeekStr) {
        setLocalStreak(0);
        setLocalLastWeek(null);
        setStreakBroken(true);
        if (userId) {
          const { error } = await supabase
            .from("church_profiles")
            .update({ streak_count: 0, last_completed_week: null })
            .eq("id", userId);
          if (error) console.warn("Streak reset failed:", error);
        }
      } else {
        setLocalStreak(profile.streak_count);
        setLocalLastWeek(lastWeek ?? null);
      }
    }

    initStreak();
  }, [profile, userId]);

  // ── 2. Compute missions (memoized) ────────────────────────
  const missions = useMemo(
    () => computeMissions(progressDates, getStatus),
    [progressDates, getStatus]
  );

  // ── 3. Record streak when all missions complete ───────────
  useEffect(() => {
    if (!missions.allComplete || !userId || !initializedRef.current) return;
    if (streakUpdatingRef.current) return;

    const currentWeekStr = toLocalDateStr(getWeekStartLocal());
    if (localLastWeek === currentWeekStr) return; // already recorded this week

    async function recordStreak() {
      if (!userId || streakUpdatingRef.current) return;
      streakUpdatingRef.current = true;

      const newStreak = localStreak + 1;
      setLocalStreak(newStreak);
      setLocalLastWeek(currentWeekStr);

      const { error } = await supabase
        .from("church_profiles")
        .update({ streak_count: newStreak, last_completed_week: currentWeekStr })
        .eq("id", userId);
      if (error) console.warn("Streak update failed:", error);
      streakUpdatingRef.current = false;
    }

    recordStreak();
  }, [missions.allComplete, userId, localLastWeek, localStreak]);

  // ── 4. Dynamic messages ───────────────────────────────────
  //
  // Priority (highest first):
  //   1. Completed + streak ≥ 2   → streak celebration
  //   2. Completed                → completion celebration
  //   3. Near completion (2/3)    → near-finish encouragement
  //   4. Started (1/3)            → early encouragement
  //   5. Streak was broken        → gentle restart nudge
  //   6. No activity              → opening call to action

  function getMotivationMsg(): string {
    if (missions.allComplete) {
      if (localStreak >= 2) return `${localStreak}주 연속 달성 중입니다 🔥`;
      return "이번 주 챌린지 완료 🎉";
    }
    if (missions.completedCount === 2) return "조금만 더 하면 완료입니다";
    if (missions.completedCount === 1) return "이번 주도 잘하고 있어요";
    if (streakBroken) return "이번 주 다시 시작해보세요";
    return "이번 주 챌린지를 시작해보세요";
  }

  // Hint: always shows the single smallest remaining action.
  // Priority: closest-to-completion → most immediately actionable.
  function getHint(): string {
    if (missions.allComplete) return "";

    const m2Rem = missions.progress.target - missions.progress.current;
    const m1Rem = missions.consistency.target - missions.consistency.current;

    // Only completion (m3) left
    if (missions.consistency.done && missions.progress.done) {
      return "구절 1개만 완주하면 이번 주 챌린지 완료입니다";
    }

    // One practice away from progress goal
    if (!missions.progress.done && m2Rem === 1) {
      return "1번만 더 암송하면 전진 달성입니다";
    }

    // One day away from consistency goal
    if (!missions.consistency.done && m1Rem === 1) {
      return "오늘 하루만 더 활동하면 꾸준함 달성 완료입니다";
    }

    // Both progress and consistency incomplete — show the closer one
    if (!missions.progress.done && !missions.consistency.done) {
      return m2Rem <= m1Rem
        ? `${m2Rem}번 더 암송하면 전진 달성입니다`
        : `${m1Rem}일 더 활동하면 꾸준함 달성입니다`;
    }

    // Only progress incomplete
    if (!missions.progress.done) {
      return `${m2Rem}번 더 암송하면 전진 달성입니다`;
    }

    // Only consistency incomplete
    if (!missions.consistency.done) {
      return `${m1Rem}일 더 활동하면 꾸준함 달성입니다`;
    }

    return "구절 1개만 완주하면 이번 주 챌린지 완료입니다";
  }

  return {
    missions,
    streak: localStreak,
    motivationMsg: getMotivationMsg(),
    /** Always a non-empty string when !allComplete. Empty string when complete. */
    hint: getHint(),
  };
}
