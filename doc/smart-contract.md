<!-- omit in toc -->
# Smart Contract

- [`contracts/DIDRegistry.sol`](#contractsdidregistrysol)
  - [State](#state)
  - [Events](#events)
  - [Functions](#functions)

## `contracts/DIDRegistry.sol`

This contract enables **on-chain anchoring** of DIDs and VCs, allowing us to keep the actual DID Document and VC **off-chain** (e.g., Solid Pod, IPFS) while still verifying integrity via the on-chain hash.

### State

- `mapping(bytes32 => DIDRecord) dids`
  - key: `keccak256(didString)`
  - `DIDRecord { address controller; bytes32 docHash; bool active; }`
- `mapping(bytes32 => VCAnchor) vcAnchors`
  - key: `vcHash` (keccak256 of full VC bytes)
  - `VCAnchor { string subjectDid; address issuer; bytes32 vcHash; string metadataURI; uint256 timestamp; }`
- `mapping(bytes32 => bytes32[]) subjectToVCs`
  - key: `keccak256(subjectDid)`, value: list of anchored `vcHash`es

### Events

- `DIDRegistered(string did, address controller, bytes32 docHash)`
- `DIDUpdated(string did, bytes32 newDocHash)`
- `DIDDeactivated(string did)`
- `VCAnchored(string subjectDid, address issuer, bytes32 vcHash, string metadataURI)`

### Functions

- `registerDID(string did, bytes32 docHash)`
  - Reverts if DID exists.
  - `msg.sender` becomes the **controller**.
- `updateDID(string did, bytes32 newDocHash)`
  - Only **controller** & **active** DIDs.
  - Updates the DID Document **hash** (off-chain content can change, on-chain hash tracks the new version).
- `deactivateDID(string did)`
  - Only controller; flips `active=false`. (No reactivation provided in minimal demo.)
- `getDID(string did) -> (controller, docHash, active)`
  - Simple resolve.
- `anchorCredential(string subjectDid, bytes32 vcHash, string metadataURI)`
  - Reverts if `vcAnchors[vcHash]` already exists.
  - Records `(subjectDid, issuer=msg.sender, vcHash, metadataURI, timestamp)`.
- `getSubjectVCs(string subjectDid) -> bytes32[]`
  - Lists all `vcHash`es anchored for a subject.
