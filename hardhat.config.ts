import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import { task } from "hardhat/config";

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  
  for (const account of accounts) {
    console.log(account)
    console.log(account.address);
  }
});

// Per-actor signing keys for non-dev chains (Option A). Order must match
// scripts/signers.ts ACTOR_INDEX. Unset keys are dropped, so set all together.
const actorKeys = [
  process.env.ACTOR_PK_CONSORTIUM,
  process.env.ACTOR_PK_FARMER,
  process.env.ACTOR_PK_PACKAGER,
  process.env.ACTOR_PK_TRANSPORTER,
  process.env.ACTOR_PK_RETAILER,
].filter((key): key is string => Boolean(key));

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    hardhat: {},
    // Non-dev chain: set RPC_URL, CHAIN_ID, and ACTOR_PK_* in the environment.
    // On a non-31337 chain, update the eip155:<chainId> prefix in
    // data/did-docs/*.did.json. Each actor account needs gas before use.
    testnet: {
      url: process.env.RPC_URL || "http://127.0.0.1:8545",
      accounts: actorKeys,
      chainId: process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : undefined,
    },
  }
};
export default config;
