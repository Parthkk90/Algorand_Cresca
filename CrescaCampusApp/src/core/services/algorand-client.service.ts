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
  public async getAccountInfo(address: string): Promise<any> {
    return await this.algodClient.accountInformation(address).do();
  }

  /**
   * Get account balance in microAlgos
   */
  public async getBalance(address: string): Promise<number> {
    const accountInfo = await this.getAccountInfo(address);
    return Number(accountInfo.amount || 0);
  }

  /**
   * Get account balance in ALGO
   */
  public async getBalanceInAlgo(address: string): Promise<number> {
    const microAlgos = await this.getBalance(address);
    return microAlgos / 1_000_000;
  }

  /**
   * Send signed transaction (single or array)
   */
  public async sendTransaction(signedTxn: Uint8Array | Uint8Array[]): Promise<string> {
    // Handle array of transactions (atomic group)
    if (Array.isArray(signedTxn)) {
      // Concatenate all signed transactions into one blob
      const totalLength = signedTxn.reduce((sum, txn) => sum + txn.length, 0);
      const combinedTxn = new Uint8Array(totalLength);
      let offset = 0;
      for (const txn of signedTxn) {
        combinedTxn.set(txn, offset);
        offset += txn.length;
      }
      const response = await this.algodClient.sendRawTransaction(combinedTxn).do();
      return response.txid || '';
    }
    
    const response = await this.algodClient.sendRawTransaction(signedTxn).do();
    return response.txid || '';
  }

  /**
   * Wait for transaction confirmation
   */
  public async waitForConfirmation(
    txId: string,
    rounds: number = 4
  ): Promise<any> {
    return await algosdk.waitForConfirmation(this.algodClient, txId, rounds);
  }

  /**
   * Send and wait for transaction confirmation
   */
  public async sendAndWait(signedTxn: Uint8Array): Promise<{
    txId: string;
    confirmation: any;
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

    const globalState = (appInfo.params as any)?.globalState || (appInfo.params as any)?.['global-state'] || [];
    
    for (const item of globalState) {
      // Handle both Uint8Array and base64 string formats
      let keyStr: string;
      if (item.key instanceof Uint8Array) {
        keyStr = new TextDecoder().decode(item.key);
      } else {
        keyStr = atob(item.key);
      }
      
      const value = item.value;
      if (value.type === 1) {
        // Bytes
        if (value.bytes instanceof Uint8Array) {
          state.set(keyStr, value.bytes);
        } else {
          state.set(keyStr, Uint8Array.from(atob(value.bytes), c => c.charCodeAt(0)));
        }
      } else {
        // Uint
        state.set(keyStr, Number(value.uint));
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

    const appsLocalState = accountInfo.appsLocalState || accountInfo['apps-local-state'] || [];
    const appLocalState = appsLocalState.find(
      (app: any) => Number(app.id) === appId
    );

    const keyValue = appLocalState?.keyValue || appLocalState?.['key-value'] || [];
    
    for (const item of keyValue) {
      let keyStr: string;
      if (item.key instanceof Uint8Array) {
        keyStr = new TextDecoder().decode(item.key);
      } else {
        keyStr = atob(item.key);
      }
      
      const value = item.value;
      if (value.type === 1) {
        if (value.bytes instanceof Uint8Array) {
          state.set(keyStr, value.bytes);
        } else {
          state.set(keyStr, Uint8Array.from(atob(value.bytes), c => c.charCodeAt(0)));
        }
      } else {
        state.set(keyStr, Number(value.uint));
      }
    }

    return state;
  }

  /**
   * Check if account is opted into an application
   */
  public async isOptedIntoApp(address: string, appId: number): Promise<boolean> {
    const accountInfo = await this.getAccountInfo(address);
    const appsLocalState = accountInfo.appsLocalState || accountInfo['apps-local-state'] || [];
    return appsLocalState.some((app: any) => Number(app.id) === appId);
  }
}

export const algorandClient = AlgorandClientService.getInstance();
export const algorandClientService = algorandClient; // Alias for compatibility
export default AlgorandClientService;
