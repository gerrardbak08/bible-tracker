"use client";

import { useState, useRef, useCallback } from "react";
import { normalizeTextForKoreanTTS } from "@/utils/ttsNormalize";

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";


export const SPEED_OPTIONS = [
  { label: "0.75x", value: 0.75 },
  { label: "1.0x",  value: 1.0  },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x",  value: 1.5  },
];

export const REPEAT_OPTIONS = [
  { label: "1회", value: 1 },
  { label: "2회", value: 2 },
  { label: "3회", value: 3 },
  { label: "5회", value: 5 },
];

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_TTS_KEY || "";
}

async function synthesizeSpeech(text: string, speed: number = 1.0): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Google TTS API key not configured");

  const res = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: normalizeTextForKoreanTTS(text) },
      voice: { languageCode: "ko-KR", name: "ko-KR-Wavenet-A", ssmlGender: "FEMALE" },
      audioConfig: { audioEncoding: "MP3", speakingRate: speed, pitch: 0, volumeGainDb: 0 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.audioContent as string;
}

// ── Playback session ────────────────────────────────────────────────────────

interface PlaySession {
  queue: Array<{ id: number; data: string }>;
  itemIdx: number;
  cycleIdx: number;
  totalCycles: number;
}

// Plain object-type refs — no dependency on React's generic ref types.
interface PlayRefs {
  session: { current: PlaySession | null };
  audio:   { current: HTMLAudioElement | null };
  timer:   { current: ReturnType<typeof setTimeout> | null };
  stop:    { current: boolean };
}

interface PlaySetters {
  setCurrentIndex: (id: number) => void;
  setIsSpeaking:   (b: boolean) => void;
}

// ── Module-level state machine ──────────────────────────────────────────────
//
// Defined OUTSIDE the hook so React Compiler cannot touch it.
//
// React Compiler (babel-plugin-react-compiler) can transform useCallback
// closures that self-reference through setTimeout. Even if the source looks
// stable, the compiler may produce a version where the `driveQueue` captured
// inside the timer callback becomes stale after the first cycle, silently
// dropping all subsequent cycles on iOS Safari.
//
// A module-level plain function is completely outside React Compiler's scope.
// It calls itself directly (not through a closed-over React callback),
// reads all state from explicit ref parameters, and can never go stale.
//
// Chain: audio.onended → onDone() → setTimeout → runDriveQueue() → audio.play()

function runDriveQueue(
  refs:         PlayRefs,
  setters:      PlaySetters,
  clearPlayback: () => void,
): void {
  const session = refs.session.current;
  console.log(
    "[TTS:driveQueue] called —",
    session
      ? `item=${session.itemIdx}/${session.queue.length - 1} cycle=${session.cycleIdx}/${session.totalCycles - 1}`
      : "session=null",
    "| stop:", refs.stop.current,
  );

  if (!session || refs.stop.current) {
    console.log("[TTS:driveQueue] aborted — session null or stopped");
    return;
  }

  const item = session.queue[session.itemIdx];

  clearPlayback();

  if (item.id >= 0) setters.setCurrentIndex(item.id);

  console.log(`[TTS:driveQueue] playing id=${item.id} dataLen=${item.data.length}`);

  const audio = new Audio(`data:audio/mp3;base64,${item.data}`);
  refs.audio.current = audio;

  // Single-fire guard — prevents double-advance if onended + ontimeupdate both trigger.
  let doneFired = false;

  const onDone = (reason: string) => {
    if (doneFired) return;
    doneFired = true;

    audio.onended     = null;
    audio.onerror     = null;
    audio.ontimeupdate = null;

    console.log(
      `[TTS:onDone] fired via "${reason}" —`,
      refs.session.current
        ? `item=${refs.session.current.itemIdx} cycle=${refs.session.current.cycleIdx}`
        : "session=null",
      "| stop:", refs.stop.current,
    );

    if (!refs.session.current || refs.stop.current) {
      console.log("[TTS:onDone] skipped — session cleared or stopped");
      return;
    }

    const sess = refs.session.current;

    if (sess.itemIdx < sess.queue.length - 1) {
      sess.itemIdx += 1;
      console.log(`[TTS:onDone] → next item ${sess.itemIdx} (direct call, no timer)`);
      // iOS throttles setTimeout when audio ends — call directly to keep the audio session alive.
      runDriveQueue(refs, setters, clearPlayback);

    } else if (sess.cycleIdx < sess.totalCycles - 1) {
      sess.itemIdx = 0;
      sess.cycleIdx += 1;
      console.log(`[TTS:onDone] → next cycle ${sess.cycleIdx} (direct call, no timer)`);
      runDriveQueue(refs, setters, clearPlayback);

    } else {
      console.log("[TTS:onDone] → all cycles complete — resetting state");
      refs.session.current = null;
      setters.setIsSpeaking(false);
      setters.setCurrentIndex(-1);
    }
  };

  // Primary: onended (standard)
  audio.onended = () => onDone("onended");
  audio.onerror = () => onDone("onerror");

  // Fallback: ontimeupdate — iOS Safari sometimes skips onended for data-URI audio.
  // Fires every ~250 ms; triggers when within 150 ms of the end.
  // NOTE: Do NOT call audio.pause() here. On iOS, pausing breaks the audio session,
  // causing the next new Audio().play() to be blocked (NotAllowedError).
  // The pause happens naturally inside clearPlayback() just before the next audio starts.
  audio.ontimeupdate = () => {
    if (
      audio.duration &&
      isFinite(audio.duration) &&
      audio.currentTime >= audio.duration - 0.15
    ) {
      onDone("ontimeupdate");
    }
  };

  audio.play()
    .then(() => console.log("[TTS:play] play() resolved — audio started"))
    .catch((err) => {
      console.error("[TTS:play] play() REJECTED:", err);
      onDone("play.catch");
    });
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useTts() {
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [speed,        setSpeed]        = useState(1.0);
  const [repeatCount,  setRepeatCount]  = useState(1);

  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const stopRef    = useRef(false);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<PlaySession | null>(null);

  // Stable setters (React guarantees these never change identity).
  const setters: PlaySetters = { setCurrentIndex, setIsSpeaking };

  // ── iOS audio session unlock ────────────────────────────────────────────
  const unlockAudio = useCallback(() => {
    try {
      const a = new Audio(
        "data:audio/mp3;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
      );
      a.volume = 0;
      a.play().catch(() => {});
    } catch {}
  }, []);

  // ── Tear down audio element + pending timer ─────────────────────────────
  const clearPlayback = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  // Build the refs bundle inline each call — values are read at call-time
  // from the stable ref objects, so staleness is not possible.
  const getRefs = useCallback((): PlayRefs => ({
    session: sessionRef,
    audio:   audioRef,
    timer:   timerRef,
    stop:    stopRef,
  }), []);

  // ── speak: single verse, repeatCount times ──────────────────────────────
  const speak = useCallback(async (text: string) => {
    console.log(`[TTS:session] speak() — speed=${speed} repeat=${repeatCount}`);
    stopRef.current = false;
    setIsSpeaking(true);
    unlockAudio();

    try {
      const data = await synthesizeSpeech(text, speed);
      if (stopRef.current) { console.log("[TTS:session] speak() stopped during synthesis"); setIsSpeaking(false); return; }

      sessionRef.current = { queue: [{ id: -1, data }], itemIdx: 0, cycleIdx: 0, totalCycles: repeatCount };
      console.log(`[TTS:session] speak() — session ready, cycles=${repeatCount}`);
      runDriveQueue(getRefs(), setters, clearPlayback);
    } catch (err: unknown) {
      console.error("[TTS:session] speak() error:", err instanceof Error ? err.message : err);
      setIsSpeaking(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, repeatCount, unlockAudio, clearPlayback, getRefs]);

  // ── speakSequence: queue of verses, full queue repeated N times ──────────
  const speakSequence = useCallback(async (items: { id: number; text: string }[]) => {
    if (items.length === 0) return;
    console.log(`[TTS:session] speakSequence() — items=${items.length} speed=${speed} repeat=${repeatCount}`);
    stopRef.current = false;
    setIsSpeaking(true);
    setCurrentIndex(-1);
    unlockAudio();

    try {
      const synthesized: Array<{ id: number; data: string }> = [];
      for (const item of items) {
        if (stopRef.current) { console.log("[TTS:session] speakSequence() stopped during synthesis"); break; }
        console.log(`[TTS:session] synthesizing id=${item.id}`);
        const data = await synthesizeSpeech(item.text, speed);
        synthesized.push({ id: item.id, data });
        console.log(`[TTS:session] synthesized id=${item.id} dataLen=${data.length}`);
      }

      if (stopRef.current || synthesized.length === 0) { setIsSpeaking(false); return; }

      sessionRef.current = { queue: synthesized, itemIdx: 0, cycleIdx: 0, totalCycles: repeatCount };
      console.log(`[TTS:session] speakSequence() — session ready, queue=${synthesized.length} cycles=${repeatCount}`);
      runDriveQueue(getRefs(), setters, clearPlayback);
    } catch (err: unknown) {
      console.error("[TTS:session] speakSequence() error:", err instanceof Error ? err.message : err);
      setIsSpeaking(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, repeatCount, unlockAudio, clearPlayback, getRefs]);

  // ── stop ─────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    console.log("[TTS:stop] called");
    stopRef.current = true;
    sessionRef.current = null;
    clearPlayback();
    setIsSpeaking(false);
    setCurrentIndex(-1);
  }, [clearPlayback]);

  return {
    speak, speakSequence, stop, isSpeaking, currentIndex,
    speed, setSpeed, repeatCount, setRepeatCount,
  };
}
