import dayjs, { type Dayjs } from 'dayjs';

export type DayjsDateRange = [Dayjs, Dayjs];

export function getCurrentWeekRange(): DayjsDateRange {
  const today = dayjs();
  const day = today.day();
  const weekStart = today
    .subtract(day === 0 ? 6 : day - 1, 'day')
    .startOf('day');
  return [weekStart, weekStart.add(6, 'day')];
}
