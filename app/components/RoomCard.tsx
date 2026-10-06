import type { Room } from "../data/rooms";

type RoomCardProps = {
  room: Room;
  period: number;
};

export default function RoomCard({
  room,
  period,
}: RoomCardProps) {
  const lesson = room.lessons[period - 1];
  const isOccupied = Boolean(lesson);

  return (
    <article
      className={`
        flex min-w-0 min-h-[88px]
        flex-col gap-[9px]
        rounded-[11px]
        px-[14px] py-[13px]
        ${
          isOccupied
            ? "bg-[#fde8e8]"
            : "bg-[#e8f7ed]"
        }
      `}
    >
      <div
        className="
          flex items-center
          justify-between
          gap-2
        "
      >
        <h3
          className="
            m-0
            text-[14px]
            font-medium
            text-[#153d5c]
          "
        >
          {room.number}
        </h3>

        <span
          className={`
            text-[10px]
            ${
              isOccupied
                ? "text-[#b8404b]"
                : "text-[#24804a]"
            }
          `}
        >
          {isOccupied ? "Занята" : "Свободна"}
        </span>
      </div>

      {lesson ? (
        <div
          className="
            flex min-w-0
            flex-col gap-[5px]
          "
        >
          <p
            className="
              m-0
              overflow-hidden
              text-ellipsis
              whitespace-nowrap
              text-[11px]
              font-semibold
              text-[#3e5060]
            "
          >
            {lesson.subject}
          </p>

          <p
            className="
              m-0
              overflow-hidden
              text-ellipsis
              whitespace-nowrap
              text-[10px]
              text-[#778694]
            "
          >
            {lesson.teacher}
          </p>
        </div>
      ) : (
        <p
          className="
            m-0
            text-[10px]
            leading-[1.4]
            text-[#778694]
          "
        >
          На эту пару занятий нет
        </p>
      )}
    </article>
  );
}