import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Category, categoryValidationSchema } from "@shared/schema";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon, Trash2Icon, EditIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type CategoryFormValues = z.infer<typeof categoryValidationSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Form for adding/editing categories
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryValidationSchema),
    defaultValues: {
      name: "",
      color: "#6366f1"
    }
  });
  
  // Open modal for adding a new category
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    form.reset({ name: "", color: "#6366f1" });
    setCategoryModalOpen(true);
  };
  
  // Open modal for editing a category
  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      color: category.color
    });
    setCategoryModalOpen(true);
  };
  
  // Close category modal
  const closeModal = () => {
    setCategoryModalOpen(false);
    setEditingCategory(null);
  };
  
  // Save category mutation
  const { mutate: saveCategory, isPending: isSavingCategory } = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      if (editingCategory) {
        const response = await apiRequest("PUT", `/api/categories/${editingCategory.id}`, values);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/categories", values);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      closeModal();
      toast({
        title: editingCategory ? "Category updated" : "Category created",
        description: editingCategory 
          ? "Your category has been updated successfully." 
          : "Your new category has been created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingCategory ? 'update' : 'create'} category. Please try again.`,
        variant: "destructive",
      });
    },
  });
  
  // Delete category mutation
  const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await apiRequest("DELETE", `/api/categories/${categoryId}`, undefined);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete category. It might be in use by some habits.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: CategoryFormValues) => {
    saveCategory(values);
  };
  
  // Handle category deletion
  const handleDeleteCategory = (categoryId: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteCategory(categoryId);
    }
  };
  
  return (
    <div className="p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="font-heading font-bold text-2xl mb-1">Settings</h2>
        <p className="text-gray-600">Customize your habit tracking experience</p>
      </div>
      
      {/* Categories Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Manage categories for your habits</CardDescription>
            </div>
            <Button onClick={openNewCategoryModal}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full mb-3" />
              <Skeleton className="h-12 w-full mb-3" />
              <Skeleton className="h-12 w-full mb-3" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : categories && categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((category) => (
                <div 
                  key={category.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-5 h-5 rounded-full mr-3"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span>{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditCategoryModal(category)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={isDeletingCategory}
                    >
                      <Trash2Icon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No categories found. Create your first category.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Health, Productivity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: field.value }}
                      ></div>
                      <FormControl>
                        <Input 
                          type="color" 
                          {...field} 
                          className="w-full h-10"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSavingCategory}
                >
                  {editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Additional settings could be added here */}
    </div>
  );
}
