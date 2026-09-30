import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Свободные аудитории — Б корпус",
  description: "Просмотр свободных и занятых аудиторий по парам",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
