# Supabase Database Migration Instructions

## Prerequisites
- Supabase project created (from task 1)
- Access to Supabase Dashboard SQL Editor

## Step 1: Execute Initial Schema Migration

1. Log in to your Supabase Dashboard at https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
6. Paste into the SQL Editor
7. Click **Run** to execute the migration
8. Verify success message appears

## Step 2: Execute Row Level Security Migration

1. In the SQL Editor, click **New Query**
2. Copy the entire contents of `supabase/migrations/002_row_level_security.sql`
3. Paste into the SQL Editor
4. Click **Run** to execute the migration
5. Verify success message appears

## Step 3: Verify Tables Created

1. Navigate to **Table Editor** in the left sidebar
2. Verify the following tables exist:
   - `profiles`
   - `spending_categories`
   - `transactions`
   - `financial_goals`
   - `chat_messages`

3. Click on each table to verify columns are correct

## Step 4: Verify Row Level Security Policies

1. Navigate to **Authentication** > **Policies** in the left sidebar
2. Verify RLS is enabled for all tables (should show green "Enabled" badge)
3. For each table, verify the policies exist:

### profiles
- ✓ Users can view own profile (SELECT)
- ✓ Users can update own profile (UPDATE)

### spending_categories
- ✓ Users can view own categories (SELECT)
- ✓ Users can insert own categories (INSERT)
- ✓ Users can update own categories (UPDATE)
- ✓ Users can delete own categories (DELETE)

### transactions
- ✓ Users can view own transactions (SELECT)
- ✓ Users can insert own transactions (INSERT)
- ✓ Users can delete own transactions (DELETE)

### financial_goals
- ✓ Users can view own goals (SELECT)
- ✓ Users can insert own goals (INSERT)
- ✓ Users can update own goals (UPDATE)
- ✓ Users can delete own goals (DELETE)

### chat_messages
- ✓ Users can view own messages (SELECT)
- ✓ Users can insert own messages (INSERT)

## Step 5: Verify Indexes

1. In SQL Editor, run the following query to verify indexes:

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
    AND tablename IN ('profiles', 'spending_categories', 'transactions', 'financial_goals', 'chat_messages')
ORDER BY 
    tablename, indexname;
```

2. Verify the following indexes exist:
   - `idx_spending_categories_user`
   - `idx_transactions_user_created`
   - `idx_financial_goals_user`
   - `idx_chat_messages_user_created`

## Troubleshooting

### If migration fails:
1. Check error message in SQL Editor
2. Verify you have proper permissions
3. Ensure no tables with same names already exist
4. Try running migrations one statement at a time

### To reset and start over:
```sql
-- WARNING: This will delete all data
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS financial_goals CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS spending_categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

Then re-run the migrations from Step 1.

## Next Steps

After successful migration:
- Proceed to task 3: Implement authentication service and hooks
- Update environment variables with Supabase credentials
