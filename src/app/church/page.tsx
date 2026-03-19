"use client";

import { useState } from "react";
import { useChurchAuth } from "@/hooks/church/useChurchAuth";
import IntroScreen from "@/components/church/IntroScreen";
import RegistrationForm from "@/components/church/RegistrationForm";
import ChurchTracker from "@/components/church/ChurchTracker";

export default function ChurchPage() {
  const { userId, effectiveUserId, profile, isLoading, authError, registerProfile } =
    useChurchAuth();
  const [showIntro, setShowIntro] = useState(true);

  // ── Auth initialising ──────────────────────────────────
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

  // ── Unrecoverable auth error ───────────────────────────
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

  // ── Not yet registered ────────────────────────────────
  if (!profile) {
    if (showIntro) {
      return <IntroScreen onStart={() => setShowIntro(false)} />;
    }
    return <RegistrationForm onRegister={registerProfile} />;
  }

  // ── Registered — show tracker ─────────────────────────
  return (
    <ChurchTracker
      profile={profile}
      effectiveUserId={effectiveUserId ?? userId!}
    />
  );
}
