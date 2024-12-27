import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface OverviewData {
  accounts: {
    list: any[];
    total: number;
    count: number;
  };
  investments: {
    list: any[];
    invested: number;
    currentValue: number;
    growth: number;
    growthPercentage: number;
  };
  totalNetWorth: number;
}

const Overview = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(`${BACKEND_URL}/bank/overview`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch data");
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching overview:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (isLoading) return <div className="text-white">Loading...</div>;
  if (!data) return <div className="text-white">No data available</div>;

  return (
    <div className="space-y-6">
      {/* stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Net Worth", value: data.totalNetWorth, trend: null },
          { label: "Total Balance", value: data.accounts.total, trend: null },
          {
            label: "Investments",
            value: data.investments.currentValue,
            trend: data.investments.growthPercentage,
          },
        ].map((stat, index) => (
          <Card
            key={index}
            className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10"
          >
            <CardHeader>
              <CardTitle className="text-sm font-normal text-white/70">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">
                  $
                  {stat.value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                {stat.trend !== null && (
                  <span
                    className={`text-sm ${
                      stat.trend >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {stat.trend > 0 ? "+" : ""}
                    {stat.trend.toFixed(1)}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* recent activity & investment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.accounts.list.map((account) =>
                account.transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-white/70">{tx.description}</span>
                    <span
                      className={
                        tx.amount < 0 ? "text-red-400" : "text-green-400"
                      }
                    >
                      $
                      {Math.abs(tx.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Investment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-white/70">
                <span>Total Invested</span>
                <span>
                  $
                  {data.investments.invested.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Current Value</span>
                <span>
                  $
                  {data.investments.currentValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Total Growth</span>
                <span
                  className={
                    data.investments.growth >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  $
                  {data.investments.growth.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                  ({data.investments.growthPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
