import { Habit, Category, HabitLog } from "@shared/schema";
import {
  CheckIcon,
  FlameIcon,
  ClockIcon,
  Trash2Icon,
  MoreVerticalIcon,
  XIcon,
  MinusCircleIcon,
  LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: Habit;
  categories: Category[];
  logs?: HabitLog[];
  date?: string;
  streak?: number;
}

type HabitLogStatus = HabitLog["status"];

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

  const currentStatus: HabitLogStatus = habitLog?.status ?? "incomplete";
  const isNotApplicable = currentStatus === "not_applicable";
  const statusOptions: Array<{
    value: HabitLogStatus;
    label: string;
    icon: LucideIcon;
    tone: "success" | "warning" | "destructive" | "neutral";
    helper: string;
  }> = [
    {
      value: "complete",
      label: "Complete",
      icon: CheckIcon,
      tone: "success",
      helper: "Great job!",
    },
    {
      value: "partial",
      label: "Partial",
      icon: ClockIcon,
      tone: "warning",
      helper: "Progress made",
    },
    {
      value: "incomplete",
      label: "Incomplete",
      icon: XIcon,
      tone: "destructive",
      helper: "Not yet started",
    },
    {
      value: "not_applicable",
      label: "N/A",
      icon: MinusCircleIcon,
      tone: "neutral",
      helper: "Skipping today",
    },
  ];

  const toneClasses: Record<"success" | "warning" | "destructive" | "neutral", { active: string; inactive: string; icon: string }> = {
    success: {
      active: "status-button status-button--success",
      inactive: "status-button status-button--success-muted",
      icon: "status-icon status-icon--success",
    },
    warning: {
      active: "status-button status-button--warning",
      inactive: "status-button status-button--warning-muted",
      icon: "status-icon status-icon--warning",
    },
    destructive: {
      active: "status-button status-button--danger",
      inactive: "status-button status-button--danger-muted",
      icon: "status-icon status-icon--danger",
    },
    neutral: {
      active: "status-button status-button--neutral",
      inactive: "status-button status-button--neutral-muted",
      icon: "status-icon status-icon--neutral",
    },
  };
  
  // Toggle habit completion mutation
  const { mutate: updateHabitStatus, isPending } = useMutation<
    HabitLog,
    Error,
    HabitLogStatus,
    { previousLogs?: HabitLog[] }
  >({
    mutationFn: async (nextStatus) => {
      const response = await apiRequest(
        "POST",
        `/api/habits/${habit.id}/toggle`,
        { status: nextStatus },
        { params: { date } }
      );
      return response.json() as Promise<HabitLog>;
    },
    // Use optimistic updates for immediate feedback
    onMutate: async (nextStatus) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/habit-logs', { date }] });

      // Get snapshot of the current state
      const previousLogs = queryClient.getQueryData<HabitLog[]>(['/api/habit-logs', { date }]);

      // Create optimistic update
      const updatedHabitLogsList = (() => {
        const normalizedDate = parseLocalDate(date).toISOString().split('T')[0];
        const existingLogs = previousLogs ? [...previousLogs] : [];
        const existingLogIndex = existingLogs.findIndex(log => {
          const logDate = parseLocalDate(log.date).toISOString().split('T')[0];
          return log.habitId === habit.id && logDate === normalizedDate;
        });

        if (existingLogIndex >= 0) {
          existingLogs[existingLogIndex] = {
            ...existingLogs[existingLogIndex],
            status: nextStatus,
          };
          return existingLogs;
        }

        return [
          ...existingLogs,
          {
            id: Date.now(),
            habitId: habit.id,
            userId: habit.userId,
            date: normalizedDate,
            status: nextStatus,
          },
        ];
      })();

      // Update the cache with our optimistic update
      queryClient.setQueryData(['/api/habit-logs', { date }], updatedHabitLogsList);

      // Return the previous data so we can roll back if needed
      return { previousLogs };
    },
    onSuccess: (data) => {
      // Synchronize the cache with the server response
      queryClient.setQueryData<HabitLog[]>(['/api/habit-logs', { date }], (existingLogs = []) => {
        const index = existingLogs.findIndex(log => log.id === data.id);
        if (index >= 0) {
          const nextLogs = [...existingLogs];
          nextLogs[index] = data;
          return nextLogs;
        }
        return [...existingLogs, data];
      });

      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs'], refetchType: 'active' });

      // Use data returned from the server to determine the toast message
      const newStatus: HabitLogStatus = data.status;

      const statusMessages: Record<
        HabitLogStatus,
        { title: string; description: string; Icon: LucideIcon; tone: keyof typeof toneClasses }
      > = {
        complete: {
          title: "Habit completed!",
          description: "Great job keeping up with your habits!",
          Icon: CheckIcon,
          tone: "success",
        },
        partial: {
          title: "Partial progress logged",
          description: "Nice work—keep going to finish this habit!",
          Icon: ClockIcon,
          tone: "warning",
        },
        incomplete: {
          title: "Habit marked as incomplete",
          description: "You can still complete it later!",
          Icon: XIcon,
          tone: "destructive",
        },
        not_applicable: {
          title: "Habit skipped for today",
          description: "We'll keep this out of your streak calculations.",
          Icon: MinusCircleIcon,
          tone: "neutral",
        },
      };

      const message = statusMessages[newStatus];

      toast({
        title: message.title,
        description: (
          <div className="flex items-start gap-2">
            <message.Icon className={cn("mt-0.5", toneClasses[message.tone].icon)} />
            <span>{message.description}</span>
          </div>
        ),
        variant: message.tone === "destructive" ? "destructive" : "default", // Only default and destructive are available
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

  const handleStatusChange = (status: HabitLogStatus) => {
    if (!isPending && status !== currentStatus) {
      updateHabitStatus(status);
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
      <div
        className={cn(
          "bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow",
          isNotApplicable && "border border-dashed border-gray-200 bg-gray-50"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              {statusOptions.map((option) => {
                const isActive = currentStatus === option.value;
                const classes = toneClasses[option.tone];
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleStatusChange(option.value)}
                    disabled={isPending}
                    aria-pressed={isActive}
                    aria-label={`Mark as ${option.label}`}
                    className={cn(
                      isActive ? classes.active : classes.inactive,
                      isPending && !isActive && "opacity-60",
                      isPending && "cursor-not-allowed"
                    )}
                    title={option.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] font-medium text-gray-500">
              {statusOptions.find((option) => option.value === currentStatus)?.helper ?? "Update status"}
            </span>
          </div>

          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <h4 className={cn("font-medium", isNotApplicable && "text-gray-400 line-through")}>{habit.name}</h4>
              <div className="flex items-center gap-2">
                {category && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      isNotApplicable && "bg-gray-200 text-gray-500"
                    )}
                    style={{
                      backgroundColor: isNotApplicable ? undefined : `${category.color}20`,
                      color: isNotApplicable ? undefined : category.color
                    }}
                  >
                    {category.name}
                  </span>
                )}

                {isNotApplicable && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                    N/A today
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
              <p className={cn("text-sm mt-1", isNotApplicable ? "text-gray-400 line-through" : "text-gray-600")}>{habit.description}</p>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>{habit.reminderTime || "Anytime"}</span>
              </div>

              {streak > 0 && !isNotApplicable && (
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
