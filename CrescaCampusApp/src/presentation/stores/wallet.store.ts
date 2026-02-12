/**
 * Wallet Store (ViewModel)
 * Manages wallet state and operations
 */

import { create } from 'zustand';
import { walletService } from '../../core/services/wallet.service';
import { algorandClientService } from '../../core/services/algorand-client.service';
import { AccountInfo } from '../../domain/models';

interface WalletState {
  // State
  address: string | null;
  balance: number;
  balanceAlgo: number;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  accountInfo: AccountInfo | null;

  // Actions
  initialize: () => Promise<void>;
  createWallet: () => Promise<string>;
  importWallet: (mnemonic: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  getAccountInfo: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  address: null,
  balance: 0,
  balanceAlgo: 0,
  isLoading: false,
  error: null,
  isInitialized: false,
  accountInfo: null,

  // Initialize wallet from storage
  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const wallet = await walletService.loadWallet();
      if (wallet) {
        set({ address: wallet.address });
        await get().refreshBalance();
      }
      set({ isInitialized: true });
    } catch (error: any) {
      set({ error: error.message || 'Failed to initialize wallet' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Create new wallet
  createWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      const { account, mnemonic } = walletService.generateAccount();
      await walletService.saveWallet(account.addr, mnemonic);
      set({ address: account.addr });
      await get().refreshBalance();
      return mnemonic;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create wallet' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Import wallet from mnemonic
  importWallet: async (mnemonic: string) => {
    set({ isLoading: true, error: null });
    try {
      const account = walletService.recoverFromMnemonic(mnemonic);
      await walletService.saveWallet(account.addr, mnemonic);
      set({ address: account.addr });
      await get().refreshBalance();
    } catch (error: any) {
      set({ error: error.message || 'Failed to import wallet' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh balance
  refreshBalance: async () => {
    const { address } = get();
    if (!address) return;

    try {
      const balance = await algorandClientService.getBalance(address);
      set({ 
        balance, 
        balanceAlgo: balance / 1_000_000 
      });
    } catch (error: any) {
      console.error('Failed to refresh balance:', error);
    }
  },

  // Get full account info
  getAccountInfo: async () => {
    const { address } = get();
    if (!address) return;

    set({ isLoading: true });
    try {
      const info = await algorandClientService.getAccountInfo(address);
      if (info) {
        const accountInfo: AccountInfo = {
          address,
          balance: info.amount || 0,
          balanceAlgo: (info.amount || 0) / 1_000_000,
          minBalance: info['min-balance'] || 0,
          assets: (info.assets || []).map((a: any) => ({
            assetId: a['asset-id'],
            amount: a.amount,
            isFrozen: a['is-frozen'],
          })),
          appsOptedIn: (info['apps-local-state'] || []).map((a: any) => a.id),
        };
        set({ accountInfo, balance: accountInfo.balance, balanceAlgo: accountInfo.balanceAlgo });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to get account info' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Disconnect wallet
  disconnect: async () => {
    set({ isLoading: true });
    try {
      await walletService.clearWallet();
      set({ 
        address: null, 
        balance: 0, 
        balanceAlgo: 0, 
        accountInfo: null 
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to disconnect' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
