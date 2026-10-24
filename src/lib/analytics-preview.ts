import { prayerNames } from './feature-model';

export function previewMonth(year: number, month: number) {
  const days = new Date(year, month + 1, 0).getDate();
  const daily = Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    const count = (day + month) % 9 === 0 ? 0 : (day + month) % 4 === 0 ? 3 : (day + month) % 3 === 0 ? 4 : 5;
    return { day, count, previous: Math.max(0, count - (day % 3 === 0 ? 2 : 1)) };
  });
  const total = daily.reduce((sum, d) => sum + d.count, 0);
  return {
    days, daily, total, possible: days * 5, average: Math.round(total / (days * 5) * 100),
    prayers: prayerNames.map((name, i) => ({ name, percent: [68, 94, 87, 97, 90][(i + month % 2) % 5] ?? 0 })),
    weeks: [1, 2, 3, 4, 5].map((week) => ({ name: `Week ${week}`, tasks: [8, 12, 9, 15, 6][week - 1] ?? 0 })),
  };
}