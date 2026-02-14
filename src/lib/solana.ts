/**
 * Solana utilities for building payment transactions.
 * Used client-side with the connected wallet to pay bounties.
 */
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

export function getConnection() {
  return new Connection(RPC_URL, "confirmed");
}

/**
 * Build a SOL transfer transaction.
 */
export async function buildSolTransferTx(params: {
  from: string;
  to: string;
  amountSol: number;
}): Promise<Transaction> {
  const connection = getConnection();
  const fromPubkey = new PublicKey(params.from);
  const toPubkey = new PublicKey(params.to);
  const lamports = Math.round(params.amountSol * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    })
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = fromPubkey;

  return tx;
}

/**
 * Confirm a transaction on-chain.
 */
export async function confirmTransaction(signature: string) {
  const connection = getConnection();
  const latestBlockhash = await connection.getLatestBlockhash();
  return connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });
}

/**
 * Get SOL balance for a wallet.
 */
export async function getSolBalance(walletAddress: string): Promise<number> {
  const connection = getConnection();
  const pubkey = new PublicKey(walletAddress);
  const lamports = await connection.getBalance(pubkey);
  return lamports / LAMPORTS_PER_SOL;
}
