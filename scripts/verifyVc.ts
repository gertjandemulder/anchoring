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
  const SUBJECT_DID = process.env.SUBJECT_DID || "did:secuweb:product:batch123";
  const VC = process.env.VC || "data/vcs/sample-credential.jsonld"; // file path or URL
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const contractAddr = process.env.CONTRACT || getContractAddr();

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const registry = new ethers.Contract(contractAddr, (artifact as any).abi, provider);

  const buf = await readAsBuffer(VC);
  const vcHash = ethers.keccak256(buf);

  const anchor = await (registry as any).vcAnchors(vcHash);
  const exists = anchor && anchor.timestamp && Number(anchor.timestamp) > 0;
  const subjectMatch = exists && anchor.subjectDid === SUBJECT_DID;

  const result = {
    contract: contractAddr,
    subjectExpected: SUBJECT_DID,
    vcHash,
    anchor: exists ? {
      subjectDid: anchor.subjectDid,
      issuer: anchor.issuer,
      vcHash: anchor.vcHash,
      metadataURI: anchor.metadataURI,
      timestamp: Number(anchor.timestamp)
    } : null,
    anchored: !!exists,
    subjectMatches: !!subjectMatch
  };

  console.log(JSON.stringify(result, null, 2));

  if (!exists || !subjectMatch) {
    console.error("VC not anchored or subject DID mismatch.");
    process.exitCode = 1;
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });