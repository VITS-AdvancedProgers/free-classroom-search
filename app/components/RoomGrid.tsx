"use client";

import { useMemo, useState } from "react";
import { periods, type Room } from "../data/rooms";
import type { WeekLesson, WeekType } from "../hooks/useRooms";

type View = "grid" | "list" | "table";

type RoomGridProps = {
  rooms: Room[];
  period: number;
  view: View;
  weeklySchedule?: Record<number, WeekLesson[]>;
  date?: string;
  weekType?: WeekType;
};

function getWeekDates(date: string): string[] {
  const selected = new Date(`${date}T12:00:00`);
  const day = selected.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  selected.setDate(selected.getDate() + mondayOffset);

  return Array.from({ length: 6 }, (_, index) => {
    const current = new Date(selected);
    current.setDate(selected.getDate() + index);

    return [
      current.getFullYear(),
      String(current.getMonth() + 1).padStart(2, "0"),
      String(current.getDate()).padStart(2, "0"),
    ].join("-");
  });
}

function formatDayName(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
    weekday: "long",
  });
}

function formatDayDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

function splitTime(time: string): { start: string; end: string } {
  const parts = time.split("–");

  return {
    start: parts[0]?.trim() ?? "",
    end: parts[1]?.trim() ?? "",
  };
}

function getLesson(
  lessons: WeekLesson[] | undefined,
  date: string,
  period: number,
  weekType: WeekType
): WeekLesson | null {
  if (!lessons) {
    return null;
  }

  const matches = lessons.filter((lesson) => {
    const lessonDate = lesson.date.slice(0, 10);
    const correctDate = lessonDate === date;
    const correctPeriod = lesson.period === period;
    const correctWeek =
      lesson.typeWeekID === 0 || lesson.typeWeekID === weekType;

    return correctDate && correctPeriod && correctWeek;
  });

  return matches[0] ?? null;
}

function isCurrentPeriod(periodIndex: number, date: string): boolean {
  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  if (today !== date) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const periodInfo = periods[periodIndex];

  if (!periodInfo) {
    return false;
  }

  const [start, end] = periodInfo.time.split("–").map((time) => {
    const [hours, minutes] = time.trim().split(":").map(Number);
    return hours * 60 + minutes;
  });

  return currentMinutes >= start && currentMinutes < end;
}

export default function RoomGrid({
  rooms,
  period,
  view,
  weeklySchedule = {},
  date = "",
  weekType = 0,
}: RoomGridProps) {
  const [selectedLesson, setSelectedLesson] = useState<WeekLesson | null>(
    null
  );

  const weekDates = useMemo(() => (date ? getWeekDates(date) : []), [date]);

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort((a, b) =>
        a.number.localeCompare(b.number, "ru", {
          numeric: true,
        })
      ),
    [rooms]
  );

  if (view === "table" && date) {
    return (
      <>
        <div className="w-full max-h-[calc(100vh-280px)] overflow-auto rounded-xl border border-[#dce8f1] bg-white shadow-[0_5px_18px_rgba(31,73,104,0.045)] min-[1800px]:max-h-[calc(100vh-210px)] min-[1800px]:rounded-xl">
          <table className="w-max min-w-full border-collapse border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 h-10 w-[96px] min-w-[96px] max-w-[96px] border-b border-r border-[#dce8f1] bg-[#f5f9fc] px-2 text-center text-[10px] font-semibold text-[#315773] min-[1800px]:h-[70px] min-[1800px]:w-[80px] min-[1800px]:min-w-[80px] min-[1800px]:max-w-[80px] min-[1800px]:text-[15px]">
                  День
                </th>

                <th className="sticky left-[96px] top-0 z-30 h-10 w-[68px] min-w-[68px] max-w-[68px] border-b border-r border-[#dce8f1] bg-[#f5f9fc] px-1 text-center text-[10px] font-semibold text-[#315773] min-[1800px]:left-[80px] min-[1800px]:h-[70px] min-[1800px]:w-[78px] min-[1800px]:min-w-[78px] min-[1800px]:max-w-[78px] min-[1800px]:text-[15px]">
                  Пара
                </th>

                {sortedRooms.map((room) => (
                  <th key={room.id} className="sticky top-0 z-20 h-10 w-[155px] min-w-[155px] max-w-[155px] border-b border-r border-[#dce8f1] bg-[#f5f9fc] px-2 text-center text-[10px] font-semibold text-[#315773] last:border-r-0 min-[1800px]:h-[70px] min-[1800px]:w-[145px] min-[1800px]:min-w-[145px] min-[1800px]:max-w-[145px] min-[1800px]:px-2 min-[1800px]:text-[15px]">
                    {room.number}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {weekDates.map((weekDate) => {
                const dayName = formatDayName(weekDate);
                const dayDate = formatDayDate(weekDate);

                return periods.map((item, periodIndex) => {
                  const lessonPeriod = periodIndex + 1;
                  const current = isCurrentPeriod(periodIndex, weekDate);
                  const time = splitTime(item.time);

                  return (
                    <tr key={`${weekDate}-${item.name}`} className="h-[72px] min-[1800px]:h-[100px]">
                      {periodIndex === 0 && (
                        <th rowSpan={periods.length} className="sticky left-0 z-20 w-[96px] min-w-[96px] max-w-[96px] border-b border-r border-[#dce8f1] bg-[#fbfcfd] px-2 align-middle text-center min-[1800px]:w-[80px] min-[1800px]:min-w-[80px] min-[1800px]:max-w-[80px] min-[1800px]:px-1">
                          <div className="flex items-center justify-center">
                            <div className="flex rotate-[-90deg] items-center gap-3 whitespace-nowrap min-[1800px]:gap-4">
                              <span className="text-[15px] font-bold capitalize leading-none text-[#365c75] min-[1800px]:text-[18px]">
                                {dayName}
                              </span>

                              <span className="text-[12px] font-semibold leading-none text-[#71899b] min-[1800px]:text-[14px]">
                                {dayDate}
                              </span>
                            </div>
                          </div>
                        </th>
                      )}

                      <th className={`sticky left-[96px] z-20 w-[68px] min-w-[68px] max-w-[68px] border-b border-r border-[#dce8f1] px-1 align-middle text-center min-[1800px]:left-[80px] min-[1800px]:w-[78px] min-[1800px]:min-w-[78px] min-[1800px]:max-w-[78px] ${current ? "bg-[#f1fbf5]" : "bg-[#f8fafc]"}`}>
                        {current && (
                          <span className="mx-auto mb-1 block h-2 w-2 rounded-full bg-[#26a65b] min-[1800px]:mb-2 min-[1800px]:h-3 min-[1800px]:w-3" />
                        )}

                        <span className={`block text-[9px] font-semibold leading-[1.15] min-[1800px]:text-[14px] ${current ? "text-[#168a46]" : "text-[#315773]"}`}>
                          {item.name}
                        </span>

                        <div className="mx-auto mt-1 flex flex-col items-center min-[1800px]:mt-2">
                          <span className="whitespace-nowrap text-[6px] font-normal leading-none text-[#8aa0b2] min-[1800px]:text-[10px]">
                            {time.start}
                          </span>

                          <span className="my-1 block h-px w-[30px] bg-[#8aa0b2] opacity-60 min-[1800px]:my-2 min-[1800px]:w-[42px]" />

                          <span className="whitespace-nowrap text-[6px] font-normal leading-none text-[#8aa0b2] min-[1800px]:text-[10px]">
                            {time.end}
                          </span>
                        </div>
                      </th>

                      {sortedRooms.map((room) => {
                        const lesson = getLesson(
                          weeklySchedule[room.id],
                          weekDate,
                          lessonPeriod,
                          weekType
                        );

                        return (
                          <td key={`${room.id}-${weekDate}-${lessonPeriod}`} className="h-[72px] w-[155px] min-w-[155px] max-w-[155px] border-b border-r border-[#dce8f1] p-0 align-middle last:border-r-0 min-[1800px]:h-[100px] min-[1800px]:w-[145px] min-[1800px]:min-w-[145px] min-[1800px]:max-w-[145px]">
                            <button
                              type="button"
                              className={`relative flex h-full min-h-[72px] w-full flex-col items-center justify-center gap-1 overflow-hidden px-2 text-center transition min-[1800px]:min-h-[100px] min-[1800px]:gap-2 min-[1800px]:px-3 ${lesson ? "bg-[#FFD6D6] text-[#D93636] hover:bg-[#FFC2C2]" : "bg-[#D1F4DF] text-[#168A46] hover:bg-[#BDEECE]"}`}
                              onClick={() => {
                                if (lesson) {
                                  setSelectedLesson(lesson);
                                }
                              }}
                            >
                              {current && (
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#26a65b] shadow-[0_0_0_2px_rgba(38,166,91,0.12)] min-[1800px]:right-3 min-[1800px]:top-3 min-[1800px]:h-3 min-[1800px]:w-3" />
                              )}

                              {lesson ? (
                                <>
                                  <span className="truncate text-[9px] font-bold min-[1800px]:text-[16px]">
                                    Занята
                                  </span>

                                  <span className="max-w-[92%] truncate text-[7px] font-medium opacity-80 min-[1800px]:text-[12px]">
                                    {lesson.subject}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[9px] font-bold min-[1800px]:text-[16px]">
                                  Свободна
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {selectedLesson && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(18,52,81,0.35)] p-5 backdrop-blur-[4px]" onClick={() => setSelectedLesson(null)}>
            <div className="relative w-full max-w-[440px] rounded-[18px] border border-[#dce8f1] bg-white p-7 shadow-[0_25px_70px_rgba(18,52,81,0.2)] min-[1800px]:max-w-[500px] min-[1800px]:rounded-2xl min-[1800px]:p-7" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="absolute right-3 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#f1f6fa] text-[20px] text-[#71889a] transition hover:bg-[#e5eef5] min-[1800px]:h-9 min-[1800px]:w-9 min-[1800px]:text-[22px]" onClick={() => setSelectedLesson(null)} aria-label="Закрыть">
                ×
              </button>

              <h2 className="mb-3 pr-8 text-[20px] font-semibold leading-[1.35] text-[#183d5d] min-[1800px]:text-[22px]">
                {selectedLesson.subject}
              </h2>

              <p className="mb-4 text-[14px] text-[#647d91] min-[1800px]:text-[15px]">
                {selectedLesson.teacher}
              </p>

              <div className="inline-flex rounded-full bg-[#e8f3eb] px-3 py-1.5 text-[12px] text-[#245b39] min-[1800px]:px-4 min-[1800px]:py-2 min-[1800px]:text-[13px]">
                {selectedLesson.period} пара
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <section className={`grid gap-3 min-[1800px]:gap-2 ${view === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"}`} aria-live="polite">
      {sortedRooms.map((room) => (
        <RoomCard key={room.id} room={room} period={period} view={view} />
      ))}
    </section>
  );
}

function RoomCard({
  room,
  period,
  view,
}: {
  room: Room;
  period: number;
  view: View;
}) {
  const lesson = room.lessons[period - 1];

  return (
    <article className={`relative overflow-hidden rounded-2xl border bg-white transition min-[1800px]:rounded-xl ${lesson ? "border-[#f0d6d6]" : "border-[#dce8f1]"} ${view === "list" ? "flex min-h-[84px] items-center gap-5 px-5 py-4 min-[1800px]:min-h-[64px] min-[1800px]:gap-3 min-[1800px]:px-3 min-[1800px]:py-2.5" : "min-h-[150px] p-5 min-[1800px]:min-h-[110px] min-[1800px]:p-3"}`}>
      <div className={view === "list" ? "min-w-[90px] min-[1800px]:min-w-[70px]" : ""}>
        <h3 className="text-[16px] font-semibold text-[#12395e] min-[1800px]:text-[13px]">
          {room.number}
        </h3>

        <span className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium min-[1800px]:mt-0.5 min-[1800px]:gap-1 min-[1800px]:text-[8px] ${lesson ? "text-[#D93636]" : "text-[#168A46]"}`}>
          <span className={`h-1.5 w-1.5 rounded-full min-[1800px]:h-1.5 min-[1800px]:w-1.5 ${lesson ? "bg-[#D93636]" : "bg-[#168A46]"}`} />
          {lesson ? "Занята" : "Свободна"}
        </span>
      </div>

      {lesson ? (
        <div className={view === "list" ? "min-w-0 flex-1" : "mt-5 min-[1800px]:mt-3"}>
          <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-[#315773] min-[1800px]:text-[10px]">
            {lesson.subject}
          </strong>

          <span className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#7893aa] min-[1800px]:mt-0.5 min-[1800px]:text-[8px]">
            {lesson.teacher}
          </span>
        </div>
      ) : (
        <p className={view === "list" ? "ml-auto text-[11px] text-[#8aa0b2] min-[1800px]:text-[8px]" : "mt-6 text-[11px] text-[#8aa0b2] min-[1800px]:mt-3 min-[1800px]:text-[8px]"}>
          Можно использовать
        </p>
      )}
    </article>
  );
}