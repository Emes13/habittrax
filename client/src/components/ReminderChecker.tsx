import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { Habit, HabitLog } from "@shared/schema";
import { formatDate } from "@/lib/dates";
import { isHabitActiveOnDate } from "@/lib/habitUtils";

interface Props {
  habits: Habit[];
}

const ReminderChecker = ({ habits }: Props) => {
  const remindedIds = useRef<Set<number>>(new Set());
  const today = formatDate(new Date());

  const { data: habitLogs } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", { date: today }],
    queryFn: async () => {
      const res = await fetch(`/api/habit-logs?date=${today}`);
      if (!res.ok) throw new Error("Failed to fetch habit logs");
      return res.json();
    },
  });

  useEffect(() => {
    const reminderHours: Record<string, number> = {
      morning: 8,
      afternoon: 13,
      evening: 19,
    };

    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayIso = now.toISOString().slice(0, 10);

      habits.forEach((habit) => {
        if (!habit.reminderTime || habit.reminderTime === "none") return;
        if (remindedIds.current.has(habit.id)) return;

        const reminderHour = reminderHours[habit.reminderTime as keyof typeof reminderHours];
        if (reminderHour === undefined) return;

        if (!isHabitActiveOnDate(habit, now)) return;

        const doneToday = habitLogs?.some(
          (log) =>
            log.habitId === habit.id &&
            log.completed &&
            log.date.startsWith(todayIso)
        );

        if (!doneToday && currentHour >= reminderHour) {
          toast.info(`Reminder: ${habit.name}`);
          remindedIds.current.add(habit.id);
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60_000);
    return () => clearInterval(interval);
  }, [habits, habitLogs]);

  return null;
};

export default ReminderChecker;
