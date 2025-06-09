import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/MainLayout";
import Home from "@/pages/home";
import Habits from "@/pages/habits";
import Statistics from "@/pages/statistics";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={() => <Habits />} />
      <ProtectedRoute path="/dashboard" component={() => <Home />} />
      <ProtectedRoute path="/habits" component={() => <Habits />} />
      <ProtectedRoute path="/statistics" component={() => <Statistics />} />
      <ProtectedRoute path="/settings" component={() => <Settings />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainLayout>
          <Router />
        </MainLayout>
        <Toaster />
        <ToastContainer position="bottom-right" autoClose={8000} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
