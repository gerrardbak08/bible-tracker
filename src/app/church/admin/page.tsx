"use client";

import { useState, useRef } from "react";
import AdminDashboard from "@/components/church/AdminDashboard";

const ADMIN_NAME = "박찬욱";

export default function ChurchAdminPage() {
  const [nameInput, setNameInput] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (nameInput.trim() === ADMIN_NAME) {
      setAuthorized(true);
    } else {
      setError(true);
      setNameInput("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (authorized) {
    return <AdminDashboard />;
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-xs space-y-5">
        <div className="space-y-1">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Admin
          </p>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight">
            관리자 접근
          </h1>
        </div>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={nameInput}
            onChange={(e) => {
              setNameInput(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="이름 입력"
            autoFocus
            style={{ fontSize: "16px" }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all"
          />

          {error && (
            <p className="text-[12px] font-bold text-red-500 px-1">
              접근 권한이 없습니다.
            </p>
          )}

          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-slate-900 py-3 text-[14px] font-black text-white tracking-wide transition-opacity active:opacity-70"
          >
            확인
          </button>
        </div>

        <div className="pt-2 text-center">
          <a
            href="/church"
            className="text-[12px] font-medium text-slate-400 underline underline-offset-2"
          >
            트래커로 돌아가기
          </a>
        </div>
      </div>
    </main>
  );
}
