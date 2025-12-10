import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const factory = await ethers.getContractFactory("DIDRegistry");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("DIDRegistry deployed to:", addr);

  const dir = path.resolve(__dirname, "../cache");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "contract.json"), JSON.stringify({ address: addr }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
