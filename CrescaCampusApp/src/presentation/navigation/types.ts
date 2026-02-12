/**
 * Navigation Types
 */

export type RootStackParamList = {
  Main: undefined;
  WalletSetup: undefined;
  ImportWallet: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Expenses: undefined;
  Treasury: undefined;
  Tickets: undefined;
  Fundraise: undefined;
};

export type ExpenseStackParamList = {
  ExpenseList: undefined;
  AddExpense: undefined;
  ExpenseDetails: { expenseId: number };
};

export type TreasuryStackParamList = {
  TreasuryOverview: undefined;
  CreateProposal: undefined;
  ProposalDetails: { proposalId: number };
};

export type TicketStackParamList = {
  EventList: undefined;
  CreateEvent: undefined;
  EventDetails: { eventId: number };
  MyTickets: undefined;
};

export type FundraisingStackParamList = {
  CampaignList: undefined;
  CreateCampaign: undefined;
  CampaignDetails: { campaignId: number };
  MyDonations: undefined;
};
