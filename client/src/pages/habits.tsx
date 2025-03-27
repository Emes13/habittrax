import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterIcon, SearchIcon, PlusIcon } from "lucide-react";
import { formatDisplayDate, formatDate } from "@/lib/dates";
import { HabitList } from "@/components/habits/HabitList";
import { CircularProgressDisplay } from "@/components/stats/CircularProgressDisplay";
import { WeeklyCalendar } from "@/components/stats/WeeklyCalendar";
import CategoryFilter from "@/components/CategoryFilter";
import { Button } from "@/components/ui/button";
import { useHabitModal } from "@/lib/hooks/use-habit-modal";

export default function Habits() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { openModal } = useHabitModal();

  const displayDate = formatDisplayDate(new Date(selectedDate));

  return (
    <div className="p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-2xl mb-1">My Habits</h2>
          <p className="text-gray-600">{displayDate}</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button 
            onClick={() => openModal()} 
            className="md:hidden"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            <span>New Habit</span>
          </Button>
          <div className="ml-auto md:ml-0 flex items-center space-x-2">
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <FilterIcon className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <SearchIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      <CategoryFilter 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Today's Progress */}
      <div className="mb-8">
        <h3 className="font-heading font-semibold text-lg mb-3">Today's Progress</h3>
        <CircularProgressDisplay date={selectedDate} />
      </div>

      {/* Habit List */}
      <div className="mb-8">
        <h3 className="font-heading font-semibold text-lg mb-3">My Habits</h3>
        <HabitList 
          selectedCategory={selectedCategory}
          date={selectedDate}
        />
      </div>

      {/* Weekly Stats */}
      <div className="mb-8">
        <WeeklyCalendar 
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
    </div>
  );
}
