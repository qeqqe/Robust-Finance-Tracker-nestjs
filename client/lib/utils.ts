import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return "bg-red-500/50";
  if (percentage >= 80) return "bg-yellow-500/50";
  if (percentage >= 50) return "bg-blue-500/50";
  return "bg-emerald-500/50";
};

export const getBudgetStatus = (spent: number, total: number) => {
  const percentage = (spent / total) * 100;
  return {
    color: getProgressColor(percentage),
    percentage: Math.min(percentage, 100),
    isOverBudget: percentage > 100,
    remaining: total - spent,
  };
};
