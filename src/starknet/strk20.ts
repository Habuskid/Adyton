import { strk20Vault } from './strk20Sdk';
import { AssetSymbol, SpendingPolicy } from '../types';

export function getDecimalsForAsset(symbol: AssetSymbol): number {
  switch (symbol) {
    case 'USDC':
      return 6;
    case 'ETH':
    case 'STRK':
    default:
      return 18;
  }
}

/**
 * 1. Shield Tokens (Public -> Official STRK20 Privacy Pool)
 */
export async function shieldTokens(
  tokenSymbol: AssetSymbol,
  amount: number
): Promise<{ success: boolean; txHash: string; noteId: string }> {
  const result = await strk20Vault.shieldDeposit(tokenSymbol, amount);
  return {
    success: result.success,
    txHash: result.txHash,
    noteId: result.note.id,
  };
}

/**
 * 2. Confidential UTXO Note Spend Transfer
 */
export async function executePrivateTransfer(
  tokenSymbol: AssetSymbol,
  amount: number,
  usdRate: number,
  recipientAddress: string,
  policy: SpendingPolicy
): Promise<{ success: boolean; txHash?: string; error?: string; proofFacts?: string[] }> {
  return await strk20Vault.privateTransfer(
    tokenSymbol,
    amount,
    usdRate,
    recipientAddress,
    policy
  );
}
