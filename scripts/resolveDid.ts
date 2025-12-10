import { ethers } from "hardhat";
import { getContractAddr } from "./util";

async function main() {
  const did = process.env.DID || "did:secuweb:alice";
  const contractAddr = process.env.CONTRACT || getContractAddr();
  const reg = await ethers.getContractAt("DIDRegistry", contractAddr);
  const [controller, docHash, active] = await reg.getDID(did);
  console.log(JSON.stringify({ did, controller, docHash, active }, null, 2));
}

main().catch((e)=>{ console.error(e); process.exit(1); });
