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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface BudgetInterface {
  id: string;
  categoryId: string;
  amount: number;
  period: string;
  spent: number;
  category: {
    name: string;
  };
}

interface CategoryInterface {
  id: string;
  name: string;
  type: string;
}

const Budget = () => {
  const [budgets, setBudgets] = useState<BudgetInterface[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("MONTHLY");
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
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const fetchBudgetProgress = async (budgetId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${BACKEND_URL}/budget/progress/${budgetId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch budget progress");
      return await response.json();
    } catch (error) {
      console.error("Error fetching budget progress:", error);
      return null;
    }
  };

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/budget`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch budgets");

      const data = await response.json();

      // Fetch progress for each budget
      const budgetsWithProgress = await Promise.all(
        data.map(async (budget: any) => {
          const progress = await fetchBudgetProgress(budget.id);
          return {
            ...budget,
            spent: progress?.spent || 0,
          };
        })
      );

      setBudgets(budgetsWithProgress);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      setBudgets([]);
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

  const calculatePercentage = (spent: number, total: number) => {
    if (total <= 0) return 0;
    return (spent / total) * 100;
  };

  const getBudgetStatus = (spent: number, allocated: number) => {
    const percentage = calculatePercentage(spent, allocated);
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const validateBudgetAmount = (amount: number) => {
    return amount > 0;
  };

  const createBudget = async () => {
    try {
      if (
        !newBudget.categoryId ||
        !validateBudgetAmount(newBudget.amount) ||
        !newBudget.startDate
      ) {
        alert(
          "Please fill in all required fields. Budget amount must be positive."
        );
        return;
      }

      // Format the data before sending
      const budgetData = {
        ...newBudget,
        amount: Number(newBudget.amount),
        startDate: new Date(newBudget.startDate), // This will be serialized correctly
        period: newBudget.period,
      };

      console.log("Sending budget data:", budgetData); // Debug log

      const response = await fetch(`${BACKEND_URL}/budget`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(budgetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create budget");
      }

      const data = await response.json();
      console.log("Created budget:", data);

      await fetchBudgets();
      setIsCreateModalOpen(false);
      setNewBudget({
        categoryId: "",
        amount: 0,
        period: "MONTHLY",
        startDate: new Date().toISOString().split("T")[0],
        alerts: true,
        alertThreshold: 80,
      });
    } catch (error) {
      console.error("Error creating budget:", error);
      alert(error instanceof Error ? error.message : "Failed to create budget");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchBudgets();
        await fetchCategories();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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

  if (isLoading) return <div className="text-white">Loading budgets...</div>;

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
            budgets.map((budget: BudgetInterface) => (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-medium">
                      {budget.category.name}
                    </h3>
                    <p className="text-sm text-white/50">{budget.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">
                      ${budget.spent} / ${budget.amount}
                    </p>
                    <p className="text-sm text-white/50">
                      {calculatePercentage(budget.spent, budget.amount).toFixed(
                        1
                      )}
                      %
                    </p>
                  </div>
                </div>
                <Progress
                  value={calculatePercentage(budget.spent, budget.amount)}
                  className={`h-2 ${getBudgetStatus(
                    budget.spent,
                    budget.amount
                  )}`}
                />
              </div>
            ))
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
