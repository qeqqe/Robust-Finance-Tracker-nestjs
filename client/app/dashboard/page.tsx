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
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  PlusCircle,
  Wallet,
  PieChart,
  ArrowUpDown,
  Settings,
} from "lucide-react";

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
  return (
    <main className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-purple-900/20 to-slate-900" />
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-500/30 rounded-full mix-blend-color-dodge filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[800px] h-[800px] bg-blue-500/30 rounded-full mix-blend-color-dodge filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] bg-indigo-500/30 rounded-full mix-blend-color-dodge filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header with Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {dummyAccounts.map((account) => (
            <Card
              key={account.name}
              className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  {account.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span
                  className={`text-2xl font-bold ${
                    account.balance < 0 ? "text-red-400" : "text-green-400"
                  }`}
                >
                  ${Math.abs(account.balance).toFixed(2)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white/10 border-white/20 text-white grid grid-cols-5 lg:w-[600px] mx-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white/20"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-white/20"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="budgets"
              className="data-[state=active]:bg-white/20"
            >
              Budgets
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white/20"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-white/20"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Monthly Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dummyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="name" stroke="#fff" />
                      <YAxis stroke="#fff" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      />
                      <Bar dataKey="income" fill="#4ade80" />
                      <Bar dataKey="expenses" fill="#f87171" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </CardHeader>
                <CardContent>{/* Recent transactions table */}</CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tab contents... */}
        </Tabs>
      </div>
    </main>
  );
}
