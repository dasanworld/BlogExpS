const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const toSeoulDayIndex = (value: string | Date | null | undefined): number | null => {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  const time = date.getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((time + SEOUL_OFFSET_MS) / DAY_MS);
};

export const getSeoulTodayIndex = (): number => {
  const idx = toSeoulDayIndex(new Date());
  return idx ?? 0;
};
