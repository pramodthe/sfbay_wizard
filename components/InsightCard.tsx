import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Sparkles, LoaderCircle, AlertCircle } from 'lucide-react';
import { getAIInsight } from '../lib/services/geminiService';
import { SpendingCategory } from '../types';

interface InsightCardProps {
  categories: SpendingCategory[];
}

export default function InsightCard({ categories }: InsightCardProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAIInsight(categories);
      setInsight(result);
    } catch (err: any) {
      setError(err.message || "Failed to load insight.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, [categories]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-24 text-slate-500">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <p className="mt-2 text-sm">Generating your insight...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-rose-600">
          <AlertCircle className="mx-auto h-6 w-6" />
          <p className="mt-2 text-sm font-medium">{error}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={fetchInsight}>Try Again</Button>
        </div>
      );
    }

    if (insight) {
      return (
        <p className="text-sm text-slate-700 leading-relaxed">
          {insight}
        </p>
      );
    }
    
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-fuchsia-500" />
          <CardTitle className="text-xl">AI Insight</CardTitle>
        </div>
        <CardDescription>A summary of your financial health</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}