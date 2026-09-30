
import type { Room } from "../data/rooms";
import RoomCard from "./RoomCard";

type RoomGridProps = {
  rooms: Room[];
  period: number;
  view: "grid" | "list";
};

export default function RoomGrid({
  rooms,
  period,
  view,
}: RoomGridProps) {
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