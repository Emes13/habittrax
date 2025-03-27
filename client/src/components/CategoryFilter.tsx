import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <button
        onClick={() => onSelectCategory('all')}
        className={cn(
          "px-4 py-1 rounded-full text-sm font-medium",
          selectedCategory === 'all'
            ? "bg-primary text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        )}
      >
        All
      </button>
      
      {categories?.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id.toString())}
          className={cn(
            "px-4 py-1 rounded-full text-sm font-medium",
            selectedCategory === category.id.toString()
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
