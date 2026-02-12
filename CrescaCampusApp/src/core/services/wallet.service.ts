/**
 * Wallet Service
 * Handles account creation, storage, and signing
 */

import algosdk from 'algosdk';

// Simple in-memory storage for development (replace with AsyncStorage in production)
const storage: Map<string, string> = new Map();
const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => storage.get(key) || null,
  setItem: async (key: string, value: string): Promise<void> => { storage.set(key, value); },
  removeItem: async (key: string): Promise<void> => { storage.delete(key); },
};

const WALLET_STORAGE_KEY = '@cresca_wallet';

export interface WalletAccount {
  address: string;
  mnemonic: string;
  createdAt: string;
}

class WalletService {
  private static instance: WalletService;
  private currentAccount: WalletAccount | null = null;

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Generate a new Algorand account
   */
  public generateAccount(): { account: algosdk.Account; mnemonic: string } {
    const account = algosdk.generateAccount();
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
    
    return {
      account,
      mnemonic,
    };
  }

  /**
   * Recover account from mnemonic
   */
  public recoverFromMnemonic(mnemonic: string): algosdk.Account {
    return algosdk.mnemonicToSecretKey(mnemonic);
  }

  /**
   * Get secret key from mnemonic (for signing)
   */
  public getSecretKeyFromMnemonic(mnemonic: string): Uint8Array {
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    return account.sk;
  }

  /**
   * Sign a transaction
   */
  public signTransaction(txn: algosdk.Transaction, secretKey: Uint8Array): Uint8Array {
    return txn.signTxn(secretKey);
  }

  /**
   * Sign multiple transactions (atomic group)
   */
  public signTransactions(
    txns: algosdk.Transaction[],
    secretKey: Uint8Array
  ): Uint8Array[] {
    return txns.map((txn) => txn.signTxn(secretKey));
  }

  /**
   * Save wallet to secure storage
   */
  public async saveWallet(address: string, mnemonic: string): Promise<void> {
    const account: WalletAccount = {
      address,
      mnemonic,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(account));
    this.currentAccount = account;
  }

  /**
   * Load wallet from secure storage
   */
  public async loadWallet(): Promise<WalletAccount | null> {
    const stored = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
    if (stored) {
      this.currentAccount = JSON.parse(stored);
      return this.currentAccount;
    }
    return null;
  }

  /**
   * Get current wallet account
   */
  public getCurrentAccount(): WalletAccount | null {
    return this.currentAccount;
  }

  /**
   * Check if wallet exists
   */
  public async hasWallet(): Promise<boolean> {
    const wallet = await this.loadWallet();
    return wallet !== null;
  }

  /**
   * Delete/clear wallet from storage
   */
  public async clearWallet(): Promise<void> {
    await AsyncStorage.removeItem(WALLET_STORAGE_KEY);
    this.currentAccount = null;
  }

  /**
   * Create and save a new wallet
   */
  public async createAndSaveWallet(): Promise<{ account: WalletAccount; mnemonic: string }> {
    const { account, mnemonic } = this.generateAccount();
    const address = account.addr.toString();
    
    const walletAccount: WalletAccount = {
      address,
      mnemonic,
      createdAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletAccount));
    this.currentAccount = walletAccount;
    
    return { account: walletAccount, mnemonic };
  }

  /**
   * Import wallet from mnemonic and save
   */
  public async importWallet(mnemonic: string): Promise<WalletAccount> {
    const account = this.recoverFromMnemonic(mnemonic);
    const address = account.addr.toString();
    
    const walletAccount: WalletAccount = {
      address,
      mnemonic,
      createdAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletAccount));
    this.currentAccount = walletAccount;
    
    return walletAccount;
  }
}

export const walletService = WalletService.getInstance();
export default WalletService;
