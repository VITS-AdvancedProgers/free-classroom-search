import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const roomId = searchParams.get("roomId");
  const date = searchParams.get("date");

  if (!roomId || !date) {
    return NextResponse.json(
      { error: "Не указана аудитория или дата" },
      { status: 400 }
    );
  }

  const url = new URL("https://eios.kosgos.ru/api/Rasp");
  url.searchParams.set("idAudLine", roomId);
  url.searchParams.set("sdate", date);

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Ошибка ЭИОС: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Не удалось получить расписание" },
      { status: 502 }
    );
  }
}