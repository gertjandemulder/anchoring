// scripts/exploreChain.ts
import fs from "fs";
import path from "path";
import {ethers, EventLog} from "ethers";

async function main() {
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const cachePath = path.join(__dirname, "..", "cache", "contract.json");
  const addr = JSON.parse(fs.readFileSync(cachePath, "utf8")).address as string;

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "DIDRegistry.sol",
    "DIDRegistry.json",
  );
  const abi = JSON.parse(fs.readFileSync(artifactPath, "utf8")).abi;

  const reg = new ethers.Contract(addr, abi, provider);

  // --- Events
  const didReg = await reg.queryFilter(reg.filters.DIDRegistered(), 0, "latest");
  const didUpd = await reg.queryFilter(reg.filters.DIDUpdated(), 0, "latest");
  const didDea = await reg.queryFilter(reg.filters.DIDDeactivated(), 0, "latest");
  const vcAnch = await reg.queryFilter(reg.filters.VCAnchored(), 0, "latest");

  console.log("\n== Summary ==");
  console.table([
    { event: "DIDRegistered", count: didReg.length },
    { event: "DIDUpdated",    count: didUpd.length },
    { event: "DIDDeactivated",count: didDea.length },
    { event: "VCAnchored",    count: vcAnch.length },
  ]);

  // --- DID state snapshot (for all registered DIDs)
  const dids = Array.from(new Set(didReg.filter((e): e is EventLog => "args" in e).map(e => (e.args?.[0] as string))));
  const snap: Array<{did:string; controller:string; docHash:string; active:boolean}> = [];
  for (const did of dids) {
    const [controller, docHash, active] = await reg.getDID(did);
    snap.push({ did, controller, docHash, active });
  }
  console.log("\n== DID Snapshot ==");
  console.table(snap);

  // --- VC anchors
  const vcRows = vcAnch
    .filter((e): e is EventLog => "args" in e)
    .map(e => ({
    block: e.blockNumber,
    tx: e.transactionHash,
    subjectDid: e.args?.[0] as string,
    issuer: e.args?.[1] as string,
    vcHash: e.args?.[2] as string,
    metadataURI: e.args?.[3] as string,
  }));
  console.log("\n== VC Anchors ==");
  console.table(vcRows);

  // --- Subject → vcHash[] index
  const index = new Map<string, string[]>();
  for (const r of vcRows) {
    const arr = index.get(r.subjectDid) || [];
    arr.push(r.vcHash);
    index.set(r.subjectDid, arr);
  }
  console.log("\n== Subject → vcHash[] ==");
  for (const [subject, hashes] of index.entries()) {
    console.log(subject, "→", hashes.length ? hashes.join(", ") : "(none)");
  }
}

main().catch(err => { console.error(err); process.exit(1); });