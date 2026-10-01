
"use client";

import { useEffect, useMemo, useState } from "react";
import { periods } from "./data/rooms";
import { useRooms } from "./hooks/useRooms";
import DateSelector from "./components/DateSelector";
import RoomFilters from "./components/RoomFilters";
import RoomGrid from "./components/RoomGrid";
import { Grid2X2, List, Table } from "lucide-react";

type View = "grid" | "list" | "table";

// Возвращает индекс пары, которая идёт прямо сейчас.
// Если сейчас перемена или занятия закончились, возвращает -1.
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

// Выбирает текущую или ближайшую следующую пару.
// Если все пары закончились, выбирает последнюю.
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

  // Загружаем сохранённый режим просмотра.
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

  // Сохраняем выбранный режим просмотра.
  useEffect(() => {
    if (viewLoaded) {
      localStorage.setItem("rooms-view", view);
    }
  }, [view, viewLoaded]);

  // Обновляем время каждую минуту.
  useEffect(() => {
    setClockReady(true);

    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // При смене даты выбираем текущую или ближайшую пару.
  // Для другой даты по умолчанию выбирается первая пара.
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
  loading,
  scheduleLoading,
  error,
  } = useRooms(date);

  // Индикатор показывается только во время реально идущей пары.
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

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img
            src="/images/logo.png"
            alt="Логотип Б корпуса"
            className="brand-logo"
          />

          <div className="brand-text">
            <strong>Б корпус</strong>
            <span>Высшая ИТ-школа</span>
          </div>
        </div>

        <div className="sidebar-photo">
          <div className="sidebar-photo-overlay">
            <span>УЧЕБНОЕ ПРОСТРАНСТВО</span>
            <strong>Б корпус</strong>
          </div>
        </div>
      </aside>

      <section className="content" id="rooms">
        <header className="mobile-header">
          <img
            src="/images/logo.png"
            alt="Логотип Б корпуса"
            className="brand-logo"
          />

          <div className="mobile-brand-text">
            <strong>Б корпус</strong>
            <span>Высшая ИТ-школа</span>
          </div>

          <div className="mobile-photo" aria-hidden="true" />
        </header>

        <header className="topbar">
          <div className="page-title">
            <h1>Аудитории</h1>
            <p>
              Выберите пару, чтобы посмотреть доступность аудиторий
            </p>
          </div>

          <DateSelector date={date} setDate={setDate} />
        </header>

        <section
          className="period-grid"
          id="schedule"
          aria-label="Выбор пары"
        >
          {periods.map((item, index) => {
            const isCurrent =
              clockReady &&
              isToday &&
              index === currentPeriod;

            return (
              <button
                className={`period-card ${
                clockReady && period === index ? "selected" : ""
                } ${isCurrent ? "current-period" : ""}`}
                key={item.name}
                onClick={() => setPeriod(index)}
                type="button"
                aria-pressed={clockReady && period === index}
              >
                {isCurrent && (
                  <span
                    className="current-period-indicator"
                    title="Сейчас идёт эта пара"
                    aria-label="Сейчас идёт эта пара"
                  />
                )}

                <strong>{item.name}</strong>
                <span>{item.time}</span>
              </button>
            );
          })}
        </section>

        <section className="room-toolbar">
          <RoomFilters
            floors={floors}
            floor={floor}
            setFloor={setFloor}
          />

          <div className="toolbar-right">
            <div className="room-count">
              {isScheduleReady
                ? `${freeCount} свободно · ${busyCount} занято`
                : "Загрузка данных"}
            </div>

            <div className="view-toggle" aria-label="Вид аудиторий">
              <button
                type="button"
                className={view === "grid" ? "view-active" : ""}
                onClick={() => setView("grid")}
                aria-label="Плитка"
                aria-pressed={view === "grid"}
                title="Плитка"
              >
                <Grid2X2 size={18} strokeWidth={2} />
              </button>

              <button
                type="button"
                className={view === "list" ? "view-active" : ""}
                onClick={() => setView("list")}
                aria-label="Список"
                aria-pressed={view === "list"}
                title="Список"
              >
                <List size={18} strokeWidth={2} />
              </button>

              <button
                type="button"
                className={view === "table" ? "view-active" : ""}
                onClick={() => setView("table")}
                aria-label="Таблица"
                aria-pressed={view === "table"}
                title="Таблица"
              >
                <Table size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="message-state">
            Загружаем аудитории...
          </div>
        ) : error ? (
          <div className="message-state error-state">
            <strong>{error}</strong>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Повторить
            </button>
          </div>
        ) : scheduleLoading ? (
          <div className="message-state">
            Загружаем расписание...
          </div>
        ) : visibleRooms.length === 0 ? (
          <div className="message-state">
            На выбранном этаже аудитории не найдены.
          </div>
        ) : (
          <RoomGrid
            rooms={visibleRooms}
            period={period + 1}
            view={view}
            weeklySchedule={weeklySchedule}
            date={date}
          />
        )}

        <footer className="page-footer" id="about">
          <span>Б корпус</span>
          <span>·</span>
          <span>{formattedDate}</span>
        </footer>
      </section>
    </main>
  );
}
