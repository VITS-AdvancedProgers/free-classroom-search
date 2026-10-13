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
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copiedEmbedCode, setCopiedEmbedCode] = useState(false);
  const [isEmbedMode, setIsEmbedMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsEmbedMode(params.get("embed") === "1");
  }, []);

  const embedUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?embed=1`
      : "";

  const embedCode = `<iframe src="${embedUrl}" width="100%" height="700" style="border:0;border-radius:12px;" loading="lazy" title="Расписание свободных аудиторий"></iframe>`;

  async function copyEmbedCode() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbedCode(true);
      window.setTimeout(() => setCopiedEmbedCode(false), 2000);
    } catch {
      setCopiedEmbedCode(false);
    }
  }

  useEffect(() => {
    const savedView = localStorage.getItem("rooms-view");
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
      setView(savedView === "table" ? "table" : "list");
      setViewLoaded(true);
      return;
    }

    if (savedView === "grid" || savedView === "list" || savedView === "table") {
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

  const freeCount = rooms.filter((room) => !room.lessons[period]).length;
  const busyCount = rooms.length - freeCount;

  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
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
      <section id="rooms" className="min-h-screen">
        <header className="border-b border-[#dce8f1] bg-white px-4 py-4 sm:px-7 sm:py-5 lg:px-10 min-[1800px]:px-12 min-[1800px]:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between min-[1800px]:gap-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-[1800px]:gap-4">
                <h1 className="text-[24px] font-bold tracking-[-0.7px] text-[#12395e] sm:text-[28px] min-[1800px]:text-[36px] min-[1800px]:tracking-[-1px]">
                  Аудитории
                </h1>

                {weekNumber && (
                  <span className="hidden items-center gap-1.5 rounded-full bg-[#eaf5ff] px-2.5 py-1 text-[10px] font-semibold text-[#1674bb] lg:inline-flex min-[1800px]:gap-2 min-[1800px]:rounded-full min-[1800px]:px-4 min-[1800px]:py-2 min-[1800px]:text-[13px]">
                    <span className={`h-1.5 w-1.5 rounded-full min-[1800px]:h-2.5 min-[1800px]:w-2.5 ${weekType === 1 ? "bg-[#168a46]" : weekType === 2 ? "bg-[#d93636]" : "bg-[#f0a900]"}`} />
                    Неделя {weekNumber} · {weekLabel.toLowerCase()}
                  </span>
                )}
              </div>

              <p className="mt-1 max-w-[300px] text-[11px] leading-4 text-[#7890a5] sm:text-[12px] min-[1800px]:mt-2 min-[1800px]:max-w-none min-[1800px]:text-[15px] min-[1800px]:leading-5">
                Б корпус · доступность аудиторий
              </p>
            </div>

            <div className="flex w-full items-center gap-2 lg:w-auto lg:shrink-0 min-[1800px]:gap-4">
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

        <section id="schedule" aria-label="Выбор пары" className="grid grid-cols-2 gap-2.5 px-4 py-4 sm:grid-cols-3 sm:px-7 lg:grid-cols-6 lg:px-10 min-[1800px]:gap-4 min-[1800px]:px-12 min-[1800px]:py-5">
          {periods.map((item, index) => {
            const isCurrent = clockReady && isToday && index === currentPeriod;
            const isSelected = period === index;

            return (
              <button key={item.name} type="button" onClick={() => setPeriod(index)} aria-pressed={isSelected} className={`relative flex min-h-[64px] flex-col justify-center rounded-xl border px-4 py-3 text-left transition min-[1800px]:min-h-[76px] min-[1800px]:rounded-2xl min-[1800px]:border-[1.5px] min-[1800px]:px-5 min-[1800px]:py-4 ${isCurrent ? "border-[#26a65b] shadow-[0_0_0_2px_#26a65b]" : "border-[#dce8f1]"} ${isSelected ? "bg-[#eaf5ff] shadow-sm" : "bg-white hover:border-[#b7d7ed] hover:bg-[#fbfdff]"}`}>
                {isCurrent && (
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#26a65b] shadow-[0_0_0_3px_rgba(38,166,91,0.12)] min-[1800px]:right-5 min-[1800px]:top-5 min-[1800px]:h-3.5 min-[1800px]:w-3.5" title="Текущая пара" aria-label="Текущая пара" />
                )}

                <strong className={`text-[13px] font-semibold ${isSelected ? "text-[#126aa8]" : "text-[#12395e]"} min-[1800px]:text-[16px]`}>
                  {item.name}
                </strong>

                <span className="mt-1 text-[10px] text-[#7893aa] min-[1800px]:mt-2 min-[1800px]:text-[11px]">
                  {item.time}
                </span>
              </button>
            );
          })}
        </section>

        <section className="flex flex-col gap-3 px-4 pb-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:px-10 min-[1800px]:gap-5 min-[1800px]:px-12 min-[1800px]:pb-5">
          <div className="min-[1800px]:text-[14px]">
            <RoomFilters floors={floors} floor={floor} setFloor={setFloor} />
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end min-[1800px]:gap-6">
            <div className="flex items-center gap-2 whitespace-nowrap text-[11px] font-medium text-[#64819b] min-[1800px]:gap-3 min-[1800px]:text-[14px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#26a65b] min-[1800px]:h-2.5 min-[1800px]:w-2.5" />
              {isScheduleReady ? `${freeCount} свободно` : "Загрузка"}
              <span className="text-[#c7d4de]">·</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#d93636] min-[1800px]:h-2.5 min-[1800px]:w-2.5" />
              {isScheduleReady ? `${busyCount} занято` : ""}
            </div>

            <div className="flex items-center rounded-lg border border-[#dce9f3] bg-white p-1 min-[1800px]:rounded-xl min-[1800px]:p-1.5" aria-label="Вид аудиторий">
              <button type="button" className={`hidden h-8 w-8 items-center justify-center rounded-md transition lg:flex min-[1800px]:h-11 min-[1800px]:w-11 min-[1800px]:rounded-lg ${view === "grid" ? "bg-[#eaf5ff] text-[#1d78c8]" : "text-[#7893aa] hover:bg-[#f5f9fc]"}`} onClick={() => setView("grid")} aria-label="Плитка" aria-pressed={view === "grid"} title="Плитка">
                <Grid2X2 size={17} strokeWidth={2} className="min-[1800px]:h-6 min-[1800px]:w-6" />
              </button>

              <button type="button" className={`flex h-8 w-8 items-center justify-center rounded-md transition min-[1800px]:h-11 min-[1800px]:w-11 min-[1800px]:rounded-lg ${view === "list" ? "bg-[#eaf5ff] text-[#1d78c8]" : "text-[#7893aa] hover:bg-[#f5f9fc]"}`} onClick={() => setView("list")} aria-label="Список" aria-pressed={view === "list"} title="Список">
                <List size={17} strokeWidth={2} className="min-[1800px]:h-6 min-[1800px]:w-6" />
              </button>

              <button type="button" className={`flex h-8 w-8 items-center justify-center rounded-md transition min-[1800px]:h-11 min-[1800px]:w-11 min-[1800px]:rounded-lg ${view === "table" ? "bg-[#eaf5ff] text-[#1d78c8]" : "text-[#7893aa] hover:bg-[#f5f9fc]"}`} onClick={() => setView("table")} aria-label="Таблица" aria-pressed={view === "table"} title="Таблица">
                <Table size={17} strokeWidth={2} className="min-[1800px]:h-6 min-[1800px]:w-6" />
              </button>
            </div>
          </div>
        </section>

        <div className="px-4 sm:px-7 lg:px-10 min-[1800px]:px-12">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[#dce8f1] bg-white text-[14px] text-[#7893aa] min-[1800px]:min-h-[260px] min-[1800px]:rounded-2xl min-[1800px]:text-[16px]">
              Загружаем аудитории...
            </div>
          ) : error ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl border border-[#f0d6d6] bg-white px-5 text-center min-[1800px]:min-h-[260px]">
              <strong className="text-[14px] text-[#b84040] min-[1800px]:text-[17px]">
                {error}
              </strong>

              <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-[#12395e] px-4 py-2 text-[12px] font-medium text-white transition hover:bg-[#0d2e4c] min-[1800px]:rounded-xl min-[1800px]:px-6 min-[1800px]:py-3 min-[1800px]:text-[14px]">
                Повторить
              </button>
            </div>
          ) : scheduleLoading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[#dce8f1] bg-white text-[14px] text-[#7893aa] min-[1800px]:min-h-[260px] min-[1800px]:text-[16px]">
              Загружаем расписание...
            </div>
          ) : visibleRooms.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[#dce8f1] bg-white text-[14px] text-[#7893aa] min-[1800px]:min-h-[260px] min-[1800px]:text-[16px]">
              На выбранном этаже аудитории не найдены.
            </div>
          ) : (
            <RoomGrid rooms={visibleRooms} period={period + 1} view={view} weeklySchedule={weeklySchedule} date={date} weekType={weekType} />
          )}
        </div>

        {!isEmbedMode && (
          <footer className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-[11px] text-[#91a7b9] sm:flex-row sm:gap-4 sm:px-7 lg:px-10 min-[1800px]:gap-5 min-[1800px]:px-12 min-[1800px]:py-6 min-[1800px]:text-[13px]">
            <span>Б корпус</span>
            <span className="hidden sm:inline">·</span>
            <span>{formattedDate}</span>
            <button type="button" onClick={() => setShowEmbedModal(true)} className="font-medium text-[#247db8] transition hover:text-[#125b91] hover:underline">
              Внедрение на сайт
            </button>
          </footer>
        )}
        
        {showEmbedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(18,52,81,0.4)] p-4 backdrop-blur-sm" onClick={() => setShowEmbedModal(false)}>
            <div className="w-full max-w-[560px] rounded-2xl border border-[#dce8f1] bg-white p-5 shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()}>
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#12395e]">Внедрение на сайт</h2>
                  <p className="mt-2 text-sm leading-6 text-[#7890a5]">
                    Скопируйте HTML-код и вставьте его на страницу своего сайта. Расписание будет загружаться с актуальными данными.
                  </p>
                </div>
                <button type="button" onClick={() => setShowEmbedModal(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-[#7893aa] hover:bg-[#f1f7fb]" aria-label="Закрыть">
                  ×
                </button>
              </div>

              <label className="mt-5 block text-xs font-semibold text-[#64819b]">
                HTML-код для вставки
              </label>

              <textarea readOnly value={embedCode} onFocus={(event) => event.currentTarget.select()} className="mt-2 min-h-[125px] w-full resize-y rounded-xl border border-[#dce8f1] bg-[#f6f9fc] p-3 font-mono text-xs leading-5 text-[#315773] outline-none focus:border-[#8bc4ed]" />

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowEmbedModal(false)} className="rounded-xl border border-[#dce8f1] px-4 py-3 text-sm font-medium text-[#64819b] hover:bg-[#f6f9fc]">
                  Закрыть
                </button>
                <button type="button" onClick={copyEmbedCode} className="rounded-xl bg-[#1683d8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#126eb7]">
                  {copiedEmbedCode ? "Код скопирован" : "Скопировать код"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}