import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { habitValidationSchema } from "@shared/schema";
import { z } from "zod";
import { useHabitModal } from "@/lib/hooks/use-habit-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { Category, Habit } from "@shared/schema";

type FormValues = z.infer<typeof habitValidationSchema>;

export function NewHabitModal() {
  const { isOpen, closeModal, editingHabitId } = useHabitModal();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedFrequency, setSelectedFrequency] = useState<string>("daily");
  
  // Fetch categories for dropdown
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Prefetch habit data if editing
  const { data: editingHabit } = useQuery<Habit | undefined>({
    queryKey: ['/api/habits', editingHabitId],
    enabled: !!editingHabitId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(habitValidationSchema),
    defaultValues: {
      name: editingHabit?.name || "",
      description: editingHabit?.description || "",
      categoryId: editingHabit?.categoryId || 1,
      frequency: editingHabit?.frequency || "daily",
      reminderTime: editingHabit?.reminderTime || "none",
      userId: 1, // For demo, we'll use user ID 1
    },
  });

  // Update form when editing habit changes
  useEffect(() => {
    if (editingHabit) {
      form.reset({
        name: editingHabit.name,
        description: editingHabit.description || "",
        categoryId: editingHabit.categoryId,
        frequency: editingHabit.frequency,
        reminderTime: editingHabit.reminderTime || "none",
        userId: editingHabit.userId,
      });
      
      setSelectedFrequency(editingHabit.frequency);
    } else {
      form.reset({
        name: "",
        description: "",
        categoryId: categories?.[0]?.id || 1,
        frequency: "daily",
        reminderTime: "none",
        userId: 1,
      });
      
      setSelectedFrequency("daily");
    }
  }, [editingHabit, form, categories]);

  // Create/update habit mutation
  const { mutate: saveHabit, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editingHabitId) {
        const response = await apiRequest("PUT", `/api/habits/${editingHabitId}`, values);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/habits", values);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      closeModal();
      toast({
        title: editingHabitId ? "Habit updated" : "Habit created",
        description: editingHabitId 
          ? "Your habit has been updated successfully." 
          : "Your new habit has been created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingHabitId ? 'update' : 'create'} habit. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    saveHabit(values);
  };

  const reminderOptions = [
    { value: "none", label: "No reminder" },
    { value: "morning", label: "Morning (8:00 AM)" },
    { value: "afternoon", label: "Afternoon (1:00 PM)" },
    { value: "evening", label: "Evening (7:00 PM)" },
    { value: "anytime", label: "Anytime" },
  ];

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-lg">
            {editingHabitId ? "Edit Habit" : "Create New Habit"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Drink water" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why this habit is important to you"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {categories?.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => form.setValue("categoryId", category.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm",
                          field.value === category.id
                            ? `${category.color}20 text-${category.color}`
                            : "bg-gray-100 text-gray-800"
                        )}
                        style={field.value === category.id ? {
                          backgroundColor: `${category.color}20`,
                          color: category.color
                        } : {}}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {frequencies.map((frequency) => (
                      <button
                        key={frequency.value}
                        type="button"
                        onClick={() => {
                          form.setValue("frequency", frequency.value);
                          setSelectedFrequency(frequency.value);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm",
                          selectedFrequency === frequency.value
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {frequency.label}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reminderTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder Time (optional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reminder time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reminderOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isPending}
              >
                {editingHabitId ? "Update Habit" : "Create Habit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
