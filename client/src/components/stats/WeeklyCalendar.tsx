import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HabitLog } from "@shared/schema";
import { 
  getCurrentWeekDates, 
  getPreviousWeekDates, 
  getNextWeekDates,
  formatDate,
  formatShortWeekday,
  formatDayNumber,
  formatHebrewDate,
  isToday,
  parseLocalDate
} from "@/lib/dates";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface WeeklyCalendarProps {
  onSelectDate: (date: string) => void;
  selectedDate: string;
}

export function WeeklyCalendar({ onSelectDate, selectedDate }: WeeklyCalendarProps) {
  const [weekDates, setWeekDates] = useState(getCurrentWeekDates());
  
  // Format date range for display
  const dateRangeText = `${format(weekDates.start, 'MMM d')} - ${format(weekDates.end, 'MMM d')}`;
  
  // Fetch habit logs for the current week
  const { data: habitLogs, isLoading } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs', {
      startDate: formatDate(weekDates.start),
      endDate: formatDate(weekDates.end)
    }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/habit-logs", undefined, {
        params: { startDate: formatDate(weekDates.start), endDate: formatDate(weekDates.end) },
      });
      return response.json() as Promise<HabitLog[]>;
    }
  });
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    setWeekDates(getPreviousWeekDates(weekDates.start));
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    setWeekDates(getNextWeekDates(weekDates.start));
  };
  
  type DayStatus = HabitLog["status"] | "none";

  const getDayStatus = (date: Date): DayStatus => {
    if (!habitLogs) return "none";

    const formattedDate = formatDate(date);
    const logsForDay = habitLogs.filter(log => formatDate(parseLocalDate(log.date)) === formattedDate);

    if (logsForDay.length === 0) {
      return "none";
    }

    const allNotApplicable = logsForDay.every((log) => log.status === "not_applicable");
    if (allNotApplicable) {
      return "not_applicable";
    }

    const allComplete = logsForDay.every((log) => log.status === "complete");
    if (allComplete) {
      return "complete";
    }

    const allIncomplete = logsForDay.every((log) => log.status === "incomplete");
    if (allIncomplete) {
      return "incomplete";
    }

    return "partial";
  };

  const dayToneClasses: Record<DayStatus, { button: string; bar: string }> = {
    complete: {
      button: "status-tile status-tile--success",
      bar: "status-meter--success",
    },
    partial: {
      button: "status-tile status-tile--warning",
      bar: "status-meter--warning",
    },
    incomplete: {
      button: "status-tile status-tile--danger",
      bar: "status-meter--danger",
    },
    not_applicable: {
      button: "status-tile status-tile--muted",
      bar: "status-meter--muted",
    },
    none: {
      button: "status-tile status-tile--neutral",
      bar: "status-meter--neutral",
    },
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-4 w-8 mb-2" />
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="mt-2 w-8 h-1.5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-lg">Weekly Overview</h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={goToPreviousWeek} 
            className="p-1 text-gray-700 hover:text-gray-900"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-sm">{dateRangeText}</span>
          <button 
            onClick={goToNextWeek} 
            className="p-1 text-gray-700 hover:text-gray-900"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDates.days.map((day) => {
          const dateStr = formatDate(day);
          const dayStatus = getDayStatus(day);
          const tone = dayToneClasses[dayStatus];
          const isSelected = selectedDate === dateStr;
          const dayIsToday = isToday(day);

          return (
            <div key={dateStr} className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-2">
                {formatShortWeekday(day)}
              </span>
              <button
                onClick={() => onSelectDate(dateStr)}
                className={cn(
                  tone.button,
                  dayIsToday && dayStatus === "none" && "status-tile--today",
                  isSelected && "ring-2 ring-offset-2 ring-primary"
                )}
              >
                <span className="text-sm font-medium">
                  {formatDayNumber(day)}
                </span>
              </button>
              <div
                className={cn(
                  "mt-2 w-8 h-1.5 rounded-full",
                  isSelected ? "bg-primary" : tone.bar
                )}
              ></div>
              <span className="text-[10px] text-gray-500 mt-1">
                {formatHebrewDate(day)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
