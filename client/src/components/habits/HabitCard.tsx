import { Habit, Category, HabitLog } from "@shared/schema";
import { CheckIcon, FlameIcon, ClockIcon, Trash2Icon, MoreVerticalIcon } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, parseLocalDate } from "@/lib/dates";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Get the category for this habit
  const category = categories.find(c => c.id === habit.categoryId);
  
  // Find if habit is completed for the given date
  const habitLog = logs.find(log => {
    // Standardize date formats for comparison
    const logDate = parseLocalDate(log.date).toISOString().split('T')[0];
    const compareDate = parseLocalDate(date).toISOString().split('T')[0];
    return log.habitId === habit.id && logDate === compareDate;
  });
  
  const isCompleted = habitLog?.completed || false;
  
  // Toggle habit completion mutation
  const { mutate: toggleHabit, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/habits/${habit.id}/toggle`, { date });
      return response.json();
    },
    // Use optimistic updates for immediate feedback
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/habit-logs', { date }] });
      
      // Get snapshot of the current state
      const previousLogs = queryClient.getQueryData(['/api/habit-logs', { date }]);
      
      // Create optimistic update
      const updatedHabitLogsList = [...(logs || [])];
      const existingLogIndex = updatedHabitLogsList.findIndex(log => {
        const logDate = parseLocalDate(log.date).toISOString().split('T')[0];
        const compareDate = parseLocalDate(date).toISOString().split('T')[0];
        return log.habitId === habit.id && logDate === compareDate;
      });
      
      if (existingLogIndex >= 0) {
        // Update existing log
        updatedHabitLogsList[existingLogIndex] = {
          ...updatedHabitLogsList[existingLogIndex],
          completed: !isCompleted
        };
      } else {
        // Add new log (optimistically)
        updatedHabitLogsList.push({
          id: Date.now(), // Temporary ID
          habitId: habit.id,
          userId: 1,
          date: date, // Using string date
          completed: true
        });
      }
      
      // Update the cache with our optimistic update
      queryClient.setQueryData(['/api/habit-logs', { date }], updatedHabitLogsList);
      
      // Return the previous data so we can roll back if needed
      return { previousLogs };
    },
    onSuccess: (data) => {
      // Invalidate and refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs', { date }] });
      
      // Use data returned from the server to determine the toast message
      // The data contains the newly toggled habit log
      const newCompletionState = data.completed;
      
      toast({
        title: newCompletionState ? "Habit completed!" : "Habit marked as incomplete",
        description: newCompletionState ? "Great job keeping up with your habits!" : "You can still complete it later!",
        variant: "default", // Only default and destructive are available
      });
    },
    onError: (error, variables, context) => {
      // Roll back the optimistic update using the context we saved
      if (context?.previousLogs) {
        queryClient.setQueryData(['/api/habit-logs', { date }], context.previousLogs);
      }
      
      toast({
        title: "Error",
        description: "Failed to update habit completion status.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs', { date }] });
    }
  });

  // Delete habit mutation
  const { mutate: deleteHabit, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/habits/${habit.id}`);
      return response.status === 204; // No content response
    },
    onSuccess: () => {
      // Invalidate habits query to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      
      toast({
        title: "Habit deleted",
        description: "The habit has been deleted successfully.",
        variant: "default",
      });
      
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = () => {
    if (!isPending) {
      toggleHabit();
    }
  };
  
  const handleDelete = () => {
    if (!isDeleting) {
      deleteHabit();
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
    <>
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
              <div className="flex items-center gap-2">
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-7 w-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100">
                      <MoreVerticalIcon className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2Icon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the habit "{habit.name}" and all of its tracking history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
