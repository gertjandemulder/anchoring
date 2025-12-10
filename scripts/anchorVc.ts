import { ethers } from "hardhat";
import { readFileAsBuffer, toKeccakHex, getContractAddr } from "./util";

async function main() {
  const subject = process.env.SUBJECT_DID || "did:secuweb:product:batch123";
  const vcPath = process.env.VC || "data/vcs/sample-credential.jsonld";
  const metadataURI = process.env.METADATA_URI || "";
  const contractAddr = process.env.CONTRACT || getContractAddr();

  const buf = readFileAsBuffer(vcPath);
  const vcHash = toKeccakHex(buf);

  const reg = await ethers.getContractAt("DIDRegistry", contractAddr);
  const tx = await reg.anchorCredential(subject, vcHash, metadataURI);
  const rc = await tx.wait();
  console.log("Anchored VC for subject:", subject, "vcHash:", vcHash);
  console.log("Tx:", rc?.hash);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
