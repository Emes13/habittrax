import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import { NewHabitModal } from "../habits/NewHabitModal";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen md:flex-row">
      <Sidebar />
      <MobileNavbar />
      
      <main className="flex-grow overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      
      <NewHabitModal />
    </div>
  );
}
