import { Habit } from "@shared/schema";

export function getWeekdayIndex(date: Date): number {
  const jsDay = date.getDay();
  return (jsDay + 6) % 7; // convert to Monday=0
}

export function isHabitActiveOnDate(habit: Habit, date: Date): boolean {
  const dayIndex = getWeekdayIndex(date);

  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekly') {
    return habit.startDay === dayIndex;
  }
  if (habit.frequency === 'custom') {
    return Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.includes(dayIndex);
  }
  return true;
}
