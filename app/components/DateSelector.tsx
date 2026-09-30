"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

type DateSelectorProps = {
  date: string;
  setDate: (date: string) => void;
};

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DateSelector({
  date,
  setDate,
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = new Date(`${date}T12:00:00`);
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });

  useEffect(() => {
    const selected = new Date(`${date}T12:00:00`);
    if (!Number.isNaN(selected.getTime())) {
      setVisibleMonth(
        new Date(selected.getFullYear(), selected.getMonth(), 1)
      );
    }
  }, [date]);

  const today = toDateString(new Date());

  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString(
    "ru-RU",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const monthTitle = visibleMonth.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Понедельник — первый день недели
    const offset = (firstDay.getDay() + 6) % 7;

    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [visibleMonth]);

  const changeMonth = (amount: number) => {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1)
    );
  };

  const selectDate = (day: number) => {
    const selected = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      day
    );

    setDate(toDateString(selected));
    setIsOpen(false);
  };

  const selectToday = () => {
    const current = new Date();
    setDate(toDateString(current));
    setVisibleMonth(
      new Date(current.getFullYear(), current.getMonth(), 1)
    );
    setIsOpen(false);
  };

  const clearDate = () => {
    setIsOpen(false);
  };

  return (
    <div className="custom-date-picker">
      <button
        type="button"
        className="custom-date-button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="custom-date-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
        </span>

        <span className="custom-date-text">
          <span>Выбранная дата</span>
          <strong>{formattedDate}</strong>
        </span>
      </button>

      {isOpen && (
        <div
          className="custom-calendar"
          role="dialog"
          aria-label="Выбор даты"
        >
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-month-button"
              onClick={() => changeMonth(-1)}
              aria-label="Предыдущий месяц"
            >
              ‹
            </button>

            <strong>{monthTitle}</strong>

            <button
              type="button"
              className="calendar-month-button"
              onClick={() => changeMonth(1)}
              aria-label="Следующий месяц"
            >
              ›
            </button>
          </div>

          <div className="calendar-weekdays">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-days">
            {days.map((day, index) =>
              day === null ? (
                <span className="calendar-empty" key={`empty-${index}`} />
              ) : (
                <button
                  type="button"
                  key={day}
                  className={[
                    "calendar-day",
                    date ===
                    toDateString(
                      new Date(
                        visibleMonth.getFullYear(),
                        visibleMonth.getMonth(),
                        day
                      )
                    )
                      ? "selected"
                      : "",
                    today ===
                    toDateString(
                      new Date(
                        visibleMonth.getFullYear(),
                        visibleMonth.getMonth(),
                        day
                      )
                    )
                      ? "today"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => selectDate(day)}
                >
                  {day}
                </button>
              )
            )}
          </div>
           <CalendarDays
              size={22}
              strokeWidth={1.8}
            /> 
          <div className="calendar-footer">
            <button
              type="button"
              className="calendar-action"
              onClick={clearDate}
            >
              Закрыть
            </button>

            <button
              type="button"
              className="calendar-action"
              onClick={selectToday}
            >
              Сегодня
            </button>
          </div>
        </div>
      )}
    </div>
  );
}