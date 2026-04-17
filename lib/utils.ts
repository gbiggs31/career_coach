import { format, formatISO, startOfWeek, endOfWeek } from "date-fns";

export function getWeekBounds(date = new Date()) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  return {
    weekStart,
    weekEnd,
    weekStartDate: formatISO(weekStart, { representation: "date" }),
    weekEndDate: formatISO(weekEnd, { representation: "date" })
  };
}

export function formatWeekLabel(startDate: string, endDate: string) {
  return `${format(new Date(startDate), "MMM d")} - ${format(new Date(endDate), "MMM d, yyyy")}`;
}

export function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function uniqueNormalized(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

export function clampScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.max(0, Math.min(1, value));
}
