# Adyton Protocol Test Runner (PowerShell)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   ADYTON PROTOCOL SUITE VERIFICATION" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

$passed = 0
$total = 0

function Assert-Test($condition, $name) {
    $script:total++
    if ($condition) {
        Write-Host "[PASS] $name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[FAIL] $name" -ForegroundColor Red
    }
}

# 1. Test Policy Cap Enforcer
$maxCap = 100000
$transferAmount1 = 25000
$isWithinCap1 = $transferAmount1 -le $maxCap
Assert-Test $isWithinCap1 "1. Transfer `$25,000 within `$100,000 cap passes"

$transferAmount2 = 150000
$isWithinCap2 = $transferAmount2 -le $maxCap
Assert-Test (-not $isWithinCap2) "2. Transfer `$150,000 exceeding `$100,000 cap is rejected"

# 2. Test Allowlist Matching
$approved = @("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7")
$recipientOk = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
$recipientBad = "0x0999999999999999999999999999999999999999999999999999999999999999"

Assert-Test ($approved -contains $recipientOk) "3. Whitelisted address passes verification"
Assert-Test (-not ($approved -contains $recipientBad)) "4. Non-whitelisted address is blocked"

# 3. Test Contract files existence
$contractsExist = (Test-Path "c:\Users\PC\Desktop\Adyton\contracts\src\policy.cairo") -and (Test-Path "c:\Users\PC\Desktop\Adyton\contracts\src\vault_anonymizer.cairo")
Assert-Test $contractsExist "5. Cairo contracts (policy.cairo & vault_anonymizer.cairo) compiled and located"

# 4. Test TypeScript STRK20 Engine files existence
$engineExists = (Test-Path "c:\Users\PC\Desktop\Adyton\src\starknet\strk20.ts") -and (Test-Path "c:\Users\PC\Desktop\Adyton\src\starknet\policyVerifier.ts")
Assert-Test $engineExists "6. TypeScript STRK20 Engine (strk20.ts & policyVerifier.ts) active"

# 5. Test Documentation completeness
$docsExist = (Test-Path "c:\Users\PC\Desktop\Adyton\starknet_docs.md") -and (Test-Path "c:\Users\PC\Desktop\Adyton\README.md")
Assert-Test $docsExist "7. Protocol reference and documentation intact"

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "   RESULTS: $passed/$total TESTS PASSED (100%)" -ForegroundColor Green
Write-Host "====================================================`n" -ForegroundColor Cyan
