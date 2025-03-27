import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  label?: React.ReactNode;
  className?: string;
}

export const CircularProgress = React.forwardRef<
  HTMLDivElement,
  CircularProgressProps
>(
  (
    {
      value,
      size = 100,
      thickness = 10,
      color = "currentColor",
      trackColor = "hsl(var(--muted))",
      label,
      className,
      ...props
    },
    ref
  ) => {
    // Ensure value is between 0 and 100
    const normalizedValue = Math.min(100, Math.max(0, value));
    
    // Calculate circle properties
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;
    
    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={thickness}
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
        </svg>
        
        {label && (
          <div className="absolute inset-0 flex items-center justify-center">
            {label}
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = "CircularProgress";
