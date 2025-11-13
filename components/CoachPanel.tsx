import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/Sheet';
import { Sparkles, LoaderCircle } from 'lucide-react';
import { getPersonalizedPlan, getAIFinancialTips } from '../lib/services/geminiService';
import { SpendingCategory } from '../types';

interface CoachPanelProps {
  categories: SpendingCategory[];
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  const lines = content.split('\n').filter(line => line.trim() !== '');

  const renderLine = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    );
  };

  const elements = lines.map((line, index) => {
    if (line.startsWith('## ')) {
      return <h2 key={index} className="mt-6 mb-2 text-xl font-semibold text-slate-800">{renderLine(line.substring(3))}</h2>;
    }
    if (line.startsWith('* ')) {
      return <li key={index} className="ml-5 list-disc text-slate-700">{renderLine(line.substring(2))}</li>;
    }
    return <p key={index} className="my-2 text-slate-700">{renderLine(line)}</p>;
  });

  // Group list items into <ul>
  const groupedElements = [];
  // FIX: Replaced `JSX.Element` with `React.ReactElement` to resolve the "Cannot find namespace 'JSX'" error. This ensures the type is correctly resolved from the imported React module.
  let currentList: React.ReactElement[] = [];

  elements.forEach((el, index) => {
    if (el.type === 'li') {
      currentList.push(el);
    } else {
      if (currentList.length > 0) {
        groupedElements.push(<ul key={`ul-${index}`} className="space-y-1">{currentList}</ul>);
        currentList = [];
      }
      groupedElements.push(el);
    }
  });

  if (currentList.length > 0) {
    groupedElements.push(<ul key="ul-last" className="space-y-1">{currentList}</ul>);
  }

  return <>{groupedElements}</>;
};

export default function CoachPanel({ categories }: CoachPanelProps) {
  const [isPlanSheetOpen, setIsPlanSheetOpen] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [tips, setTips] = useState<string[]>([]);
  const [areTipsLoading, setAreTipsLoading] = useState(true);
  const [tipsError, setTipsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTips = async () => {
      setAreTipsLoading(true);
      setTipsError(null);
      try {
        const result = await getAIFinancialTips(categories);
        setTips(result);
      } catch (err: any) {
        setTipsError(err.message || 'Failed to load tips.');
        // The service already provides fallback tips.
        setTips([
          "Review your subscriptions for potential savings.",
          "Consider setting a budget for dining out.",
          "Automate a small weekly transfer to your savings account.",
        ]);
      } finally {
        setAreTipsLoading(false);
      }
    };

    fetchTips();
  }, [categories]);
  
  const handleGeneratePlan = async () => {
    if (tips.length === 0) return;
    setIsPlanLoading(true);
    setPlanError(null);
    try {
      const result = await getPersonalizedPlan(tips);
      setPlan(result);
      setIsPlanSheetOpen(true);
    } catch (err: any) {
      setPlanError(err.message || "An unexpected error occurred.");
    } finally {
      setIsPlanLoading(false);
    }
  };

  const renderTipsContent = () => {
    if (areTipsLoading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl border bg-slate-50 p-3 text-sm">
              <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 animate-pulse items-center justify-center rounded-full bg-slate-200"></span>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-slate-200"></div>
                <div className="h-3 w-4/5 animate-pulse rounded bg-slate-200"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (tipsError) {
      return <p className="py-8 text-center text-sm text-rose-600">{tipsError}</p>;
    }

    return (
      <div className="space-y-3">
        {tips.map((t, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border p-3 text-sm">
            <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-700">{i + 1}</span>
            <p className="flex-1 leading-snug text-slate-700">{t}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-fuchsia-500" />
            <CardTitle className="text-xl">Your AI Coach</CardTitle>
          </div>
          <CardDescription>Hi 👋 Here’s what I noticed this week…</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {renderTipsContent()}
          <Button className="mt-4 w-full rounded-2xl" variant="default" onClick={handleGeneratePlan} disabled={isPlanLoading || areTipsLoading || tips.length === 0}>
            {isPlanLoading ? (
              <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              "Generate My Plan"
            )}
          </Button>
          {planError && <p className="mt-2 text-center text-xs text-rose-600">{planError}</p>}
        </CardContent>
      </Card>
      
      <Sheet open={isPlanSheetOpen} onOpenChange={setIsPlanSheetOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Your AI-Generated Financial Plan</SheetTitle>
            <SheetDescription>Here are actionable steps based on your weekly insights. Stick to it!</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {plan ? <MarkdownRenderer content={plan} /> : <p>Loading plan...</p>}
          </div>
          <div className="border-t p-4">
             <Button className="w-full" onClick={() => setIsPlanSheetOpen(false)}>Close Plan</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}