/**
 * DAO Treasury Store (ViewModel)
 * Manages DAO treasury state and multisig operations
 */

import { create } from 'zustand';
import { daoTreasuryRepository } from '../../data/repositories';
import { DAOTreasury, TreasuryProposal, TransactionResult } from '../../domain/models';

interface DAOTreasuryState {
  // State
  treasuryState: DAOTreasury | null;
  proposals: TreasuryProposal[];
  isSigner: boolean;
  hasOptedIn: boolean;
  isLoading: boolean;
  error: string | null;
  lastTransaction: TransactionResult | null;

  // Actions
  checkOptInStatus: (address: string) => Promise<void>;
  checkSignerStatus: (address: string) => Promise<void>;
  optIn: () => Promise<TransactionResult>;
  addSigner: (signerAddress: string) => Promise<TransactionResult>;
  createProposal: (recipient: string, amount: number, description: string) => Promise<TransactionResult>;
  approveProposal: (proposalId: number) => Promise<TransactionResult>;
  executeProposal: (proposalId: number) => Promise<TransactionResult>;
  deposit: (amount: number) => Promise<TransactionResult>;
  fetchTreasuryState: () => Promise<void>;
  fetchProposal: (proposalId: number) => Promise<TreasuryProposal | null>;
  getTreasuryBalance: () => Promise<number>;
  clearError: () => void;
}

export const useDAOTreasuryStore = create<DAOTreasuryState>((set, get) => ({
  // Initial state
  treasuryState: null,
  proposals: [],
  isSigner: false,
  hasOptedIn: false,
  isLoading: false,
  error: null,
  lastTransaction: null,

  // Check opt-in status
  checkOptInStatus: async (address: string) => {
    try {
      const hasOptedIn = await daoTreasuryRepository.hasOptedIn(address);
      set({ hasOptedIn });
    } catch (error: any) {
      console.error('Failed to check opt-in status:', error);
    }
  },

  // Check signer status
  checkSignerStatus: async (address: string) => {
    try {
      const isSigner = await daoTreasuryRepository.isSigner(address);
      set({ isSigner });
    } catch (error: any) {
      console.error('Failed to check signer status:', error);
    }
  },

  // Opt-in to the contract
  optIn: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await daoTreasuryRepository.optIn();
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

  // Add a signer
  addSigner: async (signerAddress: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await daoTreasuryRepository.addSigner(signerAddress);
      set({ lastTransaction: result });
      
      // Refresh state
      await get().fetchTreasuryState();
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to add signer';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a proposal
  createProposal: async (recipient: string, amount: number, description: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await daoTreasuryRepository.createProposal(recipient, amount, description);
      set({ lastTransaction: result });
      
      // Refresh state
      await get().fetchTreasuryState();
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to create proposal';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Approve a proposal
  approveProposal: async (proposalId: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await daoTreasuryRepository.approveProposal(proposalId);
      set({ lastTransaction: result });
      
      // Refresh proposal
      await get().fetchProposal(proposalId);
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to approve proposal';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Execute a proposal
  executeProposal: async (proposalId: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await daoTreasuryRepository.executeProposal(proposalId);
      set({ lastTransaction: result });
      
      // Refresh state
      await get().fetchTreasuryState();
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to execute proposal';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Deposit funds
  deposit: async (amount: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await daoTreasuryRepository.deposit(amount);
      set({ lastTransaction: result });
      
      // Refresh state
      await get().fetchTreasuryState();
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to deposit';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch treasury state
  fetchTreasuryState: async () => {
    set({ isLoading: true });
    try {
      const treasuryState = await daoTreasuryRepository.getTreasuryState();
      set({ treasuryState });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch treasury state' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch a specific proposal
  fetchProposal: async (proposalId: number) => {
    try {
      const proposal = await daoTreasuryRepository.getProposal(proposalId);
      if (proposal) {
        const { proposals } = get();
        const existingIndex = proposals.findIndex(p => p.id === proposalId);
        if (existingIndex >= 0) {
          proposals[existingIndex] = proposal;
        } else {
          proposals.push(proposal);
        }
        set({ proposals: [...proposals] });
      }
      return proposal;
    } catch (error: any) {
      console.error('Failed to fetch proposal:', error);
      return null;
    }
  },

  // Get treasury balance
  getTreasuryBalance: async () => {
    try {
      return await daoTreasuryRepository.getTreasuryBalance();
    } catch (error: any) {
      console.error('Failed to get treasury balance:', error);
      return 0;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
