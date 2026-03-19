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
        const statusMap: Record<number, VerseStatus> = {};
        const dateMap: Record<number, string> = {};
        data?.forEach((row) => {
          const id = row.verse_id as number;
          statusMap[id] = row.status as VerseStatus;
          if (row.updated_at) dateMap[id] = row.updated_at as string;
        });
        setProgress(statusMap);
        setProgressDates(dateMap);
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

      const { error } = await supabase
        .from("church_progress")
        .upsert(
          {
            user_id: effectiveUserId,
            verse_id: verseId,
            status: newStatus,
            updated_at: nowIso,
          },
          { onConflict: "user_id,verse_id" }
        );

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

  /** Toggle daily practice. Mastered verses are not downgraded. */
  const toggleDaily = useCallback(
    (verseId: number) => {
      const current = progressRef.current[verseId] ?? "not_started";
      if (current === "mastered") return;
      updateStatus(verseId, current === "daily_done" ? "not_started" : "daily_done");
    },
    [updateStatus]
  );

  /** Toggle mastery: mastered → not_started, anything else → mastered. */
  const toggleMastery = useCallback(
    (verseId: number) => {
      const current = progressRef.current[verseId] ?? "not_started";
      updateStatus(verseId, current === "mastered" ? "not_started" : "mastered");
    },
    [updateStatus]
  );

  const getStatus = useCallback(
    (verseId: number): VerseStatus => progress[verseId] ?? "not_started",
    [progress]
  );

  const masteredCount = Object.values(progress).filter((s) => s === "mastered").length;
  const dailyCount = Object.values(progress).filter(
    (s) => s === "daily_done" || s === "mastered"
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
