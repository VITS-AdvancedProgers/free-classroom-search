import { NextResponse } from "next/server";

export async function GET() {
  const year = "2026-2027";
  const url = `https://eios.kosgos.ru/api/raspAudList?year=${year}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Не удалось загрузить аудитории" },
        { status: 502 }
      );
    }

    const result = await response.json();

    const rooms = result.data.filter(
      (room: { name: string; id: number }) =>
        /^Б-\d+$/.test(room.name)
    );

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Ошибка загрузки аудиторий:", error);

    return NextResponse.json(
      { error: "Ошибка подключения к ЭИОС" },
      { status: 500 }
    );
  }
}