import { Link, useLocation } from "wouter";
import { useHabitModal } from "@/lib/hooks/use-habit-modal";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  CalendarCheckIcon,
  BarChartIcon,
  SettingsIcon,
  PlusIcon,
  CheckSquareIcon,
  LogOutIcon
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/habits", label: "My Habits", icon: CalendarCheckIcon },
  { href: "/statistics", label: "Statistics", icon: BarChartIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { openModal } = useHabitModal();
  const { user, logoutMutation } = useAuth();

  return (
    <aside className={cn("hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 h-screen", className)}>
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-heading font-bold text-primary flex items-center">
          <CheckSquareIcon className="mr-2 h-6 w-6" /> HabitTracker
        </h1>
        {user && (
          <p className="text-sm text-muted-foreground mt-2">
            Welcome, {user.username}
          </p>
        )}
      </div>
      
      <nav className="flex-grow py-4 px-2">
        <ul>
          {navItems.map((item) => (
            <li key={item.href} className="mb-1">
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-2 rounded-lg",
                    location === item.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center w-full px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          <span>New Habit</span>
        </button>
        
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="flex items-center justify-center w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <LogOutIcon className="h-5 w-5 mr-2" />
          <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
