"use client";

import { useMemo, useState, useEffect } from "react";
import Banner from "@/components/Banner";
import MemberSelector from "@/components/MemberSelector";
import Notice from "@/components/Notice";
import ProgressBar from "@/components/ProgressBar";
import VerseAccordion from "@/components/VerseAccordion";
import { TEAM_MEMBERS, VERSES } from "@/constants/data";
import { useProgress } from "@/hooks/useProgress";
import { useTts, SPEED_OPTIONS, REPEAT_OPTIONS } from "@/hooks/useTts";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, ListChecks, X, Volume2 } from "lucide-react";

export default function Home() {
  const [selectedMemberId, setSelectedMemberId] = useState(TEAM_MEMBERS[0].id);
  const [teamAvg, setTeamAvg] = useState(0);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const { masteredVerses, dailyVerses, toggleMastery, toggleDaily, isLoading, saveError, setSaveError, fetchTeamMandatoryProgress } = useProgress(selectedMemberId);
  const { speak, speakSequence, stop, isSpeaking, currentIndex, speed, setSpeed, repeatCount, setRepeatCount } = useTts();

  useEffect(() => {
    async function loadTeamStats() {
      const avg = await fetchTeamMandatoryProgress(TEAM_MEMBERS);
      setTeamAvg(avg);
    }
    // Only refresh team avg when loading finishes (member switch or initial load),
    // not on every individual toggle — avoids a full-table query per checkbox click.
    if (!isLoading) {
      loadTeamStats();
    }
  }, [isLoading, fetchTeamMandatoryProgress]);

  const selectedMember = TEAM_MEMBERS.find((member) => member.id === selectedMemberId) ?? TEAM_MEMBERS[0];
  const mandatoryIds = useMemo(() => new Set(selectedMember.mandatoryVerses), [selectedMember.mandatoryVerses]);
  const mandatoryVerses = useMemo(() => VERSES.filter((verse) => mandatoryIds.has(verse.id)), [mandatoryIds]);
  const extraVerses = useMemo(() => VERSES.filter((verse) => !mandatoryIds.has(verse.id)), [mandatoryIds]);
  const mandatoryCompletedCount = mandatoryVerses.filter((verse) => masteredVerses.includes(verse.id)).length;
  const todayCheckedCount = VERSES.filter(v => dailyVerses.includes(v.id)).length;

  const handleSpeak = (text: string) => { if (isSpeaking) { stop(); } else { speak(text); } };
  const toggleSelect = (id: number) => {
    setSelectedVerses(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };
  const playSelected = () => {
    const items = VERSES.filter(v => selectedVerses.includes(v.id))
      .sort((a, b) => selectedVerses.indexOf(a.id) - selectedVerses.indexOf(b.id))
      .map(v => ({ id: v.id, text: `${v.title}. ${v.content}` }));
    if (items.length > 0) speakSequence(items);
  };
  const exitSelectMode = () => { setSelectMode(false); setSelectedVerses([]); stop(); };

  return (
    <main className="min-h-screen bg-white py-10 sm:py-16 selection:bg-slate-900 selection:text-white">
      <div className="mx-auto w-full max-w-[480px] px-5 sm:px-0">
        
        {/* Header Section */}
        <header className="space-y-8 mb-12">
          <Banner totalMandatoryPercentage={teamAvg} />
          <Notice />
        </header>

        {/* Control Section */}
        <section className="space-y-8 mb-16">
          <MemberSelector selectedId={selectedMemberId} onSelect={setSelectedMemberId} />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMemberId}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ProgressBar
                completedCount={masteredVerses.length}
                totalCount={VERSES.length}
                mandatoryCompletedCount={mandatoryCompletedCount}
                mandatoryTotalCount={mandatoryVerses.length}
                themeColor={selectedMember.themeColor}
                todayCheckedCount={todayCheckedCount}
              />
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Save Error Banner */}
        {saveError && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[12px] font-semibold text-red-700">{saveError}</p>
            <button onClick={() => setSaveError(null)} className="shrink-0 text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* TTS Controls */}
        <section className="mb-8">
          <div className="rounded-2xl border bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">음성 재생 설정</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 w-8">속도</span>
              <div className="flex gap-1.5 flex-1">
                {SPEED_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setSpeed(o.value)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      speed === o.value
                        ? "text-white border-transparent"
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                    style={speed === o.value ? { backgroundColor: selectedMember.themeColor } : {}}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 w-8">반복</span>
              <div className="flex gap-1.5 flex-1">
                {REPEAT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setRepeatCount(o.value)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      repeatCount === o.value
                        ? "text-white border-transparent"
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                    style={repeatCount === o.value ? { backgroundColor: selectedMember.themeColor } : {}}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="space-y-10">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <div className="flex flex-col">
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Checklist</h2>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">불꽃 아이콘은 매일 체크, 체크박스는 최종 완료입니다.</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {VERSES.length} TOTAL VERSES
              </span>
              <button onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                  selectMode
                    ? "text-white border-transparent"
                    : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                }`}
                style={selectMode ? { backgroundColor: selectedMember.themeColor } : {}}
              >
                {selectMode ? <X size={10} /> : <ListChecks size={10} />}
                {selectMode ? "취소" : "다중 재생"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Synchronizing...</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Mandatory Group */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: selectedMember.themeColor }} />
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Essential Target</h3>
                </div>
                <div className="rounded-2xl border bg-white divide-y divide-slate-50 overflow-hidden shadow-sm">
                  {mandatoryVerses.map((verse) => (
                    <VerseAccordion
                      key={verse.id}
                      verse={verse}
                      isMastered={masteredVerses.includes(verse.id)}
                      isDailyDone={dailyVerses.includes(verse.id)}
                      isMandatory
                      onToggleMastery={toggleMastery}
                      onToggleDaily={toggleDaily}
                      onSpeak={handleSpeak}
                      isSpeakingThis={currentIndex === verse.id}
                      themeColor={selectedMember.themeColor}
                      selectMode={selectMode}
                      isSelected={selectedVerses.includes(verse.id)}
                      onToggleSelect={toggleSelect}
                      enableWriting
                    />
                  ))}
                </div>
              </div>

              {/* Extra Group */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 border border-slate-100/50">
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extended Journey</h3>
                </div>
                <div className="rounded-2xl border bg-white divide-y divide-slate-50 overflow-hidden shadow-sm">
                  {extraVerses.map((verse) => (
                    <VerseAccordion
                      key={verse.id}
                      verse={verse}
                      isMastered={masteredVerses.includes(verse.id)}
                      isDailyDone={dailyVerses.includes(verse.id)}
                      isMandatory={false}
                      onToggleMastery={toggleMastery}
                      onToggleDaily={toggleDaily}
                      onSpeak={handleSpeak}
                      isSpeakingThis={currentIndex === verse.id}
                      themeColor={selectedMember.themeColor}
                      selectMode={selectMode}
                      isSelected={selectedVerses.includes(verse.id)}
                      onToggleSelect={toggleSelect}
                      enableWriting
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Global Footer */}
        <footer className="mt-24 mb-12 flex flex-col items-center gap-4">
          <div className="h-[1px] w-8 bg-slate-200" />
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">&copy; 2026 CHURCH OF LOVE & PEACE</p>
            <p className="text-[9px] font-bold text-slate-200 uppercase tracking-tighter">Daily Commitment & Mastery</p>
          </div>
        </footer>
      </div>

      {/* Floating TTS bar */}
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
              <p className="text-slate-400 text-[11px] font-medium">{speed}x · {repeatCount}회 반복</p>
            </div>
            <button onClick={isSpeaking ? stop : playSelected}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors"
              style={{ backgroundColor: isSpeaking ? "#EF4444" : selectedMember.themeColor }}
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
