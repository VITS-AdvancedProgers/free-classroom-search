
"use client";

import { useEffect, useState } from "react";
import type { Room } from "../data/rooms";

type ApiRoom = {
  name: string;
  id: number;
};

type ApiLesson = {
  номерЗанятия: number;
  дисциплина: string;
  преподаватель: string;
  дата: string;
  typeWeekID?: number;
};

type ApiSchedule = {
  data: {
    rasp: ApiLesson[];
    info?: {
      date?: string;
      lastDate?: string;
    };
  };
};

export type WeekLesson = {
  date: string;
  period: number;
  typeWeekID: number;
  subject: string;
  teacher: string;
};

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const ROOMS_CACHE_KEY = "rooms-cache";
const SCHEDULE_CACHE_KEY = "schedule-cache";
const ROOMS_CACHE_TIME = 30 * 60 * 1000;
const SCHEDULE_CACHE_TIME = 5 * 60 * 1000;

function readCache<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;

    const entry: CacheEntry<T> = JSON.parse(saved);

    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(
  key: string,
  data: T,
  duration: number
) {
  try {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + duration,
    };

    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error("Не удалось сохранить кэш:", error);
  }
}

function getDateString(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getWeekDates(date: string): string[] {
  const selected = new Date(`${date}T12:00:00`);
  const day = selected.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  selected.setDate(selected.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(selected);
    current.setDate(selected.getDate() + index);
    return getDateString(current);
  });
}

export function useRooms(date: string) {
  const [apiRooms, setApiRooms] = useState<ApiRoom[]>([]);
  const [schedule, setSchedule] = useState<
    Record<number, Room["lessons"]>
  >({});
  const [weeklySchedule, setWeeklySchedule] = useState<
    Record<number, WeekLesson[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRooms() {
      setLoading(true);
      setError("");

      const cachedRooms = readCache<ApiRoom[]>(ROOMS_CACHE_KEY);

      if (cachedRooms) {
        if (!cancelled) {
          setApiRooms(cachedRooms);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/rooms");

        if (!response.ok) {
          throw new Error("Не удалось загрузить аудитории");
        }

        const data: ApiRoom[] = await response.json();

        writeCache(ROOMS_CACHE_KEY, data, ROOMS_CACHE_TIME);

        if (!cancelled) {
          setApiRooms(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Произошла ошибка"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRooms();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (apiRooms.length === 0) return;

    let cancelled = false;

    async function loadSchedule() {
      setError("");

      const cachedSchedules = readCache<
        Record<
          string,
          {
            daily: Record<number, Room["lessons"]>;
            weekly: Record<number, WeekLesson[]>;
          }
        >
      >(SCHEDULE_CACHE_KEY) ?? {};

      const cached = cachedSchedules[date];

      if (
        cached &&
        Object.keys(cached.daily).length === apiRooms.length &&
        Object.keys(cached.weekly).length === apiRooms.length
      ) {
        setSchedule(cached.daily);
        setWeeklySchedule(cached.weekly);
        setScheduleLoading(false);
        return;
      }

      setSchedule({});
      setWeeklySchedule({});
      setScheduleLoading(true);

      try {
        const weekDates = getWeekDates(date);

        const results = await Promise.all(
          apiRooms.map(async (room) => {
            const params = new URLSearchParams({
              roomId: String(room.id),
              date,
            });

            const response = await fetch(
              `/api/schedule?${params.toString()}`
            );

            if (!response.ok) {
              throw new Error(
                `Не удалось загрузить расписание ${room.name}`
              );
            }

            const result: ApiSchedule = await response.json();
            const dailyLessons: Room["lessons"] = Array(6).fill(null);
            const weeklyLessons: WeekLesson[] = [];

            for (const lesson of result.data.rasp ?? []) {
              const lessonDate = lesson.дата.slice(0, 10);
              const period = lesson.номерЗанятия;

              if (
                !weekDates.includes(lessonDate) ||
                period < 1 ||
                period > 6
              ) {
                continue;
              }

              const typeWeekID = lesson.typeWeekID ?? 0;

              weeklyLessons.push({
                date: lessonDate,
                period,
                typeWeekID,
                subject: lesson.дисциплина,
                teacher: lesson.преподаватель,
              });

              if (lessonDate === date) {
                dailyLessons[period - 1] = {
                  subject: lesson.дисциплина,
                  teacher: lesson.преподаватель,
                };
              }
            }

            return [
              room.id,
              dailyLessons,
              weeklyLessons,
            ] as const;
          })
        );

        const newSchedule = Object.fromEntries(
          results.map(([id, daily]) => [id, daily])
        );

        const newWeeklySchedule = Object.fromEntries(
          results.map(([id, , weekly]) => [id, weekly])
        );

        const currentCache =
          readCache<
            Record<
              string,
              {
                daily: Record<number, Room["lessons"]>;
                weekly: Record<number, WeekLesson[]>;
              }
            >
          >(SCHEDULE_CACHE_KEY) ?? {};

        currentCache[date] = {
          daily: newSchedule,
          weekly: newWeeklySchedule,
        };

        writeCache(
          SCHEDULE_CACHE_KEY,
          currentCache,
          SCHEDULE_CACHE_TIME
        );

        if (!cancelled) {
          setSchedule(newSchedule);
          setWeeklySchedule(newWeeklySchedule);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Не удалось загрузить расписание"
          );
        }
      } finally {
        if (!cancelled) {
          setScheduleLoading(false);
        }
      }
    }

    loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [apiRooms, date]);

  return {
    apiRooms,
    schedule,
    weeklySchedule,
    loading,
    scheduleLoading,
    error,
  };
}
