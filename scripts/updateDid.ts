import { ethers } from "hardhat";
import { readFileAsBuffer, toKeccakHex, getContractAddr } from "./util";
import { getSignerForActor } from "./signers";

async function main() {
  const did = process.env.DID || "did:secuweb:alice";
  const docPath = process.env.DOC || "data/did-docs/alice.did.json";
  const actor = process.env.ACTOR || "consortium";
  const contractAddr = process.env.CONTRACT || getContractAddr();
  const buf = readFileAsBuffer(docPath);
  const docHash = toKeccakHex(buf);

  const signer = await getSignerForActor(actor);
  const reg = await ethers.getContractAt("DIDRegistry", contractAddr, signer);
  const tx = await reg.updateDID(did, docHash);
  const rc = await tx.wait();
  console.log("Updated DID:", did, "controller:", await signer.getAddress(), "new docHash:", docHash);
  console.log("Tx:", rc?.hash);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
