"use client";

import { useState } from "react";
import type { Room } from "../data/rooms";
import { periods } from "../data/rooms";
import type { WeekLesson, WeekType } from "../hooks/useRooms";
import RoomCard from "./RoomCard";
import { X } from "lucide-react";

type View = "grid" | "list" | "table";

type RoomGridProps = {
  rooms: Room[];
  period: number;
  view: View;
  weeklySchedule?: Record<number, WeekLesson[]>;
  date?: string;
  weekType?: WeekType;
};

type SelectedLesson = {
  subject: string;
  teacher: string;
} | null;

const weekdays = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

function getDateString(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getWeekDates(date: string) {
  const selected = new Date(`${date}T12:00:00`);
  const day = selected.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  selected.setDate(selected.getDate() + mondayOffset);

  return Array.from({ length: 6 }, (_, index) => {
    const current = new Date(selected);
    current.setDate(selected.getDate() + index);

    return getDateString(current);
  });
}

export default function RoomGrid({
  rooms,
  period,
  view,
  weeklySchedule = {},
  date,
  weekType = 0,
}: RoomGridProps) {
  const [selectedLesson, setSelectedLesson] =
    useState<SelectedLesson>(null);

  if (view === "table") {
    const days = getWeekDates(date ?? "");

    function getLesson(
      roomId: number,
      day: string,
      lessonPeriod: number
    ) {
      const lessons = weeklySchedule[roomId] ?? [];

      return lessons.find(
        (lesson) =>
          lesson.date === day &&
          lesson.period === lessonPeriod &&
          (weekType === 0
            ? lesson.typeWeekID === 0
            : lesson.typeWeekID === 0 ||
              lesson.typeWeekID === weekType)
      );
    }

    return (
      <>
        <div className="w-full max-h-[calc(100vh-280px)] overflow-auto rounded-xl border border-[#c9dce9] bg-white shadow-sm">
          <table className="min-w-max w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#c9dce9] bg-[#f3f8fc]">
                <th className="sticky left-0 top-0 z-40 min-w-[130px] border-r border-[#c9dce9] bg-[#f3f8fc] px-4 py-3 text-xs font-semibold text-[#234d70]">
                  День
                </th>

                <th className="sticky left-[130px] top-0 z-40 min-w-[120px] border-r border-[#c9dce9] bg-[#f3f8fc] px-4 py-3 text-xs font-semibold text-[#234d70]">
                  Пара
                </th>

                {rooms.map((room) => (
                  <th key={room.id} className="sticky top-0 z-30 min-w-[150px] border-r border-[#dce8f0] bg-[#f3f8fc] px-3 py-3 text-center text-xs font-semibold text-[#234d70] last:border-r-0">
                    {room.number}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {days.map((day, dayIndex) =>
                periods.map((item, periodIndex) => {
                  const lessonNumber = periodIndex + 1;

                  return (
                    <tr key={`${day}-${lessonNumber}`} className="border-b border-[#dce8f0] last:border-b-0">
                      {periodIndex === 0 && (
                        <td rowSpan={periods.length} className="sticky left-0 z-20 border-r border-[#c9dce9] bg-white px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-[#234d70]">
                              {weekdays[dayIndex]}
                            </span>

                            <span className="text-[11px] text-[#7890a5]">
                              {new Date(`${day}T12:00:00`).toLocaleDateString("ru-RU", {
                                day: "numeric",
                                month: "long",
                              })}
                            </span>
                          </div>
                        </td>
                      )}

                      <td className="sticky left-[130px] z-20 border-r border-[#dce8f0] bg-white px-3 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#234d70]">
                            {item.name}
                          </span>

                          <span className="mt-1 text-[10px] text-[#7890a5]">
                            {item.time}
                          </span>
                        </div>
                      </td>

                      {rooms.map((room) => {
                        const lesson = getLesson(
                          room.id,
                          day,
                          lessonNumber
                        );

                        const isBusy = Boolean(lesson);

                        return (
                          <td key={room.id} className="border-r border-[#dce8f0] p-0 last:border-r-0">
                            <button
                              type="button"
                              disabled={!lesson}
                              onClick={() => {
                                if (!lesson) {
                                  return;
                                }

                                setSelectedLesson({
                                  subject: lesson.subject,
                                  teacher: lesson.teacher,
                                });
                              }}
                              className={`flex min-h-[78px] w-full flex-col items-center justify-center px-2 py-2 text-center transition ${isBusy ? "cursor-pointer bg-[#FFD6D6] text-[#D93636] hover:bg-[#FFC2C2]" : "cursor-default bg-[#D1F4DF] text-[#168A46] hover:bg-[#BDEECE]"}`}
                            >
                              {isBusy ? (
                                <>
                                  <span className="text-xs font-bold">
                                    Занято
                                  </span>

                                  <span className="mt-1 max-w-[130px] truncate text-[10px] font-medium opacity-90">
                                    {lesson?.subject}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs font-bold">
                                  Свободно
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {selectedLesson && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-md rounded-2xl border border-[#dce8f0] bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-[#234d70]">
                    Занятие
                  </h3>

                  <p className="mt-1 text-xs text-[#7890a5]">
                    Информация о занятии
                  </p>
                </div>

                <button type="button" onClick={() => setSelectedLesson(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7890a5] transition hover:bg-[#edf4f8] hover:text-[#234d70]">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#7890a5]">
                    Дисциплина
                  </div>

                  <div className="mt-1 text-sm font-medium text-[#234d70]">
                    {selectedLesson.subject}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#7890a5]">
                    Преподаватель
                  </div>

                  <div className="mt-1 text-sm font-medium text-[#234d70]">
                    {selectedLesson.teacher}
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => setSelectedLesson(null)} className="mt-6 w-full rounded-lg bg-[#e3f2ff] py-2.5 text-xs font-semibold text-[#1674bb] transition hover:bg-[#d5ebff]">
                Закрыть
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={view === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          period={period}
        />
      ))}
    </div>
  );
}