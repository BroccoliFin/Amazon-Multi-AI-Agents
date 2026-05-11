"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, icon, children, className, disabled, ...props },
    ref
  ) => {
    const variants = {
      primary:
        "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 border border-indigo-600",
      secondary:
        "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm",
      ghost: "hover:bg-slate-100 text-slate-500 hover:text-slate-700",
      danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
      success:
        "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200",
      outline:
        "border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-50",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:ring-offset-2 focus:ring-offset-white",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
