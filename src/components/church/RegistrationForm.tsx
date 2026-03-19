"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronDown, KeyRound, User } from "lucide-react";
import { CHURCH_AFFILIATIONS, ChurchAffiliation } from "@/types/church";

interface RegistrationFormProps {
  onRegister: (
    name: string,
    affiliation: ChurchAffiliation,
    birthHint: string
  ) => Promise<{ success: boolean; error?: string; recovered?: boolean }>;
}

export default function RegistrationForm({ onRegister }: RegistrationFormProps) {
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState<ChurchAffiliation | "">("");
  const [birthHint, setBirthHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recovered, setRecovered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("이름을 입력해주세요.");
      return;
    }
    if (!affiliation) {
      setFormError("소속을 선택해주세요.");
      return;
    }
    if (!birthHint.trim()) {
      setFormError("확인 코드를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    const result = await onRegister(
      name.trim(),
      affiliation as ChurchAffiliation,
      birthHint.trim()
    );

    if (!result.success) {
      setFormError(result.error ?? "등록에 실패했습니다.");
    } else if (result.recovered) {
      setRecovered(true);
    }
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[400px] space-y-8"
      >
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white mx-auto">
            <BookOpen size={22} />
          </div>
          <div className="space-y-1">
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight">
              성경 암송 트래커
            </h1>
            <p className="text-[13px] font-medium text-slate-500">
              시작하기 전에 정보를 입력해주세요.
            </p>
          </div>
        </div>

        {/* Recovered notice */}
        {recovered && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-center">
            <p className="text-[12px] font-semibold text-indigo-700">
              이전 기기의 진도를 연결했습니다. 기존 암송 기록이 유지됩니다.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <User size={11} />
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              maxLength={20}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] font-semibold text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {/* Affiliation */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              소속
            </label>
            <div className="relative">
              <select
                value={affiliation}
                onChange={(e) =>
                  setAffiliation(e.target.value as ChurchAffiliation)
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] font-semibold text-slate-900 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 pr-10"
              >
                <option value="" disabled>
                  소속 선택
                </option>
                {CHURCH_AFFILIATIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Birth hint */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <KeyRound size={11} />
              확인 코드
            </label>
            <input
              type="text"
              value={birthHint}
              onChange={(e) => setBirthHint(e.target.value)}
              placeholder="생일 4자리 (예: 0324)"
              maxLength={10}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] font-semibold text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
            />
            <p className="text-[10px] font-medium text-slate-400 pl-0.5">
              기기를 바꿀 때 기존 진도를 찾는 데 사용됩니다. 기억하기 쉬운 숫자로 설정하세요.
            </p>
          </div>

          {/* Error */}
          {formError && (
            <p className="text-[12px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-slate-900 py-3.5 text-[14px] font-black text-white transition-all hover:bg-slate-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? "등록 중..." : "시작하기"}
          </button>
        </form>

        <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          사랑과평안의교회 · 2026
        </p>
      </motion.div>
    </main>
  );
}
