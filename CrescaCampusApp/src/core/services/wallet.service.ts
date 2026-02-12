/**
 * Wallet Service
 * Handles account creation, storage, and signing
 */

import algosdk from 'algosdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  public generateAccount(): { address: string; mnemonic: string; secretKey: Uint8Array } {
    const account = algosdk.generateAccount();
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
    
    return {
      address: account.addr,
      mnemonic,
      secretKey: account.sk,
    };
  }

  /**
   * Recover account from mnemonic
   */
  public recoverFromMnemonic(mnemonic: string): { address: string; secretKey: Uint8Array } {
    const secretKey = algosdk.mnemonicToSecretKey(mnemonic);
    return {
      address: secretKey.addr,
      secretKey: secretKey.sk,
    };
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
  public async saveWallet(account: WalletAccount): Promise<void> {
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
   * Delete wallet from storage
   */
  public async deleteWallet(): Promise<void> {
    await AsyncStorage.removeItem(WALLET_STORAGE_KEY);
    this.currentAccount = null;
  }

  /**
   * Create and save a new wallet
   */
  public async createAndSaveWallet(): Promise<WalletAccount> {
    const { address, mnemonic } = this.generateAccount();
    
    const account: WalletAccount = {
      address,
      mnemonic,
      createdAt: new Date().toISOString(),
    };

    await this.saveWallet(account);
    return account;
  }

  /**
   * Import wallet from mnemonic and save
   */
  public async importWallet(mnemonic: string): Promise<WalletAccount> {
    const { address } = this.recoverFromMnemonic(mnemonic);
    
    const account: WalletAccount = {
      address,
      mnemonic,
      createdAt: new Date().toISOString(),
    };

    await this.saveWallet(account);
    return account;
  }
}

export const walletService = WalletService.getInstance();
export default WalletService;
