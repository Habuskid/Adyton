import { SpendingPolicy } from '../types';

export interface PolicyVerificationResult {
  valid: boolean;
  error?: string;
  telemetry: {
    spentAmount: number;
    maxCap: number;
    isWithinCap: boolean;
    isRecipientWhitelisted: boolean;
    predicateProofTag: string;
    evaluatedAt: string;
  };
}

/**
 * Client-Side Policy Predicate Verifier
 * Evaluates bounded range checks (amount <= max_cap) and allowlist membership
 * prior to assembling the zero-knowledge STRK20 transaction.
 */
export function verifyPolicyPredicate(
  amount: number,
  usdRate: number,
  recipientAddress: string,
  policy: SpendingPolicy
): PolicyVerificationResult {
  const usdValue = amount * usdRate;
  const isWithinCap = usdValue <= policy.maxTransactionCap;

  const isRecipientWhitelisted =
    policy.approvedRecipients.length === 0 ||
    policy.approvedRecipients.some(
      (r) => r.address.toLowerCase() === recipientAddress.toLowerCase()
    );

  const predicateProofTag = `POLICY_PREDICATE_CAP_${policy.maxTransactionCap}_USDC`;

  if (!isWithinCap) {
    return {
      valid: false,
      error: `POLICY VIOLATION: Transaction value ($${usdValue.toLocaleString()} USD) exceeds vault maximum cap ($${policy.maxTransactionCap.toLocaleString()} USD). Zero-knowledge range check circuit will fail.`,
      telemetry: {
        spentAmount: usdValue,
        maxCap: policy.maxTransactionCap,
        isWithinCap: false,
        isRecipientWhitelisted,
        predicateProofTag,
        evaluatedAt: new Date().toISOString(),
      },
    };
  }

  if (!isRecipientWhitelisted) {
    return {
      valid: false,
      error: `POLICY VIOLATION: Recipient ${recipientAddress} is not present on the vault's approved allowlist.`,
      telemetry: {
        spentAmount: usdValue,
        maxCap: policy.maxTransactionCap,
        isWithinCap: true,
        isRecipientWhitelisted: false,
        predicateProofTag,
        evaluatedAt: new Date().toISOString(),
      },
    };
  }

  return {
    valid: true,
    telemetry: {
      spentAmount: usdValue,
      maxCap: policy.maxTransactionCap,
      isWithinCap: true,
      isRecipientWhitelisted: true,
      predicateProofTag,
      evaluatedAt: new Date().toISOString(),
    },
  };
}
