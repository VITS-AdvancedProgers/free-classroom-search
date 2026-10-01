
import type { Room } from "../data/rooms";
import { periods } from "../data/rooms";
import RoomCard from "./RoomCard";

type RoomGridProps = {
  rooms: Room[];
  period: number;
  view: "grid" | "list" | "table";
};

export default function RoomGrid({
  rooms,
  period,
  view,
}: RoomGridProps) {
  if (view === "table") {
    return (
      <div className="room-table-wrapper">
        <table className="room-table">
          <thead>
            <tr>
              <th className="room-table-period">
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
            {periods.map((item, index) => (
              <tr key={item.name}>
                <th className="room-table-period">
                  <span>{item.name}</span>
                  <small>{item.time}</small>
                </th>

                {rooms.map((room) => {
                  const lesson = room.lessons[index];

                  return (
                    <td key={room.id}>
                      {lesson ? (
                        <div className="table-lesson">
                          <span className="table-status occupied">
                            Занята
                          </span>
                          <span className="table-subject">
                            {lesson.subject}
                          </span>
                          <span className="table-teacher">
                            {lesson.teacher}
                          </span>
                        </div>
                      ) : (
                        <span className="table-status available">
                          Свободна
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
