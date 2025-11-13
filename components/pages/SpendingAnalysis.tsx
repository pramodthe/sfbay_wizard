
import React from 'react';
import SpendingBreakdown from '../SpendingBreakdown';
import RecordExpense from '../RecordExpense';
import InsightCard from '../InsightCard';
import { SpendingCategory } from '../../types';

interface SpendingAnalysisProps {
  categories: SpendingCategory[];
  loading?: boolean;
  error?: string | null;
}

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mt-12 mb-6">
    <h2 className="text-2xl font-semibold tracking-tight text-slate-800">{title}</h2>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
  </div>
);

export default function SpendingAnalysis({ categories, loading = false, error = null }: SpendingAnalysisProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-20">
      <SectionHeader 
        title="Spending Analysis"
        description="Drill down into your expenses and discover where your money is going."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SpendingBreakdown categories={categories} loading={loading} error={error} />
        </div>
        <div className="lg:col-span-1">
          <RecordExpense />
        </div>
        <div className="lg:col-span-1">
          <InsightCard categories={categories} />
        </div>
      </div>
    </main>
  );
}
