/**
 * Algorand Client Service
 * Singleton service for Algorand network interaction
 */

import algosdk from 'algosdk';
import { AlgorandConfig } from '../config/algorand.config';

class AlgorandClientService {
  private static instance: AlgorandClientService;
  private algodClient: algosdk.Algodv2;
  private indexerClient: algosdk.Indexer;

  private constructor() {
    this.algodClient = new algosdk.Algodv2(
      AlgorandConfig.algodToken,
      AlgorandConfig.algodServer,
      AlgorandConfig.algodPort
    );

    this.indexerClient = new algosdk.Indexer(
      AlgorandConfig.indexerToken,
      AlgorandConfig.indexerServer,
      AlgorandConfig.indexerPort
    );
  }

  public static getInstance(): AlgorandClientService {
    if (!AlgorandClientService.instance) {
      AlgorandClientService.instance = new AlgorandClientService();
    }
    return AlgorandClientService.instance;
  }

  public getAlgodClient(): algosdk.Algodv2 {
    return this.algodClient;
  }

  public getIndexerClient(): algosdk.Indexer {
    return this.indexerClient;
  }

  /**
   * Get suggested transaction parameters
   */
  public async getSuggestedParams(): Promise<algosdk.SuggestedParams> {
    return await this.algodClient.getTransactionParams().do();
  }

  /**
   * Get account information
   */
  public async getAccountInfo(address: string): Promise<algosdk.modelsv2.Account> {
    return await this.algodClient.accountInformation(address).do();
  }

  /**
   * Get account balance in microAlgos
   */
  public async getBalance(address: string): Promise<number> {
    const accountInfo = await this.getAccountInfo(address);
    return Number(accountInfo.amount);
  }

  /**
   * Get account balance in ALGO
   */
  public async getBalanceInAlgo(address: string): Promise<number> {
    const microAlgos = await this.getBalance(address);
    return microAlgos / 1_000_000;
  }

  /**
   * Send signed transaction
   */
  public async sendTransaction(signedTxn: Uint8Array): Promise<string> {
    const response = await this.algodClient.sendRawTransaction(signedTxn).do();
    return response.txId;
  }

  /**
   * Wait for transaction confirmation
   */
  public async waitForConfirmation(
    txId: string,
    rounds: number = 4
  ): Promise<algosdk.modelsv2.PendingTransactionResponse> {
    return await algosdk.waitForConfirmation(this.algodClient, txId, rounds);
  }

  /**
   * Send and wait for transaction confirmation
   */
  public async sendAndWait(signedTxn: Uint8Array): Promise<{
    txId: string;
    confirmation: algosdk.modelsv2.PendingTransactionResponse;
  }> {
    const txId = await this.sendTransaction(signedTxn);
    const confirmation = await this.waitForConfirmation(txId);
    return { txId, confirmation };
  }

  /**
   * Get application global state
   */
  public async getAppGlobalState(appId: number): Promise<Map<string, any>> {
    const appInfo = await this.algodClient.getApplicationByID(appId).do();
    const state = new Map<string, any>();

    if (appInfo.params?.globalState) {
      for (const item of appInfo.params.globalState) {
        const key = Buffer.from(item.key, 'base64').toString('utf8');
        const value = item.value;
        
        if (value.type === 1) {
          // Bytes
          state.set(key, Buffer.from(value.bytes, 'base64'));
        } else {
          // Uint
          state.set(key, value.uint);
        }
      }
    }

    return state;
  }

  /**
   * Get application local state for an account
   */
  public async getAppLocalState(
    appId: number,
    address: string
  ): Promise<Map<string, any>> {
    const accountInfo = await this.getAccountInfo(address);
    const state = new Map<string, any>();

    const appLocalState = accountInfo.appsLocalState?.find(
      (app) => app.id === BigInt(appId)
    );

    if (appLocalState?.keyValue) {
      for (const item of appLocalState.keyValue) {
        const key = Buffer.from(item.key, 'base64').toString('utf8');
        const value = item.value;
        
        if (value.type === 1) {
          state.set(key, Buffer.from(value.bytes, 'base64'));
        } else {
          state.set(key, value.uint);
        }
      }
    }

    return state;
  }

  /**
   * Check if account is opted into an application
   */
  public async isOptedIntoApp(address: string, appId: number): Promise<boolean> {
    const accountInfo = await this.getAccountInfo(address);
    return (
      accountInfo.appsLocalState?.some((app) => app.id === BigInt(appId)) ?? false
    );
  }
}

export const algorandClient = AlgorandClientService.getInstance();
export default AlgorandClientService;
