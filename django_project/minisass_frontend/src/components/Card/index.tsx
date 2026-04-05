import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated";
}

const Card: React.FC<React.PropsWithChildren<CardProps>> = ({
  children,
  className = "",
  variant = "default",
  ...rest
}) => {
  const base = "rounded-tr-2xl rounded-bl-2xl rounded-br-2xl";
  const variants = {
    default: "bg-surface border border-surface-subtle",
    outlined: "bg-transparent border border-surface-subtle",
    elevated: "bg-surface shadow-card",
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export { Card };
