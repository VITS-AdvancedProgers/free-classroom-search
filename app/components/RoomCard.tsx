import type { Room } from "../data/rooms";

type RoomCardProps = {
  room: Room;
  period: number;
};

export default function RoomCard({ room, period }: RoomCardProps) {
  const lesson = room.lessons[period - 1];
  const isOccupied = Boolean(lesson);

  return (
    <article
      className={`room-card ${isOccupied ? "occupied" : "available"}`}
    >
      <div className="room-card-header">
        <h3 className="room-number">{room.number}</h3>

        <span className={`room-status ${isOccupied ? "busy" : "free"}`}>
          {isOccupied ? "Занята" : "Свободна"}
        </span>
      </div>

      {lesson  ? (
        <div className="room-card-info">
          <p className="room-subject">
            {lesson.subject}
          </p>
          <p className="room-teacher">
            {lesson.teacher}
          </p>
        </div>
      ) : (
        <p className="room-card-empty">
          На эту пару занятий нет
        </p>
      )}
    </article>
  );
}