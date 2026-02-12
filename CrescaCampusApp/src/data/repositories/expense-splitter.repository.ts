/**
 * ExpenseSplitterRepository
 * Repository for interacting with the Expense Splitter smart contract
 * App ID: 755399831 (Testnet)
 */

import algosdk from 'algosdk';
import { algorandClientService } from '../../core/services/algorand-client.service';
import { walletService } from '../../core/services/wallet.service';
import { ALGORAND_CONFIG } from '../../core/config/algorand.config';
import { ExpenseSplit, ExpenseMember, TransactionResult } from '../../domain/models';

class ExpenseSplitterRepository {
  private readonly appId: number;
  private readonly client: algosdk.Algodv2;

  constructor() {
    this.appId = ALGORAND_CONFIG.contracts.expenseSplitter;
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
    
    const optInTxn = algosdk.makeApplicationOptInTxn(
      wallet.address,
      suggestedParams,
      this.appId
    );

    const signedTxn = await walletService.signTransaction(optInTxn);
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
    
    // Build application call with arguments
    const appArgs = [
      new TextEncoder().encode('add_expense'),
      algosdk.encodeUint64(amount),
      new TextEncoder().encode(description.slice(0, 32)), // Max 32 chars for description
    ];

    const appCallTxn = algosdk.makeApplicationNoOpTxn(
      wallet.address,
      suggestedParams,
      this.appId,
      appArgs
    );

    const signedTxn = await walletService.signTransaction(appCallTxn);
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
    
    const appArgs = [
      new TextEncoder().encode('mark_settled'),
    ];

    const appCallTxn = algosdk.makeApplicationNoOpTxn(
      wallet.address,
      suggestedParams,
      this.appId,
      appArgs
    );

    const signedTxn = await walletService.signTransaction(appCallTxn);
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
        creator: globalState['creator'] || '',
        memberCount: Number(globalState['member_count'] || 0),
        expenseCount: Number(globalState['expense_count'] || 0),
        isSettled: Boolean(globalState['is_settled']),
        totalPool: Number(globalState['total_pool'] || 0),
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
      
      if (!localState) {
        return {
          address,
          netBalance: 0,
          isOwed: false,
          hasOptedIn: false,
        };
      }

      const netBalance = Number(localState['net_balance'] || 0);
      
      return {
        address,
        netBalance,
        isOwed: netBalance > 0,
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
    const accountInfo = await algorandClientService.getAccountInfo(address);
    
    if (!accountInfo || !accountInfo['apps-local-state']) {
      return false;
    }

    return accountInfo['apps-local-state'].some(
      (app: any) => app.id === this.appId
    );
  }

  /**
   * Get the application address (escrow)
   */
  getAppAddress(): string {
    return algosdk.getApplicationAddress(this.appId);
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
