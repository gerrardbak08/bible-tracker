"use client";

import { useState, useRef, useCallback } from "react";

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

export const SPEED_OPTIONS = [
  { label: "0.75x", value: 0.75 },
  { label: "1.0x", value: 1.0 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
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

  const body = {
    input: { text },
    voice: {
      languageCode: "ko-KR",
      name: "ko-KR-Wavenet-A",
      ssmlGender: "FEMALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: speed,
      pitch: 0,
      volumeGainDb: 0,
    },
  };

  const res = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.audioContent; // base64 MP3
}

export function useTts() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [speed, setSpeed] = useState(1.0);
  const [repeatCount, setRepeatCount] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef(false);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  // iOS fix: unlock audio context synchronously before any async work
  const unlockAudio = useCallback(() => {
    try {
      const a = new Audio();
      a.play().catch(() => {});
    } catch {}
  }, []);

  // Play a base64 MP3. Creates Audio element immediately (iOS-safe).
  const playBase64 = useCallback((base64: string): Promise<void> => {
    cleanup();
    return new Promise((resolve) => {
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audioRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  }, [cleanup]);

  const speak = useCallback(async (text: string) => {
    stopRef.current = false;
    setIsSpeaking(true);

    // Unlock iOS audio context synchronously before async work
    unlockAudio();

    try {
      // Synthesize ONCE, replay repeatCount times
      const base64 = await synthesizeSpeech(text, speed);
      if (stopRef.current) { setIsSpeaking(false); return; }

      for (let r = 0; r < repeatCount; r++) {
        if (stopRef.current) break;
        await playBase64(base64);
        if (r < repeatCount - 1 && !stopRef.current) {
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    } catch (err: unknown) {
      console.error("[TTS]", err instanceof Error ? err.message : err);
    }
    setIsSpeaking(false);
  }, [speed, repeatCount, playBase64, unlockAudio]);

  const speakSequence = useCallback(async (items: { id: number; text: string }[]) => {
    if (items.length === 0) return;
    stopRef.current = false;
    setIsSpeaking(true);

    // Unlock iOS audio context synchronously before async work
    unlockAudio();

    try {
      // Pre-synthesize all items ONCE (1 API call per verse regardless of repeatCount)
      const audioMap: Record<number, string> = {};
      for (const item of items) {
        if (stopRef.current) break;
        audioMap[item.id] = await synthesizeSpeech(item.text, speed);
      }

      // Play sequence repeatCount times using cached audio
      for (let r = 0; r < repeatCount; r++) {
        if (stopRef.current) break;
        for (let i = 0; i < items.length; i++) {
          if (stopRef.current) break;
          setCurrentIndex(items[i].id);
          await playBase64(audioMap[items[i].id]);
          if (i < items.length - 1 && !stopRef.current) {
            await new Promise((res) => setTimeout(res, 1200));
          }
        }
        if (r < repeatCount - 1 && !stopRef.current) {
          await new Promise((res) => setTimeout(res, 2000));
        }
      }
    } catch (err: unknown) {
      console.error("[TTS Sequence]", err instanceof Error ? err.message : err);
    }
    setIsSpeaking(false);
    setCurrentIndex(-1);
  }, [speed, repeatCount, playBase64, unlockAudio]);

  const stop = useCallback(() => {
    stopRef.current = true;
    cleanup();
    setIsSpeaking(false);
    setCurrentIndex(-1);
  }, [cleanup]);

  return {
    speak, speakSequence, stop, isSpeaking, currentIndex,
    speed, setSpeed, repeatCount, setRepeatCount,
  };
}
