"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface TransactionType {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  categoryId: string;
  account: {
    id: string;
    name: string;
    type: string;
  };
  category?: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
  status?: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  notes?: string | null;
  receipt?: {
    id: string;
    url: string;
  } | null;
  isRecurring?: boolean;
  recurringRule?: {
    frequency: string;
    interval: number;
    nextDue: string;
  } | null;
  createdAt?: string;
}

interface CategoryInterface {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  icon?: string | null;
}

interface AccountInterface {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface BudgetInterface {
  id: string;
  categoryId: string;
  amount: number;
  period: "MONTHLY" | "WEEKLY" | "YEARLY";
  spent: number;
  startDate: string;
  endDate?: string | null;
  category: {
    name: string;
  };
  remaining: number;
}

interface FinanceContextType {
  activeBudgets: BudgetInterface[];
  transactions: TransactionType[];
  categories: CategoryInterface[];
  accounts: AccountInterface[];
  refreshData: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

function FinanceProviderComponent({ children }: { children: React.ReactNode }) {
  const [activeBudgets, setActiveBudgets] = useState<BudgetInterface[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [accounts, setAccounts] = useState<AccountInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const [budgetRes, transactionRes, categoryRes, accountRes] =
        await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/budget/active`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bank/transactions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bank/categories`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bank/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const [budgets, transactions, categories, accountData] =
        await Promise.all([
          budgetRes.json(),
          transactionRes.json(),
          categoryRes.json(),
          accountRes.json(),
        ]);

      setActiveBudgets(budgets);
      setTransactions(transactions);
      setCategories(categories);
      setAccounts(accountData.accounts.list);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        activeBudgets,
        transactions,
        categories,
        accounts,
        refreshData,
        isLoading,
        error,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

function useFinanceHook() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}

export {
  FinanceProviderComponent as FinanceProvider,
  useFinanceHook as useFinance,
};

export type {
  FinanceContextType,
  TransactionType,
  CategoryInterface,
  AccountInterface,
  BudgetInterface,
};
