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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface TransactionInterface {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  date: string;
  description: string;
  notes: string | null;
  receipt: {
    id: string;
    url: string;
  } | null;
  isRecurring: boolean;
  recurringRule: {
    frequency: string;
    interval: number;
    nextDue: string;
  } | null;
  category: {
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
  createdAt: string;
}

const Transaction = () => {
  const [transactions, setTransactions] = useState<TransactionInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [mappings, setMappings] = useState<{ [key: string]: string }>({});

  const isCSVFile = (file: File) => {
    // comprehensive MIME type and extension check cus yes
    const validTypes = [
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "application/vnd.comma-separated-values",
      "", // apparently some stupid fucking browsers don't set the type
    ];

    return (
      validTypes.includes(file.type) || file.name.toLowerCase().endsWith(".csv")
    );
  };

  const handleFile = (file: File) => {
    if (!isCSVFile(file)) {
      alert("Please upload a CSV file");
      return;
    }

    setFile(file);
    Papa.parse(file, {
      complete: (results) => {
        setPreview(results.data.slice(0, 15)); // Show first 15 rows as preview
      },
      header: true,
      skipEmptyLines: true,
    });
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
  const processCSV = async () => {
    if (!file) return;

    try {
      const results = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error),
        });
      });

      // formatting transactions according to schema
      const formattedTransactions = (results as any[]).map((row) => ({
        description: row[mappings.description] || row.description,
        amount: parseFloat(row[mappings.amount] || row.amount),
        date: new Date(row[mappings.date] || row.date).toISOString(),
        type:
          parseFloat(row[mappings.amount] || row.amount) < 0
            ? "EXPENSE"
            : "INCOME",
        accountId: "", // uhh will do it later
        categoryId: null, // need to map but im lazy
      }));

      // thorow this shit to backend
      const response = await fetch(`${BACKEND_URL}/bank/transactions/bulk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactions: formattedTransactions }),
      });

      if (!response.ok) throw new Error("Failed to upload transactions");

      // refretch after sending the request
      fetchTransactions();
      setIsModalOpen(false);
      setFile(null);
      setPreview([]);
    } catch (error) {
      console.error("Error processing CSV:", error);
      alert("Failed to process CSV file");
    }
  };

  useEffect(() => {
    fetchTransactions();
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
                    onClick={() => setIsModalOpen(true)}
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
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white gap-2">
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
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-white/10">
                      <TableCell className="text-white/70">{tx.date}</TableCell>
                      <TableCell className="text-white/70">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {tx.category?.name}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          tx.amount < 0 ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        ${Math.abs(tx.amount).toFixed(2)}
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

              {/* CSV format example */}
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

              {/* preview mapping */}
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
    </div>
  );
};

export default Transaction;
