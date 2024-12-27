import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Wallet } from "lucide-react";

const Budget = () => {
  const dummyBudgets = [
    { category: "Food & Dining", allocated: 800, spent: 650 },
    { category: "Transportation", allocated: 400, spent: 280 },
    { category: "Entertainment", allocated: 300, spent: 250 },
    { category: "Shopping", allocated: 500, spent: 420 },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="w-fit bg-white/5 text-white border border-white/10 rounded-lg p-1">
          <TabsTrigger
            value="current"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            Current Budget
          </TabsTrigger>
          <TabsTrigger
            value="planning"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            Budget Planning
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            Analysis
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
          >
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              Current Month Budget
            </h3>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Budget
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* budget overview */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {dummyBudgets.map((budget, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">{budget.category}</span>
                      <span className="text-white">
                        ${budget.spent} / ${budget.allocated}
                      </span>
                    </div>
                    <Progress
                      value={(budget.spent / budget.allocated) * 100}
                      className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-purple-500"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* budget details  */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Category Details</CardTitle>
              </CardHeader>
              <CardContent>{/* detail budget info */}</CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* other shit */}
      </Tabs>
    </div>
  );
};

export default Budget;
