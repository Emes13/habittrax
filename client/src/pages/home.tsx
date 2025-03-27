import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [_, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to habits page for now
    setLocation("/habits");
  }, [setLocation]);
  
  return null;
}
