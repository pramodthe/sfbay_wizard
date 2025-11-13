import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { Button } from './ui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/Sheet';
import { Input } from './ui/Input';
import { Plus } from 'lucide-react';
import { useGoals, useAddGoal, useUpdateGoal } from '@/hooks/useGoals';
import { FinancialGoal } from '@/types';

export default function Goals() {
  const { goals: dbGoals, loading, error } = useGoals();
  const { addGoal, adding: addingGoal, error: addGoalError } = useAddGoal();
  
  // Local state for optimistic updates
  const [optimisticGoals, setOptimisticGoals] = useState<FinancialGoal[]>([]);

  // Optimistic update handlers
  const handleOptimisticUpdate = useCallback((goalId: string, updates: Partial<FinancialGoal>) => {
    setOptimisticGoals(prev => {
      const existing = prev.find(g => g.id === goalId);
      if (existing) {
        return prev.map(g => g.id === goalId ? { ...g, ...updates } : g);
      }
      // If not in optimistic list, add it from dbGoals
      const dbGoal = dbGoals.find(g => g.id === goalId);
      if (dbGoal) {
        return [...prev, { ...dbGoal, ...updates }];
      }
      return prev;
    });
  }, [dbGoals]);

  const handleRollback = useCallback((goalId: string, previousData: Partial<FinancialGoal>) => {
    setOptimisticGoals(prev => {
      const existing = prev.find(g => g.id === goalId);
      if (existing) {
        // Rollback the change
        if (previousData.current_amount !== undefined) {
          return prev.map(g => 
            g.id === goalId 
              ? { ...g, current_amount: g.current_amount - previousData.current_amount! }
              : g
          );
        }
      }
      return prev.filter(g => g.id !== goalId);
    });
  }, []);

  const { addContributionMutation, updating: updatingGoal, error: updateGoalError } = useUpdateGoal(
    handleOptimisticUpdate,
    handleRollback
  );

  // Merge optimistic and real goals
  const goals = React.useMemo(() => {
    const optimisticMap = new Map(optimisticGoals.map(g => [g.id, g]));
    return dbGoals.map(g => optimisticMap.get(g.id) || g);
  }, [dbGoals, optimisticGoals]);

  // Clear optimistic updates when real data changes
  React.useEffect(() => {
    if (!loading && dbGoals.length > 0) {
      setOptimisticGoals([]);
    }
  }, [dbGoals, loading]);

  // State for "Set New Goal" sheet
  const [isNewGoalSheetOpen, setIsNewGoalSheetOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalMonths, setNewGoalMonths] = useState('12');

  // State for "Add Savings" sheet
  const [isAddSavingsSheetOpen, setIsAddSavingsSheetOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [savingsAmount, setSavingsAmount] = useState('');

  const handleAddNewGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim() || !newGoalAmount) return;

    try {
      await addGoal({
        title: newGoalName,
        target_amount: parseFloat(newGoalAmount),
        current_amount: 0,
        months_remaining: parseInt(newGoalMonths) || 12,
      });
      
      // Reset form and close sheet
      setNewGoalName('');
      setNewGoalAmount('');
      setNewGoalMonths('12');
      setIsNewGoalSheetOpen(false);
    } catch (err) {
      console.error('Failed to add goal:', err);
    }
  };

  const handleOpenAddSavingsSheet = (goalId: string) => {
    setSelectedGoalId(goalId);
    setSavingsAmount('');
    setIsAddSavingsSheetOpen(true);
  };

  const handleAddSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !savingsAmount) return;

    const amountToAdd = parseFloat(savingsAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) return;

    try {
      await addContributionMutation(selectedGoalId, amountToAdd);
      
      setIsAddSavingsSheetOpen(false);
      setSelectedGoalId(null);
      setSavingsAmount('');
    } catch (err) {
      console.error('Failed to add contribution:', err);
    }
  };
  
  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-slate-800">Financial Goals</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[calc(100%-4rem)] flex-col">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {(addGoalError || updateGoalError) && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {addGoalError || updateGoalError}
            </div>
          )}
          <div className="h-64 space-y-4 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-sm text-slate-500">Loading goals...</div>
              </div>
            ) : goals.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-sm text-slate-500">
                  <p>No goals yet.</p>
                  <p className="mt-1">Click "Set New Goal" to get started!</p>
                </div>
              </div>
            ) : (
              goals.map((g) => {
                const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
                const toGo = g.target_amount - g.current_amount;
                return (
                  <div key={g.id} className="rounded-xl bg-slate-50/80 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{g.title}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm text-slate-600">
                          <span className="font-bold text-slate-900">${g.current_amount.toLocaleString()}</span> / ${g.target_amount.toLocaleString()}
                        </p>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 rounded-full" 
                          onClick={() => handleOpenAddSavingsSheet(g.id)}
                          disabled={updatingGoal}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={pct} indicatorClassName="bg-emerald-500" className="h-2" />
                    <p className="mt-2 text-xs text-slate-500">
                      ${toGo.toLocaleString()} to go • {g.months_remaining} months remaining
                    </p>
                  </div>
                );
              })
            )}
          </div>
          <Button 
            className="mt-auto w-full" 
            onClick={() => setIsNewGoalSheetOpen(true)}
            disabled={addingGoal}
          >
            {addingGoal ? 'Adding...' : 'Set New Goal'}
          </Button>
        </CardContent>
      </Card>

      {/* Sheet for adding a new goal */}
      <Sheet open={isNewGoalSheetOpen} onOpenChange={setIsNewGoalSheetOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Set a New Financial Goal</SheetTitle>
            <SheetDescription>What are you saving for next? Give your goal a name and a target amount.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAddNewGoal} className="flex flex-1 flex-col justify-between p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="goal-name" className="mb-1 block text-sm font-medium text-slate-700">Goal Name</label>
                <Input
                  id="goal-name"
                  placeholder="e.g., New Laptop"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="goal-amount" className="mb-1 block text-sm font-medium text-slate-700">Target Amount</label>
                <div className="relative">
                   <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">$</span>
                   <Input
                      id="goal-amount"
                      type="number"
                      placeholder="e.g., 2500"
                      value={newGoalAmount}
                      onChange={(e) => setNewGoalAmount(e.target.value)}
                      required
                      min="1"
                      step="0.01"
                      className="pl-7"
                   />
                </div>
              </div>
              <div>
                <label htmlFor="goal-months" className="mb-1 block text-sm font-medium text-slate-700">Months to Achieve</label>
                <Input
                  id="goal-months"
                  type="number"
                  placeholder="e.g., 12"
                  value={newGoalMonths}
                  onChange={(e) => setNewGoalMonths(e.target.value)}
                  required
                  min="1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
               <Button type="button" variant="ghost" onClick={() => setIsNewGoalSheetOpen(false)} disabled={addingGoal}>Cancel</Button>
               <Button type="submit" disabled={addingGoal}>
                 {addingGoal ? 'Adding...' : 'Add Goal'}
               </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Sheet for adding savings to an existing goal */}
      <Sheet open={isAddSavingsSheetOpen} onOpenChange={setIsAddSavingsSheetOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Add to {selectedGoal?.title}</SheetTitle>
            <SheetDescription>Record a new contribution to this savings goal.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAddSavings} className="flex flex-1 flex-col justify-between p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="savings-amount" className="mb-1 block text-sm font-medium text-slate-700">Amount to Add</label>
                <div className="relative">
                   <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">$</span>
                   <Input
                      id="savings-amount"
                      type="number"
                      placeholder="e.g., 100"
                      value={savingsAmount}
                      onChange={(e) => setSavingsAmount(e.target.value)}
                      required
                      min="0.01"
                      step="0.01"
                      className="pl-7"
                      autoFocus
                   />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
               <Button type="button" variant="ghost" onClick={() => setIsAddSavingsSheetOpen(false)} disabled={updatingGoal}>Cancel</Button>
               <Button type="submit" disabled={updatingGoal}>
                 {updatingGoal ? 'Adding...' : 'Add Contribution'}
               </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}