"use client";

import { useEffect, useMemo, useState } from "react";
import { periods } from "./data/rooms";
import { useRooms } from "./hooks/useRooms";
import DateSelector from "./components/DateSelector";
import RoomFilters from "./components/RoomFilters";
import RoomGrid from "./components/RoomGrid";
import { Grid2X2, List, Table } from "lucide-react";

type View = "grid" | "list" | "table";

function getCurrentPeriod(date: Date): number {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  return periods.findIndex((period) => {
    const [start, end] = period.time.split("–").map((time) => {
      const [hours, minutes] = time.trim().split(":").map(Number);
      return hours * 60 + minutes;
    });

    return currentMinutes >= start && currentMinutes < end;
  });
}

function getSelectedPeriod(date: Date): number {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const currentIndex = getCurrentPeriod(date);

  if (currentIndex !== -1) {
    return currentIndex;
  }

  const nextIndex = periods.findIndex((period) => {
    const [start] = period.time.split("–");
    const [hours, minutes] = start.trim().split(":").map(Number);

    return currentMinutes < hours * 60 + minutes;
  });

  return nextIndex !== -1 ? nextIndex : periods.length - 1;
}

function getDateString(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function Home() {
  const [date, setDate] = useState(() => getDateString(new Date()));
  const [period, setPeriod] = useState(0);
  const [floor, setFloor] = useState("all");
  const [view, setView] = useState<View>("grid");
  const [viewLoaded, setViewLoaded] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [clockReady, setClockReady] = useState(false);

  useEffect(() => {
    const savedView = localStorage.getItem("rooms-view");

    if (
      savedView === "grid" ||
      savedView === "list" ||
      savedView === "table"
    ) {
      setView(savedView);
    }

    setViewLoaded(true);
  }, []);

  useEffect(() => {
    if (viewLoaded) {
      localStorage.setItem("rooms-view", view);
    }
  }, [view, viewLoaded]);

  useEffect(() => {
    setClockReady(true);

    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentDate = new Date();
    const todayString = getDateString(currentDate);

    if (date === todayString) {
      setPeriod(getSelectedPeriod(currentDate));
    } else {
      setPeriod(0);
    }
  }, [date]);

  const {
    apiRooms,
    schedule,
    weeklySchedule,
    weekType,
    weekNumber,
    loading,
    scheduleLoading,
    error,
  } = useRooms(date);

  const today = getDateString(now);
  const isToday = date === today;
  const currentPeriod = isToday ? getCurrentPeriod(now) : -1;

  const rooms = useMemo(
    () =>
      apiRooms.map((room) => ({
        number: room.name,
        id: room.id,
        lessons: schedule[room.id] ?? Array(6).fill(null),
      })),
    [apiRooms, schedule]
  );

  const floors = useMemo(() => {
    const values = rooms
      .map((room) => room.number.match(/-(\d)/)?.[1])
      .filter((value): value is string => Boolean(value));

    return [...new Set(values)].sort();
  }, [rooms]);

  const visibleRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        const roomFloor = room.number.match(/-(\d)/)?.[1];

        return floor === "all" || roomFloor === floor;
      })
      .sort((a, b) =>
        a.number.localeCompare(b.number, "ru", {
          numeric: true,
        })
      );
  }, [rooms, floor]);

  const freeCount = rooms.filter(
    (room) => !room.lessons[period]
  ).length;

  const busyCount = rooms.length - freeCount;

  const formattedDate = new Date(
    `${date}T12:00:00`
  ).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isScheduleReady =
    !loading &&
    !scheduleLoading &&
    !error &&
    apiRooms.length > 0 &&
    Object.keys(schedule).length === apiRooms.length;

  const weekLabel =
    weekType === 1
      ? "Числитель"
      : weekType === 2
        ? "Знаменатель"
        : "Каждую неделю";

  return (
    <main className="min-h-screen bg-[#f6f9fc] text-[#12395e]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[168px] flex-col overflow-hidden border-r border-[#d4e8fa] bg-[#e3f2ff] md:flex">
        <div className="flex flex-col items-center gap-3 px-3 pb-6 pt-7 text-center">
          <img src="/images/logo.png" alt="Логотип Б корпуса" className="h-[38px] w-[38px] shrink-0 object-contain" />

          <div className="flex flex-col items-center gap-1 leading-[1.3]">
            <strong className="text-[20px] font-bold tracking-[-0.5px] text-[#12395e]">
              Б корпус
            </strong>

            <span className="text-[11px] font-medium tracking-[0.25px] text-[#64819b]">
              Высшая ИТ-школа
            </span>
          </div>
        </div>

        <div className="relative mt-auto min-h-[190px] flex-1 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(227,242,255,0) 40%, rgba(18,52,81,0.53) 100%), url("/images/building.jpg")' }}>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[5px] bg-gradient-to-t from-[#102d49]/80 to-transparent px-3 pb-[14px] pt-[30px] text-white">
            <span className="text-[7px] tracking-[1px]">
              УЧЕБНОЕ ПРОСТРАНСТВО
            </span>

            <strong className="text-[14px]">
              Б корпус
            </strong>
          </div>
        </div>
      </aside>

      <section id="rooms" className="min-h-screen md:ml-[168px]">
        <header className="border-b border-[#dce8f1] bg-white px-4 py-4 sm:px-7 sm:py-5 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[24px] font-bold tracking-[-0.7px] text-[#12395e] sm:text-[28px]">
                  Аудитории
                </h1>

                {weekNumber && (
                  <span className="hidden items-center gap-1.5 rounded-full bg-[#eaf5ff] px-2.5 py-1 text-[10px] font-semibold text-[#1674bb] lg:inline-flex">
                    <span className={`h-1.5 w-1.5 rounded-full ${weekType === 1 ? "bg-[#168a46]" : weekType === 2 ? "bg-[#d93636]" : "bg-[#f0a900]"}`} />
                    Неделя {weekNumber} · {weekLabel.toLowerCase()}
                  </span>
                )}
              </div>

              <p className="mt-1 max-w-[300px] text-[11px] leading-4 text-[#7890a5] sm:text-[12px]">
                Б корпус · доступность аудиторий
              </p>
            </div>

            <div className="flex w-full items-center gap-2 lg:w-auto lg:shrink-0">
              {weekNumber && (
                <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#dce9f3] bg-[#f8fbfd] px-2 py-2 text-[10px] font-semibold text-[#5e7b94] sm:px-3 lg:hidden">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${weekType === 1 ? "bg-[#168a46]" : weekType === 2 ? "bg-[#d93636]" : "bg-[#f0a900]"}`} />

                  <span className="truncate">
                    Неделя {weekNumber} · {weekLabel.toLowerCase()}
                  </span>
                </div>
              )}

              <DateSelector date={date} setDate={setDate} weekType={weekType} weekNumber={weekNumber} />
            </div>
          </div>
        </header>

        <section id="schedule" aria-label="Выбор пары" className="grid grid-cols-2 gap-2.5 px-4 py-4 sm:grid-cols-3 sm:px-7 lg:grid-cols-6 lg:px-10">
          {periods.map((item, index) => {
            const isCurrent =
              clockReady &&
              isToday &&
              index === currentPeriod;

            const isSelected = period === index;

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setPeriod(index)}
                aria-pressed={isSelected}
                className={`relative flex min-h-[64px] flex-col justify-center rounded-xl border px-4 py-3 text-left transition ${isSelected ? "border-[#1683d8] bg-[#eaf5ff] shadow-sm" : "border-[#dce8f1] bg-white hover:border-[#b7d7ed] hover:bg-[#fbfdff]"}`}
              >
                {isCurrent && (
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#26a65b]" title="Сейчас идёт эта пара" aria-label="Сейчас идёт эта пара" />
                )}

                <strong className="text-[13px] font-semibold text-[#12395e]">
                  {item.name}
                </strong>

                <span className="mt-1 text-[10px] text-[#7893aa]">
                  {item.time}
                </span>
              </button>
            );
          })}
        </section>

        <section className="flex flex-col gap-3 px-4 pb-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <RoomFilters floors={floors} floor={floor} setFloor={setFloor} />

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="flex items-center gap-2 whitespace-nowrap text-[11px] font-medium text-[#64819b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#26a65b]" />

              {isScheduleReady
                ? `${freeCount} свободно`
                : "Загрузка"}

              <span className="text-[#c7d4de]">
                ·
              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-[#d93636]" />

              {isScheduleReady
                ? `${busyCount} занято`
                : ""}
            </div>

            <div className="flex items-center rounded-lg border border-[#dce9f3] bg-white p-1" aria-label="Вид аудиторий">
              <button type="button" className={`flex h-8 w-8 items-center justify-center rounded-md transition ${view === "grid" ? "bg-[#eaf5ff] text-[#1d78c8]" : "text-[#7893aa] hover:bg-[#f5f9fc]"}`} onClick={() => setView("grid")} aria-label="Плитка" aria-pressed={view === "grid"} title="Плитка">
                <Grid2X2 size={17} strokeWidth={2} />
              </button>

              <button type="button" className={`flex h-8 w-8 items-center justify-center rounded-md transition ${view === "list" ? "bg-[#eaf5ff] text-[#1d78c8]" : "text-[#7893aa] hover:bg-[#f5f9fc]"}`} onClick={() => setView("list")} aria-label="Список" aria-pressed={view === "list"} title="Список">
                <List size={17} strokeWidth={2} />
              </button>

              <button type="button" className={`flex h-8 w-8 items-center justify-center rounded-md transition ${view === "table" ? "bg-[#eaf5ff] text-[#1d78c8]" : "text-[#7893aa] hover:bg-[#f5f9fc]"}`} onClick={() => setView("table")} aria-label="Таблица" aria-pressed={view === "table"} title="Таблица">
                <Table size={17} strokeWidth={2} />
              </button>
            </div>
          </div>
        </section>

        <div className="px-4 sm:px-7 lg:px-10">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[#dce8f1] bg-white text-[14px] text-[#7893aa]">
              Загружаем аудитории...
            </div>
          ) : error ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl border border-[#f0d6d6] bg-white px-5 text-center">
              <strong className="text-[14px] text-[#b84040]">
                {error}
              </strong>

              <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-[#12395e] px-4 py-2 text-[12px] font-medium text-white transition hover:bg-[#0d2e4c]">
                Повторить
              </button>
            </div>
          ) : scheduleLoading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[#dce8f1] bg-white text-[14px] text-[#7893aa]">
              Загружаем расписание...
            </div>
          ) : visibleRooms.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[#dce8f1] bg-white text-[14px] text-[#7893aa]">
              На выбранном этаже аудитории не найдены.
            </div>
          ) : (
            <RoomGrid rooms={visibleRooms} period={period + 1} view={view} weeklySchedule={weeklySchedule} date={date} weekType={weekType} />
          )}
        </div>

        <footer className="flex items-center justify-center gap-2 px-4 py-8 text-[11px] text-[#91a7b9] sm:px-7 lg:px-10">
          <span>Б корпус</span>
          <span>·</span>
          <span>{formattedDate}</span>
        </footer>
      </section>
    </main>
  );
}