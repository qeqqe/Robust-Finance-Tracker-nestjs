import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PlusCircle, Upload, Search, Receipt, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { fetchWithAuth } from "@/lib/api";
import { useFinance } from "@/contexts/FinanceContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type TransactionInterface = {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  date: string;
  description: string;
  category?: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
  account: {
    id: string;
    name: string;
    type: string;
  };
  userId?: string;
  accountId?: string;
  categoryId?: string | null;
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
};

interface NormalTransactionInterface {
  description: string;
  amount: number;
  date: string;
  type: "INCOME" | "EXPENSE";
  notes: string;
  accountId: string;
  status: "COMPLETED";
}

interface BudgetOption {
  id: string;
  categoryId: string;
  amount: number;
  remaining: number;
  category: {
    name: string;
  };
}

const validateTransaction = (transaction: NormalTransactionInterface) => {
  const errors = [];

  if (!transaction.description?.trim()) {
    errors.push("Description is required");
  }

  if (!transaction.amount || transaction.amount <= 0) {
    errors.push("Amount must be greater than 0");
  }

  if (!transaction.date) {
    errors.push("Date is required");
  } else {
    const transactionDate = new Date(transaction.date);
    if (transactionDate > new Date()) {
      errors.push("Transaction date cannot be in the future");
    }
  }

  if (!transaction.accountId) {
    errors.push("Account is required");
  }

  return errors;
};

const Transaction = () => {
  const {
    refreshData,
    transactions: contextTransactions,
    activeBudgets: contextActiveBudgets,
    accounts: contextAccounts,
  } = useFinance();

  const [transactions, setTransactions] = useState<TransactionInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionData, setTransactionData] =
    useState<NormalTransactionInterface>({
      description: "",
      amount: 0,
      date: "",
      type: "EXPENSE",
      notes: "",
      accountId: "",
      status: "COMPLETED",
    });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [mappings, setMappings] = useState<{ [key: string]: string }>({});
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>(
    []
  );

  const [normalTransactionDialog, setNormalTransactionDialog] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [newTransaction, setNewTransaction] =
    useState<NormalTransactionInterface>({
      description: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      type: "EXPENSE",
      notes: "",
      accountId: "",
      status: "COMPLETED",
    });

  const [searchQuery, setSearchQuery] = useState("");

  const [availableBudgets, setAvailableBudgets] = useState<BudgetOption[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>("");

  const handleFile = (file: File) => {
    console.log("Handling file:", file);

    setFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      console.log("First few characters of file:", csvData.substring(0, 100));

      Papa.parse(csvData, {
        complete: (results) => {
          console.log("Parse results:", results);
          if (results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
            alert(`CSV parsing errors: ${JSON.stringify(results.errors)}`);
            return;
          }
          setPreview(results.data.slice(0, 15));
        },
        header: true,
        skipEmptyLines: true,
      });
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      alert("Error reading file");
    };

    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/bank/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load transactions"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/bank/overview`);
      const data = await response.json();
      setAccounts(data.accounts.list);
      if (data.accounts.list.length > 0) {
        setSelectedAccountId(data.accounts.list[0].id);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch accounts"
      );
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchAvailableBudgets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${BACKEND_URL}/budget/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch budgets");
      const data = await response.json();
      setAvailableBudgets(data);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    }
  };

  const handleImportClick = () => {
    setIsModalOpen(true);
    fetchAccounts();
  };

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchAvailableBudgets();
  }, [router]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchTransactions(),
          fetchAccounts(),
          fetchAvailableBudgets(),
        ]);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Add effect to sync with context
  useEffect(() => {
    if (accounts.length > 0) {
      setAccounts(accounts);
      if (!selectedAccountId && accounts[0]) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [accounts]);

  useEffect(() => {
    if (contextActiveBudgets?.length > 0) {
      setAvailableBudgets(contextActiveBudgets);
    }
  }, [contextActiveBudgets]);

  useEffect(() => {
    if (contextTransactions?.length > 0) {
      setTransactions(
        contextTransactions.map((tx) => ({
          ...tx,
          account: tx.account || { id: "", name: "", type: "" },
          status: tx.status || "COMPLETED",
        })) as TransactionInterface[]
      );
    }
  }, [contextTransactions]);

  const processCSV = async () => {
    try {
      if (!file) {
        toast.error("Please upload a CSV file");
        return;
      }

      if (!selectedAccountId) {
        toast.error("Please select an account");
        return;
      }

      const results = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error),
        });
      });

      if (!Array.isArray(results) || results.length === 0) {
        throw new Error("No valid data found in CSV");
      }

      const requiredColumns = ["description", "amount", "date"];
      const firstRow = results[0] as any;
      const missingColumns = requiredColumns.filter(
        (col) =>
          !Object.keys(firstRow).some((header) =>
            header.toLowerCase().includes(col.toLowerCase())
          )
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Missing required columns: ${missingColumns.join(", ")}`
        );
      }

      const formattedTransactions = (results as any[]).map((row, index) => {
        const amount = parseFloat(
          row.amount || row.Amount || row.AMOUNT || "0"
        );
        if (isNaN(amount)) {
          throw new Error(`Invalid amount in row ${index + 1}`);
        }

        const date = new Date(row.date || row.Date || row.DATE);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date in row ${index + 1}`);
        }

        return {
          description: row.description || row.Description || row.DESC || "",
          amount: Math.abs(amount),
          date: date.toISOString(),
          type: amount < 0 ? "EXPENSE" : "INCOME",
          status: "COMPLETED",
          accountId: selectedAccountId,
          notes: row.notes || row.Notes || row.NOTES || "",
        };
      });

      const response = await fetch(`${BACKEND_URL}/bank/transactions/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions: formattedTransactions,
          accountId: selectedAccountId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import transactions");
      }

      await fetchTransactions();
      setIsModalOpen(false);
      setFile(null);
      setPreview([]);

      toast.success(
        `Successfully imported ${formattedTransactions.length} transactions`,
        {
          style: {
            background: "#059669",
            color: "white",
          },
        }
      );
    } catch (error) {
      console.error("Error processing CSV:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process CSV file",
        {
          duration: 5000,
          style: {
            background: "#dc2626",
            color: "white",
          },
        }
      );
    }
  };

  const handleNormalTransaction = async () => {
    try {
      const validationErrors = validateTransaction(newTransaction);
      if (validationErrors.length > 0) {
        toast.error(validationErrors.join("\n"), {
          duration: 4000,
          style: {
            background: "#dc2626",
            color: "white",
          },
        });
        return;
      }

      const transactionData = {
        ...newTransaction,
        date: new Date(newTransaction.date).toISOString(),
        amount: Math.abs(newTransaction.amount),
        categoryId:
          selectedBudget && selectedBudget !== "none"
            ? availableBudgets.find((b) => b.id === selectedBudget)?.categoryId
            : null,
      };

      const response = await fetch(`${BACKEND_URL}/bank/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create transaction");
      }

      await fetchTransactions();
      await fetchAvailableBudgets();
      setNormalTransactionDialog(false);

      setNewTransaction({
        description: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        type: "EXPENSE",
        notes: "",
        accountId: "",
        status: "COMPLETED",
      });
      setSelectedBudget("");

      toast.success("Transaction created successfully", {
        style: {
          background: "#059669",
          color: "white",
        },
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred",
        {
          style: {
            background: "#dc2626",
            color: "white",
          },
        }
      );
    }
  };

  const filteredTransactions = transactions.filter((tx) =>
    tx.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const handleFetchError = (error: any) => {
      if (error.status === 401) {
        toast.error("Session expired. Please login again.", {
          style: {
            background: "#dc2626",
            color: "white",
          },
        });
        router.push("/login");
      }
    };

    window.addEventListener("unhandledrejection", handleFetchError);
    return () =>
      window.removeEventListener("unhandledrejection", handleFetchError);
  }, [router]);

  if (isLoading)
    return <div className="text-white">Loading transactions...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-fit bg-white/5 text-white border border-white/10 rounded-lg p-1">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            All Transactions
          </TabsTrigger>
          <TabsTrigger
            value="recurring"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            Recurring
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            Categories
          </TabsTrigger>
          <TabsTrigger
            value="receipts"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            Receipts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="bg-white/5 border-white/10 text-white gap-2"
                    onClick={handleImportClick}
                  >
                    <Upload className="h-4 w-4" />
                    Import
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white/5 border-white/10 text-white gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    Add Receipt
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white gap-2"
                    onClick={() => setNormalTransactionDialog(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    New Transaction
                  </Button>
                </div>
              </div>
              <div className="mt-4 relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-white/70" />
                <Input
                  placeholder="Search transactions..."
                  className="bg-white/5 border-white/10 text-white pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Description</TableHead>
                    <TableHead className="text-white">Category</TableHead>
                    <TableHead className="text-white text-right">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-white/10">
                      <TableCell className="text-white/70">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {tx.category?.name}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          tx.type === "EXPENSE"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {tx.type === "EXPENSE" ? "-" : "+"}$
                        {Math.abs(tx.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Import Transactions
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[80vh]">
            <div className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-white/10 hover:border-white/20"
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-white/50" />
                <label className="block text-white/70">
                  Drag and drop your CSV file here, or
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,text/csv,application/vnd.ms-excel,application/vnd.comma-separated-values"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer ml-1">
                    browse
                  </span>
                </label>
                {file && (
                  <div className="mt-4 text-white/50 text-sm">
                    Selected file: {file.name}
                  </div>
                )}
              </div>

              {preview.length == 0 && (
                <div className="rounded-lg bg-white/5 p-4 text-sm">
                  <h4 className="font-medium text-white mb-2">
                    Expected CSV Format:
                  </h4>
                  <div className="space-y-2 text-white/70">
                    <p>Your CSV file should include the following columns:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <code className="text-indigo-400">date</code> - Format:
                        YYYY-MM-DD
                      </li>
                      <li>
                        <code className="text-indigo-400">description</code> -
                        Transaction description
                      </li>
                      <li>
                        <code className="text-indigo-400">amount</code> -
                        Numeric (negative for expenses)
                      </li>
                      <li>
                        <code className="text-indigo-400">category</code> -
                        (Optional) Transaction category
                      </li>
                    </ul>
                    <div className="mt-3 p-2 bg-white/5 rounded font-mono text-xs">
                      Example:
                      <br />
                      date,description,amount,category
                      <br />
                      2024-02-20,Grocery Store,-85.50,Food
                      <br />
                      2024-02-19,Salary Deposit,3000.00,Income
                    </div>
                  </div>
                </div>
              )}

              {preview.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg text-white">Preview:</h3>
                  <div className="rounded-lg border border-white/10">
                    <ScrollArea className="max-h-[400px]">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              {Object.keys(preview[0]).map((header) => (
                                <th
                                  key={header}
                                  className="p-3 text-left text-white/70"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.map((row, i) => (
                              <tr key={i} className="border-b border-white/10">
                                {Object.values(row).map((cell, j) => (
                                  <td key={j} className="p-3 text-white/50">
                                    {cell as string}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </ScrollArea>
                  </div>

                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full p-2 mb-4 bg-white/5 border border-white/10 rounded text-white"
                  >
                    <option value="">Select Account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>

                  <Button
                    onClick={processCSV}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                    Import Transactions
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog
        open={normalTransactionDialog}
        onOpenChange={setNormalTransactionDialog}
      >
        <DialogContent className="bg-slate-900 border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">New Transaction</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <div className="space-y-4">
              <Input
                placeholder="Description"
                className="bg-white/5 border-white/10 text-white"
                value={newTransaction.description}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    description: e.target.value,
                  })
                }
              />
              <Input
                type="number"
                required
                step="0.01"
                min="0"
                placeholder="Amount"
                className="bg-white/5 border-white/10 text-white"
                value={newTransaction.amount || ""}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <Input
                type="date"
                required
                className="bg-white/5 border-white/10 text-white"
                value={newTransaction.date}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    date: e.target.value,
                  })
                }
              />
              <select
                value={newTransaction.type}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    type: e.target.value as "INCOME" | "EXPENSE",
                  })
                }
                className="w-full p-2 bg-white/5 border-white/10 rounded text-white"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
              {newTransaction.type === "EXPENSE" && (
                <Select
                  value={selectedBudget}
                  onValueChange={setSelectedBudget}
                >
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select Budget (Optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem
                      value="none"
                      className="text-white hover:bg-white/10"
                    >
                      {" "}
                      No Budget{" "}
                    </SelectItem>{" "}
                    {availableBudgets.map((budget) => (
                      <SelectItem
                        key={budget.id}
                        value={budget.id}
                        className="text-white hover:bg-white/10"
                      >
                        {" "}
                        {budget.category.name} (${budget.remaining} remaining){" "}
                      </SelectItem>
                    ))}{" "}
                  </SelectContent>{" "}
                </Select>
              )}
              <select
                value={newTransaction.accountId}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    accountId: e.target.value,
                  })
                }
                className="w-full p-2 bg-white/5 border-white/10 rounded text-white"
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Notes (optional)"
                className="bg-white/5 border-white/10 text-white"
                value={newTransaction.notes}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    notes: e.target.value,
                  })
                }
              />
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                onClick={handleNormalTransaction}
              >
                Create Transaction
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transaction;
