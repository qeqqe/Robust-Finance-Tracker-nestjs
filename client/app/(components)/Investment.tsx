import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrendingUp, PieChart, LineChart, Coins } from "lucide-react";

const Investment = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="w-full bg-white/5 text-white border border-white/10 rounded-lg p-1">
          <TabsTrigger
            value="portfolio"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            Portfolio
          </TabsTrigger>
          <TabsTrigger
            value="stocks"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            Stocks
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger
            value="dividends"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            Dividends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              Investment Portfolio
            </h3>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              Add Investment
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add pie chart for asset allocation */}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Portfolio Performance
                </CardTitle>
              </CardHeader>
              <CardContent>{/* Add line chart for performance */}</CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Add other tab contents */}
      </Tabs>
    </div>
  );
};

export default Investment;
