import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Progress } from './ui/Progress';
import { List, Edit2, Check, X } from 'lucide-react';
import { SpendingCategory } from '../types';
import { Skeleton } from './ui/Skeleton';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useUpdateCategory } from '../hooks/useCategories';

interface SpendingBreakdownProps {
  categories: SpendingCategory[];
  loading?: boolean;
  error?: string | null;
}

const SpendingBreakdownSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          <div className="mb-1 flex justify-between">
            <Skeleton width={100} height={14} />
            <Skeleton width={120} height={14} />
          </div>
          <Skeleton height={8} className="w-full" />
        </div>
      ))}
    </div>
  );
};

export default function SpendingBreakdown({ categories, loading = false, error = null }: SpendingBreakdownProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const { updateCategoryMutation, updating } = useUpdateCategory();

  const getBarColor = (value: number, budget: number): string => {
    if (budget === 0 && value > 0) return 'bg-red-500';
    if (budget === 0) return 'bg-slate-300';
    const percentage = (value / budget) * 100;
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 90) return 'bg-orange-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleEditClick = (category: SpendingCategory) => {
    setEditingId(category.id);
    setEditValue(category.budget.toString());
  };

  const handleSave = async (categoryId: string) => {
    const newBudget = parseFloat(editValue);
    if (isNaN(newBudget) || newBudget < 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    try {
      await updateCategoryMutation(categoryId, { budget: newBudget });
      setEditingId(null);
      setEditValue('');
    } catch (err) {
      console.error('Failed to update budget:', err);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-xl">Spending Breakdown</CardTitle>
          </div>
        </div>
        <CardDescription>Spending vs. Budget (Jun)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full space-y-4 overflow-y-auto pr-2">
          {loading ? (
            <SpendingBreakdownSkeleton />
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-500">No categories yet</p>
            </div>
          ) : (
            categories.map((cat, index) => {
              const percentage = cat.budget > 0 ? Math.round((cat.value / cat.budget) * 100) : 0;
              const isEditing = editingId === cat.id;
              
              return (
                <div key={index}>
                  <div className="mb-1 flex justify-between items-center text-sm gap-2">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">${cat.value.toLocaleString()} /</span>
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 w-20 px-2 text-sm"
                          placeholder="Budget"
                          min="0"
                          step="0.01"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(cat.id);
                            if (e.key === 'Escape') handleCancel();
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleSave(cat.id)}
                          disabled={updating}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                          onClick={handleCancel}
                          disabled={updating}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">
                          ${cat.value.toLocaleString()} / <span className="font-medium text-slate-600">${cat.budget.toLocaleString()}</span>
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          onClick={() => handleEditClick(cat)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Progress 
                    value={percentage} 
                    indicatorClassName={getBarColor(cat.value, cat.budget)}
                    className="h-2"
                    aria-label={`${cat.name} spending, ${percentage}% of budget`}
                  />
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}