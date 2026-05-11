"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  glow?: "indigo" | "emerald" | "amber" | "red" | "blue" | "purple";
}

export function Card({ children, className, hover, onClick, glow }: CardProps) {
  const glowBorders = {
    indigo: "border-indigo-200",
    emerald: "border-emerald-200",
    amber: "border-amber-200",
    red: "border-red-200",
    blue: "border-blue-200",
    purple: "border-purple-200",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl bg-white border border-slate-200",
        "shadow-sm transition-all duration-300",
        hover && "hover:border-slate-300 hover:shadow-md cursor-pointer",
        glow && glowBorders[glow],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-5 py-4 border-b border-slate-100", className)}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-5 py-3 border-t border-slate-100", className)}>
      {children}
    </div>
  );
}
