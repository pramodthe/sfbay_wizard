# Optimistic Updates Implementation

This document describes the optimistic updates and loading states implementation for the FinSmart application.

## Overview

Optimistic updates provide immediate UI feedback to users by updating the interface before the server confirms the operation. If the operation fails, the UI automatically rolls back to the previous state.

## Implementation Details

### 1. Skeleton Loaders

Created a reusable `Skeleton` component in `components/ui/Skeleton.tsx` with the following features:
- Multiple variants: text, circular, rectangular
- Animation options: pulse, wave, none
- Preset components: SkeletonText, SkeletonCard, SkeletonAvatar

#### Usage Example:
```tsx
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

// Simple skeleton
<Skeleton width={100} height={20} />

// Text skeleton with multiple lines
<SkeletonText lines={3} />
```

### 2. Optimistic Updates for Categories

**Hook**: `useUpdateCategory` in `hooks/useCategories.ts`

**Features**:
- Accepts optional `onOptimisticUpdate` and `onRollback` callbacks
- Applies optimistic update immediately
- Rolls back on error

**Usage Example**:
```tsx
const handleOptimisticUpdate = (id: string, updates: Partial<SpendingCategory>) => {
  setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
};

const handleRollback = (id: string, previousData: Partial<SpendingCategory>) => {
  setCategories(prev => prev.map(c => c.id === id ? { ...c, ...previousData } : c));
};

const { updateCategoryMutation } = useUpdateCategory(handleOptimisticUpdate, handleRollback);
```

### 3. Optimistic Updates for Transactions

**Hook**: `useAddTransaction` in `hooks/useTransactions.ts`

**Features**:
- Creates temporary transaction with `temp-${Date.now()}` ID
- Adds transaction to UI immediately
- Removes temporary transaction on error
- Real-time subscription replaces temporary with persisted transaction

**Implementation in AppContext**:
```tsx
const [optimisticTransactions, setOptimisticTransactions] = useState<Transaction[]>([]);

const handleOptimisticAdd = (transaction: Transaction) => {
  setOptimisticTransactions(prev => [transaction, ...prev]);
};

const handleRollback = (transactionId: string) => {
  setOptimisticTransactions(prev => prev.filter(t => t.id !== transactionId));
};

const { addTransaction } = useAddTransaction(handleOptimisticAdd, handleRollback);
```

### 4. Optimistic Updates for Goals

**Hook**: `useUpdateGoal` in `hooks/useGoals.ts`

**Features**:
- Supports both goal updates and contribution additions
- Applies optimistic update immediately
- Rolls back on error with proper amount calculation

**Implementation in Goals Component**:
```tsx
const [optimisticGoals, setOptimisticGoals] = useState<FinancialGoal[]>([]);

const handleOptimisticUpdate = (goalId: string, updates: Partial<FinancialGoal>) => {
  setOptimisticGoals(prev => {
    const existing = prev.find(g => g.id === goalId);
    if (existing) {
      return prev.map(g => g.id === goalId ? { ...g, ...updates } : g);
    }
    const dbGoal = dbGoals.find(g => g.id === goalId);
    if (dbGoal) {
      return [...prev, { ...dbGoal, ...updates }];
    }
    return prev;
  });
};

const handleRollback = (goalId: string, previousData: Partial<FinancialGoal>) => {
  // Rollback logic with proper amount calculation
};

const { addContributionMutation } = useUpdateGoal(handleOptimisticUpdate, handleRollback);
```

### 5. Loading States

#### SummaryCards Component
- Shows skeleton loaders while data is loading
- Displays error cards if data fetch fails
- Gracefully handles empty states

#### BalanceCard Component
- Shows spinner with loading message
- Displays error state with retry option
- Renders chart only when data is ready

#### SpendingBreakdown Component
- Shows skeleton loaders for category items
- Displays error message if data fetch fails
- Handles empty state

#### Goals Component
- Shows "Loading goals..." message
- Displays error messages for add/update operations
- Shows empty state with helpful message

#### RecordExpense Component
- Shows loading spinner during AI processing
- Displays loading spinner during transaction save
- Shows error messages for both AI and save operations

## Testing Optimistic Updates

### Manual Testing Steps

1. **Test Transaction Optimistic Add**:
   - Open the RecordExpense component
   - Add a new expense
   - Observe the transaction appears immediately in the list
   - If successful, the temporary transaction is replaced with the real one
   - If failed, the transaction is removed and error is shown

2. **Test Goal Contribution Optimistic Update**:
   - Open the Goals component
   - Click the "+" button on a goal
   - Add a contribution amount
   - Observe the progress bar updates immediately
   - If successful, the update persists
   - If failed, the progress bar reverts to previous state

3. **Test Category Budget Optimistic Update**:
   - Update a category budget
   - Observe the UI updates immediately
   - If successful, the update persists
   - If failed, the UI reverts to previous state

### Testing Loading States

1. **Test Skeleton Loaders**:
   - Clear browser cache and reload
   - Observe skeleton loaders appear while data is loading
   - Verify smooth transition from skeleton to actual content

2. **Test Error States**:
   - Disconnect from internet
   - Try to perform operations
   - Verify error messages are displayed
   - Verify UI doesn't break

## Benefits

1. **Improved User Experience**: Users see immediate feedback without waiting for server response
2. **Perceived Performance**: Application feels faster and more responsive
3. **Error Handling**: Automatic rollback on errors prevents inconsistent state
4. **Loading States**: Clear visual feedback during data fetching
5. **Graceful Degradation**: Application handles errors and empty states elegantly

## Architecture Decisions

1. **Callback Pattern**: Used optional callbacks for optimistic updates to maintain flexibility
2. **Temporary IDs**: Used `temp-${Date.now()}` for temporary transactions to avoid ID conflicts
3. **Merge Strategy**: Merged optimistic and real data to prevent duplicates
4. **Cleanup**: Automatic cleanup of optimistic data after successful operations
5. **Skeleton Components**: Created reusable skeleton components for consistency

## Future Enhancements

1. Add optimistic delete for transactions
2. Add optimistic updates for category creation
3. Implement offline queue for operations
4. Add retry logic for failed operations
5. Implement undo/redo functionality
