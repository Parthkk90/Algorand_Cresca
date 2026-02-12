/**
 * Fundraising Store (ViewModel)
 * Manages fundraising campaigns state and operations
 */

import { create } from 'zustand';
import { fundraisingRepository } from '../../data/repositories';
import { Campaign, Donation, CampaignStatus, TransactionResult } from '../../domain/models';

interface FundraisingState {
  // State
  campaigns: Campaign[];
  activeCampaigns: Campaign[];
  userDonations: Donation[];
  selectedCampaign: Campaign | null;
  hasOptedIn: boolean;
  isLoading: boolean;
  error: string | null;
  lastTransaction: TransactionResult | null;
  stats: {
    totalCampaigns: number;
    totalRaised: number;
    successfulCampaigns: number;
  } | null;

  // Actions
  checkOptInStatus: (address: string) => Promise<void>;
  optIn: () => Promise<TransactionResult>;
  createCampaign: (
    beneficiary: string,
    title: string,
    description: string,
    goal: number,
    deadlineDays: number
  ) => Promise<TransactionResult>;
  donate: (campaignId: number, amount: number, isAnonymous?: boolean) => Promise<TransactionResult>;
  claimFunds: (campaignId: number) => Promise<TransactionResult>;
  requestRefund: (campaignId: number) => Promise<TransactionResult>;
  cancelCampaign: (campaignId: number) => Promise<TransactionResult>;
  fetchCampaign: (campaignId: number) => Promise<void>;
  fetchActiveCampaigns: () => Promise<void>;
  fetchUserDonations: (address: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  selectCampaign: (campaign: Campaign | null) => void;
  clearError: () => void;
}

export const useFundraisingStore = create<FundraisingState>((set, get) => ({
  // Initial state
  campaigns: [],
  activeCampaigns: [],
  userDonations: [],
  selectedCampaign: null,
  hasOptedIn: false,
  isLoading: false,
  error: null,
  lastTransaction: null,
  stats: null,

  // Check opt-in status
  checkOptInStatus: async (address: string) => {
    try {
      const hasOptedIn = await fundraisingRepository.hasOptedIn(address);
      set({ hasOptedIn });
    } catch (error: any) {
      console.error('Failed to check opt-in status:', error);
    }
  },

  // Opt-in to the contract
  optIn: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await fundraisingRepository.optIn();
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

  // Create a campaign
  createCampaign: async (beneficiary, title, description, goal, deadlineDays) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fundraisingRepository.createCampaign(
        beneficiary,
        title,
        description,
        goal,
        deadlineDays
      );
      set({ lastTransaction: result });
      
      // Refresh campaigns
      await get().fetchActiveCampaigns();
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to create campaign';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Donate to a campaign
  donate: async (campaignId: number, amount: number, isAnonymous = false) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fundraisingRepository.donate(campaignId, amount, isAnonymous);
      set({ lastTransaction: result });
      
      // Refresh campaign
      await get().fetchCampaign(campaignId);
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to donate';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Claim funds from successful campaign
  claimFunds: async (campaignId: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fundraisingRepository.claimFunds(campaignId);
      set({ lastTransaction: result });
      
      // Refresh campaign
      await get().fetchCampaign(campaignId);
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to claim funds';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Request refund from failed campaign
  requestRefund: async (campaignId: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fundraisingRepository.requestRefund(campaignId);
      set({ lastTransaction: result });
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to request refund';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Cancel a campaign
  cancelCampaign: async (campaignId: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fundraisingRepository.cancelCampaign(campaignId);
      set({ lastTransaction: result });
      
      // Refresh campaigns
      await get().fetchActiveCampaigns();
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to cancel campaign';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch a specific campaign
  fetchCampaign: async (campaignId: number) => {
    try {
      const campaign = await fundraisingRepository.getCampaign(campaignId);
      if (campaign) {
        const { campaigns } = get();
        const existingIndex = campaigns.findIndex(c => c.id === campaignId);
        if (existingIndex >= 0) {
          campaigns[existingIndex] = campaign;
        } else {
          campaigns.push(campaign);
        }
        set({ campaigns: [...campaigns] });
        
        // Update active campaigns list
        if (campaign.status === CampaignStatus.ACTIVE) {
          const { activeCampaigns } = get();
          const activeIndex = activeCampaigns.findIndex(c => c.id === campaignId);
          if (activeIndex >= 0) {
            activeCampaigns[activeIndex] = campaign;
          } else {
            activeCampaigns.push(campaign);
          }
          set({ activeCampaigns: [...activeCampaigns] });
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch campaign:', error);
    }
  },

  // Fetch all active campaigns
  fetchActiveCampaigns: async () => {
    set({ isLoading: true });
    try {
      const activeCampaigns = await fundraisingRepository.getActiveCampaigns();
      set({ activeCampaigns });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch campaigns' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch user's donation history
  fetchUserDonations: async (address: string) => {
    try {
      const userDonations = await fundraisingRepository.getUserDonations(address);
      set({ userDonations });
    } catch (error: any) {
      console.error('Failed to fetch donations:', error);
    }
  },

  // Fetch contract stats
  fetchStats: async () => {
    try {
      const stats = await fundraisingRepository.getContractStats();
      set({ stats });
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  },

  // Select a campaign
  selectCampaign: (campaign: Campaign | null) => set({ selectedCampaign: campaign }),

  // Clear error
  clearError: () => set({ error: null }),
}));
