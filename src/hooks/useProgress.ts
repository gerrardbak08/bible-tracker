"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useProgress(userName: string) {
  const [masteredVerses, setMasteredVerses] = useState<number[]>([]);
  const [dailyVerses, setDailyVerses] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getTodayString = () => {
    // KST is UTC+9. Using local string and manual construction for consistency.
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === "year")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const day = parts.find(p => p.type === "day")?.value;
    return `${year}-${month}-${day}`;
  };

  // Fetch initial data
  useEffect(() => {
    async function fetchProgress() {
      setIsLoading(true);
      const today = getTodayString();
      
      const { data, error } = await supabase
        .from("progress")
        .select("mastered_verses, daily_verses, last_checked_date")
        .eq("user_name", userName)
        .single();

      if (error) {
        console.warn("Could not fetch progress, might be new user:", error.message);
        setMasteredVerses([]);
        setDailyVerses([]);
      } else {
        setMasteredVerses(data.mastered_verses || []);
        
        // If last checked date is today, keep daily verses. Otherwise reset.
        if (data.last_checked_date === today) {
          setDailyVerses(data.daily_verses || []);
        } else {
          setDailyVerses([]);
        }
      }
      setIsLoading(false);
    }

    if (userName) {
      fetchProgress();
    }
  }, [userName]);

  const toggleMastery = async (verseId: number) => {
    const isMastered = masteredVerses.includes(verseId);
    const newMastered = isMastered
      ? masteredVerses.filter((id) => id !== verseId)
      : [...masteredVerses, verseId];
    
    setMasteredVerses(newMastered);

    const { error } = await supabase
      .from("progress")
      .upsert({ 
        user_name: userName, 
        mastered_verses: newMastered,
        last_checked_date: getTodayString() 
      }, { onConflict: "user_name" });

    if (error) {
      console.error("Error updating mastery:", error);
      setMasteredVerses(masteredVerses); // revert
      alert("데이터 저장에 실패했습니다. (마스터리)");
    }
  };

  const toggleDaily = async (verseId: number) => {
    const isDaily = dailyVerses.includes(verseId);
    const newDaily = isDaily
      ? dailyVerses.filter((id) => id !== verseId)
      : [...dailyVerses, verseId];
    
    setDailyVerses(newDaily);
    const today = getTodayString();

    const { error } = await supabase
      .from("progress")
      .upsert({ 
        user_name: userName, 
        daily_verses: newDaily,
        last_checked_date: today 
      }, { onConflict: "user_name" });

    if (error) {
      console.error("Error updating daily practice:", error);
      setDailyVerses(dailyVerses); // revert
      alert("데이터 저장에 실패했습니다. (데일리)");
    }
  };

  const fetchTeamMandatoryProgress = async (members: typeof import("@/constants/data").TEAM_MEMBERS) => {
    try {
      const { data, error } = await supabase
        .from("progress")
        .select("user_name, mastered_verses");

      if (error) throw error;

      let totalCompleted = 0;
      const totalMandatory = members.length * 3; // 3 mandatory per member

      members.forEach(member => {
        const userProgress = data.find(d => d.user_name === member.id);
        if (userProgress) {
          const completedCount = member.mandatoryVerses.filter(id => 
            (userProgress.mastered_verses || []).includes(id)
          ).length;
          totalCompleted += completedCount;
        }
      });

      return Math.round((totalCompleted / totalMandatory) * 100);
    } catch (err) {
      console.error("Error fetching team progress:", err);
      return 0;
    }
  };

  return { masteredVerses, dailyVerses, toggleMastery, toggleDaily, isLoading, fetchTeamMandatoryProgress };
}
