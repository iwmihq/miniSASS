import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

const Spinner: React.FC<SpinnerProps> = ({ size = "md", className = "" }) => (
  <div
    className={`animate-spin rounded-full border-accent border-t-transparent ${sizes[size]} ${className}`}
    role="status"
    aria-label="Loading"
  />
);

export { Spinner };
