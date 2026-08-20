import type { constants } from "starknet";
import type { ProofInvocationFactoryDetails } from "../interfaces.js";

export function getDefaultProofDetails(chainId: constants.StarknetChainId): ProofInvocationFactoryDetails {
  return {
    nonce: "0x0",
    version: "0x3",
    chainId,
    resourceBounds: {
      l1_gas: { max_amount: "0x0", max_price_per_unit: "0x0" },
      l2_gas: { max_amount: "0x0", max_price_per_unit: "0x0" },
    },
  } as unknown as ProofInvocationFactoryDetails;
}

export function extractExecuteViewCalldata(calldata: string[]): string[] {
  return calldata;
}
