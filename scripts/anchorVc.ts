import { ethers } from "hardhat";
import { readFileAsBuffer, toKeccakHex, getContractAddr } from "./util";
import { getSignerForActor } from "./signers";

async function main() {
  const subject = process.env.SUBJECT_DID || "did:secuweb:product:batch123";
  const issuerDid = process.env.ISSUER_DID || "did:secuweb:consortium";
  const actor = process.env.ACTOR || "consortium";
  const vcPath = process.env.VC || "data/vcs/sample-credential.jsonld";
  const metadataURI = process.env.METADATA_URI || "";
  const contractAddr = process.env.CONTRACT || getContractAddr();

  const buf = readFileAsBuffer(vcPath);
  const vcHash = toKeccakHex(buf);

  const signer = await getSignerForActor(actor);
  const reg = await ethers.getContractAt("DIDRegistry", contractAddr, signer);
  // issuerDid arg is consumed by the DIDRegistry signature change in Phase 3.
  const tx = await reg.anchorCredential(subject, issuerDid, vcHash, metadataURI);
  const rc = await tx.wait();
  console.log("Anchored VC for subject:", subject, "issuerDid:", issuerDid, "issuer:", await signer.getAddress(), "vcHash:", vcHash);
  console.log("Tx:", rc?.hash);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
