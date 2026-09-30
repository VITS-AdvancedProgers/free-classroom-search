
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
};

type ApiSchedule = {
  data: {
    rasp: ApiLesson[];
  };
};

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const ROOMS_CACHE_KEY = "rooms-cache";
const SCHEDULE_CACHE_KEY = "schedule-cache";

const ROOMS_CACHE_TIME = 30 * 60 * 1000;
const SCHEDULE_CACHE_TIME = 5 * 60 * 1000;

// Читаем данные из localStorage
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

// Сохраняем данные в localStorage
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

export function useRooms(date: string) {
  const [apiRooms, setApiRooms] = useState<ApiRoom[]>([]);
  const [schedule, setSchedule] = useState<
    Record<number, Room["lessons"]>
  >({});
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState("");

  // Загружаем список аудиторий
  useEffect(() => {
    let cancelled = false;

    async function loadRooms() {
      setLoading(true);
      setError("");

      // Сначала проверяем localStorage
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

  // Загружаем расписание выбранной даты
  useEffect(() => {
    if (apiRooms.length === 0) return;

    let cancelled = false;

    async function loadSchedule() {
      setError("");

      // Получаем весь кэш расписаний
      const cachedSchedules = readCache<
        Record<string, Record<number, Room["lessons"]>>
      >(SCHEDULE_CACHE_KEY) ?? {};

      // Проверяем, есть ли расписание для выбранной даты
      const cachedSchedule = cachedSchedules[date];

      if (
        cachedSchedule &&
        Object.keys(cachedSchedule).length === apiRooms.length
      ) {
        setSchedule(cachedSchedule);
        setScheduleLoading(false);
        return;
      }

      setSchedule({});
      setScheduleLoading(true);

      try {
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
            const lessons: Room["lessons"] = Array(6).fill(null);

            for (const lesson of result.data.rasp) {
              if (!lesson.дата.startsWith(date)) continue;

              const index = lesson.номерЗанятия - 1;

              if (index >= 0 && index < lessons.length) {
                lessons[index] = {
                  subject: lesson.дисциплина,
                  teacher: lesson.преподаватель,
                };
              }
            }

            return [room.id, lessons] as const;
          })
        );

        const newSchedule = Object.fromEntries(results);

        // Обновляем кэш расписаний
        const currentCache =
          readCache<
            Record<string, Record<number, Room["lessons"]>>
          >(SCHEDULE_CACHE_KEY) ?? {};

        currentCache[date] = newSchedule;

        writeCache(
          SCHEDULE_CACHE_KEY,
          currentCache,
          SCHEDULE_CACHE_TIME
        );

        if (!cancelled) {
          setSchedule(newSchedule);
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
    loading,
    scheduleLoading,
    error,
  };
}