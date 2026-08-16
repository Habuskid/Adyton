# Adyton Starknet Sepolia Deployment & Test Helper

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "       ADYTON STARKNET SEPOLIA CONTRACT DEPLOYMENT GUIDE       " -ForegroundColor Cyan
Write-Host "===============================================================`n" -ForegroundColor Cyan

Write-Host "PREREQUISITES:" -ForegroundColor Yellow
Write-Host "1. Install Scarb (Cairo compiler):"
Write-Host "   curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh" -ForegroundColor DarkGray
Write-Host "2. Install Starknet Foundry (sncast & snforge):"
Write-Host "   curl --proto '=https' --tlsv1.2 -sSf https://foundry.starkware.co/install | sh" -ForegroundColor DarkGray
Write-Host "3. Get free Sepolia ETH / STRK testnet tokens from: https://starknet-faucet.vercel.app/`n"

Write-Host "STEP 1: COMPILE CAIRO CONTRACTS" -ForegroundColor Yellow
Write-Host "cd contracts && scarb build`n" -ForegroundColor Green

Write-Host "STEP 2: DECLARE CONTRACTS ON SEPOLIA" -ForegroundColor Yellow
Write-Host "sncast --network sepolia declare --contract-name PolicyVault" -ForegroundColor Green
Write-Host "sncast --network sepolia declare --contract-name VaultAnonymizer`n" -ForegroundColor Green

Write-Host "STEP 3: DEPLOY CONTRACT INSTANCES" -ForegroundColor Yellow
Write-Host "# PolicyVault (Owner, MaxCap=$100,000, DailyLimit=$500,000):"
Write-Host "sncast --network sepolia deploy --class-hash <POLICY_CLASS_HASH> --constructor-calldata <OWNER_ADDR> 0x174876e800 0x0 0x746a528800 0x0`n" -ForegroundColor Green

Write-Host "# VaultAnonymizer (STRK20 Pool, USDC Token):"
Write-Host "sncast --network sepolia deploy --class-hash <ANONYMIZER_CLASS_HASH> --constructor-calldata 0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91 0x053b40a647cedfca6ca84f542a0fe38736031706ec1b43ba5d6f503063234470`n" -ForegroundColor Green

Write-Host "STEP 4: TEST ONCHAIN INVOCATION" -ForegroundColor Yellow
Write-Host "# Query current max cap:"
Write-Host "sncast --network sepolia call --contract-address <DEPLOYED_POLICY_ADDR> --function get_max_cap`n" -ForegroundColor Green
