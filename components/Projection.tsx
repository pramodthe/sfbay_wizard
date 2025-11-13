import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { DollarSign, TrendingUp } from "lucide-react";

export default function Projection() {
  const [monthly, setMonthly] = useState<number>(200); // $/month
  const [rate, setRate] = useState<number>(5); // % annual
  const [years, setYears] = useState<number>(40); // 30 - 50

  const { series, fv, principal, interest } = useMemo(() => {
    const n = 12; // monthly compounding
    const r = rate / 100;
    const totalMonths = years * 12;
    const out: { year: number; principal: number; interest: number }[] = [];

    for (let y = 1; y <= years; y++) {
      const months = y * 12;
      const fvYear = monthly * ((Math.pow(1 + r / n, months) - 1) / (r / n));
      const principalY = monthly * months;
      const interestY = fvYear - principalY;
      out.push({ year: y, principal: Math.round(principalY), interest: Math.round(interestY) });
    }

    const fvAll = monthly * ((Math.pow(1 + r / n, totalMonths) - 1) / (r / n));
    const principalAll = monthly * totalMonths;
    const interestAll = fvAll - principalAll;

    return { series: out, fv: fvAll, principal: principalAll, interest: interestAll };
  }, [monthly, rate, years]);

  const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-xl">Long‑Term Savings Projection</CardTitle>
          </div>
          <Badge variant="secondary">{years} yrs @ {rate}%</Badge>
        </div>
        <CardDescription>Estimate future value with monthly contributions</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <div className="mb-1 text-xs text-slate-500">Monthly contribution</div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-400" />
              <input
                type="number"
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                value={monthly}
                min={0}
                step={10}
                onChange={(e) => setMonthly(parseFloat(e.target.value || '0'))}
              />
            </div>
          </div>
          <div className="rounded-2xl border p-4">
            <div className="mb-1 text-xs text-slate-500">Annual interest rate</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                value={rate}
                min={0}
                max={15}
                step={0.25}
                onChange={(e) => setRate(parseFloat(e.target.value || '0'))}
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>
          <div className="rounded-2xl border p-4">
            <div className="mb-1 text-xs text-slate-500">Time horizon (30–50 yrs)</div>
            <input
              type="range"
              min={30}
              max={50}
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 text-sm font-medium">{years} years</div>
          </div>
        </div>

        {/* Chart & KPIs */}
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tickFormatter={(v) => `Y${v}`} />
                <YAxis tickFormatter={(v) => `$${fmt(v as number / 1000)}k`}/>
                <Tooltip formatter={(v) => `$${fmt(v as number)}`} labelFormatter={(l) => `Year ${l}`} />
                <Legend />
                <Line type="monotone" dataKey="principal" stroke="#3b82f6" strokeWidth={3} dot={false} name="Principal" />
                <Line type="monotone" dataKey="interest" stroke="#10b981" strokeWidth={3} dot={false} name="Interest" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-slate-500">Future Value</div>
              <div className="text-2xl font-bold">${fmt(fv)}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-slate-500">Total Principal Invested</div>
              <div className="text-xl font-semibold">${fmt(principal)}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-slate-500">Total Interest Earned</div>
              <div className="text-xl font-semibold">${fmt(interest)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}