
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { TrendingUp } from 'lucide-react';

const cashFlowData = [
  { month: "Jan", income: 2800, expense: 2100 },
  { month: "Feb", income: 2900, expense: 2250 },
  { month: "Mar", income: 3000, expense: 2180 },
  { month: "Apr", income: 3050, expense: 2300 },
  { month: "May", income: 3100, expense: 2400 },
  { month: "Jun", income: 3120, expense: 2350 },
];

export default function CashFlow() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-xl">Cash Flow</CardTitle>
        </div>
        <CardDescription>Income vs. Expenses (6 months)</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cashFlowData} barCategoryGap={18}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Bar dataKey="income" fill="#22c55e" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
          If you keep this trend, you could save <span className="font-semibold">FOR DEMO PURPOSE ONLY</span> next month.
        </div>
      </CardContent>
    </Card>
  );
}
