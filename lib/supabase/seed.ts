import { supabase } from './client'
import { logDatabaseError } from './errors'

/**
 * Default spending categories based on the 50/30/20 budgeting rule
 * These will be created for new users upon signup
 */
export const DEFAULT_CATEGORIES = [
  { name: 'Housing', budget: 1500, color: '#0ea5e9' },
  { name: 'Food', budget: 600, color: '#22c55e' },
  { name: 'Transportation', budget: 350, color: '#f97316' },
  { name: 'Debt Payments', budget: 400, color: '#f43f5e' },
  { name: 'Entertainment', budget: 150, color: '#84cc16' },
  { name: 'Utilities', budget: 220, color: '#6366f1' },
  { name: 'Savings & Investments', budget: 300, color: '#eab308' },
  { name: 'Healthcare', budget: 200, color: '#a855f7' },
  { name: 'Personal', budget: 150, color: '#14b8a6' },
  { name: 'Insurance', budget: 120, color: '#ec4899' },
]

/**
 * Sample transactions to help new users understand the app
 */
export const SAMPLE_TRANSACTIONS = [
  { description: 'Monthly Rent', amount: 1200, category_name: 'Housing' },
  { description: 'Trader Joe\'s', amount: 85.50, category_name: 'Food' },
  { description: 'Gas Fill-up', amount: 45.25, category_name: 'Transportation' },
  { description: 'Movie Night', amount: 35.00, category_name: 'Entertainment' },
]

/**
 * Seeds initial data for a new user
 * Creates default spending categories and sample transactions
 * 
 * @param userId - The authenticated user's ID
 * @returns Promise that resolves when seeding is complete
 * @throws Error if seeding fails
 */
export async function seedUserData(userId: string): Promise<void> {
  try {
    // Check if user already has data
    const { data: existingCategories, error: checkError } = await supabase
      .from('spending_categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (checkError) {
      logDatabaseError(checkError, 'check existing categories for seeding', 'spending_category', undefined, userId)
      throw new Error(`Failed to check existing data: ${checkError.message}`)
    }

    // If user already has categories, skip seeding
    if (existingCategories && existingCategories.length > 0) {
      console.log('User already has data, skipping seeding')
      return
    }

    // Insert default categories
    const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
      user_id: userId,
      name: cat.name,
      budget: cat.budget,
      color: cat.color,
      value: 0, // Start with zero actual spending
    }))

    const { data: insertedCategories, error: categoryError } = await supabase
      .from('spending_categories')
      .insert(categoriesToInsert)
      .select()

    if (categoryError) {
      logDatabaseError(categoryError, 'insert default categories', 'spending_category', undefined, userId)
      throw new Error(`Failed to create default categories: ${categoryError.message}`)
    }

    if (!insertedCategories || insertedCategories.length === 0) {
      console.warn('No categories were inserted')
      return
    }

    // Create a map of category names to IDs for transaction insertion
    const categoryMap = new Map<string, string>(
      insertedCategories.map((cat: any) => [cat.name, cat.id])
    )

    // Insert sample transactions
    const transactionsToInsert = SAMPLE_TRANSACTIONS.map(tx => ({
      user_id: userId,
      description: tx.description,
      amount: tx.amount,
      category_name: tx.category_name,
      category_id: categoryMap.get(tx.category_name) || null,
    }))

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)

    if (transactionError) {
      logDatabaseError(transactionError, 'insert sample transactions', 'transaction', undefined, userId)
      // Don't throw here - categories are more important than sample transactions
      console.warn('Failed to create sample transactions, but categories were created successfully')
      return
    }

    // Update category values based on sample transactions
    for (const tx of SAMPLE_TRANSACTIONS) {
      const categoryId = categoryMap.get(tx.category_name)
      if (categoryId) {
        const { error: updateError } = await supabase
          .from('spending_categories')
          .update({ value: tx.amount })
          .eq('id', categoryId)
          .eq('user_id', userId)

        if (updateError) {
          logDatabaseError(
            updateError, 
            'update category value during seeding', 
            'spending_category', 
            categoryId, 
            userId,
            { categoryName: tx.category_name, amount: tx.amount }
          )
        }
      }
    }

    console.log('User data seeded successfully')
  } catch (error) {
    logDatabaseError(error, 'seed user data', 'user_data', undefined, userId, { unexpected: true })
    throw error
  }
}
