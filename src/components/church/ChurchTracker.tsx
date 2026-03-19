"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Check,
  Flame,
  ListChecks,
  Play,
  Square,
  Timer,
  Volume2,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ChurchProfile } from "@/types/church";
import { useChurchProgress } from "@/hooks/church/useChurchProgress";
import { useWeeklyChallenge } from "@/hooks/church/useWeeklyChallenge";
import { useTts, SPEED_OPTIONS, REPEAT_OPTIONS } from "@/hooks/useTts";
import VerseAccordion from "@/components/VerseAccordion";
import WeeklyChallengeCard from "@/components/church/WeeklyChallengeCard";
import { VERSES, TARGET_DATE } from "@/constants/data";

const CHURCH_THEME = "#4f46e5";

function calculateDDay(target: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface ChurchTrackerProps {
  profile: ChurchProfile;
  effectiveUserId: string;
}

export default function ChurchTracker({
  profile,
  effectiveUserId,
}: ChurchTrackerProps) {
  const {
    getStatus,
    toggleDaily,
    toggleMastery,
    isLoading,
    saveError,
    setSaveError,
    masteredCount,
    dailyCount,
    verseMeta,
    progressDates,
  } = useChurchProgress(effectiveUserId);

  // profile.id === auth.uid() always, even for duplicate users
  const { missions, streak, motivationMsg, hint } = useWeeklyChallenge(
    profile,
    progressDates,
    getStatus,
    profile.id
  );

  const {
    speak,
    speakSequence,
    stop,
    isSpeaking,
    currentIndex,
    speed,
    setSpeed,
    repeatCount,
    setRepeatCount,
  } = useTts();

  const [selectMode, setSelectMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);

  const dDay = calculateDDay(TARGET_DATE);
  const dDayLabel =
    dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-DAY" : `D+${Math.abs(dDay)}`;

  // Filter to active verses only (default active if metadata not yet loaded)
  const activeVerses = VERSES.filter(
    (v) => verseMeta[v.id]?.is_active !== false
  );
  const totalCount = activeVerses.length;
  const masteryPct =
    totalCount === 0 ? 0 : Math.round((masteredCount / totalCount) * 100);

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  const handleToggleMastery = (verseId: number) => {
    const current = getStatus(verseId);
    if (current !== "mastered") {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.7 },
        colors: [CHURCH_THEME, "#FFD700", "#ffffff"],
      });
    }
    toggleMastery(verseId);
  };

  const toggleSelect = (id: number) =>
    setSelectedVerses((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );

  const playSelected = () => {
    const items = activeVerses
      .filter((v) => selectedVerses.includes(v.id))
      .sort((a, b) => selectedVerses.indexOf(a.id) - selectedVerses.indexOf(b.id))
      .map((v) => ({ id: v.id, text: `${v.title}. ${v.content}` }));
    if (items.length > 0) speakSequence(items);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedVerses([]);
    stop();
  };

  return (
    <main className="min-h-screen bg-white py-10 sm:py-16 selection:bg-slate-900 selection:text-white">
      <div className="mx-auto w-full max-w-[480px] px-5 sm:px-0">

        {/* ── Header Banner ─────────────────────────────── */}
        <header className="space-y-8 mb-12">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl opacity-40 pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl opacity-20 pointer-events-none" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-indigo-300 border border-white/5">
                  <BookOpen size={10} />
                  교회 전체 암송
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">2026. 05. 24</span>
                  <div className="h-4 w-[1px] bg-white/10" />
                  <div className="flex items-center gap-1.5 text-[12px] font-black text-[#E4F7BA]">
                    <Timer size={12} />
                    {dDayLabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h1 className="text-[20px] leading-[1.15] font-black tracking-[-0.04em] sm:text-[24px] break-keep">
                    성령의 인도함을 받는 삶
                    <br />
                    <span className="text-indigo-400">성경 암송 대회</span>
                  </h1>
                  <p className="text-[12px] font-bold text-slate-400">
                    {profile.affiliation} · {profile.name}
                  </p>
                </div>

                <div className="relative rounded-2xl bg-white/[0.04] p-3 border border-white/5 min-w-[110px] shrink-0">
                  <div className="flex items-center justify-between mb-1.5 gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">달성률</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-[#E4F7BA] animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#E4F7BA] tracking-tight tabular-nums">{masteryPct}%</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">done</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/5 mt-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${masteryPct}%` }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full"
                      style={{ backgroundColor: "#E4F7BA" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Weekly Challenge ──────────────────────────── */}
        <section className="mb-6">
          <WeeklyChallengeCard
            missions={missions}
            streak={streak}
            motivationMsg={motivationMsg}
            hint={hint}
          />
        </section>

        {/* ── Progress Card ──────────────────────────────── */}
        <section className="mb-8">
          <div className="rounded-2xl border bg-white p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex items-end justify-between mb-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">전체 암송 진도</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black tracking-tight" style={{ color: CHURCH_THEME }}>
                    {masteryPct}%
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">done</span>
                </div>
              </div>
              <span
                className="rounded-lg px-2.5 py-1 text-[13px] font-bold text-white"
                style={{ backgroundColor: CHURCH_THEME }}
              >
                {masteredCount} / {totalCount}
              </span>
            </div>

            <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden mb-6">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: CHURCH_THEME }}
                initial={{ width: 0 }}
                animate={{ width: `${masteryPct}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                    <Flame size={13} />
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">오늘 암송</span>
                </div>
                <span className="text-sm font-black text-amber-600">{dailyCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">남은 구절</span>
                <span className="text-sm font-black text-slate-800">{totalCount - masteredCount}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Save Error Banner ─────────────────────────── */}
        {saveError && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[12px] font-semibold text-red-700">{saveError}</p>
            <button
              onClick={() => setSaveError(null)}
              className="shrink-0 text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── TTS Controls ──────────────────────────────── */}
        <section className="mb-8">
          <div className="rounded-2xl border bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">음성 재생 설정</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 w-8">속도</span>
              <div className="flex gap-1.5 flex-1">
                {SPEED_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setSpeed(o.value)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      speed === o.value
                        ? "text-white border-transparent"
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                    style={speed === o.value ? { backgroundColor: CHURCH_THEME } : {}}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 w-8">반복</span>
              <div className="flex gap-1.5 flex-1">
                {REPEAT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setRepeatCount(o.value)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      repeatCount === o.value
                        ? "text-white border-transparent"
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                    style={repeatCount === o.value ? { backgroundColor: CHURCH_THEME } : {}}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Verse List ────────────────────────────────── */}
        <section className="space-y-10">
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <div className="flex flex-col">
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Checklist</h2>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">불꽃 아이콘은 매일 체크, 체크박스는 최종 완료입니다.</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {totalCount} TOTAL
              </span>
              <button
                onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                  selectMode
                    ? "text-white border-transparent"
                    : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                }`}
                style={selectMode ? { backgroundColor: CHURCH_THEME } : {}}
              >
                {selectMode ? <X size={10} /> : <ListChecks size={10} />}
                {selectMode ? "취소" : "다중 재생"}
              </button>
            </div>
          </div>

          {/* State legend */}
          <div className="flex items-center gap-4 px-1">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                <Flame size={11} />
              </div>
              <span className="text-[11px] font-semibold text-slate-500">오늘 암송</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-white">
                <Check size={11} strokeWidth={3} />
              </div>
              <span className="text-[11px] font-semibold text-slate-500">암송 완료</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Synchronizing...
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-white divide-y divide-slate-50 overflow-hidden shadow-sm">
              {activeVerses.map((verse) => {
                const status = getStatus(verse.id);
                const isKeyVerse = verseMeta[verse.id]?.is_key_verse ?? false;
                return (
                  <VerseAccordion
                    key={verse.id}
                    verse={verse}
                    isMastered={status === "mastered"}
                    isDailyDone={status === "daily_done" || status === "mastered"}
                    isMandatory={isKeyVerse}
                    onToggleMastery={handleToggleMastery}
                    onToggleDaily={toggleDaily}
                    onSpeak={handleSpeak}
                    isSpeakingThis={currentIndex === verse.id}
                    themeColor={CHURCH_THEME}
                    selectMode={selectMode}
                    isSelected={selectedVerses.includes(verse.id)}
                    onToggleSelect={toggleSelect}
                    enableWriting
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* ── Footer ────────────────────────────────────── */}
        <footer className="mt-24 mb-12 flex flex-col items-center gap-4">
          <div className="h-[1px] w-8 bg-slate-200" />
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
              &copy; 2026 CHURCH OF LOVE & PEACE
            </p>
            <p className="text-[9px] font-bold text-slate-200 uppercase tracking-tighter">
              Daily Commitment & Mastery
            </p>
          </div>
        </footer>
      </div>

      {/* ── Floating multi-play bar ────────────────────── */}
      <AnimatePresence>
        {selectMode && selectedVerses.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[440px] max-w-[calc(100%-40px)] bg-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-2xl z-50"
          >
            <div>
              <p className="text-white text-sm font-bold">{selectedVerses.length}개 선택됨</p>
              <p className="text-slate-400 text-[11px] font-medium">
                {speed}x · {repeatCount}회 반복
              </p>
            </div>
            <button
              onClick={isSpeaking ? stop : playSelected}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors"
              style={{ backgroundColor: isSpeaking ? "#EF4444" : CHURCH_THEME }}
            >
              {isSpeaking ? <Square size={14} /> : <Play size={14} />}
              {isSpeaking ? "정지" : "재생"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
