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

  const weekDates = useMemo(
    () => (date ? getWeekDates(date) : []),
    [date]
  );

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
        <div className="w-full max-h-[calc(100vh-280px)] overflow-auto rounded-xl border border-[#dce8f1] bg-white shadow-[0_5px_18px_rgba(31,73,104,0.045)]">
          <table className="w-max min-w-full border-collapse border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 h-10 w-[96px] min-w-[96px] max-w-[96px] border-b border-r border-[#dce8f1] bg-[#f5f9fc] px-2 text-center text-[10px] font-semibold text-[#315773]">
                  День
                </th>

                <th className="sticky left-[96px] top-0 z-30 h-10 w-[68px] min-w-[68px] max-w-[68px] border-b border-r border-[#dce8f1] bg-[#f5f9fc] px-1 text-center text-[10px] font-semibold text-[#315773]">
                  Пара
                </th>

                {sortedRooms.map((room) => (
                  <th
                    key={room.id}
                    className="sticky top-0 z-20 h-10 w-[155px] min-w-[155px] max-w-[155px] border-b border-r border-[#dce8f1] bg-[#f5f9fc] px-2 text-center text-[10px] font-semibold text-[#315773] last:border-r-0"
                  >
                    {room.number}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {weekDates.map((weekDate, dayIndex) => {
                const dayName = formatDayName(weekDate);
                const dayDate = formatDayDate(weekDate);

                return periods.map((item, periodIndex) => {
                  const lessonPeriod = periodIndex + 1;

                  return (
                    <tr key={`${weekDate}-${item.name}`} className="h-[72px]">
                      {periodIndex === 0 && (
                        <th
                          rowSpan={periods.length}
                          className="sticky left-0 z-20 w-[96px] min-w-[96px] max-w-[96px] border-b border-r border-[#dce8f1] bg-[#fbfcfd] px-2 align-middle text-center"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="[writing-mode:vertical-rl] rotate-180 text-[15px] font-bold capitalize leading-none text-[#365c75]">
                              {dayName}
                            </span>

                            <span className="[writing-mode:vertical-rl] rotate-180 text-[12px] font-semibold leading-none text-[#71899b]">
                              {dayDate}
                            </span>
                          </div>
                        </th>
                      )}

                      <th className="sticky left-[96px] z-20 w-[68px] min-w-[68px] max-w-[68px] border-b border-r border-[#dce8f1] bg-[#f8fafc] px-1 align-middle text-center">
                        <span className="block text-[9px] font-semibold leading-[1.15] text-[#315773]">
                          {item.name}
                        </span>

                        <span className="mt-1 block whitespace-nowrap text-[6px] font-normal leading-[1.1] text-[#8aa0b2]">
                          {item.time}
                        </span>
                      </th>

                      {sortedRooms.map((room) => {
                        const lesson = getLesson(
                          weeklySchedule[room.id],
                          weekDate,
                          lessonPeriod,
                          weekType
                        );

                        return (
                          <td
                            key={`${room.id}-${weekDate}-${lessonPeriod}`}
                            className="h-[72px] w-[155px] min-w-[155px] max-w-[155px] border-b border-r border-[#dce8f1] p-0 align-middle last:border-r-0"
                          >
                            <button
                              type="button"
                              className={`flex h-full min-h-[72px] w-full flex-col items-center justify-center gap-1 overflow-hidden px-2 text-center transition ${lesson ? "bg-[#FFD6D6] text-[#D93636] hover:bg-[#FFC2C2]" : "bg-[#D1F4DF] text-[#168A46] hover:bg-[#BDEECE]"}`}
                              onClick={() => {
                                if (lesson) {
                                  setSelectedLesson(lesson);
                                }
                              }}
                            >
                              {lesson ? (
                                <span className="text-[9px] font-semibold">
                                  Занята
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold">
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
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(18,52,81,0.35)] p-5 backdrop-blur-[4px]"
            onClick={() => setSelectedLesson(null)}
          >
            <div
              className="relative w-full max-w-[440px] rounded-[18px] border border-[#dce8f1] bg-white p-7 shadow-[0_25px_70px_rgba(18,52,81,0.2)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-3 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#f1f6fa] text-[20px] text-[#71889a] transition hover:bg-[#e5eef5]"
                onClick={() => setSelectedLesson(null)}
                aria-label="Закрыть"
              >
                ×
              </button>

              <h2 className="mb-3 pr-8 text-[20px] font-semibold leading-[1.35] text-[#183d5d]">
                {selectedLesson.subject}
              </h2>

              <p className="mb-4 text-[14px] text-[#647d91]">
                {selectedLesson.teacher}
              </p>

              <div className="inline-flex rounded-full bg-[#e8f3eb] px-3 py-1.5 text-[12px] text-[#245b39]">
                {selectedLesson.period} пара
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <section
      className={`grid gap-3 ${view === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"}`}
      aria-live="polite"
    >
      {sortedRooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          period={period}
          view={view}
        />
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
    <article className={`relative overflow-hidden rounded-2xl border bg-white transition ${lesson ? "border-[#f0d6d6]" : "border-[#dce8f1]"} ${view === "list" ? "flex min-h-[84px] items-center gap-5 px-5 py-4" : "min-h-[150px] p-5"}`}>
      <div className={view === "list" ? "min-w-[90px]" : ""}>
        <h3 className="text-[16px] font-semibold text-[#12395e]">
          {room.number}
        </h3>

        <span className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium ${lesson ? "text-[#D93636]" : "text-[#168A46]"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${lesson ? "bg-[#D93636]" : "bg-[#168A46]"}`} />
          {lesson ? "Занята" : "Свободна"}
        </span>
      </div>

      {lesson ? (
        <div className={view === "list" ? "min-w-0 flex-1" : "mt-5"}>
          <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-[#315773]">
            {lesson.subject}
          </strong>

          <span className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#7893aa]">
            {lesson.teacher}
          </span>
        </div>
      ) : (
        <p className={view === "list" ? "ml-auto text-[11px] text-[#8aa0b2]" : "mt-6 text-[11px] text-[#8aa0b2]"}>
          Можно использовать
        </p>
      )}
    </article>
  );
}