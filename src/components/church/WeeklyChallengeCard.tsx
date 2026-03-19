"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { WeeklyMissions } from "@/types/church";

interface WeeklyChallengeCardProps {
  missions: WeeklyMissions;
  streak: number;
  motivationMsg: string;
  /** Always non-empty when missions are incomplete. Empty string when complete. */
  hint: string;
}

/**
 * Bolds the leading number in a string for visual emphasis.
 * "1번만 더 암송하면…" → <b>1</b>번만 더 암송하면…
 * Strings without a leading digit are rendered unchanged.
 */
function BoldLeadingNumber({
  text,
  boldClass,
}: {
  text: string;
  boldClass: string;
}) {
  const match = text.match(/^(\d+)([\s\S]*)/);
  if (!match) return <>{text}</>;
  return (
    <>
      <span className={boldClass}>{match[1]}</span>
      {match[2]}
    </>
  );
}

export default function WeeklyChallengeCard({
  missions,
  streak,
  motivationMsg,
  hint,
}: WeeklyChallengeCardProps) {
  const missionRows = [
    { mission: missions.consistency, label: "꾸준함", unit: "일" },
    { mission: missions.progress,    label: "전진",   unit: "회" },
    { mission: missions.completion,  label: "완주",   unit: "회" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border bg-white p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] space-y-4"
    >
      {/* ── Header row ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          이번 주 챌린지
        </p>
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 transition-colors ${
            missions.allComplete ? "bg-slate-900" : "bg-slate-100"
          }`}
        >
          <span
            className={`text-[11px] font-black tabular-nums ${
              missions.allComplete ? "text-white" : "text-slate-600"
            }`}
          >
            {missions.completedCount} / 3
          </span>
          {missions.allComplete && (
            <Check size={9} strokeWidth={3} className="text-white" />
          )}
        </div>
      </div>

      {/* ── Mission rows ─────────────────────────────────── */}
      <div className="space-y-2.5">
        {missionRows.map(({ mission, label, unit }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  mission.done ? "bg-slate-900" : "bg-slate-100"
                }`}
              >
                {mission.done && (
                  <Check size={9} strokeWidth={3} className="text-white" />
                )}
              </div>
              <span
                className={`text-[12px] font-bold transition-colors ${
                  mission.done ? "text-slate-800" : "text-slate-400"
                }`}
              >
                {label}{" "}
                <span className="font-medium">
                  ({mission.target}
                  {unit})
                </span>
              </span>
            </div>
            <span
              className={`text-[12px] font-black tabular-nums ${
                mission.done ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {mission.done ? "완료" : `${mission.current}/${mission.target}`}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── Streak / Badge ────────────────────────────────── */}
      {(streak > 0 || missions.allComplete) && (
        <>
          <div className="h-px bg-slate-100" />
          <div className="flex items-center gap-4 flex-wrap">
            {streak > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] leading-none">🔥</span>
                <span className="text-[12px] font-bold text-slate-700">
                  <BoldLeadingNumber
                    text={`${streak}주 연속 달성`}
                    boldClass="font-black text-slate-900"
                  />
                </span>
              </div>
            )}
            {missions.allComplete && (
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] leading-none">🏅</span>
                <span className="text-[11px] font-black text-slate-900">
                  이번 주 배지 획득
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Motivation message + hint ────────────────────── */}
      <div
        className={`rounded-xl px-4 py-3 transition-colors ${
          missions.allComplete ? "bg-slate-900" : "bg-slate-50"
        }`}
      >
        <p
          className={`text-[12px] font-semibold text-center leading-snug ${
            missions.allComplete ? "text-white" : "text-slate-600"
          }`}
        >
          <BoldLeadingNumber
            text={motivationMsg}
            boldClass={
              missions.allComplete ? "font-black text-white" : "font-black text-slate-900"
            }
          />
        </p>
        {hint && !missions.allComplete && (
          <p className="text-[10px] font-medium text-slate-400 text-center mt-1.5">
            <BoldLeadingNumber text={hint} boldClass="font-black text-slate-600" />
          </p>
        )}
      </div>
    </motion.div>
  );
}
