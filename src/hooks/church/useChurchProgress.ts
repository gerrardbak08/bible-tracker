"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChurchVerseMeta, VerseStatus } from "@/types/church";

export function useChurchProgress(effectiveUserId: string | null) {
  const [progress, setProgress] = useState<Record<number, VerseStatus>>({});
  /** Maps verseId → ISO updated_at string for weekly mission calculation. */
  const [progressDates, setProgressDates] = useState<Record<number, string>>({});
  const [verseMeta, setVerseMeta] = useState<Record<number, ChurchVerseMeta>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Stable refs so callbacks stay stable without progress as a dep
  const progressRef = useRef(progress);
  const progressDatesRef = useRef(progressDates);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { progressDatesRef.current = progressDates; }, [progressDates]);

  // ── Fetch verse metadata once (is_active, is_key_verse) ───────
  useEffect(() => {
    async function fetchVerseMeta() {
      const { data, error } = await supabase
        .from("church_verses")
        .select("id, is_active, is_key_verse");

      if (!error && data) {
        const map: Record<number, ChurchVerseMeta> = {};
        data.forEach((row) => {
          map[row.id as number] = {
            id: row.id as number,
            is_active: row.is_active as boolean,
            is_key_verse: row.is_key_verse as boolean,
          };
        });
        setVerseMeta(map);
      }
    }

    fetchVerseMeta();
  }, []); // verse metadata changes rarely — fetch once per mount

  // ── Fetch user progress ───────────────────────────────────────
  useEffect(() => {
    async function fetchProgress() {
      if (!effectiveUserId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data, error } = await supabase
        .from("church_progress")
        .select("verse_id, status, updated_at")
        .eq("user_id", effectiveUserId);

      if (error) {
        console.error("Error fetching church progress:", error);
      } else {
        const todayKST = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
        const statusMap: Record<number, VerseStatus> = {};
        const dateMap: Record<number, string> = {};
        const toReset: Array<{ user_id: string; verse_id: number; status: VerseStatus; updated_at: string }> = [];

        data?.forEach((row) => {
          const id = row.verse_id as number;
          let status = row.status as VerseStatus;
          const updatedAt = row.updated_at as string | null;

          if (updatedAt) dateMap[id] = updatedAt;

          // Daily reset: if daily check was done on a previous day, clear it
          if (status === "daily_done" || status === "mastered_daily_done") {
            const checkedDate = updatedAt
              ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date(updatedAt))
              : "";
            if (checkedDate !== todayKST) {
              const resetStatus: VerseStatus = status === "mastered_daily_done" ? "mastered" : "not_started";
              status = resetStatus;
              toReset.push({ user_id: effectiveUserId!, verse_id: id, status: resetStatus, updated_at: new Date().toISOString() });
            }
          }

          statusMap[id] = status;
        });

        setProgress(statusMap);
        setProgressDates(dateMap);

        // Batch-write expired daily resets back to Supabase
        if (toReset.length > 0) {
          await supabase
            .from("church_progress")
            .upsert(toReset, { onConflict: "user_id,verse_id" });
        }
      }

      setIsLoading(false);
    }

    fetchProgress();
  }, [effectiveUserId]);

  /** Optimistically update a verse status then persist. Rolls back on error. */
  const updateStatus = useCallback(
    async (verseId: number, newStatus: VerseStatus) => {
      if (!effectiveUserId) return;

      const prevStatus = progressRef.current[verseId] ?? "not_started";
      const prevDate = progressDatesRef.current[verseId];
      const nowIso = new Date().toISOString();

      setProgress((prev) => ({ ...prev, [verseId]: newStatus }));
      setProgressDates((prev) => ({ ...prev, [verseId]: nowIso }));

      // Ensure the session token is fresh before writing (prevents 401 on token expiry)
      await supabase.auth.getSession();

      const payload = {
        user_id: effectiveUserId,
        verse_id: verseId,
        status: newStatus,
        updated_at: nowIso,
      };

      let { error } = await supabase
        .from("church_progress")
        .upsert(payload, { onConflict: "user_id,verse_id" });

      // If 401 (expired token), refresh and retry once
      if (error && (error as { status?: number }).status === 401) {
        await supabase.auth.refreshSession();
        ({ error } = await supabase
          .from("church_progress")
          .upsert(payload, { onConflict: "user_id,verse_id" }));
      }

      if (error) {
        console.error("Error updating church progress:", error);
        setProgress((prev) => ({ ...prev, [verseId]: prevStatus }));
        setProgressDates((prev) => {
          if (prevDate === undefined) {
            const next = { ...prev };
            delete next[verseId];
            return next;
          }
          return { ...prev, [verseId]: prevDate };
        });
        setSaveError("저장에 실패했습니다. 다시 시도해주세요.");
      }
    },
    [effectiveUserId]
  );

  /** Toggle daily practice. Works regardless of mastery status. */
  const toggleDaily = useCallback(
    (verseId: number) => {
      const current = progressRef.current[verseId] ?? "not_started";
      if (current === "mastered") {
        updateStatus(verseId, "mastered_daily_done");
      } else if (current === "mastered_daily_done") {
        updateStatus(verseId, "mastered");
      } else {
        updateStatus(verseId, current === "daily_done" ? "not_started" : "daily_done");
      }
    },
    [updateStatus]
  );

  /**
   * Toggle mastery (preserves daily-check state across transitions).
   * not_started         → mastered
   * daily_done          → mastered_daily_done   (keeps today's daily check)
   * mastered            → not_started
   * mastered_daily_done → daily_done            (keeps today's daily check)
   */
  const toggleMastery = useCallback(
    (verseId: number) => {
      const current = progressRef.current[verseId] ?? "not_started";
      if (current === "mastered") {
        updateStatus(verseId, "not_started");
      } else if (current === "mastered_daily_done") {
        updateStatus(verseId, "daily_done");
      } else if (current === "daily_done") {
        updateStatus(verseId, "mastered_daily_done");
      } else {
        updateStatus(verseId, "mastered");
      }
    },
    [updateStatus]
  );

  const getStatus = useCallback(
    (verseId: number): VerseStatus => progress[verseId] ?? "not_started",
    [progress]
  );

  const masteredCount = Object.values(progress).filter(
    (s) => s === "mastered" || s === "mastered_daily_done"
  ).length;
  const dailyCount = Object.values(progress).filter(
    (s) => s === "daily_done" || s === "mastered_daily_done"
  ).length;

  return {
    getStatus,
    toggleDaily,
    toggleMastery,
    isLoading,
    saveError,
    setSaveError,
    masteredCount,
    dailyCount,
    verseMeta,
    /** verseId → ISO updated_at. Used for weekly mission calculation. */
    progressDates,
  };
}
