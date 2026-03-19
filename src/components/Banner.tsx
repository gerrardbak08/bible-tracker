"use client";

import { useEffect, useState } from "react";
import { Timer, Trophy, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { TARGET_DATE } from "@/constants/data";

function calculateDayDiff(targetDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface BannerProps {
  totalMandatoryPercentage?: number;
}

export default function Banner({ totalMandatoryPercentage = 0 }: BannerProps) {
  const [dDay, setDDay] = useState(() => calculateDayDiff(TARGET_DATE));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDDay(calculateDayDiff(TARGET_DATE));
    }, 1000 * 60 * 60);

    return () => window.clearInterval(interval);
  }, []);

  const dDayLabel = dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-DAY" : `D+${Math.abs(dDay)}`;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
      
      {/* Background Gradient Glows */}
      <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl opacity-40" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl opacity-20" />

      <div className="relative z-10 space-y-6">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-indigo-300 border border-white/5">
            <Trophy size={10} />
            CONTEST 2026
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400">
              <Calendar size={12} />
              <span>2026. 05. 24</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-black text-[#E4F7BA]">
                <Timer size={12} />
                <span>{dDayLabel}</span>
            </div>
          </div>
        </div>

        {/* Hero Section - Identically Flex-row for all screens */}
        <div className="flex flex-row items-center justify-between gap-4 text-left">
          {/* Title Area */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <h1 className="text-[20px] leading-[1.15] font-black tracking-[-0.04em] sm:text-[26px] break-keep">
              사랑과평안의교회 <br />
              <span className="text-indigo-400">성경 암송 대회</span>
            </h1>
            <p className="text-[12px] font-bold text-indigo-200/60 sm:text-sm">성령의 인도함을 받는 삶</p>
          </div>

          {/* Essential Avg Box - Perfectly Aligned */}
          <div className="relative rounded-2xl bg-white/[0.04] p-3 border border-white/5 min-w-[130px] sm:min-w-[150px] shrink-0">
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Essential Avg.</span>
              <div className="h-1.5 w-1.5 rounded-full bg-[#E4F7BA] animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#E4F7BA] tracking-tight tabular-nums sm:text-3xl">{totalMandatoryPercentage}%</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">done</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/5 mt-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${totalMandatoryPercentage}%` }}
                className="h-full bg-[#E4F7BA]" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
