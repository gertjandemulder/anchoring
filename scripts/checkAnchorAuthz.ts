import { ethers } from "hardhat";
import { readFileAsBuffer, toKeccakHex } from "./util";
import { getSignerForActor } from "./signers";

// Repeatable authorization check for DIDRegistry.anchorCredential.
//
// Deploys an ephemeral DIDRegistry in-process — run with `--network hardhat`
// (no running node or cache/contract.json needed) — and asserts the contract
// enforces issuer identity: only the registered controller of an issuer DID can
// anchor a credential under it. Exits non-zero on any failed assertion.
//
//   npm run check:authz
async function main() {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`  ${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  const expectRevert = async (fn: () => Promise<unknown>, needle: string, label: string) => {
    try {
      await fn();
      check(false, `${label} — expected revert "${needle}", but it succeeded`);
    } catch (e) {
      check(new RegExp(needle).test(String(e)), `${label} — reverts "${needle}"`);
    }
  };

  const deployed = await (await ethers.getContractFactory("DIDRegistry")).deploy();
  await deployed.waitForDeployment();
  const addr = await deployed.getAddress();
  const reader = await ethers.getContractAt("DIDRegistry", addr);

  // Each actor registers its own DID from its real DID document.
  for (const actor of ["farmer", "packager"]) {
    const signer = await getSignerForActor(actor);
    const reg = await ethers.getContractAt("DIDRegistry", addr, signer);
    const docHash = toKeccakHex(readFileAsBuffer(`data/did-docs/${actor}.did.json`));
    await (await reg.registerDID(`did:secuweb:${actor}`, docHash)).wait();
  }

  const farmer = await getSignerForActor("farmer");
  const packager = await getSignerForActor("packager");
  const subject = "did:secuweb:farmer:product-x";
  const vcHash = (seed: string) => ethers.keccak256(ethers.toUtf8Bytes(seed));

  // Positive: the farmer anchors a credential under its own issuer DID.
  const asFarmer = await ethers.getContractAt("DIDRegistry", addr, farmer);
  await (await asFarmer.anchorCredential(subject, "did:secuweb:farmer", vcHash("valid"), "")).wait();
  const anchor = await reader.vcAnchors(vcHash("valid"));
  check(
    anchor.issuerDid === "did:secuweb:farmer" &&
      anchor.issuer.toLowerCase() === (await farmer.getAddress()).toLowerCase(),
    "farmer anchors under its own issuer DID (issuerDid + issuer recorded)",
  );

  // Negative: the packager cannot anchor claiming the farmer's issuer DID.
  const asPackager = await ethers.getContractAt("DIDRegistry", addr, packager);
  await expectRevert(
    () => asPackager.anchorCredential(subject, "did:secuweb:farmer", vcHash("forged"), ""),
    "signer not issuer controller",
    "packager anchoring under did:secuweb:farmer",
  );

  // Negative: anchoring under an unregistered issuer DID.
  await expectRevert(
    () => asFarmer.anchorCredential(subject, "did:secuweb:ghost", vcHash("ghost"), ""),
    "issuer DID not registered",
    "anchoring under an unregistered issuer DID",
  );

  console.log(ok ? "\nAUTHZ CHECK PASS" : "\nAUTHZ CHECK FAIL");
  if (!ok) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
