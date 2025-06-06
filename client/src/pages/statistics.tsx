import { useQuery } from "@tanstack/react-query";
import { Habit, HabitLog } from "@shared/schema";
import { formatDisplayDate, formatDate } from "@/lib/dates";
import { HabitCharts } from "@/components/stats/HabitCharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Statistics() {
  const today = new Date();
  const displayDate = formatDisplayDate(today);
  
  // Fetch habits
  const { data: habits, isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });
  
  // Fetch today's habit logs
  const { data: todayLogs, isLoading: isLoadingLogs } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs', { date: formatDate(today) }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/habit-logs?date=${formatDate(today)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch habit logs');
      }
      return response.json();
    }
  });
  
  const isLoading = isLoadingHabits || isLoadingLogs;
  
  // Calculate overall stats
  const totalHabits = habits?.length || 0;
  const completedToday = todayLogs?.filter(log => log.completed).length || 0;
  const completionRate = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
  
  return (
    <div className="p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="font-heading font-bold text-2xl mb-1">Statistics</h2>
        <p className="text-gray-600">{displayDate}</p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm text-gray-600 mb-1">Total Habits</h3>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold">{totalHabits}</p>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm text-gray-600 mb-1">Completed Today</h3>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold">{completedToday}</p>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm text-gray-600 mb-1">Completion Rate</h3>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
          )}
        </div>
      </div>
      
      {/* Visualizations */}
      <div className="mb-8">
        <h3 className="font-heading font-semibold text-lg mb-3">Habit Performance</h3>
        <HabitCharts />
      </div>
    </div>
  );
}
