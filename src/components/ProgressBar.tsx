"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
  mandatoryCompletedCount: number;
  mandatoryTotalCount: number;
  todayCheckedCount?: number;
  themeColor?: string;
}

export default function ProgressBar({
  completedCount,
  totalCount,
  mandatoryCompletedCount,
  mandatoryTotalCount,
  todayCheckedCount = 0,
  themeColor = "#000000",
}: ProgressBarProps) {
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
      <div className="flex items-end justify-between mb-5">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery Progress</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black tracking-tight" style={{ color: themeColor }}>{percentage}%</span>
            <span className="text-xs font-bold text-slate-400 uppercase">done</span>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Mastered</span>
            <span
              className="rounded-lg px-2.5 py-1 text-[13px] font-bold text-white"
              style={{ backgroundColor: themeColor, border: `1px solid ${themeColor}` }}
            >
              {completedCount} <span className="text-slate-500">/</span> {totalCount}
            </span>
          </div>
        </div>
      </div>

      <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: themeColor }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="mt-6 space-y-3">
        {/* Essential Status — primary competition metric, shown first and prominently */}
        <div className="rounded-xl border-2 p-4" style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}06` }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">필수 구절 달성</p>
            <span className="text-lg font-black" style={{ color: themeColor }}>
              {mandatoryTotalCount > 0 ? Math.round((mandatoryCompletedCount / mandatoryTotalCount) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-black text-slate-800">{mandatoryCompletedCount} / {mandatoryTotalCount} 구절</span>
            {mandatoryCompletedCount === mandatoryTotalCount && mandatoryTotalCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: themeColor }}>완료!</span>
            )}
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: themeColor }}
              initial={{ width: 0 }}
              animate={{ width: `${mandatoryTotalCount > 0 ? (mandatoryCompletedCount / mandatoryTotalCount) * 100 : 0}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Today's Commitment */}
        <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-600">
              <Flame size={14} />
            </div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-tight">Today&apos;s Commitment</span>
          </div>
          <span className="text-sm font-black text-amber-600">{todayCheckedCount} 구절 완료</span>
        </div>

        {/* Overall remaining */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">전체 잔여</p>
            <span className="text-sm font-black text-slate-800">{totalCount - completedCount} 구절 남음</span>
          </div>
        </div>
      </div>
    </div>
  );
}
