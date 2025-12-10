import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { URL } from "url";
import { getContractAddr } from "./util";
import artifact from "../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json";

function isHttp(u: string): boolean { return /^https?:\/\//i.test(u); }

function fetchUrl(u: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(u);
    const lib = urlObj.protocol === "https:" ? https : http;
    const req = lib.get(urlObj, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(Buffer.from(c)));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
  });
}

async function readAsBuffer(p: string): Promise<Buffer> {
  if (isHttp(p)) return await fetchUrl(p);
  return fs.readFileSync(path.resolve(p));
}

async function main() {
  const did = process.env.DID || "did:secuweb:alice";
  const DID_DOC = process.env.DID_DOC || "data/did-docs/alice.did.json"; // file path or URL
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const contractAddr = process.env.CONTRACT || getContractAddr();

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const registry = new ethers.Contract(contractAddr, (artifact as any).abi, provider);

  const [controller, onChainDocHash, active] = await registry.getDID(did);

  const buf = await readAsBuffer(DID_DOC);
  const localHash = ethers.keccak256(buf);

  const match = onChainDocHash.toLowerCase() === localHash.toLowerCase();
  console.log(JSON.stringify({ did, contract: contractAddr, controller, active, onChainDocHash, computedHash: localHash, match }, null, 2));

  if (!match) {
    console.error("Hash mismatch. The off-chain JSON bytes differ from the bytes used during registration.");
    process.exitCode = 1;
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });