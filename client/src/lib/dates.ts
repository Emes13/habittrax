import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { toJewishDate } from "jewish-date";

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

export function formatShortWeekday(date: Date): string {
  return format(date, "EEE");
}

export function formatDayNumber(date: Date): string {
  return format(date, "d");
}

export function formatHebrewDate(date: Date): string {
  const { day, monthName } = toJewishDate(date);
  return `${day} ${monthName}`;
}

// Parse a YYYY-MM-DD string as a local date (avoids timezone offsets)
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getCurrentWeekDates(): { start: Date; end: Date; days: Date[] } {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
  const end = endOfWeek(today, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start, end });
  
  return { start, end, days };
}

export function getPreviousWeekDates(currentStart: Date): { start: Date; end: Date; days: Date[] } {
  const start = subDays(currentStart, 7);
  const end = subDays(start, -6);
  
  const days = eachDayOfInterval({ start, end });
  
  return { start, end, days };
}

export function getNextWeekDates(currentStart: Date): { start: Date; end: Date; days: Date[] } {
  const start = addDays(currentStart, 7);
  const end = addDays(start, 6);
  
  const days = eachDayOfInterval({ start, end });
  
  return { start, end, days };
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function getStreakCount(completionDates: Date[], skippedDates: Date[] = []): number {
  if (completionDates.length === 0) return 0;

  // Sort dates in descending order
  const sortedDates = [...completionDates].sort((a, b) => b.getTime() - a.getTime());

  const skippedSet = new Set(skippedDates.map((date) => formatDate(date)));
  const isSkipped = (date: Date) => skippedSet.has(formatDate(date));
  const findPreviousTrackedDate = (date: Date) => {
    let candidate = subDays(date, 1);
    while (isSkipped(candidate)) {
      candidate = subDays(candidate, 1);
    }
    return candidate;
  };

  let streak = 1;
  let currentDate = sortedDates[0];

  // Ensure the most recent completion is contiguous with today when accounting for skipped days
  const today = new Date();
  let comparisonDate = today;
  while (
    isSkipped(comparisonDate) &&
    comparisonDate.getTime() > currentDate.getTime()
  ) {
    comparisonDate = subDays(comparisonDate, 1);
  }

  if (
    !isSameDay(currentDate, comparisonDate) &&
    !isSameDay(currentDate, subDays(comparisonDate, 1))
  ) {
    return 0; // Streak broken if most recent completion is too far in the past
  }

  // Count consecutive days, skipping not applicable dates
  for (let i = 1; i < sortedDates.length; i++) {
    const expectedPreviousDate = findPreviousTrackedDate(currentDate);

    if (isSameDay(sortedDates[i], expectedPreviousDate)) {
      streak++;
      currentDate = sortedDates[i];
    } else {
      break; // Streak broken
    }
  }

  return streak;
}
