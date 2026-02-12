/**
 * DAOTreasuryRepository
 * Repository for interacting with the DAO Treasury smart contract
 * App ID: 755399773 (Testnet)
 */

import algosdk from 'algosdk';
import { algorandClientService } from '../../core/services/algorand-client.service';
import { walletService } from '../../core/services/wallet.service';
import { ALGORAND_CONFIG } from '../../core/config/algorand.config';
import { DAOTreasury, TreasuryProposal, ProposalStatus, TransactionResult } from '../../domain/models';

class DAOTreasuryRepository {
  private readonly appId: number;
  private readonly client: algosdk.Algodv2;

  constructor() {
    this.appId = ALGORAND_CONFIG.contracts.daoTreasury;
    this.client = algorandClientService.getAlgodClient();
  }

  /**
   * Opt-in to the DAO Treasury application
   * Required to become a signer or create proposals
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
   * Add a signer to the treasury multisig
   * Only the creator can add signers
   * @param signerAddress Address of the new signer
   */
  async addSigner(signerAddress: string): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    
    const appArgs = [
      new TextEncoder().encode('add_signer'),
    ];

    const appCallTxn = algosdk.makeApplicationNoOpTxn(
      wallet.address,
      suggestedParams,
      this.appId,
      appArgs,
      [signerAddress] // Add signer address as account reference
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
   * Create a spending proposal
   * @param recipient Address to receive funds
   * @param amount Amount in microAlgos
   * @param description Description of the proposal (max 32 chars)
   */
  async createProposal(
    recipient: string,
    amount: number,
    description: string
  ): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    
    const appArgs = [
      new TextEncoder().encode('create_proposal'),
      algosdk.decodeAddress(recipient).publicKey,
      algosdk.encodeUint64(amount),
      new TextEncoder().encode(description.slice(0, 32)),
    ];

    const appCallTxn = algosdk.makeApplicationNoOpTxn(
      wallet.address,
      suggestedParams,
      this.appId,
      appArgs,
      [recipient]
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
   * Approve a pending proposal
   * @param proposalId ID of the proposal to approve
   */
  async approveProposal(proposalId: number): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    
    const appArgs = [
      new TextEncoder().encode('approve_proposal'),
      algosdk.encodeUint64(proposalId),
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
   * Execute an approved proposal
   * @param proposalId ID of the proposal to execute
   */
  async executeProposal(proposalId: number): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    
    const appArgs = [
      new TextEncoder().encode('execute_proposal'),
      algosdk.encodeUint64(proposalId),
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
   * Deposit funds to the treasury
   * @param amount Amount in microAlgos
   */
  async deposit(amount: number): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    const appAddress = this.getAppAddress();

    // Create payment transaction to app address
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: wallet.address,
      to: appAddress,
      amount: amount,
      suggestedParams,
    });

    const signedTxn = await walletService.signTransaction(paymentTxn);
    const txId = await algorandClientService.sendTransaction(signedTxn);
    const confirmed = await algorandClientService.waitForConfirmation(txId);

    return {
      txId,
      confirmed: confirmed !== null,
      appId: this.appId,
    };
  }

  /**
   * Get the global state of the DAO Treasury
   */
  async getTreasuryState(): Promise<DAOTreasury | null> {
    try {
      const globalState = await algorandClientService.getAppGlobalState(this.appId);
      
      if (!globalState) return null;

      const appAddress = this.getAppAddress();
      const balance = await algorandClientService.getBalance(appAddress);

      return {
        appId: this.appId,
        creator: globalState['creator'] || '',
        threshold: Number(globalState['threshold'] || 2),
        signerCount: Number(globalState['signer_count'] || 0),
        proposalCount: Number(globalState['proposal_count'] || 0),
        balance,
      };
    } catch (error) {
      console.error('Failed to get treasury state:', error);
      return null;
    }
  }

  /**
   * Check if an address is a signer
   * @param address The address to check
   */
  async isSigner(address: string): Promise<boolean> {
    try {
      const localState = await algorandClientService.getAppLocalState(this.appId, address);
      return localState?.['is_signer'] === 1;
    } catch {
      return false;
    }
  }

  /**
   * Get proposal details by ID
   * Note: This reads from box storage in a real implementation
   * @param proposalId The proposal ID
   */
  async getProposal(proposalId: number): Promise<TreasuryProposal | null> {
    try {
      // In a full implementation, this would read from box storage
      // For now, we return the global state info about proposals
      const globalState = await algorandClientService.getAppGlobalState(this.appId);
      
      if (!globalState) return null;

      // Basic proposal info from global state
      return {
        id: proposalId,
        creator: '',
        recipient: '',
        amount: 0,
        description: '',
        status: ProposalStatus.PENDING,
        approvalCount: 0,
      };
    } catch (error) {
      console.error('Failed to get proposal:', error);
      return null;
    }
  }

  /**
   * Get the application address (treasury escrow)
   */
  getAppAddress(): string {
    return algosdk.getApplicationAddress(this.appId);
  }

  /**
   * Get the treasury balance
   */
  async getTreasuryBalance(): Promise<number> {
    const appAddress = this.getAppAddress();
    return algorandClientService.getBalance(appAddress);
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
}

export const daoTreasuryRepository = new DAOTreasuryRepository();
