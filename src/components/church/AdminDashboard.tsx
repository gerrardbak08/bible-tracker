"use client";

import { motion } from "framer-motion";
import { useChurchAdmin } from "@/hooks/church/useChurchAdmin";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return `${Math.floor(d / 7)}주 전`;
}

const RANK_COLORS = [
  { bg: "#fef3c7", text: "#b45309", label: "🥇" },
  { bg: "#f1f5f9", text: "#475569", label: "🥈" },
  { bg: "#fdf4e7", text: "#92400e", label: "🥉" },
];

export default function AdminDashboard() {
  const { stats, isLoading, fetchError } = useChurchAdmin();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Loading stats...
          </p>
        </div>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-[13px] font-bold text-slate-800">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white"
          >
            새로고침
          </button>
        </div>
      </main>
    );
  }

  if (!stats) return null;

  const maxMastered = Math.max(...stats.weeklyTrend.map((w) => w.newMastered), 1);
  const hasWeeklyData = stats.weeklyTrend.some((w) => w.newMastered > 0);

  return (
    <main className="min-h-screen bg-white py-10 sm:py-16">
      <div className="mx-auto w-full max-w-[480px] px-5 sm:px-0 space-y-10">

        {/* Header */}
        <header className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin</span>
          </div>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight">암송 현황 대시보드</h1>
          <p className="text-[12px] font-medium text-slate-400">암송대회 관리자</p>
        </header>

        {/* Top stats */}
        <section className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              등록 인원
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">{stats.totalUsers}</span>
              <span className="text-[11px] font-bold text-slate-400">명</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              전체 암송 완료율
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">{stats.totalMasteredRate}</span>
              <span className="text-[11px] font-bold text-slate-400">%</span>
            </div>
          </motion.div>
        </section>

        {/* Overall progress bar */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            전체 진도
          </p>
          <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-slate-900"
              initial={{ width: 0 }}
              animate={{ width: `${stats.totalMasteredRate}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="text-[11px] font-medium text-slate-400">
            {stats.totalUsers}명 × 18구절 기준 평균 달성률
          </p>
        </section>

        {/* Per-affiliation breakdown */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-900 pb-2">
            소속별 현황
          </h2>
          <div className="space-y-3">
            {stats.byAffiliation.map((row, i) => (
              <motion.div
                key={row.affiliation}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-2xl border bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-800">{row.affiliation}</span>
                    <span className="text-[10px] font-bold text-slate-400">{row.userCount}명</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-500">완료 {row.avgMasteredPct}%</span>
                    <span className="text-[11px] font-bold text-amber-500">오늘 {row.avgDailyPct}%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-slate-900"
                      initial={{ width: 0 }}
                      animate={{ width: `${row.avgMasteredPct}%` }}
                      transition={{ duration: 1, delay: i * 0.06 }}
                    />
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-amber-300/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${row.avgDailyPct}%` }}
                      transition={{ duration: 1, delay: i * 0.06 + 0.15 }}
                    />
                  </div>
                  {row.userCount === 0 && (
                    <p className="text-[10px] font-medium text-slate-300">등록 인원 없음</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Personal Ranking ─────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-900 pb-2">
            개인 랭킹
          </h2>

          {stats.ranking.length === 0 ? (
            <p className="text-[12px] font-medium text-slate-300 py-4 text-center">
              등록된 멤버가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.ranking.map((u, i) => {
                const medal = RANK_COLORS[i] ?? null;
                return (
                  <motion.div
                    key={u.name + u.affiliation}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                    style={medal ? { backgroundColor: medal.bg, borderColor: "transparent" } : {}}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div className="shrink-0 w-7 text-center">
                        {medal ? (
                          <span className="text-[16px]">{medal.label}</span>
                        ) : (
                          <span className="text-[11px] font-black text-slate-400">{u.rank}</span>
                        )}
                      </div>

                      {/* Name + affiliation */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className="text-[14px] font-black truncate"
                            style={{ color: medal ? medal.text : "#1e293b" }}
                          >
                            {u.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            {u.affiliation}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-1.5 relative h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
                          <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ backgroundColor: medal ? medal.text : "#0f172a" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${u.masteredPct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.04 }}
                          />
                        </div>
                      </div>

                      {/* Count */}
                      <div className="shrink-0 text-right">
                        <span
                          className="text-[15px] font-black"
                          style={{ color: medal ? medal.text : "#0f172a" }}
                        >
                          {u.masteredCount}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400"> / 18</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Recent Activity ──────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-900 pb-2">
            최근 활동
          </h2>

          {stats.recentActivity.length === 0 ? (
            <p className="text-[12px] font-medium text-slate-300 py-4 text-center">
              활동 기록이 없습니다.
            </p>
          ) : (
            <div className="rounded-2xl border bg-white shadow-sm divide-y divide-slate-50">
              {stats.recentActivity.map((entry, i) => (
                <motion.div
                  key={entry.name + entry.affiliation}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Avatar */}
                  <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-[12px] font-black text-slate-600">
                      {entry.name.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[13px] font-black text-slate-800 truncate">
                        {entry.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {entry.affiliation}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {entry.masteredCount > 0
                        ? `${entry.masteredCount}구절 완료`
                        : "암송 진행 중"}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="shrink-0 text-[11px] font-bold text-slate-400">
                    {relativeTime(entry.lastActiveAt)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── Weekly Progress Trend ────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-900 pb-2">
            주간 암송 추이
          </h2>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            {!hasWeeklyData ? (
              <p className="text-[12px] font-medium text-slate-300 py-4 text-center">
                아직 주간 데이터가 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Bar chart */}
                <div className="flex items-end gap-1.5 h-20">
                  {stats.weeklyTrend.map((w, i) => {
                    const heightPct = maxMastered > 0 ? (w.newMastered / maxMastered) * 100 : 0;
                    const isLast = i === stats.weeklyTrend.length - 1;
                    return (
                      <div key={w.weekLabel} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400">
                          {w.newMastered > 0 ? w.newMastered : ""}
                        </span>
                        <div className="w-full flex items-end" style={{ height: 52 }}>
                          <motion.div
                            className="w-full rounded-t-md"
                            style={{
                              backgroundColor: isLast ? "#0f172a" : "#e2e8f0",
                              minHeight: w.newMastered > 0 ? 4 : 2,
                            }}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(heightPct, w.newMastered > 0 ? 8 : 2)}%` }}
                            transition={{ duration: 0.7, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Week labels */}
                <div className="flex gap-1.5">
                  {stats.weeklyTrend.map((w, i) => (
                    <div key={w.weekLabel} className="flex-1 text-center">
                      <span
                        className="text-[9px] font-bold"
                        style={{
                          color: i === stats.weeklyTrend.length - 1 ? "#0f172a" : "#94a3b8",
                        }}
                      >
                        {w.weekLabel}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] font-medium text-slate-400">
                  주차별 완료(mastered) 전환 구절 수
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8">
          <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.3em]">
            &copy; 2026 CHURCH OF LOVE & PEACE
          </p>
        </footer>
      </div>
    </main>
  );
}
