/**
 * Expense Splitter Store (ViewModel)
 * Manages expense splitting state and operations
 */

import { create } from 'zustand';
import { expenseSplitterRepository } from '../../data/repositories';
import { ExpenseSplit, ExpenseMember, TransactionResult } from '../../domain/models';

interface ExpenseSplitterState {
  // State
  splitState: ExpenseSplit | null;
  memberState: ExpenseMember | null;
  hasOptedIn: boolean;
  isLoading: boolean;
  error: string | null;
  lastTransaction: TransactionResult | null;

  // Actions
  checkOptInStatus: (address: string) => Promise<void>;
  optIn: () => Promise<TransactionResult>;
  addExpense: (amount: number, description: string) => Promise<TransactionResult>;
  markSettled: () => Promise<TransactionResult>;
  fetchSplitState: () => Promise<void>;
  fetchMemberState: (address: string) => Promise<void>;
  getAppBalance: () => Promise<number>;
  clearError: () => void;
}

export const useExpenseSplitterStore = create<ExpenseSplitterState>((set, get) => ({
  // Initial state
  splitState: null,
  memberState: null,
  hasOptedIn: false,
  isLoading: false,
  error: null,
  lastTransaction: null,

  // Check if user has opted in
  checkOptInStatus: async (address: string) => {
    try {
      const hasOptedIn = await expenseSplitterRepository.hasOptedIn(address);
      set({ hasOptedIn });
    } catch (error: any) {
      console.error('Failed to check opt-in status:', error);
    }
  },

  // Opt-in to the contract
  optIn: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await expenseSplitterRepository.optIn();
      set({ 
        lastTransaction: result, 
        hasOptedIn: result.confirmed 
      });
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to opt-in';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Add an expense
  addExpense: async (amount: number, description: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await expenseSplitterRepository.addExpense(amount, description);
      set({ lastTransaction: result });
      
      // Refresh state after adding expense
      await get().fetchSplitState();
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to add expense';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Mark expenses as settled
  markSettled: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await expenseSplitterRepository.markSettled();
      set({ lastTransaction: result });
      
      // Refresh state
      await get().fetchSplitState();
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to mark settled';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch global split state
  fetchSplitState: async () => {
    set({ isLoading: true });
    try {
      const splitState = await expenseSplitterRepository.getExpenseSplitState();
      set({ splitState });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch split state' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch member-specific state
  fetchMemberState: async (address: string) => {
    try {
      const memberState = await expenseSplitterRepository.getMemberState(address);
      set({ memberState });
    } catch (error: any) {
      console.error('Failed to fetch member state:', error);
    }
  },

  // Get app balance
  getAppBalance: async () => {
    try {
      return await expenseSplitterRepository.getAppBalance();
    } catch (error: any) {
      console.error('Failed to get app balance:', error);
      return 0;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
