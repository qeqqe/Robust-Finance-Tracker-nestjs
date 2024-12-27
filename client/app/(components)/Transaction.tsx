import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const Transaction = () => {
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
                  {dummyTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-white/10">
                      <TableCell className="text-white/70">{tx.date}</TableCell>
                      <TableCell className="text-white/70">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {tx.category}
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

        {/* other shit */}
      </Tabs>
    </div>
  );
};

export default Transaction;
