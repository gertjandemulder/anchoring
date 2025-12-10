<!-- omit in toc  -->
# Scripts

- [Scripts](#scripts)
  - [Deploy: `scripts/deploy.ts`](#deploy-scriptsdeployts)
  - [Register DID: `scripts/registerDid.ts`](#register-did-scriptsregisterdidts)
  - [Update DID: `scripts/updateDid.ts`](#update-did-scriptsupdatedidts)
  - [Anchor VC: `scripts/anchorVc.ts`](#anchor-vc-scriptsanchorvcts)
  - [Resolve DID: `scripts/resolveDid.ts`](#resolve-did-scriptsresolvedidts)
  - [Resolve and verify DID Document: `resolveAndCheckDid.ts`](#resolve-and-verify-did-document-resolveandcheckdidts)
  - [On-chain verification of a VC: `verifyVc.ts`](#on-chain-verification-of-a-vc-verifyvcts)
  - [Explore](#explore)

## Deploy: `scripts/deploy.ts`

**What it does:** Compiles and deploys `DIDRegistry`, then writes:

```json
cache/contract.json
{ "address": "0x..." }
```

**Run:**

```bash
npm run deploy
# or: npx hardhat run scripts/deploy.ts --network localhost
```

**Output (example):**

```plain
DIDRegistry deployed to: 0x5FbD...aa3
```

## Register DID: `scripts/registerDid.ts`

**Purpose:** Create a DID and set its initial DID Document hash.

**Env:**

- `CONTRACT` (optional; otherwise read from `cache/contract.json`)
- `DID` (default `did:secuweb:alice`)
- `DOC` path to JSON (default `data/did-docs/alice.did.json`)

**Run:**

```bash
CONTRACT=0x... DID=did:secuweb:alice DOC=data/did-docs/alice.did.json npx hardhat run scripts/registerDid.ts --network localhost
```

**Notes:**

- The script computes `docHash = keccak256(<DOC raw bytes>)`.
- Reverts if DID already exists.

## Update DID: `scripts/updateDid.ts`

**Purpose:** Update the on-chain `docHash` (e.g., key rotation, new service endpoints).

**Env:** same as register.

**Run:**

```bash
CONTRACT=0x... DID=did:secuweb:alice DOC=data/did-docs/alice.did.json npx hardhat run scripts/updateDid.ts --network localhost
```

**Notes:** Must be called by the **controller** address (the deploying default signer on localhost).

## Anchor VC: `scripts/anchorVc.ts`

**Purpose:** Commit a VC by content hash with an optional URL (e.g., Solid Pod resource).

**Env:**

- `CONTRACT`
- `SUBJECT_DID` (default `did:secuweb:product:batch123`)
- `VC` path to VC JSON-LD bytes (default `data/vcs/sample-credential.jsonld`)
- `METADATA_URI` (optional; empty by default)

**Run:**

```bash
CONTRACT=0x... SUBJECT_DID=did:secuweb:product:batch123 VC=data/vcs/sample-credential.jsonld METADATA_URI=https://pod.example/batch123/vc.json npx hardhat run scripts/anchorVc.ts --network localhost
```

**Notes:** Reverts if `vcHash` already anchored.

## Resolve DID: `scripts/resolveDid.ts`

**Purpose:** Read `(controller, docHash, active)` from chain.

**Env:**

- `CONTRACT`
- `DID` (default `did:secuweb:alice`)

**Run:**

```bash
CONTRACT=0x... DID=did:secuweb:alice npx hardhat run scripts/resolveDid.ts --network localhost
```

**Output (example):**

```json
{
  "did": "did:secuweb:alice",
  "controller": "0xf39F...266",
  "docHash": "0xaea3...460",
  "active": true
}
```

## Resolve and verify DID Document: `resolveAndCheckDid.ts`

**Goal:** Verify your **off-chain DID Document bytes** match the **on-chain `docHash`**.

**Env:**

- `CONTRACT` (or `cache/contract.json`)
- `DID` (default `did:secuweb:alice`)
- `DID_DOC` — **file path or HTTP(S) URL** to the DID Document JSON
- `RPC_URL` (default `http://127.0.0.1:8545`)

**Run:**

```bash
RPC_URL=http://127.0.0.1:8545 CONTRACT=0x... DID=did:secuweb:alice DID_DOC=data/did-docs/alice.did.json npx hardhat run scripts/resolveAndCheckDid.ts --network localhost
```

**Output (example):**

```json
{
  "did": "did:secuweb:alice",
  "contract": "0x5FbD...aa3",
  "controller": "0xf39F...266",
  "active": true,
  "onChainDocHash": "0xaea3...460",
  "computedHash": "0xaea3...460",
  "match": true
}
```

## On-chain verification of a VC: `verifyVc.ts`

**Goal:** Verify that a VC (file or URL) is **anchored** on-chain for the expected `subjectDid`.

**Env:**

- `CONTRACT` (or `cache/contract.json`)
- `SUBJECT_DID` (default `did:secuweb:product:batch123`)
- `VC` — **file path or HTTP(S) URL** to the VC JSON-LD
- `RPC_URL` (default `http://127.0.0.1:8545`)

**Run:**

```bash
RPC_URL=http://127.0.0.1:8545 CONTRACT=0x... SUBJECT_DID=did:secuweb:product:batch123 VC=data/vcs/sample-credential.jsonld npx hardhat run scripts/verifyVc.ts --network localhost
```

**Output (example):**

```json
{
  "contract": "0x5FbD...aa3",
  "subjectExpected": "did:secuweb:product:batch123",
  "vcHash": "0x9821...6c0",
  "anchor": {
    "subjectDid": "did:secuweb:product:batch123",
    "issuer": "0xf39F...266",
    "vcHash": "0x9821...6c0",
    "metadataURI": "",
    "timestamp": 1762131577
  },
  "anchored": true,
  "subjectMatches": true
}
```

## Explore

This script provides an overview consisting of:

- A summary of event counts/
- A live snapshot of all DIDs (controller/docHash/active).
- All VC anchors (block, tx, subjectDid, issuer, vcHash, metadataURI).
- A subject→vcHash[] index.

**Run**:
```bash
npm run explore
```
