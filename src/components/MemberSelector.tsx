"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import { TEAM_MEMBERS } from "@/constants/data";

interface MemberSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function MemberSelector({ selectedId, onSelect }: MemberSelectorProps) {
  return (
    <section className="space-y-4" aria-labelledby="member-selector-title">
      <div className="flex items-center gap-2 px-2">
        <User size={14} className="text-slate-400" />
        <h3 id="member-selector-title" className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
          팀원 선택
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="팀원 선택">
        {TEAM_MEMBERS.map((member) => {
          const isSelected = selectedId === member.id;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(member.id)}
              aria-pressed={isSelected}
              className={`relative flex flex-col items-center justify-center rounded-2xl border py-3 transition-all duration-300 ${
                isSelected
                  ? "bg-white border-transparent shadow-md active:scale-95"
                  : "bg-transparent border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeTab"
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-white shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className={`relative z-10 text-sm font-bold ${isSelected ? "text-slate-900" : "text-slate-400"}`}>
                {member.name}
              </span>
              <div
                className={`relative z-10 mt-1.5 h-1 w-1 rounded-full transition-transform duration-300 ${
                  isSelected ? "scale-100" : "scale-0"
                }`}
                style={{ backgroundColor: member.themeColor }}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
