"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type DateSelectorProps = {
  date: string;
  setDate: (date: string) => void;
  weekType?: 0 | 1 | 2;
  weekNumber?: number | null;
};

const weekdays = [
  "Пн",
  "Вт",
  "Ср",
  "Чт",
  "Пт",
  "Сб",
  "Вс",
];

const monthNames = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "ru-RU",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function toDateString(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function isSameDate(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

export default function DateSelector({
  date,
  setDate,
  weekType = 0,
  weekNumber,
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = useMemo(
    () => parseDate(date),
    [date]
  );

  const today = useMemo(
    () => startOfDay(new Date()),
    []
  );

  const [visibleMonth, setVisibleMonth] = useState(
    () =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
  );

  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setVisibleMonth(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        )
      );
    }
  }, [isOpen, selectedDate]);

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const firstDay = new Date(
      year,
      month,
      1
    );

    const lastDay = new Date(
      year,
      month + 1,
      0
    );

    const firstWeekday =
      (firstDay.getDay() + 6) % 7;

    const daysInMonth =
      lastDay.getDate();

    const previousMonthDays =
      new Date(
        year,
        month,
        0
      ).getDate();

    const result: {
      date: Date;
      currentMonth: boolean;
    }[] = [];

    for (
      let i = firstWeekday - 1;
      i >= 0;
      i--
    ) {
      result.push({
        date: new Date(
          year,
          month - 1,
          previousMonthDays - i
        ),
        currentMonth: false,
      });
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      result.push({
        date: new Date(
          year,
          month,
          day
        ),
        currentMonth: true,
      });
    }

    let nextDay = 1;

    while (result.length % 7 !== 0) {
      result.push({
        date: new Date(
          year,
          month + 1,
          nextDay
        ),
        currentMonth: false,
      });

      nextDay++;
    }

    return result;
  }, [visibleMonth]);

  const currentMonthIsToday =
    visibleMonth.getFullYear() ===
      today.getFullYear() &&
    visibleMonth.getMonth() ===
      today.getMonth();

  const goToPreviousMonth = () => {
    if (currentMonthIsToday) {
      return;
    }

    setVisibleMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );
  };

  const goToNextMonth = () => {
    setVisibleMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );
  };

  const selectDate = (selected: Date) => {
    const selectedDay =
      startOfDay(selected);

    if (selectedDay < today) {
      return;
    }

    if (selectedDay.getDay() === 0) {
      return;
    }

    setDate(toDateString(selectedDay));
    setIsOpen(false);
  };

  const goToToday = () => {
    setDate(toDateString(today));

    setVisibleMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setIsOpen(false);
  };

  const weekLabel =
    weekType === 1
      ? "Числитель"
      : weekType === 2
        ? "Знаменатель"
        : "Каждую неделю";

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
    >
      <button
        type="button"
        onClick={() =>
          setIsOpen((value) => !value)
        }
        className="flex h-11 w-full min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-[#dce9f3] bg-white px-3 text-left shadow-sm transition hover:border-[#b9d8ef] hover:shadow-md sm:min-w-[220px] sm:gap-3 sm:px-4"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eaf5ff] text-[#1d78c8] sm:h-9 sm:w-9">
          <CalendarDays
            size={17}
            strokeWidth={2}
          />
        </span>

        <span className="flex min-w-0 flex-col">
          <span className="text-[8px] font-medium uppercase tracking-[0.4px] text-[#8aa0b2] sm:text-[9px]">
            Выбранная дата
          </span>

          <span className="mt-0.5 truncate text-[11px] font-semibold text-[#12395e] sm:text-[12px]">
            {formatDate(date)}
          </span>
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[calc(100vw-24px)] max-w-[340px] overflow-hidden rounded-2xl border border-[#dce9f3] bg-white p-3 shadow-[0_20px_55px_rgba(18,57,94,0.16)] sm:p-4"
          role="dialog"
          aria-label="Выбор даты"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              disabled={currentMonthIsToday}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${currentMonthIsToday ? "cursor-not-allowed text-[#cbd6de]" : "text-[#7893aa] hover:bg-[#eaf5ff] hover:text-[#1d78c8]"}`}
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft
                size={20}
                strokeWidth={2}
              />
            </button>

            <div className="text-[14px] font-semibold capitalize text-[#12395e]">
              {monthNames[
                visibleMonth.getMonth()
              ]}{" "}
              {visibleMonth.getFullYear()}
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#7893aa] transition hover:bg-[#eaf5ff] hover:text-[#1d78c8]"
              aria-label="Следующий месяц"
            >
              <ChevronRight
                size={20}
                strokeWidth={2}
              />
            </button>
          </div>

          <div className="mt-2 flex justify-center">
            <span className="max-w-full truncate rounded-full bg-[#eaf5ff] px-3 py-1 text-[9px] font-semibold text-[#1d78c8]">
              {weekNumber
                ? `Неделя ${weekNumber} · ${weekLabel.toLowerCase()}`
                : weekLabel}
            </span>
          </div>

          <div className="my-3 border-t border-[#eef4f8]" />

          <div className="grid grid-cols-7">
            {weekdays.map((day) => (
              <div
                key={day}
                className="flex h-8 items-center justify-center text-[10px] font-semibold text-[#8aa0b2] sm:h-9 sm:text-[11px]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {days.map(
              ({
                date: calendarDate,
                currentMonth,
              }) => {
                const calendarDay =
                  startOfDay(calendarDate);

                const isSunday =
                  calendarDate.getDay() === 0;

                const isPast =
                  calendarDay < today;

                const isDisabled =
                  isPast || isSunday;

                const selected =
                  isSameDate(
                    calendarDate,
                    selectedDate
                  );

                const isToday =
                  isSameDate(
                    calendarDate,
                    today
                  );

                return (
                  <button
                    key={toDateString(
                      calendarDate
                    )}
                    type="button"
                    disabled={isDisabled}
                    onClick={() =>
                      selectDate(
                        calendarDate
                      )
                    }
                    className="relative flex h-10 items-center justify-center rounded-xl sm:h-11"
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-[12px] transition sm:h-10 sm:w-10 sm:text-[13px] ${selected && !isDisabled ? "bg-[#1d78c8] font-semibold text-white shadow-sm" : isToday && !isDisabled ? "border border-[#365873] bg-white font-medium text-[#365873]" : isDisabled ? "cursor-not-allowed text-[#d2dbe1]" : currentMonth ? "text-[#365873] hover:bg-[#f1f8fc] hover:text-[#1d78c8]" : "text-[#cbd5dc]"}`}
                    >
                      {calendarDate.getDate()}
                    </span>

                    {!isSunday &&
                      !isPast && (
                        <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-[#f5b400]" />
                      )}
                  </button>
                );
              }
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#eef4f8] pt-3">
            <button
              type="button"
              onClick={() =>
                setIsOpen(false)
              }
              className="rounded-lg px-3 py-2 text-[10px] font-medium text-[#7893aa] transition hover:bg-[#f5f9fc] hover:text-[#365873]"
            >
              Закрыть
            </button>

            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg bg-[#eaf5ff] px-3 py-2 text-[10px] font-semibold text-[#1d78c8] transition hover:bg-[#dff1ff]"
            >
              Сегодня
            </button>
          </div>

          <div className="mt-2 text-center text-[9px] text-[#9aafbe]">
            Сегодня:{" "}
            {formatDate(
              toDateString(today)
            )}
          </div>
        </div>
      )}
    </div>
  );
}