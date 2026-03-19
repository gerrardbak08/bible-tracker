"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChurchAffiliation, ChurchProfile } from "@/types/church";

/** Stable per-browser fingerprint stored in localStorage. */
function getOrCreateDeviceFingerprint(): string {
  const key = "church_device_fp";
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const fp =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, fp);
    return fp;
  } catch {
    // localStorage unavailable (e.g. private browsing restrictions)
    return "unknown";
  }
}

export function useChurchAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ChurchProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let currentUserId: string;

        if (session?.user) {
          currentUserId = session.user.id;
        } else {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error || !data.user)
            throw error ?? new Error("Anonymous sign-in returned no user");
          currentUserId = data.user.id;
        }

        setUserId(currentUserId);

        const { data: profileData, error: profileError } = await supabase
          .from("church_profiles")
          .select("*")
          .eq("id", currentUserId)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
        } else {
          setProfile(profileData ?? null);
        }
      } catch (err) {
        console.error("Church auth init error:", err);
        setAuthError("초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.");
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  /**
   * Register a new profile, with duplicate detection.
   *
   * If (name + affiliation + birthHint) already exists, the new anonymous
   * user's profile is created with `canonical_id` pointing to the original.
   * The caller should then use `profile.canonical_id ?? userId` as the
   * effective user ID for all progress queries.
   */
  const registerProfile = async (
    name: string,
    affiliation: ChurchAffiliation,
    birthHint: string
  ): Promise<{ success: boolean; error?: string; recovered?: boolean }> => {
    if (!userId) return { success: false, error: "인증 정보가 없습니다." };

    const fingerprint = getOrCreateDeviceFingerprint();

    // ── Duplicate detection via SECURITY DEFINER RPC ──────────
    let canonicalId: string | null = null;
    const { data: existingId, error: rpcError } = await supabase.rpc(
      "find_matching_church_profile",
      {
        p_name: name.trim(),
        p_affiliation: affiliation,
        p_birth_hint: birthHint.trim(),
      }
    );

    if (rpcError) {
      console.warn("Duplicate check RPC failed (continuing):", rpcError);
      // Non-fatal: proceed as a fresh registration
    } else if (existingId) {
      canonicalId = existingId as string;
    }

    // ── Insert new profile row ─────────────────────────────────
    const { data, error } = await supabase
      .from("church_profiles")
      .insert({
        id: userId,
        name: name.trim(),
        affiliation,
        birth_hint: birthHint.trim(),
        device_fingerprint: fingerprint,
        canonical_id: canonicalId,
      })
      .select()
      .single();

    if (error) {
      console.error("Profile creation error:", error);
      return { success: false, error: "등록에 실패했습니다. 다시 시도해주세요." };
    }

    setProfile(data as ChurchProfile);
    return { success: true, recovered: canonicalId !== null };
  };

  /**
   * The effective user ID to use for all progress queries.
   * For duplicates: the canonical profile's id.
   * For everyone else: their own id.
   */
  const effectiveUserId: string | null = profile
    ? (profile.canonical_id ?? userId)
    : userId;

  return { userId, effectiveUserId, profile, isLoading, authError, registerProfile };
}
