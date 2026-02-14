/**
 * Sign-In with Solana (SIWS) - verify wallet ownership via message signing.
 */
import nacl from "tweetnacl";
import bs58 from "bs58";
import { randomBytes } from "crypto";

const DOMAIN = "favours.xyz";
const NONCE_EXPIRY_MINUTES = 5;

export function generateNonce(): string {
  return randomBytes(32).toString("hex");
}

export function buildSignMessage(nonce: string, issuedAt: string): string {
  return [
    `${DOMAIN} wants you to sign in with your Solana account:`,
    "",
    "Sign in to continue",
    "",
    `URI: https://${DOMAIN}`,
    "Version: 1",
    "Chain ID: mainnet",
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

export function verifySignature(
  message: string,
  signatureBase64: string,
  walletAddress: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signatureBase64, "base64");
    const publicKeyBytes = bs58.decode(walletAddress);

    if (signatureBytes.length !== 64 || publicKeyBytes.length !== 32) {
      return false;
    }

    return nacl.sign.detached.verify(
      messageBytes,
      new Uint8Array(signatureBytes),
      new Uint8Array(publicKeyBytes)
    );
  } catch {
    return false;
  }
}

export function getNonceExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + NONCE_EXPIRY_MINUTES);
  return expiry;
}
