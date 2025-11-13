
import React from 'react';
import CashFlow from '../CashFlow';
import CoachPanel from '../CoachPanel';
import Projection from '../Projection';
import { SpendingCategory } from '../../types';

interface FinancialPlanningProps {
  categories: SpendingCategory[];
}

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mt-12 mb-6">
    <h2 className="text-2xl font-semibold tracking-tight text-slate-800">{title}</h2>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
  </div>
);

export default function FinancialPlanning({ categories }: FinancialPlanningProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-20">
      <SectionHeader 
        title="Financial Planning"
        description="Look at the bigger picture, get AI-powered advice, and plan for the future."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashFlow />
        </div>
        <div className="lg:col-span-1">
          <CoachPanel categories={categories} />
        </div>
        <div className="lg:col-span-3 mt-6">
          <Projection />
        </div>
      </div>
    </main>
  );
}
