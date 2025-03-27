import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Habit, Category, HabitLog } from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { eachDayOfInterval, format, subMonths, isEqual } from "date-fns";
import { formatDate } from "@/lib/dates";

export function HabitCharts() {
  const { data: habits, isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });
  
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Get date range for stats (last month)
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);
  
  const { data: habitLogs, isLoading: isLoadingLogs } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs', { 
      startDate: formatDate(startDate), 
      endDate: formatDate(endDate) 
    }],
  });
  
  const isLoading = isLoadingHabits || isLoadingCategories || isLoadingLogs;
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Skeleton className="h-5 w-48 mb-3" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (!habits || !categories || !habitLogs) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Completion Rate by Category</h4>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No data available</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Monthly Trend</h4>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No data available</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Prepare data for category completion chart
  const categoryCompletionData = categories.map(category => {
    const categoryHabits = habits.filter(habit => habit.categoryId === category.id);
    const habitIds = categoryHabits.map(habit => habit.id);
    
    const totalLogs = habitLogs.filter(log => habitIds.includes(log.habitId)).length;
    const completedLogs = habitLogs.filter(log => habitIds.includes(log.habitId) && log.completed).length;
    
    const completionRate = totalLogs > 0 ? (completedLogs / totalLogs) * 100 : 0;
    
    return {
      name: category.name,
      rate: Math.round(completionRate),
      color: category.color
    };
  });
  
  // Prepare data for monthly trend chart
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  const dateGroups: { [key: string]: string } = {};
  
  // Group dates by week for the line chart
  dateRange.forEach(date => {
    const weekKey = format(date, 'MMM d');
    if (date.getDay() === 1 || !dateGroups[format(date, 'yyyy-MM-dd')]) { // Monday or first iteration
      dateGroups[format(date, 'yyyy-MM-dd')] = weekKey;
    }
  });
  
  const monthlyTrendData = Object.entries(dateGroups).map(([dateStr, label]) => {
    const date = new Date(dateStr);
    
    const dayLogs = habitLogs.filter(log => {
      const logDate = new Date(log.date);
      return isEqual(
        new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate()),
        new Date(date.getFullYear(), date.getMonth(), date.getDate())
      );
    });
    
    const totalLogs = dayLogs.length;
    const completedLogs = dayLogs.filter(log => log.completed).length;
    
    const completionRate = totalLogs > 0 ? (completedLogs / totalLogs) * 100 : 0;
    
    return {
      date: dateStr,
      name: label,
      rate: Math.round(completionRate)
    };
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h4 className="text-sm font-medium text-gray-600 mb-3">Completion Rate by Category</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryCompletionData}
              margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Completion Rate']}
              />
              <Bar 
                dataKey="rate" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h4 className="text-sm font-medium text-gray-600 mb-3">Monthly Trend</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyTrendData}
              margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Completion Rate']}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
