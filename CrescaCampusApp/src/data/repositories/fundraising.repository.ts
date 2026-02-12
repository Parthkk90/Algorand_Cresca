/**
 * FundraisingRepository
 * Repository for interacting with the Fundraising Escrow smart contract
 * App ID: 755399775 (Testnet)
 */

import algosdk from 'algosdk';
import { algorandClientService } from '../../core/services/algorand-client.service';
import { walletService } from '../../core/services/wallet.service';
import { AlgorandConfig } from '../../core/config/algorand.config';
import { Campaign, CampaignStatus, Donation, TransactionResult } from '../../domain/models';

class FundraisingRepository {
  private readonly appId: number;
  private readonly client: algosdk.Algodv2;

  constructor() {
    this.appId = AlgorandConfig.contracts.fundraising;
    this.client = algorandClientService.getAlgodClient();
  }

  /**
   * Opt-in to the Fundraising application
   * Required before creating campaigns or donating
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
   * Create a new fundraising campaign
   * @param beneficiary Address to receive funds
   * @param title Campaign title (max 32 chars)
   * @param description Campaign description (max 64 chars)
   * @param goal Goal amount in microAlgos
   * @param deadlineDays Number of days until deadline
   */
  async createCampaign(
    beneficiary: string,
    title: string,
    description: string,
    goal: number,
    deadlineDays: number
  ): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    const secretKey = walletService.getSecretKeyFromMnemonic(wallet.mnemonic);
    
    // Calculate deadline as Unix timestamp
    const deadline = Math.floor(Date.now() / 1000) + (deadlineDays * 24 * 60 * 60);

    const appArgs = [
      new TextEncoder().encode('create_campaign'),
      algosdk.decodeAddress(beneficiary).publicKey,
      new TextEncoder().encode(title.slice(0, 32)),
      new TextEncoder().encode(description.slice(0, 64)),
      algosdk.encodeUint64(goal),
      algosdk.encodeUint64(deadline),
    ];

    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: wallet.address,
      suggestedParams,
      appIndex: this.appId,
      appArgs,
      accounts: [beneficiary],
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
   * Donate to a campaign
   * @param campaignId The campaign ID to donate to
   * @param amount Amount in microAlgos
   * @param isAnonymous Whether to hide donor address
   */
  async donate(
    campaignId: number,
    amount: number,
    isAnonymous: boolean = false
  ): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    const secretKey = walletService.getSecretKeyFromMnemonic(wallet.mnemonic);
    const appAddress = this.getAppAddress();

    // Create atomic group: payment + app call
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: wallet.address,
      receiver: appAddress,
      amount: amount,
      suggestedParams,
    });

    const appArgs = [
      new TextEncoder().encode('donate'),
      algosdk.encodeUint64(campaignId),
      new Uint8Array([isAnonymous ? 1 : 0]),
    ];

    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: wallet.address,
      suggestedParams,
      appIndex: this.appId,
      appArgs,
      onComplete: algosdk.OnApplicationComplete.NoOpOC
    });

    // Group transactions
    algosdk.assignGroupID([paymentTxn, appCallTxn]);

    // Sign both
    const signedPayment = walletService.signTransaction(paymentTxn, secretKey);
    const signedAppCall = walletService.signTransaction(appCallTxn, secretKey);

    // Send atomic group
    const txId = await algorandClientService.sendTransaction([signedPayment, signedAppCall]);
    const confirmed = await algorandClientService.waitForConfirmation(txId);

    return {
      txId,
      confirmed: confirmed !== null,
      appId: this.appId,
    };
  }

  /**
   * Claim funds from a successful campaign
   * Only the beneficiary can claim after goal is met
   * @param campaignId The campaign ID
   */
  async claimFunds(campaignId: number): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    const secretKey = walletService.getSecretKeyFromMnemonic(wallet.mnemonic);
    
    const appArgs = [
      new TextEncoder().encode('claim_funds'),
      algosdk.encodeUint64(campaignId),
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
   * Request refund from a failed campaign
   * Only available if campaign failed to meet goal by deadline
   * @param campaignId The campaign ID
   */
  async requestRefund(campaignId: number): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    const secretKey = walletService.getSecretKeyFromMnemonic(wallet.mnemonic);
    
    const appArgs = [
      new TextEncoder().encode('refund'),
      algosdk.encodeUint64(campaignId),
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
   * Cancel a campaign (only creator can cancel before deadline)
   * @param campaignId The campaign ID
   */
  async cancelCampaign(campaignId: number): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    const secretKey = walletService.getSecretKeyFromMnemonic(wallet.mnemonic);
    
    const appArgs = [
      new TextEncoder().encode('cancel_campaign'),
      algosdk.encodeUint64(campaignId),
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
   * Get campaign details
   * @param campaignId The campaign ID
   */
  async getCampaign(campaignId: number): Promise<Campaign | null> {
    try {
      const globalState = await algorandClientService.getAppGlobalState(this.appId);
      
      if (!globalState) return null;

      // Parse campaign data from global state
      const campaignKey = `campaign_${campaignId}`;
      
      if (!globalState.get(`${campaignKey}_title`)) return null;

      const deadline = Number(globalState.get(`${campaignKey}_deadline`) || 0);
      const goal = Number(globalState.get(`${campaignKey}_goal`) || 0);
      const raised = Number(globalState.get(`${campaignKey}_raised`) || 0);
      const now = Math.floor(Date.now() / 1000);

      let status: CampaignStatus;
      if (globalState.get(`${campaignKey}_cancelled`)) {
        status = CampaignStatus.CANCELLED;
      } else if (raised >= goal) {
        status = CampaignStatus.SUCCESSFUL;
      } else if (now > deadline) {
        status = CampaignStatus.FAILED;
      } else {
        status = CampaignStatus.ACTIVE;
      }

      return {
        id: campaignId,
        creator: String(globalState.get(`${campaignKey}_creator`) || ''),
        beneficiary: String(globalState.get(`${campaignKey}_beneficiary`) || ''),
        title: String(globalState.get(`${campaignKey}_title`) || ''),
        description: String(globalState.get(`${campaignKey}_description`) || ''),
        goal,
        raised,
        deadline,
        status,
        milestoneCount: Number(globalState.get(`${campaignKey}_milestones`) || 0),
        donationCount: Number(globalState.get(`${campaignKey}_donations`) || 0),
      };
    } catch (error) {
      console.error('Failed to get campaign:', error);
      return null;
    }
  }

  /**
   * Get all active campaigns
   */
  async getActiveCampaigns(): Promise<Campaign[]> {
    try {
      const globalState = await algorandClientService.getAppGlobalState(this.appId);
      
      if (!globalState) return [];

      const campaignCount = Number(globalState.get('campaign_count') || 0);
      const campaigns: Campaign[] = [];

      for (let i = 0; i < campaignCount; i++) {
        const campaign = await this.getCampaign(i);
        if (campaign && campaign.status === CampaignStatus.ACTIVE) {
          campaigns.push(campaign);
        }
      }

      return campaigns;
    } catch (error) {
      console.error('Failed to get active campaigns:', error);
      return [];
    }
  }

  /**
   * Get user's donation history
   * @param address User's address
   */
  async getUserDonations(address: string): Promise<Donation[]> {
    try {
      const localState = await algorandClientService.getAppLocalState(this.appId, address);
      
      if (!localState) return [];

      const donations: Donation[] = [];

      // Parse donations from local state
      for (const [key, _value] of localState) {
        if (key.startsWith('donation_')) {
          const parts = key.split('_');
          const campaignId = parseInt(parts[1]);
          const donationId = parseInt(parts[2]);
          
          donations.push({
            id: donationId,
            campaignId,
            donor: address,
            amount: Number(localState.get(key) || 0),
            timestamp: Number(localState.get(`${key}_time`) || 0),
            isAnonymous: Boolean(localState.get(`${key}_anon`)),
          });
        }
      }

      return donations;
    } catch (error) {
      console.error('Failed to get user donations:', error);
      return [];
    }
  }

  /**
   * Get contract-wide statistics
   */
  async getContractStats(): Promise<{
    totalCampaigns: number;
    totalRaised: number;
    successfulCampaigns: number;
  } | null> {
    try {
      const globalState = await algorandClientService.getAppGlobalState(this.appId);
      
      if (!globalState) return null;

      return {
        totalCampaigns: Number(globalState.get('campaign_count') || 0),
        totalRaised: Number(globalState.get('total_raised') || 0),
        successfulCampaigns: Number(globalState.get('successful_count') || 0),
      };
    } catch (error) {
      console.error('Failed to get contract stats:', error);
      return null;
    }
  }

  /**
   * Get the application address (escrow)
   */
  getAppAddress(): string {
    return algosdk.getApplicationAddress(this.appId).toString();
  }

  /**
   * Get the escrow balance
   */
  async getEscrowBalance(): Promise<number> {
    const appAddress = this.getAppAddress();
    return algorandClientService.getBalance(appAddress);
  }

  /**
   * Check if an address has opted into the contract
   * @param address The address to check
   */
  async hasOptedIn(address: string): Promise<boolean> {
    return algorandClientService.isOptedIntoApp(address, this.appId);
  }
}

export const fundraisingRepository = new FundraisingRepository();
