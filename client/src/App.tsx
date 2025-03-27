import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/MainLayout";
import Home from "@/pages/home";
import Habits from "@/pages/habits";
import Statistics from "@/pages/statistics";
import Settings from "@/pages/settings";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";

function Router() {
  useEffect(() => {
    // Seed demo data when app first loads (only for demo purposes)
    const seedDemoData = async () => {
      try {
        await apiRequest("POST", "/api/seed-demo-data", {});
      } catch (error) {
        console.error("Error seeding demo data:", error);
      }
    };
    
    seedDemoData();
  }, []);

  return (
    <Switch>
      <Route path="/" component={Habits} />
      <Route path="/dashboard" component={Home} />
      <Route path="/habits" component={Habits} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Router />
      </MainLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
