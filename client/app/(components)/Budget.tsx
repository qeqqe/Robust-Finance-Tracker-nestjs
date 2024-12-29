"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PlusCircle,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, getBudgetStatus } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface BudgetInterface {
  id: string;
  categoryId: string;
  amount: number;
  period: string;
  spent: number;
  startDate: string;
  endDate?: string | null;
  category: {
    name: string;
  };
}

interface CategoryInterface {
  id: string;
  name: string;
  type: string;
}

interface TransactionType {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  categoryId: string;
}

const calculateBudgetMetrics = (spent: number, allocated: number) => {
  const remaining = allocated - spent;
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  const isOverBudget = spent > allocated;

  return {
    remaining,
    percentage: Math.min(Math.max(percentage, 0), 100),
    isOverBudget,
    status: isOverBudget ? "over" : percentage >= 80 ? "warning" : "good",
  };
};

const validateBudget = (budget: any) => {
  const errors = [];

  if (!budget.categoryId) {
    errors.push("Category is required");
  }

  if (!budget.amount || budget.amount <= 0) {
    errors.push("Budget amount must be greater than 0");
  }

  if (!budget.startDate) {
    errors.push("Start date is required");
  }

  if (
    budget.alertThreshold &&
    (budget.alertThreshold < 0 || budget.alertThreshold > 100)
  ) {
    errors.push("Alert threshold must be between 0 and 100");
  }

  return errors;
};

const Budget = () => {
  const {
    refreshData,
    isLoading: contextLoading,
    transactions,
    activeBudgets,
  } = useFinance();

  const [budgets, setBudgets] = useState<BudgetInterface[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("MONTHLY");
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newBudget, setNewBudget] = useState({
    categoryId: "",
    amount: 0,
    period: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
    alerts: true,
    alertThreshold: 80,
  });
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const calculateBudgetProgress = (budget: BudgetInterface) => {
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = budget.endDate ? new Date(budget.endDate) : new Date();

    const relevantTransactions = transactions.filter(
      (tx: TransactionType) =>
        tx.categoryId === budget.categoryId &&
        tx.type === "EXPENSE" &&
        new Date(tx.date) >= budgetStart &&
        new Date(tx.date) <= budgetEnd
    );

    const spent = relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      spent,
      remaining: budget.amount - spent,
      percentage: (spent / budget.amount) * 100,
      isOverBudget: spent > budget.amount,
      transactions: relevantTransactions,
    };
  };

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please login to view budgets");
        router.push("/login");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/budget`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch budgets");
      }

      const data = await response.json();

      const budgetsWithProgress = data.map((budget: BudgetInterface) => {
        const progress = calculateBudgetProgress(budget);
        return {
          ...budget,
          spent: progress.spent,
          remaining: progress.remaining,
          percentage: progress.percentage,
          isOverBudget: progress.isOverBudget,
        };
      });

      setBudgets(budgetsWithProgress);
      calculateTotals(budgetsWithProgress);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load budgets";
      setError(message);
      toast.error(message);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/bank/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Categories response:", await response.text());
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      console.log("Fetched categories:", data);
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const calculateTotals = (budgetData: BudgetInterface[]) => {
    const spent = budgetData.reduce(
      (sum, budget) => sum + (budget.spent || 0),
      0
    );
    const total = budgetData.reduce((sum, budget) => sum + budget.amount, 0);
    setTotalSpent(spent);
    setTotalBudget(total);
  };

  const createBudget = async () => {
    try {
      const validationErrors = validateBudget(newBudget);
      if (validationErrors.length > 0) {
        toast.error(validationErrors.join("\n"), {
          duration: 4000,
          style: { background: "#dc2626", color: "white" },
        });
        return;
      }

      const existingBudget = budgets.find(
        (b) =>
          b.categoryId === newBudget.categoryId &&
          b.period === newBudget.period &&
          new Date(b.startDate) <= new Date(newBudget.startDate) &&
          (!b.endDate || new Date(b.endDate) >= new Date(newBudget.startDate))
      );

      if (existingBudget) {
        toast.error(
          "A budget already exists for this category in the specified period"
        );
        return;
      }

      const response = await fetch(`${BACKEND_URL}/budget`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newBudget,
          amount: Math.abs(Number(newBudget.amount)),
          startDate: new Date(newBudget.startDate).toISOString(),
          alertThreshold: Math.min(
            Math.max(newBudget.alertThreshold || 80, 0),
            100
          ),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create budget");
      }

      await fetchBudgets();
      setIsCreateModalOpen(false);
      toast.success("Budget created successfully");
      resetNewBudgetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create budget"
      );
    }
  };

  const resetNewBudgetForm = () => {
    setNewBudget({
      categoryId: "",
      amount: 0,
      period: "MONTHLY",
      startDate: new Date().toISOString().split("T")[0],
      alerts: true,
      alertThreshold: 80,
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchBudgets(), fetchCategories()]);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load budgets");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!contextLoading) {
      fetchBudgets();
      fetchCategories();
    }
  }, [contextLoading]);

  useEffect(() => {
    if (budgets.length > 0) {
      calculateTotals(budgets);
    }
  }, [budgets]);

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchCategories();
    }
  }, [isCreateModalOpen]);

  if (isLoading || contextLoading) {
    return <div className="text-white">Loading budgets...</div>;
  }

  const summaryCards = [
    {
      title: "Total Budget",
      value: `$${totalBudget.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      trend: null,
    },
    {
      title: "Spent this Month",
      value: `$${totalSpent.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`,
      icon: Wallet,
      trend: `${((totalSpent / totalBudget) * 100).toFixed(1)}%`,
    },
    {
      title: "Remaining",
      value: `$${(totalBudget - totalSpent).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`,
      icon: TrendingUp,
      trend: `${(100 - (totalSpent / totalBudget) * 100).toFixed(1)}%`,
    },
  ];

  const renderBudgetCard = (budget: BudgetInterface) => {
    const progress = calculateBudgetProgress(budget);
    const status = getBudgetStatus(progress.spent, budget.amount);
    const recentTransactions = progress.transactions.slice(0, 3);

    return (
      <div key={budget.id} className="space-y-4 p-4 rounded-lg bg-white/5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-medium flex items-center gap-2">
              {budget.category.name}
              {status.isOverBudget && (
                <span className="text-red-400 text-sm px-2 py-1 rounded-full bg-red-400/10">
                  OVER BUDGET
                </span>
              )}
            </h3>
            <p className="text-sm text-white/50">{budget.period}</p>
          </div>
          <div className="text-right">
            <p
              className={status.isOverBudget ? "text-red-400" : "text-white/70"}
            >
              {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
            </p>
            <p className="text-sm text-white/50">
              {status.isOverBudget
                ? `${formatCurrency(Math.abs(status.remaining))} over budget`
                : `${formatCurrency(status.remaining)} remaining`}
            </p>
          </div>
        </div>

        <Progress value={status.percentage} className={`h-2 ${status.color}`} />

        {recentTransactions.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/50">Recent Transactions</p>
              <p className="text-xs text-white/30">
                Last {recentTransactions.length} transactions
              </p>
            </div>
            <div className="space-y-2 rounded-lg bg-white/5 p-3">
              {recentTransactions.map((tx: TransactionType) => (
                <div
                  key={tx.id}
                  className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-white/90 font-medium">
                        {tx.description}
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(tx.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-red-400 font-medium">
                        {formatCurrency(tx.amount)}
                      </span>
                      <span className="text-xs text-white/40">
                        {((tx.amount / budget.amount) * 100).toFixed(1)}% of
                        budget
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {progress.transactions.length > 3 && (
              <p className="text-xs text-white/30 text-right">
                +{progress.transactions.length - 3} more transactions
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card, index) => (
          <Card key={index} className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-white/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <p className="text-xs text-white/50">{card.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Budget Allocation</CardTitle>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Budget
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgets.length === 0 ? (
            <div className="text-white/50 text-center py-4">
              No budgets found. Create your first budget to get started!
            </div>
          ) : (
            budgets.map(renderBudgetCard)
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={newBudget.categoryId}
              onValueChange={(value) =>
                setNewBudget({ ...newBudget, categoryId: value })
              }
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue
                  placeholder={
                    categories.length === 0
                      ? "No categories found"
                      : "Select Category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="" disabled>
                    No categories available
                  </SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Budget Amount"
              className="bg-white/5 border-white/10 text-white"
              value={newBudget.amount || ""}
              onChange={(e) =>
                setNewBudget({
                  ...newBudget,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
            />

            <Select
              value={newBudget.period}
              onValueChange={(value) =>
                setNewBudget({ ...newBudget, period: value })
              }
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              className="bg-white/5 border-white/10 text-white"
              value={newBudget.startDate}
              onChange={(e) =>
                setNewBudget({ ...newBudget, startDate: e.target.value })
              }
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newBudget.alerts}
                onChange={(e) =>
                  setNewBudget({ ...newBudget, alerts: e.target.checked })
                }
                className="rounded border-white/10 bg-white/5"
              />
              <label className="text-white text-sm">Enable alerts</label>
            </div>

            {newBudget.alerts && (
              <Input
                type="number"
                placeholder="Alert Threshold (%)"
                className="bg-white/5 border-white/10 text-white"
                value={newBudget.alertThreshold}
                onChange={(e) =>
                  setNewBudget({
                    ...newBudget,
                    alertThreshold: parseInt(e.target.value) || 80,
                  })
                }
              />
            )}

            <Button
              onClick={createBudget}
              disabled={
                !newBudget.categoryId ||
                !newBudget.amount ||
                !newBudget.startDate
              }
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50"
            >
              Create Budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Budget;
