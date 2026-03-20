export type ChurchAffiliation =
  | "1장년"
  | "2장년"
  | "청년부"
  | "중고등부"
  | "초등부";

export const CHURCH_AFFILIATIONS: ChurchAffiliation[] = [
  "1장년",
  "2장년",
  "청년부",
  "중고등부",
  "초등부",
];

export type ChurchRole = "member" | "admin";

export interface ChurchProfile {
  id: string;
  name: string;
  affiliation: ChurchAffiliation;
  role: ChurchRole;
  birth_hint: string | null;
  device_fingerprint: string | null;
  /** Non-null when this profile is a duplicate. Points to the canonical profile's id. */
  canonical_id: string | null;
  /** Consecutive weeks all 3 missions completed. */
  streak_count: number;
  /** YYYY-MM-DD of the Monday that was last fully completed. */
  last_completed_week: string | null;
  created_at: string;
  updated_at: string;
}

/** Per-verse memorization status. Transitions: not_started → daily_done → mastered */
export type VerseStatus = "not_started" | "daily_done" | "mastered";

export interface ChurchVerseMeta {
  id: number;
  is_active: boolean;
  is_key_verse: boolean;
}

// ─── Weekly challenge ──────────────────────────────────────

export interface MissionState {
  done: boolean;
  current: number;
  target: number;
}

export interface WeeklyMissions {
  consistency: MissionState; // active ≥ 4 days this week
  progress: MissionState;    // daily_done ≥ 3 this week
  completion: MissionState;  // mastered ≥ 1 this week
  completedCount: number;    // 0–3
  allComplete: boolean;
}

// ─── Admin stats ──────────────────────────────────────────────

export interface AffiliationStat {
  affiliation: ChurchAffiliation;
  userCount: number;
  avgMasteredPct: number;
  avgDailyPct: number;
}

export interface UserRankStat {
  rank: number;
  name: string;
  affiliation: ChurchAffiliation;
  masteredCount: number;
  masteredPct: number;
}

export interface ActivityEntry {
  name: string;
  affiliation: ChurchAffiliation;
  lastActiveAt: string;
  masteredCount: number;
}

export interface WeeklyTrend {
  weekLabel: string;
  newMastered: number;
}

export interface AdminStats {
  totalUsers: number;
  totalMasteredRate: number;
  byAffiliation: AffiliationStat[];
  ranking: UserRankStat[];
  recentActivity: ActivityEntry[];
  weeklyTrend: WeeklyTrend[];
}
