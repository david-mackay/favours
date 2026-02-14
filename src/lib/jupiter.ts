/**
 * Jupiter integration for token swaps and payments.
 * Uses @jup-ag/api for getting quotes and building swap transactions.
 */
import { createJupiterApiClient } from "@jup-ag/api";

export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const jupiterApi = createJupiterApiClient();

export { jupiterApi };

/**
 * Get a swap quote from Jupiter.
 */
export async function getSwapQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number; // in smallest unit (lamports for SOL)
  slippageBps?: number;
}) {
  return jupiterApi.quoteGet({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: params.slippageBps ?? 50,
  });
}

/**
 * Build a swap transaction from a quote.
 */
export async function buildSwapTransaction(params: {
  quoteResponse: Awaited<ReturnType<typeof jupiterApi.quoteGet>>;
  userPublicKey: string;
}) {
  return jupiterApi.swapPost({
    swapRequest: {
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
    },
  });
}

/**
 * Get token price in USD via Jupiter.
 */
export async function getTokenPrice(mint: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.jup.ag/price/v2?ids=${mint}`
    );
    const data = await res.json();
    return data?.data?.[mint]?.price ?? null;
  } catch {
    return null;
  }
}
