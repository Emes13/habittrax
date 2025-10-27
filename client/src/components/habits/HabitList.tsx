import { useQuery } from "@tanstack/react-query";
import { Habit, Category, HabitLog } from "@shared/schema";
import { HabitCard } from "./HabitCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getStreakCount, formatDate, parseLocalDate } from "@/lib/dates";
import { isHabitActiveOnDate } from "@/lib/habitUtils";
import { apiRequest } from "@/lib/queryClient";

interface HabitListProps {
  selectedCategory: string;
  date?: string;
}

export function HabitList({ selectedCategory, date = formatDate(new Date()) }: HabitListProps) {
  const { data: habits, isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });
  
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const selectedDateObj = parseLocalDate(date);
  const rangeStartDate = new Date(selectedDateObj);
  rangeStartDate.setDate(rangeStartDate.getDate() - 30); // Get logs for last 30 days for streak calculation
  const rangeStart = formatDate(rangeStartDate);
  const rangeEnd = formatDate(selectedDateObj);

  const { data: habitLogsRange, isLoading: isLoadingLogsRange } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs', { startDate: rangeStart, endDate: rangeEnd }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/habit-logs", undefined, {
        params: { startDate: rangeStart, endDate: rangeEnd },
      });
      return response.json() as Promise<HabitLog[]>;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: dailyHabitLogs, isLoading: isLoadingDailyLogs } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs', { date }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/habit-logs", undefined, {
        params: { date },
      });
      return response.json() as Promise<HabitLog[]>;
    },
    staleTime: 0,
  });

  const isLoading =
    isLoadingHabits ||
    isLoadingCategories ||
    isLoadingLogsRange ||
    isLoadingDailyLogs;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((status) => (
                    <Skeleton key={status} className="h-8 w-8 rounded-full" />
                  ))}
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
                <div className="flex items-center justify-between mt-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <p className="text-gray-600">No habits found. Create your first habit!</p>
      </div>
    );
  }

  // Filter habits by category if a specific one is selected
  const filteredHabits = selectedCategory === 'all'
    ? habits
    : habits.filter(habit => habit.categoryId.toString() === selectedCategory);

  const activeHabits = filteredHabits.filter(habit => isHabitActiveOnDate(habit, selectedDateObj));

  // Calculate streaks for each habit
  const calculateHabitStreaks = (habitId: number) => {
    if (!habitLogsRange) return 0;

    const completedDates = habitLogsRange
      .filter((log) => log.habitId === habitId && log.status === "complete")
      .map((log) => parseLocalDate(log.date));
    
    return getStreakCount(completedDates);
  };

  // Filter logs for the selected date
  const currentDateLogs = dailyHabitLogs ?? [];

  return (
    <div className="space-y-4">
      {activeHabits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          categories={categories || []}
          logs={currentDateLogs}
          date={date}
          streak={calculateHabitStreaks(habit.id)}
        />
      ))}

      {activeHabits.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-600">No habits found in this category.</p>
        </div>
      )}
    </div>
  );
}
