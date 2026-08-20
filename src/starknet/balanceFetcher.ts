import { CURRENT_CONFIG } from './config';
import { AssetSymbol } from '../types';

export interface TokenBalances {
  STRK: number;
  ETH: number;
  USDC: number;
}

export async function fetchOnchainBalances(userAddress: string): Promise<TokenBalances> {
  const defaultBalances: TokenBalances = { STRK: 0, ETH: 0, USDC: 0 };
  if (!userAddress || typeof window === 'undefined') return defaultBalances;

  const tokens: Record<AssetSymbol, { address: string; decimals: number }> = {
    STRK: { address: CURRENT_CONFIG.tokens.STRK, decimals: 18 },
    ETH: { address: CURRENT_CONFIG.tokens.ETH, decimals: 18 },
    USDC: { address: CURRENT_CONFIG.tokens.USDC, decimals: 6 },
  };

  const balances: TokenBalances = { ...defaultBalances };

  await Promise.all(
    (Object.keys(tokens) as AssetSymbol[]).map(async (symbol) => {
      try {
        const { address, decimals } = tokens[symbol];
        const body = {
          jsonrpc: '2.0',
          method: 'starknet_call',
          params: [
            {
              contract_address: address,
              entry_point_selector: '0x02e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e', // balanceOf
              calldata: [userAddress],
            },
            'latest',
          ],
          id: 1,
        };

        const res = await fetch(CURRENT_CONFIG.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (data.result && Array.isArray(data.result) && data.result.length >= 2) {
          const low = BigInt(data.result[0]);
          const high = BigInt(data.result[1]);
          const rawTotal = (high << 128n) + low;
          const divisor = 10n ** BigInt(decimals);
          const whole = rawTotal / divisor;
          const remainder = rawTotal % divisor;
          const frac = Number(remainder) / (10 ** decimals);
          balances[symbol] = Number(whole) + frac;
        }
      } catch (err) {
        console.warn(`Could not fetch balance for ${symbol}:`, err);
      }
    })
  );

  return balances;
}
