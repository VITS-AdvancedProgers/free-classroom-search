
"use client";

import { useEffect, useMemo, useState } from "react";
import { periods } from "./data/rooms";
import { useRooms } from "./hooks/useRooms";
import DateSelector from "./components/DateSelector";
import RoomFilters from "./components/RoomFilters";
import RoomGrid from "./components/RoomGrid";

type View = "grid" | "list";

export default function Home() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  const [period, setPeriod] = useState(0);
  const [floor, setFloor] = useState("all");
  const [view, setView] = useState<View>("grid");
  const [now, setNow] = useState(() => new Date());

  // Обновляем время каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const {
    apiRooms,
    schedule,
    loading,
    scheduleLoading,
    error,
  } = useRooms(date);

  // Определяем текущую пару
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const currentPeriod = periods.findIndex((item) => {
    const [start, end] = item.time.split("–").map((value) => {
      const [hours, minutes] = value.trim().split(":").map(Number);
      return hours * 60 + minutes;
    });

    return currentMinutes >= start && currentMinutes < end;
  });

  const isToday = date === today;

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
            const isCurrent = isToday && index === currentPeriod;

            return (
              <button
                className={`period-card ${
                  period === index ? "selected" : ""
                } ${isCurrent ? "current-period" : ""}`}
                key={item.name}
                onClick={() => setPeriod(index)}
                type="button"
                aria-pressed={period === index}
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

            <div
              className="view-toggle"
              aria-label="Вид аудиторий"
            >
              <button
                type="button"
                className={view === "grid" ? "view-active" : ""}
                onClick={() => setView("grid")}
                aria-label="Сетка"
                aria-pressed={view === "grid"}
              >
                ▦
              </button>

              <button
                type="button"
                className={view === "list" ? "view-active" : ""}
                onClick={() => setView("list")}
                aria-label="Список"
                aria-pressed={view === "list"}
              >
                ☷
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