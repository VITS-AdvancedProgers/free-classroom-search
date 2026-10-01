
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
    <div className="floor-filters" aria-label="Фильтр по этажам">
      <button
        type="button"
        className={`floor-button floor-all ${
          floor === "all" ? "active" : ""
        }`}
        onClick={() => setFloor("all")}
      >
        Все
      </button>

      {floors.map((item) => (
        <button
          key={item}
          type="button"
          className={
            floor === item
              ? "floor-button active"
              : "floor-button"
          }
          onClick={() => setFloor(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
