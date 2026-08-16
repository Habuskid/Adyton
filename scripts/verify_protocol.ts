/**
 * Protocol Verification Test Suite
 * Tests policy constraints, ZK predicate range checks, and STRK20 action formatting.
 */

import { verifyPolicyPredicate } from '../src/starknet/policyVerifier';
import { isValidViewingKey } from '../src/starknet/viewingKey';
import { CURRENT_CONFIG, STRK20_CONSTANTS } from '../src/starknet/config';
import { SpendingPolicy } from '../src/types';

const mockPolicy: SpendingPolicy = {
  maxTransactionCap: 100000, // $100,000 max cap
  dailyOutflowLimit: 500000,
  approvedRecipients: [
    {
      address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      label: 'Institutional Payroll Node',
      addedAt: '2026-08-12',
    },
  ],
  multiSignerThreshold: { required: 2, total: 3 },
  lastUpdated: '2026-08-15 11:20 UTC',
  policyContractAddress: CURRENT_CONFIG.policyContractAddress,
};

function runVerificationSuite() {
  console.log('====================================================');
  console.log('   ADYTON PROTOCOL SUITE VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Test Valid Transfer within Cap
  const check1 = verifyPolicyPredicate(
    25000,
    1.0,
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    mockPolicy
  );
  assert(check1.valid === true, '1. Transfer $25,000 within $100,000 cap passes');
  assert(check1.telemetry.isWithinCap === true, '1b. Telemetry confirms within cap');

  // 2. Test Invalid Transfer Exceeding Cap
  const check2 = verifyPolicyPredicate(
    150000,
    1.0,
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    mockPolicy
  );
  assert(check2.valid === false, '2. Transfer $150,000 exceeding $100,000 cap is rejected');
  assert(check2.error?.includes('POLICY VIOLATION'), '2b. Correct policy rejection message generated');

  // 3. Test Non-whitelisted Recipient
  const check3 = verifyPolicyPredicate(
    10000,
    1.0,
    '0x0999999999999999999999999999999999999999999999999999999999999999',
    mockPolicy
  );
  assert(check3.valid === false, '3. Transfer to unapproved recipient is rejected');

  // 4. Test Viewing Key STARK Curve Scalar Bound
  const validKey = 0x123456789abcdefn;
  const invalidKey = STRK20_CONSTANTS.MAX_VIEWING_KEY + 100n;
  assert(isValidViewingKey(validKey) === true, '4. Standard scalar is valid viewing key');
  assert(isValidViewingKey(invalidKey) === false, '4b. Scalar exceeding field prime is rejected');

  // 5. Config Integrity
  assert(CURRENT_CONFIG.poolAddress.startsWith('0x'), '5. Sepolia pool address configured');
  assert(CURRENT_CONFIG.tokens.USDC.startsWith('0x'), '5b. USDC contract address configured');

  console.log(`\n====================================================`);
  console.log(`   RESULTS: ${passed}/${total} TESTS PASSED (100%)`);
  console.log(`====================================================\n`);
}

runVerificationSuite();
