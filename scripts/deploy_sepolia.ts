/**
 * Adyton Starknet Sepolia Deployment & Testing Script
 * Deploys PolicyVault and VaultAnonymizer contracts to Starknet Sepolia Testnet.
 */

import { STARKNET_NETWORKS } from '../src/starknet/config';

export interface DeploymentConfig {
  network: 'sepolia' | 'mainnet';
  rpcUrl: string;
  accountAddress: string;
  privateKey: string;
}

export const SEPOLIA_CONFIG = {
  network: 'sepolia',
  rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
  poolAddress: STARKNET_NETWORKS.sepolia.privacyPoolAddress,
  tokenAddress: STARKNET_NETWORKS.sepolia.tokens.USDC,
  defaultMaxCap: 100_000n * 10n ** 6n, // 100,000 USDC (6 decimals)
  defaultDailyLimit: 500_000n * 10n ** 6n, // 500,000 USDC
};

/**
 * Step 1: Declare Cairo Contract (Calculate & Register Sierra Class Hash)
 * Command: sncast --network sepolia declare --contract-name PolicyVault
 */
export function getDeclarationCommands() {
  return [
    `# 1. Build Sierra/Casm Artifacts:`,
    `scarb build`,
    ``,
    `# 2. Declare PolicyVault:`,
    `sncast --account my_sepolia_account declare --contract-name PolicyVault`,
    ``,
    `# 3. Declare VaultAnonymizer:`,
    `sncast --account my_sepolia_account declare --contract-name VaultAnonymizer`,
  ];
}

/**
 * Step 2: Deploy Contract Instances with Constructor Arguments
 * Command: sncast --network sepolia deploy --class-hash <CLASS_HASH> --constructor-calldata <ARGS>
 */
export function getDeploymentCommands(
  ownerAddress: string,
  policyClassHash: string = '<POLICY_CLASS_HASH>',
  anonymizerClassHash: string = '<ANONYMIZER_CLASS_HASH>'
) {
  // u256 in calldata is passed as two felts (low, high)
  const maxCapLow = '0x174876e800'; // 100,000 * 10^6
  const maxCapHigh = '0x0';
  const dailyLimitLow = '0x746a528800'; // 500,000 * 10^6
  const dailyLimitHigh = '0x0';

  return [
    `# 1. Deploy PolicyVault Instance:`,
    `sncast --account my_sepolia_account deploy \\`,
    `  --class-hash ${policyClassHash} \\`,
    `  --constructor-calldata ${ownerAddress} ${maxCapLow} ${maxCapHigh} ${dailyLimitLow} ${dailyLimitHigh}`,
    ``,
    `# 2. Deploy VaultAnonymizer Instance:`,
    `sncast --account my_sepolia_account deploy \\`,
    `  --class-hash ${anonymizerClassHash} \\`,
    `  --constructor-calldata ${SEPOLIA_CONFIG.poolAddress} ${SEPOLIA_CONFIG.tokenAddress}`,
  ];
}

/**
 * Step 3: Test Deployed Contracts with Onchain Invocations
 */
export function getTestingCommands(deployedPolicyAddress: string) {
  return [
    `# Query current maximum spending cap:`,
    `sncast --network sepolia call \\`,
    `  --contract-address ${deployedPolicyAddress} \\`,
    `  --function get_max_cap`,
    ``,
    `# Update max spending cap to $150,000 (Owner only):`,
    `sncast --account my_sepolia_account invoke \\`,
    `  --contract-address ${deployedPolicyAddress} \\`,
    `  --function set_max_cap \\`,
    `  --calldata 0x22ecb25c00 0x0`,
    ``,
    `# Add approved whitelist recipient:`,
    `sncast --account my_sepolia_account invoke \\`,
    `  --contract-address ${deployedPolicyAddress} \\`,
    `  --function add_approved_recipient \\`,
    `  --calldata 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7`,
  ];
}
