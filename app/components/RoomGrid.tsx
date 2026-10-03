"use client";

import { useState } from "react";
import type { Room } from "../data/rooms";
import { periods } from "../data/rooms";
import type { WeekLesson } from "../hooks/useRooms";
import RoomCard from "./RoomCard";
import { X } from "lucide-react";

type View = "grid" | "list" | "table";

type RoomGridProps = {
  rooms: Room[];
  period: number;
  view: View;
  weeklySchedule?: Record<number, WeekLesson[]>;
  date?: string;
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
  "Воскресенье",
];

function getWeekDates(date: string) {
  const selected = new Date(
    `${date || new Date().toISOString().slice(0, 10)}T12:00:00`
  );

  const day = selected.getDay();

  selected.setDate(
    selected.getDate() + (day === 0 ? -6 : 1 - day)
  );

  return weekdays.map((name, index) => {
    const current = new Date(selected);

    current.setDate(selected.getDate() + index);

    return {
      name,
      date: [
        current.getFullYear(),
        String(current.getMonth() + 1).padStart(2, "0"),
        String(current.getDate()).padStart(2, "0"),
      ].join("-"),
      shortDate: `${String(current.getDate()).padStart(2, "0")}.${String(
        current.getMonth() + 1
      ).padStart(2, "0")}`,
    };
  });
}

export default function RoomGrid({
  rooms,
  period,
  view,
  weeklySchedule = {},
  date,
}: RoomGridProps) {
  const [selectedLesson, setSelectedLesson] =
    useState<SelectedLesson>(null);

  if (view === "table") {
    const days = getWeekDates(date ?? "");

    function getLesson(
      roomId: number,
      day: string,
      lessonPeriod: number,
      type: 1 | 2
    ) {
      const lessons = weeklySchedule[roomId] ?? [];

      return lessons.find(
        (lesson) =>
          lesson.date === day &&
          lesson.period === lessonPeriod &&
          (lesson.typeWeekID === 0 ||
            lesson.typeWeekID === type)
      );
    }

    return (
      <>
        <div className="room-table-wrapper">
          <table className="room-table weekly-room-table">
            <thead>
              <tr>
                <th className="room-table-period">
                  День
                </th>

                <th className="weekly-period">
                  Пара
                </th>

                {rooms.map((room) => (
                  <th key={room.id}>
                    {room.number}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {days.map((day) =>
                periods.map((item, periodIndex) => {
                  const lessonNumber = periodIndex + 1;

                  return (
                    <tr
                      key={`${day.date}-${item.name}`}
                    >
                      {periodIndex === 0 && (
                        <th
                          className="weekly-day"
                          rowSpan={periods.length}
                        >
                          <span>{day.name}</span>
                          <small>{day.shortDate}</small>
                        </th>
                      )}

                      <th className="weekly-period">
                        <span>{item.name}</span>
                        <small>{item.time}</small>
                      </th>

                      {rooms.map((room) => {
                        const numerator = getLesson(
                          room.id,
                          day.date,
                          lessonNumber,
                          1
                        );

                        const denominator = getLesson(
                          room.id,
                          day.date,
                          lessonNumber,
                          2
                        );

                        return (
                          <td key={room.id}>
                            <div className="weekly-cell">

                              {/* ЧИСЛИТЕЛЬ */}
                              <button
                                type="button"
                                className={`weekly-lesson ${
                                  numerator
                                    ? "occupied"
                                    : "available"
                                }`}
                                onClick={() => {
                                  if (!numerator) return;

                                  setSelectedLesson({
                                    subject: numerator.subject,
                                    teacher: numerator.teacher,
                                  });
                                }}
                                disabled={!numerator}
                                title={
                                  numerator
                                    ? "Нажмите, чтобы посмотреть информацию"
                                    : "Свободно"
                                }
                              >
                                <span className="week-label">
                                  Числитель
                                </span>

                                <span>
                                  {numerator
                                    ? "Занято"
                                    : "Свободно"}
                                </span>
                              </button>

                              <div className="weekly-divider" />

                              {/* ЗНАМЕНАТЕЛЬ */}
                              <button
                                type="button"
                                className={`weekly-lesson ${
                                  denominator
                                    ? "occupied"
                                    : "available"
                                }`}
                                onClick={() => {
                                  if (!denominator) return;

                                  setSelectedLesson({
                                    subject:
                                      denominator.subject,
                                    teacher:
                                      denominator.teacher,
                                  });
                                }}
                                disabled={!denominator}
                                title={
                                  denominator
                                    ? "Нажмите, чтобы посмотреть информацию"
                                    : "Свободно"
                                }
                              >
                                <span className="week-label">
                                  Знаменатель
                                </span>

                                <span>
                                  {denominator
                                    ? "Занято"
                                    : "Свободно"}
                                </span>
                              </button>

                            </div>
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

        {/* МОДАЛЬНОЕ ОКНО */}
        {selectedLesson && (
          <div
            className="lesson-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedLesson(null);
              }
            }}
          >
            <div
              className="lesson-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lesson-modal-title"
            >
              <button
                type="button"
                className="lesson-modal-close"
                onClick={() => setSelectedLesson(null)}
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>

              <h2 id="lesson-modal-title">
                {selectedLesson.subject || "Занятие"}
              </h2>

              <p className="lesson-modal-teacher">
                {selectedLesson.teacher ||
                  "Преподаватель не указан"}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`room-grid ${
        view === "list" ? "list-view" : ""
      }`}
    >
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