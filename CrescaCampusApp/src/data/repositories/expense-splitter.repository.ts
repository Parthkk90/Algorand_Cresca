/**
 * ExpenseSplitterRepository
 * Repository for interacting with the Expense Splitter smart contract
 * App ID: 755399831 (Testnet)
 */

import algosdk from 'algosdk';
import { algorandClientService } from '../../core/services/algorand-client.service';
import { walletService } from '../../core/services/wallet.service';
import { AlgorandConfig } from '../../core/config/algorand.config';
import { ExpenseSplit, ExpenseMember, TransactionResult } from '../../domain/models';

class ExpenseSplitterRepository {
  private readonly appId: number;
  private readonly client: algosdk.Algodv2;

  constructor() {
    this.appId = AlgorandConfig.contracts.expenseSplitter;
    this.client = algorandClientService.getAlgodClient();
  }

  /**
   * Opt-in to the Expense Splitter application
   * Required before participating in expense splitting
   */
  async optIn(): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    const secretKey = walletService.getSecretKeyFromMnemonic(wallet.mnemonic);
    
    const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
      sender: wallet.address,
      suggestedParams,
      appIndex: this.appId
    });

    const signedTxn = walletService.signTransaction(optInTxn, secretKey);
    const txId = await algorandClientService.sendTransaction(signedTxn);
    const confirmed = await algorandClientService.waitForConfirmation(txId);

    return {
      txId,
      confirmed: confirmed !== null,
      appId: this.appId,
    };
  }

  /**
   * Add an expense to be split among members
   * @param amount Amount in microAlgos
   * @param description Description of the expense
   */
  async addExpense(amount: number, description: string): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    const secretKey = walletService.getSecretKeyFromMnemonic(wallet.mnemonic);
    
    // Build application call with arguments
    const appArgs = [
      new TextEncoder().encode('add_expense'),
      algosdk.encodeUint64(amount),
      new TextEncoder().encode(description.slice(0, 32)), // Max 32 chars for description
    ];

    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: wallet.address,
      suggestedParams,
      appIndex: this.appId,
      appArgs,
      onComplete: algosdk.OnApplicationComplete.NoOpOC
    });

    const signedTxn = walletService.signTransaction(appCallTxn, secretKey);
    const txId = await algorandClientService.sendTransaction(signedTxn);
    const confirmed = await algorandClientService.waitForConfirmation(txId);

    return {
      txId,
      confirmed: confirmed !== null,
      appId: this.appId,
    };
  }

  /**
   * Mark expenses as settled
   * Only the creator can call this
   */
  async markSettled(): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    const secretKey = walletService.getSecretKeyFromMnemonic(wallet.mnemonic);
    
    const appArgs = [
      new TextEncoder().encode('mark_settled'),
    ];

    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: wallet.address,
      suggestedParams,
      appIndex: this.appId,
      appArgs,
      onComplete: algosdk.OnApplicationComplete.NoOpOC
    });

    const signedTxn = walletService.signTransaction(appCallTxn, secretKey);
    const txId = await algorandClientService.sendTransaction(signedTxn);
    const confirmed = await algorandClientService.waitForConfirmation(txId);

    return {
      txId,
      confirmed: confirmed !== null,
      appId: this.appId,
    };
  }

  /**
   * Get the global state of the Expense Splitter contract
   */
  async getExpenseSplitState(): Promise<ExpenseSplit | null> {
    try {
      const globalState = await algorandClientService.getAppGlobalState(this.appId);
      
      if (!globalState) return null;

      return {
        appId: this.appId,
        creator: globalState.get('creator')?.toString() || '',
        memberCount: Number(globalState.get('member_count') || 0),
        expenseCount: Number(globalState.get('expense_count') || 0),
        isSettled: Boolean(globalState.get('is_settled')),
        totalPool: Number(globalState.get('total_pool') || 0),
      };
    } catch (error) {
      console.error('Failed to get expense split state:', error);
      return null;
    }
  }

  /**
   * Get the local state for a member
   * @param address The member's address
   */
  async getMemberState(address: string): Promise<ExpenseMember | null> {
    try {
      const localState = await algorandClientService.getAppLocalState(this.appId, address);
      
      if (!localState || localState.size === 0) {
        return {
          address,
          netBalance: 0,
          isOwed: false,
          hasOptedIn: false,
        };
      }

      const netBalance = Number(localState.get('net_balance') || 0);
      const balanceSign = Number(localState.get('balance_sign') || 0);
      
      return {
        address,
        netBalance: balanceSign === 1 ? -netBalance : netBalance,
        isOwed: balanceSign === 0 && netBalance > 0,
        hasOptedIn: true,
      };
    } catch {
      return {
        address,
        netBalance: 0,
        isOwed: false,
        hasOptedIn: false,
      };
    }
  }

  /**
   * Check if an address has opted into the contract
   * @param address The address to check
   */
  async hasOptedIn(address: string): Promise<boolean> {
    return algorandClientService.isOptedIntoApp(address, this.appId);
  }

  /**
   * Get the application address (escrow)
   */
  getAppAddress(): string {
    return algosdk.getApplicationAddress(this.appId).toString();
  }

  /**
   * Get the app balance (escrow balance)
   */
  async getAppBalance(): Promise<number> {
    const appAddress = this.getAppAddress();
    return algorandClientService.getBalance(appAddress);
  }
}

export const expenseSplitterRepository = new ExpenseSplitterRepository();
