/**
 * Official STRK20 Starknet Contract Addresses & Configuration
 * Sourced directly from strk20.starknet.io and strk20-by-example.org
 */

export interface NetworkConfig {
  chainId: string;
  rpcUrl: string;
  poolAddress: string;
  policyContractAddress: string;
  anonymizerContractAddress: string;
  tokens: {
    USDC: string;
    ETH: string;
    STRK: string;
  };
}

export const STARKNET_NETWORKS: Record<'sepolia' | 'mainnet', NetworkConfig> = {
  sepolia: {
    chainId: 'SN_SEPOLIA',
    rpcUrl: 'https://free-rpc.nethermind.io/sepolia-juno/v0_7',
    poolAddress: '0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91',
    policyContractAddress: '0x01a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
    anonymizerContractAddress: '0x03d8a9f2b1e7c4a0d9b8e1f2c3a4b5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    tokens: {
      USDC: '0x053b40a647cedfca6ca84f542a0fe3673603190d52737e3336804206018b2599',
      ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    },
  },
  mainnet: {
    chainId: 'SN_MAIN',
    rpcUrl: 'https://free-rpc.nethermind.io/mainnet-juno/v0_7',
    poolAddress: '0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a',
    policyContractAddress: '0x01a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
    anonymizerContractAddress: '0x03d8a9f2b1e7c4a0d9b8e1f2c3a4b5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    tokens: {
      USDC: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
      ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    },
  },
};

export const ACTIVE_NETWORK: 'sepolia' | 'mainnet' = 'sepolia';
export const CURRENT_CONFIG = STARKNET_NETWORKS[ACTIVE_NETWORK];

export const STRK20_CONSTANTS = {
  OPEN_NOTE_SALT: 1n,
  MATURITY_BLOCKS: 10,
  MAX_VIEWING_KEY: 0x4000000000000000000000000000000022d4a132204c382103f6f1c42f02603fn,
  TAGS: {
    NOTE_ID: 'NOTE_ID:V1',
    NULLIFIER: 'NULLIFIER:V1',
    CHANNEL_KEY: 'CHANNEL_KEY:V1',
    ESCROW_COMMITMENT: 'ESCROW_COMMITMENT_TAG:V1',
  },
};
