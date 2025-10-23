import { CircularProgress } from "@/components/ui/circular-progress";
import { useQuery } from "@tanstack/react-query";
import { HabitLog, Habit } from "@shared/schema";
import { formatDate, parseLocalDate } from "@/lib/dates";
import { isHabitActiveOnDate } from "@/lib/habitUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface CircularProgressDisplayProps {
  date?: string;
}

export function CircularProgressDisplay({ date = formatDate(new Date()) }: CircularProgressDisplayProps) {
  // Fetch habits
  const { data: habits, isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });
  
  // Fetch habit logs for the date
  const { data: habitLogs, isLoading: isLoadingLogs } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs', { date }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/habit-logs?date=${date}`);
      if (!response.ok) {
        throw new Error('Failed to fetch habit logs');
      }
      return response.json();
    }
  });
  
  const isLoading = isLoadingHabits || isLoadingLogs;
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm text-gray-600">Completed</h4>
            <Skeleton className="h-8 w-16 mt-1" />
          </div>
          <Skeleton className="w-32 h-32 rounded-full" />
        </div>
        <Skeleton className="w-full h-2.5 rounded-full mt-2" />
      </div>
    );
  }
  
  if (!habits || !habitLogs) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm text-gray-600">Completed</h4>
            <p className="text-2xl font-bold">0/0</p>
          </div>
          <div className="w-32 h-32">
            <CircularProgress 
              value={0}
              size={128}
              thickness={10}
              color="hsl(var(--primary))"
              label={<span className="text-2xl font-bold text-primary">0%</span>}
            />
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full" 
            style={{ width: '0%' }}
          ></div>
        </div>
      </div>
    );
  }
  
  // Calculate completion statistics based on habits active for the selected date
  const dateObj = parseLocalDate(date);
  const activeHabits = habits.filter(habit => isHabitActiveOnDate(habit, dateObj));
  const activeHabitIds = activeHabits.map(h => h.id);
  const totalHabits = activeHabits.length;
  const completedHabits = habitLogs.filter(
    log => log.status === "complete" && activeHabitIds.includes(log.habitId)
  ).length;
  const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm text-gray-600">Completed</h4>
          <p className="text-2xl font-bold">{completedHabits}/{totalHabits}</p>
        </div>
        <div className="w-32 h-32">
          <CircularProgress 
            value={completionRate}
            size={128}
            thickness={10}
            color="hsl(var(--primary))"
            label={<span className="text-2xl font-bold text-primary">{Math.round(completionRate)}%</span>}
          />
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full" 
          style={{ width: `${completionRate}%` }}
        ></div>
      </div>
    </div>
  );
}
