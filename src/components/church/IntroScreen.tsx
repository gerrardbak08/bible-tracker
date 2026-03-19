"use client";

import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Flame } from "lucide-react";

interface IntroScreenProps {
  onStart: () => void;
}

export default function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[400px] space-y-10 text-center"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-900 text-white shadow-lg">
            <BookOpen size={28} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-[24px] font-black text-slate-900 tracking-tight leading-tight break-keep">
              성령의 인도함을 받는 삶
            </h1>
            <p className="text-[14px] font-semibold text-indigo-500">
              성경 암송 대회 2026
            </p>
          </div>
          <p className="text-[13px] font-medium text-slate-500 leading-relaxed break-keep max-w-xs mx-auto">
            매일 말씀을 암송하고 진도를 기록하세요.
            <br />
            소속 전체의 암송 현황을 함께 확인할 수 있습니다.
          </p>
        </div>

        {/* Usage hints */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-left space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-600">
              <Flame size={13} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-700">오늘 암송</p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">오늘 연습한 구절을 불꽃 버튼으로 표시합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
              <span className="text-[10px] font-black">✓</span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-700">암송 완료</p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">완전히 외운 구절은 체크 버튼으로 완료 처리합니다.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-[15px] font-black text-white transition-all hover:bg-slate-700 active:scale-95"
        >
          암송 시작하기
          <ChevronRight size={16} />
        </button>

        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          사랑과평안의교회 · 2026
        </p>
      </motion.div>
    </main>
  );
}
