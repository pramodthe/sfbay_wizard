
import React from 'react';
import SummaryCards from './SummaryCards';
import BalanceCard from './BalanceCard';
import Goals from './Goals';

export default function Dashboard() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-20">
      <SummaryCards />

      {/* --- Overview Section --- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BalanceCard />
        </div>
        <div className="lg:col-span-1">
          <Goals />
        </div>
      </div>
    </main>
  );
}
