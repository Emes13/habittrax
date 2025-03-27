import { Habit, Category, HabitLog } from "@shared/schema";
import { CheckIcon, FlameIcon, ClockIcon } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/dates";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: Habit;
  categories: Category[];
  logs?: HabitLog[];
  date?: string;
  streak?: number;
}

export function HabitCard({ habit, categories, logs = [], date = formatDate(new Date()), streak = 0 }: HabitCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get the category for this habit
  const category = categories.find(c => c.id === habit.categoryId);
  
  // Find if habit is completed for the given date
  const habitLog = logs.find(log => 
    log.habitId === habit.id && formatDate(new Date(log.date)) === date
  );
  
  const isCompleted = habitLog?.completed || false;
  
  // Toggle habit completion mutation
  const { mutate: toggleHabit, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/habits/${habit.id}/toggle`, { date });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all habit logs queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs'] });
      
      // Also invalidate specific date queries
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs', { date }] });
      
      // Also refetch the habit logs for the current date explicitly
      queryClient.refetchQueries({ queryKey: ['/api/habit-logs'] });
      
      toast({
        title: isCompleted ? "Habit marked as incomplete" : "Habit completed!",
        description: isCompleted ? "Keep working on your habits!" : "Great job keeping up with your habits!",
        variant: isCompleted ? "default" : "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update habit completion status.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = () => {
    if (!isPending) {
      toggleHabit();
    }
  };

  // Determine streak display
  let streakColor = "text-gray-600";
  if (streak >= 10) {
    streakColor = "text-success font-medium";
  } else if (streak >= 5) {
    streakColor = "text-success font-medium";
  } else if (streak > 0) {
    streakColor = "text-gray-600 font-medium";
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={cn(
            "flex-shrink-0 mt-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
            isCompleted
              ? "border-0 bg-success shadow-sm text-white"
              : "border-2 border-gray-300 hover:border-primary/50"
          )}
        >
          {isCompleted && <CheckIcon className="h-4 w-4 text-white" />}
        </button>
        
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{habit.name}</h4>
            {category && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${category.color}20`, 
                  color: category.color 
                }}
              >
                {category.name}
              </span>
            )}
          </div>
          
          {habit.description && (
            <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{habit.reminderTime || "Anytime"}</span>
            </div>
            
            {streak > 0 && (
              <div className="flex items-center text-sm">
                <span className={cn("mr-2", streakColor)}>
                  {streak} day streak
                </span>
                <FlameIcon className="h-4 w-4 text-warning" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
