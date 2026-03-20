"use client";

import { motion } from "framer-motion";
import { useChurchAdmin } from "@/hooks/church/useChurchAdmin";

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
                {/* Affiliation + user count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-800">
                      {row.affiliation}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {row.userCount}명
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-500">
                      완료 {row.avgMasteredPct}%
                    </span>
                    <span className="text-[11px] font-bold text-amber-500">
                      오늘 {row.avgDailyPct}%
                    </span>
                  </div>
                </div>

                {/* Mastery progress bar */}
                <div className="space-y-1.5">
                  <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-slate-900"
                      initial={{ width: 0 }}
                      animate={{ width: `${row.avgMasteredPct}%` }}
                      transition={{ duration: 1, delay: i * 0.06 }}
                    />
                    {/* Daily overlay */}
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
