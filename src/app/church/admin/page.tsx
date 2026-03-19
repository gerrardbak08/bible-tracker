"use client";

import { useChurchAuth } from "@/hooks/church/useChurchAuth";
import AdminDashboard from "@/components/church/AdminDashboard";

export default function ChurchAdminPage() {
  const { profile, isLoading, authError } = useChurchAuth();

  // ── Loading ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading...</p>
        </div>
      </main>
    );
  }

  // ── Auth error ─────────────────────────────────────────────
  if (authError) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-[14px] font-bold text-slate-800">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-[13px] font-bold text-white"
          >
            새로고침
          </button>
        </div>
      </main>
    );
  }

  // ── Not registered ─────────────────────────────────────────
  if (!profile) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-[14px] font-bold text-slate-800">
            먼저 암송 트래커에 등록해주세요.
          </p>
          <a
            href="/church"
            className="inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-[13px] font-bold text-white"
          >
            등록하러 가기
          </a>
        </div>
      </main>
    );
  }

  // ── Not admin ──────────────────────────────────────────────
  if (profile.role !== "admin") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-[22px] font-black text-slate-900">접근 권한 없음</p>
          <p className="text-[13px] font-medium text-slate-500">
            이 페이지는 관리자 전용입니다.
          </p>
          <a
            href="/church"
            className="inline-block mt-2 rounded-xl bg-slate-900 px-6 py-2.5 text-[13px] font-bold text-white"
          >
            트래커로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  // ── Admin ──────────────────────────────────────────────────
  return <AdminDashboard profile={profile} />;
}
