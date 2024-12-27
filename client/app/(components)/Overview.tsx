import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

const overview = () => {
  return (
    <div className="space-y-6">
      {/* stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Balance", value: "$12,345", trend: "+12.5%" },
          { label: "Monthly Savings", value: "$2,345", trend: "+8.2%" },
          { label: "Investments", value: "$5,678", trend: "+15.7%" },
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
                  {stat.value}
                </span>
                <span className="text-sm text-green-400">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* quick action */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>{/* recent */}</CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>{/* summary charts */}</CardContent>
        </Card>
      </div>
    </div>
  );
};

export default overview;
