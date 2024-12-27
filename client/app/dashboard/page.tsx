"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
} from "recharts";
import {
  Layout,
  ArrowUpDown,
  PieChart,
  Settings,
  LineChart,
  Wallet,
  Receipt,
  Calendar,
  Brain,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  Upload,
  Search,
  CreditCard,
  RefreshCcw,
  Globe,
  Currency,
} from "lucide-react";
import Overview from "../(components)/overview";
import Transaction from "../(components)/Transaction";
import Budget from "../(components)/Budget";
import Ai from "../(components)/Ai";
import Reports from "../(components)/Reports";
import Setting from "../(components)/Setting";
import Investment from "../(components)/Investment";
import CurrencyPage from "../(components)/CurrencyPage";
const dummyTransactions = [
  {
    id: 1,
    date: "2024-02-20",
    description: "Grocery Store",
    amount: -85.5,
    category: "Food",
  },
  {
    id: 2,
    date: "2024-02-19",
    description: "Salary Deposit",
    amount: 3000.0,
    category: "Income",
  },
  {
    id: 3,
    date: "2024-02-18",
    description: "Electric Bill",
    amount: -120.0,
    category: "Utilities",
  },
];

const dummyBudgets = [
  { category: "Food", allocated: 500, spent: 350 },
  { category: "Transportation", allocated: 300, spent: 250 },
  { category: "Entertainment", allocated: 200, spent: 180 },
];

const dummyAccounts = [
  { name: "Main Checking", balance: 5420.5, type: "checking" },
  { name: "Savings", balance: 12350.75, type: "savings" },
  { name: "Credit Card", balance: -1250.3, type: "credit" },
];

const dummyChartData = [
  { name: "Jan", income: 4000, expenses: 3000 },
  { name: "Feb", income: 4500, expenses: 3200 },
  { name: "Mar", income: 4100, expenses: 3100 },
];

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [isExpanded, setIsExpanded] = useState(false);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "overview":
        return <Overview />;

      case "transactions":
        return <Transaction />;

      case "budgets":
        return <Budget />;

      case "investments":
        return <Investment />;
      case "ai":
        return <Ai />;
      case "currency":
        return <CurrencyPage />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Setting />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* bg effect */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-purple-900/20 to-slate-900" />
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-500/30 rounded-full mix-blend-color-dodge filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[800px] h-[800px] bg-blue-500/30 rounded-full mix-blend-color-dodge filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] bg-indigo-500/30 rounded-full mix-blend-color-dodge filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* logo */}
      <div
        className={`fixed top-4 left-4 z-50 flex items-center gap-3 transition-all duration-300 ${
          isExpanded ? "scale-150 translate-x-6" : ""
        }`}
      >
        <div className="h-8 w-8 rounded-lg ml-[1rem] bg-gradient-to-tr from-indigo-500 to-purple-500 rotate-12 transform hover:rotate-0 transition-all duration-300" />
        <h1
          className={`text-xl font-bold  bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 transition-all duration-300 ${
            isExpanded ? "opacity-100" : "opacity-100"
          }`}
        >
          Apex
        </h1>
      </div>

      {/* sidebar trigger */}
      <div
        className="fixed left-0 top-20 w-3 h-[calc(100%-5rem)] z-50"
        onMouseEnter={() => setIsExpanded(true)}
      />

      {/* sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-black/40 border-r border-white/10 backdrop-blur-xl transition-all duration-300 ease-in-out ${
          isExpanded ? "w-80 opacity-100" : "w-0 opacity-0"
        }`}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div
          className={`p-8 pt-20 w-80 ${
            isExpanded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
        >
          <nav className="space-y-2">
            {[
              { icon: Layout, label: "Overview", id: "overview" },
              { icon: ArrowUpDown, label: "Transactions", id: "transactions" },
              { icon: PieChart, label: "Budgets", id: "budgets" },
              { icon: TrendingUp, label: "Investments", id: "investments" },
              { icon: Brain, label: "AI Insights", id: "ai" },
              { icon: Globe, label: "Multi-Currency", id: "currency" },
              { icon: FileSpreadsheet, label: "Reports", id: "reports" },
              { icon: Settings, label: "Settings", id: "settings" },
            ].map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start gap-4 py-6 px-4 text-lg ${
                  activeSection === item.id
                    ? "text-white bg-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon className="h-6 w-6" />
                <span className="transition-opacity duration-200">
                  {item.label}
                </span>
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* content */}
      <div
        className={`transition-all duration-300 ${
          isExpanded ? "ml-80" : "ml-0"
        } p-8 pt-20 relative`}
      >
        {/* title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h1>
        </div>

        {/* dynamic content */}
        {renderSectionContent()}
      </div>
    </div>
  );
}
