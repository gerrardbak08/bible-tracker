"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Flame, Volume2, Square } from "lucide-react";
import { Verse } from "@/types";
import confetti from "canvas-confetti";

interface VerseAccordionProps {
  verse: Verse;
  isMastered: boolean;
  isDailyDone: boolean;
  isMandatory: boolean;
  onToggleMastery: (id: number) => void;
  onToggleDaily: (id: number) => void;
  onSpeak?: (text: string) => void;
  isSpeakingThis?: boolean;
  themeColor?: string;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
}

export default function VerseAccordion({
  verse,
  isMastered,
  isDailyDone,
  isMandatory,
  onToggleMastery,
  onToggleDaily,
  onSpeak,
  isSpeakingThis = false,
  themeColor = "#000000",
  selectMode = false,
  isSelected = false,
  onToggleSelect,
}: VerseAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMasteryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMastered) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.7 },
        colors: [themeColor, "#FFD700", "#ffffff"],
      });
    }
    onToggleMastery(verse.id);
  };

  const handleDailyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleDaily(verse.id);
  };

  const handleSpeakClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSpeak?.(verse.content);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.(verse.id);
  };

  return (
    <div 
      className={`group relative border-b border-slate-100 last:border-0 transition-all duration-200 ${
        isOpen ? "bg-slate-50/40" : "bg-white"
      }`}
    >
      <div 
        className="flex items-center py-4 px-3 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Action Controls */}
        <div className="flex items-center gap-2 mr-4">
          {/* Multi-select checkbox */}
          {selectMode && (
            <button
              onClick={handleSelectClick}
              className={`flex h-6 w-6 items-center justify-center rounded-md border transition-all duration-200 ${
                isSelected
                  ? "border-transparent text-white"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
              style={isSelected ? { backgroundColor: themeColor } : {}}
            >
              {isSelected && <Check size={14} strokeWidth={3} />}
            </button>
          )}
          {/* Daily Practice Button */}
          <button
            onClick={handleDailyClick}
            title="오늘 암송 연습 완료"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 ${
              isDailyDone 
                ? "bg-amber-100 border-amber-200 text-amber-600 shadow-inner" 
                : "bg-white border-slate-200 text-slate-200 hover:border-slate-300 hover:text-slate-400"
            }`}
          >
            <Flame size={16} strokeWidth={3} className={isDailyDone ? "animate-pulse" : ""} />
          </button>

          {/* Master Achievement Button */}
          <button
            onClick={handleMasteryClick}
            title="완전 암송 (Mastered)"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 ${
              isMastered 
                ? "bg-slate-900 border-slate-900 text-white" 
                : "bg-white border-slate-200 text-slate-100 hover:border-slate-300 hover:text-slate-300"
            }`}
          >
            <Check size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className={`text-[14px] font-bold tracking-tight transition-colors break-keep ${isMastered ? "text-slate-400" : "text-slate-800"}`}>
              {verse.title}
            </h3>
            {isMandatory && (
              <span 
                className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
                style={{ backgroundColor: `${themeColor}10`, color: themeColor, border: `1px solid ${themeColor}20` }}
              >
                Essential
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">View Script</p>
            {isDailyDone && <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 rounded-sm">TODAY CHECKED</span>}
          </div>
        </div>

        {/* TTS Button */}
        <button
          onClick={handleSpeakClick}
          title="음성 재생"
          className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 mr-1 ${
            isSpeakingThis
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
          }`}
        >
          {isSpeakingThis ? <Square size={12} /> : <Volume2 size={14} />}
        </button>

        {/* Toggle Icon */}
        <div className={`shrink-0 p-2 transition-transform duration-300 ${isOpen ? "rotate-180 text-slate-900" : "text-slate-300"}`}>
          <ChevronDown size={14} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "circOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-5 pt-1">
              <div className="relative p-5 rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                {isMandatory && (
                  <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: themeColor }} />
                )}
                <p className="relative z-10 text-[14.5px] font-medium text-slate-600 leading-[1.7] tracking-tight">
                  {verse.content}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
