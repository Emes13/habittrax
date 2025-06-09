import { useQuery } from "@tanstack/react-query";
import { Habit, Category, HabitLog } from "@shared/schema";
import { HabitCard } from "./HabitCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getStreakCount, formatDate, parseLocalDate } from "@/lib/dates";

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
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Get logs for last 30 days for streak calculation
  
  const { data: habitLogs, isLoading: isLoadingLogs } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs', { date }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/habit-logs?date=${date}`);
      if (!response.ok) {
        throw new Error('Failed to fetch habit logs');
      }
      return response.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch
    gcTime: 0     // Don't cache results (gcTime replaces cacheTime in TanStack Query v5)
  });

  const isLoading = isLoadingHabits || isLoadingCategories || isLoadingLogs;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
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

  const getWeekdayIndex = (d: Date) => {
    const jsDay = d.getDay(); // 0 Sunday - 6 Saturday
    return (jsDay + 6) % 7; // convert to Monday=0
  };

  const isHabitActiveOnDate = (habit: Habit, currentDate: Date) => {
    const dayIndex = getWeekdayIndex(currentDate);

    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'weekly') {
      return habit.startDay === dayIndex;
    }
    if (habit.frequency === 'custom') {
      return Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.includes(dayIndex);
    }
    return true;
  };

  const dateObj = parseLocalDate(date);
  const activeHabits = filteredHabits.filter(habit => isHabitActiveOnDate(habit, dateObj));

  // Calculate streaks for each habit
  const calculateHabitStreaks = (habitId: number) => {
    if (!habitLogs) return 0;
    
    const completedDates = (habitLogs as HabitLog[])
      .filter((log: HabitLog) => log.habitId === habitId && log.completed)
      .map((log: HabitLog) => parseLocalDate(log.date));
    
    return getStreakCount(completedDates);
  };

  // Filter logs for the selected date
  const currentDateLogs = habitLogs 
    ? (habitLogs as HabitLog[]).filter((log: HabitLog) => {
        const logDate = parseLocalDate(log.date).toISOString().split('T')[0];
        const compareDate = parseLocalDate(date).toISOString().split('T')[0];
        return logDate === compareDate;
      }) 
    : [];

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
