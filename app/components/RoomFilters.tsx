"use client";

type RoomFiltersProps = {
  floors: string[];
  floor: string;
  setFloor: (floor: string) => void;
};

export default function RoomFilters({
  floors,
  floor,
  setFloor,
}: RoomFiltersProps) {
  return (
    <div
      className="
        flex max-w-full
        items-center gap-2
        overflow-x-auto
        pb-1
        scrollbar-none
      "
      role="group"
      aria-label="Фильтр по этажам"
    >
      <button
        type="button"
        onClick={() => setFloor("all")}
        aria-pressed={floor === "all"}
        className={`
          shrink-0 rounded-lg
          border px-3 py-2
          text-[12px] font-medium
          transition
          ${
            floor === "all"
              ? "border-[#1d78c8] bg-[#eaf5ff] text-[#1d78c8]"
              : "border-[#dce9f3] bg-white text-[#64819b] hover:border-[#b9d8ef] hover:text-[#1d78c8]"
          }
        `}
      >
        Все
      </button>

      {floors.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setFloor(item)}
          aria-pressed={floor === item}
          className={`
            shrink-0 rounded-lg
            border px-3 py-2
            text-[12px] font-medium
            transition
            ${
              floor === item
                ? "border-[#1d78c8] bg-[#eaf5ff] text-[#1d78c8]"
                : "border-[#dce9f3] bg-white text-[#64819b] hover:border-[#b9d8ef] hover:text-[#1d78c8]"
            }
          `}
        >
          {item} этаж
        </button>
      ))}
    </div>
  );
}