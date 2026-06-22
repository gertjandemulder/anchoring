import { ethers } from "hardhat";
import { getContractAddr, readFileAsBuffer, toKeccakHex } from "./util";
import { getSignerForActor } from "./signers";

// Each actor registers its own DID, so the on-chain controller is the actor's
// address. consortium is the deployer/governance, not a supply-chain VC issuer,
// so it is intentionally not registered here.
const ACTORS = ["farmer", "packager", "transporter", "retailer"];

async function main() {
  const contractAddr = process.env.CONTRACT || getContractAddr();

  for (const actor of ACTORS) {
    const did = `did:secuweb:${actor}`;
    const docHash = toKeccakHex(readFileAsBuffer(`data/did-docs/${actor}.did.json`));
    const signer = await getSignerForActor(actor);
    const reg = await ethers.getContractAt("DIDRegistry", contractAddr, signer);
    const tx = await reg.registerDID(did, docHash);
    const rc = await tx.wait();
    console.log(`Registered ${did} controller=${await signer.getAddress()} docHash=${docHash}`);
    console.log("Tx:", rc?.hash);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
