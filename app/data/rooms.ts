export type Lesson = {
  subject: string;
  teacher: string;
};

export type Room = {
  number: string;
  id: number;
  lessons: (Lesson | null)[];
};


export const periods = [
  { name: "1 пара", time: "08:30 – 10:00" },
  { name: "2 пара", time: "10:10 – 11:40" },
  { name: "3 пара", time: "11:50 – 13:20" },
  { name: "4 пара", time: "14:00 – 15:30" },
  { name: "5 пара", time: "15:40 – 17:10" },
  { name: "6 пара", time: "17:20 – 18:50" },
];
