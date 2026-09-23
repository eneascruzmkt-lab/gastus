import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50";
  const variants = {
    primary: "bg-veridian-500 text-white hover:bg-veridian-600",
    secondary: "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
