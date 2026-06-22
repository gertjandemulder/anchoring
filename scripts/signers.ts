import { ethers } from "hardhat";
import { Wallet, type Signer } from "ethers";

/**
 * Single seam for per-actor signing.
 *
 * Every script/flow asks for "the farmer's signer" without knowing where the
 * key lives. Swapping the key-custody model later touches only this file.
 *
 *   Dev  (Option C): the Hardhat account at the actor's fixed index below
 *                    (pre-funded, deterministic from the default mnemonic).
 *   Prod (Option A): the actor's own secp256k1 key, supplied out-of-band as
 *                    ACTOR_PK_<ACTOR> (e.g. ACTOR_PK_FARMER) — a keystore/KMS
 *                    integration is a drop-in replacement here.
 *
 * Keep ACTOR_INDEX in sync with dev/fixtures/actors.json and the dev account
 * map. Confirm the resulting addresses with: npx hardhat accounts.
 */
const ACTOR_INDEX: Record<string, number> = {
  consortium: 0, // deployer / governance
  farmer: 1, // issuer
  packager: 2, // issuer
  transporter: 3, // issuer
  retailer: 4, // issuer
};

/**
 * Resolve the signer for an actor.
 *
 * @param actor lowercase actor name (e.g. "farmer"), matching actors.json keys.
 * @returns a signer whose address is the actor's on-chain identity, so any
 *   transaction it sends records that actor as `msg.sender`.
 */
export async function getSignerForActor(actor: string): Promise<Signer> {
  // Option A (prod): per-actor private key from the environment.
  const pk = process.env[`ACTOR_PK_${actor.toUpperCase()}`];
  if (pk) {
    return new Wallet(pk, ethers.provider);
  }

  // Option C (dev): deterministic Hardhat account at the actor's fixed index.
  const idx = ACTOR_INDEX[actor];
  if (idx === undefined) {
    throw new Error(`No signer mapping for actor "${actor}"`);
  }
  const signers = await ethers.getSigners();
  if (idx >= signers.length) {
    throw new Error(
      `Signer index ${idx} out of range for actor "${actor}" (${signers.length} accounts available)`,
    );
  }
  return signers[idx];
}
