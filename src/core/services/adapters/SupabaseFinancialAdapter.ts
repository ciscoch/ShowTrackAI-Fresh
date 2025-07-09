/**
 * Supabase Financial Adapter for ShowTrackAI
 * Manages financial data (expenses, income, budgets) using Supabase backend
 */

import { getSupabaseClient, getCurrentUser, uploadFile, getFileUrl, STORAGE_BUCKETS } from '../../../../backend/api/clients/supabase';
import { IFinancialService } from '../interfaces/ServiceInterfaces';
import { Expense, CreateExpenseRequest } from '../../models/Expense';
import { Income, CreateIncomeRequest } from '../../models/Income';
import { FinancialEntry, Budget } from '../../models/Financial';

export class SupabaseFinancialAdapter implements IFinancialService {
  private supabase = getSupabaseClient();

  // Map database fields to frontend expense model
  private mapDbToExpense(dbExpense: any): Expense {
    const metadata = dbExpense.metadata || {};
    return {
      id: dbExpense.id,
      description: dbExpense.description,
      amount: parseFloat(dbExpense.amount),
      date: new Date(dbExpense.expense_date),
      category: dbExpense.category,
      subcategory: dbExpense.subcategory,
      paymentMethod: metadata.payment_method || 'Cash',
      vendor: dbExpense.vendor,
      receiptPhoto: dbExpense.receipt_url,
      isDeductible: dbExpense.tax_deductible || false,
      scheduleFLineItem: metadata.schedule_f_line,
      aetCategory: metadata.aet_category,
      animalId: dbExpense.animal_id,
      projectPhase: metadata.project_phase,
      location: metadata.location,
      notes: metadata.notes,
      createdAt: new Date(dbExpense.created_at),
      updatedAt: new Date(dbExpense.updated_at || dbExpense.created_at),
    };
  }

  // Map frontend expense model to database fields
  private mapExpenseToDb(expense: Partial<Expense>): any {
    const dbExpense: any = {};
    const metadata: any = {};
    
    // Map main fields
    if (expense.description !== undefined) dbExpense.description = expense.description;
    if (expense.amount !== undefined) dbExpense.amount = expense.amount;
    if (expense.date !== undefined) dbExpense.expense_date = expense.date.toISOString().split('T')[0];
    if (expense.category !== undefined) dbExpense.category = expense.category;
    if (expense.subcategory !== undefined) dbExpense.subcategory = expense.subcategory;
    if (expense.vendor !== undefined) dbExpense.vendor = expense.vendor;
    if (expense.receiptPhoto !== undefined) dbExpense.receipt_url = expense.receiptPhoto;
    if (expense.isDeductible !== undefined) dbExpense.tax_deductible = expense.isDeductible;
    if (expense.animalId !== undefined) dbExpense.animal_id = expense.animalId;
    
    // Map metadata fields
    if (expense.paymentMethod !== undefined) metadata.payment_method = expense.paymentMethod;
    if (expense.scheduleFLineItem !== undefined) metadata.schedule_f_line = expense.scheduleFLineItem;
    if (expense.aetCategory !== undefined) metadata.aet_category = expense.aetCategory;
    if (expense.projectPhase !== undefined) metadata.project_phase = expense.projectPhase;
    if (expense.location !== undefined) metadata.location = expense.location;
    if (expense.notes !== undefined) metadata.notes = expense.notes;
    
    // Add metadata to database object if not empty
    if (Object.keys(metadata).length > 0) {
      dbExpense.metadata = metadata;
    }
    
    return dbExpense;
  }

  // Map database fields to frontend income model
  private mapDbToIncome(dbIncome: any): Income {
    const metadata = dbIncome.metadata || {};
    return {
      id: dbIncome.id,
      description: dbIncome.description,
      amount: parseFloat(dbIncome.amount),
      date: new Date(dbIncome.income_date),
      category: metadata.category || 'Other',
      subcategory: metadata.subcategory,
      source: dbIncome.source,
      paymentMethod: metadata.payment_method || 'Cash',
      animalId: dbIncome.animal_id,
      projectPhase: metadata.project_phase,
      notes: metadata.notes,
      createdAt: new Date(dbIncome.created_at),
      updatedAt: new Date(dbIncome.updated_at || dbIncome.created_at),
    };
  }

  // Map frontend income model to database fields
  private mapIncomeToDb(income: Partial<Income>): any {
    const dbIncome: any = {};
    const metadata: any = {};
    
    // Map main fields
    if (income.description !== undefined) dbIncome.description = income.description;
    if (income.amount !== undefined) dbIncome.amount = income.amount;
    if (income.date !== undefined) dbIncome.income_date = income.date.toISOString().split('T')[0];
    if (income.source !== undefined) dbIncome.source = income.source;
    if (income.animalId !== undefined) dbIncome.animal_id = income.animalId;
    
    // Map metadata fields
    if (income.category !== undefined) metadata.category = income.category;
    if (income.subcategory !== undefined) metadata.subcategory = income.subcategory;
    if (income.paymentMethod !== undefined) metadata.payment_method = income.paymentMethod;
    if (income.projectPhase !== undefined) metadata.project_phase = income.projectPhase;
    if (income.notes !== undefined) metadata.notes = income.notes;
    
    // Add metadata to database object if not empty
    if (Object.keys(metadata).length > 0) {
      dbIncome.metadata = metadata;
    }
    
    return dbIncome;
  }

  // Map database fields to frontend budget model
  private mapDbToBudget(dbBudget: any): Budget {
    return {
      id: dbBudget.id,
      name: dbBudget.name,
      period: dbBudget.metadata?.period || 'monthly',
      startDate: new Date(dbBudget.period_start),
      endDate: new Date(dbBudget.period_end),
      categories: dbBudget.categories || [],
      notes: dbBudget.metadata?.notes,
      userId: dbBudget.user_id,
    };
  }

  // Map frontend budget model to database fields
  private mapBudgetToDb(budget: Partial<Budget>): any {
    const dbBudget: any = {};
    const metadata: any = {};
    
    if (budget.name !== undefined) dbBudget.name = budget.name;
    if (budget.startDate !== undefined) dbBudget.period_start = budget.startDate.toISOString().split('T')[0];
    if (budget.endDate !== undefined) dbBudget.period_end = budget.endDate.toISOString().split('T')[0];
    if (budget.categories !== undefined) dbBudget.categories = budget.categories;
    
    // Map metadata fields
    if (budget.period !== undefined) metadata.period = budget.period;
    if (budget.notes !== undefined) metadata.notes = budget.notes;
    
    // Add metadata to database object if not empty
    if (Object.keys(metadata).length > 0) {
      dbBudget.metadata = metadata;
    }
    
    return dbBudget;
  }

  // EXPENSE OPERATIONS
  async getExpenses(filters?: any): Promise<Expense[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 SupabaseFinancialAdapter: Fetching expenses for user:', user.id);

      let query = this.supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      // Apply filters if provided
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.animalId) {
        query = query.eq('animal_id', filters.animalId);
      }
      if (filters?.startDate && filters?.endDate) {
        query = query.gte('expense_date', filters.startDate).lte('expense_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }

      console.log(' SupabaseFinancialAdapter: Fetched', data?.length || 0, 'expenses');
      return data?.map(expense => this.mapDbToExpense(expense)) || [];
    } catch (error) {
      console.error('Failed to get expenses:', error);
      throw error;
    }
  }

  async addExpense(expense: CreateExpenseRequest): Promise<Expense> {
    try {
      console.log('🔍 SupabaseFinancialAdapter: Adding expense');
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbExpense = this.mapExpenseToDb({
        ...expense,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Add user_id to the expense
      dbExpense.user_id = user.id;

      console.log('📝 Mapped expense data for database:', JSON.stringify(dbExpense, null, 2));

      const { data, error } = await this.supabase
        .from('expenses')
        .insert([dbExpense])
        .select()
        .single();

      if (error) {
        console.error('L Supabase insert error:', error);
        throw error;
      }

      console.log(' Expense created successfully in Supabase:', data);
      return this.mapDbToExpense(data);
    } catch (error) {
      console.error('L Failed to create expense:', error);
      throw error;
    }
  }

  /**
   * Enhanced method to save expense with business intelligence data
   * Separates user-facing data from internal business intelligence
   */
  async addExpenseWithIntelligence(
    expense: CreateExpenseRequest, 
    businessIntelligence?: BusinessIntelligenceData,
    vendorIntelligence?: VendorIntelligenceData
  ): Promise<Expense> {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const dbExpense = this.mapExpenseToDb({
        ...expense,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add user ID
      dbExpense.user_id = user.id;

      // Add business intelligence data (internal only)
      if (businessIntelligence) {
        dbExpense.business_intelligence = businessIntelligence;
        console.log('💡 Adding business intelligence data:', businessIntelligence);
      }

      if (vendorIntelligence) {
        dbExpense.vendor_intelligence = vendorIntelligence;
        console.log('🏪 Adding vendor intelligence data:', vendorIntelligence);
      }

      console.log('📝 Enhanced expense data for database:', JSON.stringify(dbExpense, null, 2));

      const { data, error } = await this.supabase
        .from('expenses')
        .insert([dbExpense])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error (enhanced):', error);
        throw error;
      }

      console.log('✅ Enhanced expense created successfully in Supabase:', data);

      // Return user-facing expense data only (privacy-safe)
      return this.mapDbToExpense(data);
    } catch (error) {
      console.error('❌ Failed to create enhanced expense:', error);
      throw error;
    }
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbUpdates = this.mapExpenseToDb(updates);
      
      console.log('Updating expense with data:', dbUpdates);

      const { data, error } = await this.supabase
        .from('expenses')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating expense:', error);
        throw error;
      }

      console.log('Expense updated successfully:', data);
      return this.mapDbToExpense(data);
    } catch (error) {
      console.error('Failed to update expense:', error);
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Deleting expense:', id);

      const { error } = await this.supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting expense:', error);
        throw error;
      }

      console.log('Expense deleted successfully');
    } catch (error) {
      console.error('Failed to delete expense:', error);
      throw error;
    }
  }

  // INCOME OPERATIONS
  async getIncome(filters?: any): Promise<Income[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 SupabaseFinancialAdapter: Fetching income for user:', user.id);

      let query = this.supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .order('income_date', { ascending: false });

      // Apply filters if provided
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.animalId) {
        query = query.eq('animal_id', filters.animalId);
      }
      if (filters?.startDate && filters?.endDate) {
        query = query.gte('income_date', filters.startDate).lte('income_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching income:', error);
        throw error;
      }

      console.log(' SupabaseFinancialAdapter: Fetched', data?.length || 0, 'income entries');
      return data?.map(income => this.mapDbToIncome(income)) || [];
    } catch (error) {
      console.error('Failed to get income:', error);
      throw error;
    }
  }

  async addIncome(income: CreateIncomeRequest): Promise<Income> {
    try {
      console.log('🔍 SupabaseFinancialAdapter: Adding income');
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbIncome = this.mapIncomeToDb({
        ...income,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Add user_id to the income
      dbIncome.user_id = user.id;

      console.log('📝 Mapped income data for database:', JSON.stringify(dbIncome, null, 2));

      const { data, error } = await this.supabase
        .from('income')
        .insert([dbIncome])
        .select()
        .single();

      if (error) {
        console.error('L Supabase insert error:', error);
        throw error;
      }

      console.log(' Income created successfully in Supabase:', data);
      return this.mapDbToIncome(data);
    } catch (error) {
      console.error('L Failed to create income:', error);
      throw error;
    }
  }

  // BUDGET OPERATIONS
  async getBudgets(): Promise<Budget[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 SupabaseFinancialAdapter: Fetching budgets for user:', user.id);

      const { data, error } = await this.supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching budgets:', error);
        throw error;
      }

      console.log(' SupabaseFinancialAdapter: Fetched', data?.length || 0, 'budgets');
      return data?.map(budget => this.mapDbToBudget(budget)) || [];
    } catch (error) {
      console.error('Failed to get budgets:', error);
      throw error;
    }
  }

  async createBudget(budget: Omit<Budget, 'id' | 'userId'>): Promise<Budget> {
    try {
      console.log('🔍 SupabaseFinancialAdapter: Creating budget');
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbBudget = this.mapBudgetToDb(budget);
      
      // Add user_id to the budget
      dbBudget.user_id = user.id;

      console.log('📝 Mapped budget data for database:', JSON.stringify(dbBudget, null, 2));

      const { data, error } = await this.supabase
        .from('budgets')
        .insert([dbBudget])
        .select()
        .single();

      if (error) {
        console.error('L Supabase insert error:', error);
        throw error;
      }

      console.log(' Budget created successfully in Supabase:', data);
      return this.mapDbToBudget(data);
    } catch (error) {
      console.error('L Failed to create budget:', error);
      throw error;
    }
  }

  // RECEIPT PHOTO OPERATIONS
  async uploadReceiptPhoto(photo: any): Promise<string> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('📸 SupabaseFinancialAdapter: Uploading receipt photo');
      
      // Generate unique filename
      const filename = `receipt_${user.id}_${Date.now()}.jpg`;
      
      // Upload photo to Supabase storage
      const result = await uploadFile('RECEIPTS', filename, photo);
      
      // Get the public URL
      const photoUrl = getFileUrl('RECEIPTS', filename);
      
      console.log('✅ Receipt photo uploaded successfully:', photoUrl);
      return photoUrl;
    } catch (error) {
      console.error('Failed to upload receipt photo:', error);
      throw error;
    }
  }

  // ANALYTICS OPERATIONS
  async getFinancialSummary(filters?: any): Promise<any> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('📊 SupabaseFinancialAdapter: Generating financial summary');

      // Get expenses and income in parallel
      const [expenses, income] = await Promise.all([
        this.getExpenses(filters),
        this.getIncome(filters)
      ]);

      // Calculate totals
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalIncome = income.reduce((sum, incomeItem) => sum + incomeItem.amount, 0);
      const netProfit = totalIncome - totalExpenses;

      // Category breakdowns
      const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      const incomeByCategory = income.reduce((acc, incomeItem) => {
        acc[incomeItem.category] = (acc[incomeItem.category] || 0) + incomeItem.amount;
        return acc;
      }, {} as Record<string, number>);

      const summary = {
        totalExpenses,
        totalIncome,
        netProfit,
        expensesByCategory,
        incomeByCategory,
        expenseCount: expenses.length,
        incomeCount: income.length,
        profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
      };

      console.log(' Financial summary generated:', summary);
      return summary;
    } catch (error) {
      console.error('Failed to generate financial summary:', error);
      throw error;
    }
  }
}