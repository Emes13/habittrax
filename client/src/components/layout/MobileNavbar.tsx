import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  CalendarCheckIcon,
  BarChartIcon,
  UserIcon,
  MenuIcon,
  XIcon,
  CheckSquareIcon
} from "lucide-react";
import { useMobileMenu } from "@/lib/hooks/use-mobile-menu";
import { useHabitModal } from "@/lib/hooks/use-habit-modal";

interface MobileNavbarProps {
  className?: string;
}

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/habits", label: "Habits", icon: CalendarCheckIcon },
  { href: "/statistics", label: "Stats", icon: BarChartIcon },
  { href: "/settings", label: "Profile", icon: UserIcon },
];

const sideMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/habits", label: "My Habits", icon: CalendarCheckIcon },
  { href: "/statistics", label: "Statistics", icon: BarChartIcon },
  { href: "/settings", label: "Settings", icon: UserIcon },
];

export default function MobileNavbar({ className }: MobileNavbarProps) {
  const [location] = useLocation();
  const { isOpen, toggleMenu, closeMenu } = useMobileMenu();
  const { openModal } = useHabitModal();

  return (
    <>
      {/* Mobile Header */}
      <header className={cn("md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between", className)}>
        <h1 className="text-xl font-heading font-bold text-primary flex items-center">
          <CheckSquareIcon className="mr-2 h-6 w-6" /> HabitTracker
        </h1>
        <button onClick={toggleMenu} className="text-gray-700">
          <MenuIcon className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 z-10">
        <div className="flex justify-around items-center">
          {mobileNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex flex-col items-center p-2",
                  location === item.href ? "text-primary" : "text-gray-600"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Side Menu (Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-white h-screen w-64 p-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-heading font-bold text-primary flex items-center">
                <CheckSquareIcon className="mr-2 h-6 w-6" /> HabitTracker
              </h1>
              <button onClick={closeMenu} className="text-gray-700">
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
            <nav>
              <ul>
                {sideMenuItems.map((item) => (
                  <li key={item.href} className="mb-4">
                    <Link href={item.href}>
                      <a
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center px-4 py-2 rounded-lg",
                          location === item.href
                            ? "bg-primary bg-opacity-10 text-primary"
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

            <div className="mt-6">
              <button
                onClick={() => {
                  closeMenu();
                  openModal();
                }}
                className="flex items-center justify-center w-full px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                <span>New Habit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
