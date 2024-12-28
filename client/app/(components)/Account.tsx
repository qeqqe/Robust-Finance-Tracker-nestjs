import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Wallet } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface AccountInterface {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isDefault: boolean;
}

const Account = () => {
  const [accounts, setAccounts] = useState<AccountInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "CHECKING",
    currency: "USD",
  });

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${BACKEND_URL}/bank/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${BACKEND_URL}/bank/accounts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAccount),
      });

      if (!response.ok) throw new Error("Failed to create account");

      await fetchAccounts();
      setIsModalOpen(false);
      setNewAccount({ name: "", type: "CHECKING", currency: "USD" });
    } catch (error) {
      console.error("Error creating account:", error);
      alert("Failed to create account");
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  if (isLoading) return <div className="text-white">Loading accounts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Accounts</h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {account.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-white/70">
                <p>Type: {account.type}</p>
                <p>Currency: {account.currency}</p>
                <p className="text-2xl font-bold text-white">
                  ${account.balance.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Account Name"
              value={newAccount.name}
              onChange={(e) =>
                setNewAccount({ ...newAccount, name: e.target.value })
              }
              className="bg-white/5 border-white/10 text-white"
            />
            <Select
              value={newAccount.type}
              onValueChange={(value) =>
                setNewAccount({ ...newAccount, type: value })
              }
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="CHECKING">Checking</SelectItem>
                <SelectItem value="SAVINGS">Savings</SelectItem>
                <SelectItem value="CREDIT">Credit Card</SelectItem>
                <SelectItem value="INVESTMENT">Investment</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={createAccount}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Account;
