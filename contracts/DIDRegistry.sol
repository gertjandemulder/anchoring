// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DIDRegistry {
    struct DIDRecord {
        address controller;
        bytes32 docHash;
        bool active;
    }

    struct VCAnchor {
        string subjectDid;
        address issuer;
        bytes32 vcHash;
        string metadataURI;
        uint256 timestamp;
    }

    mapping(bytes32 => DIDRecord) private dids;
    mapping(bytes32 => VCAnchor) public vcAnchors;
    mapping(bytes32 => bytes32[]) public subjectToVCs;

    event DIDRegistered(string did, address controller, bytes32 docHash);
    event DIDUpdated(string did, bytes32 newDocHash);
    event DIDDeactivated(string did);
    event VCAnchored(string subjectDid, address issuer, bytes32 vcHash, string metadataURI);

    function _didKey(string memory did) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(did));
    }

    function registerDID(string calldata did, bytes32 docHash) external {
        bytes32 k = _didKey(did);
        require(dids[k].controller == address(0), "DID exists");
        dids[k] = DIDRecord({controller: msg.sender, docHash: docHash, active: true});
        emit DIDRegistered(did, msg.sender, docHash);
    }

    function updateDID(string calldata did, bytes32 newDocHash) external {
        bytes32 k = _didKey(did);
        DIDRecord storage rec = dids[k];
        require(rec.controller != address(0), "DID not found");
        require(rec.active, "DID inactive");
        require(msg.sender == rec.controller, "Not controller");
        rec.docHash = newDocHash;
        emit DIDUpdated(did, newDocHash);
    }

    function deactivateDID(string calldata did) external {
        bytes32 k = _didKey(did);
        DIDRecord storage rec = dids[k];
        require(rec.controller != address(0), "DID not found");
        require(rec.active, "DID inactive");
        require(msg.sender == rec.controller, "Not controller");
        rec.active = false;
        emit DIDDeactivated(did);
    }

    function getDID(string calldata did) external view returns (address controller, bytes32 docHash, bool active) {
        DIDRecord memory rec = dids[_didKey(did)];
        return (rec.controller, rec.docHash, rec.active);
    }

    function anchorCredential(string calldata subjectDid, bytes32 vcHash, string calldata metadataURI) external {
        require(vcAnchors[vcHash].timestamp == 0, "VC exists");
        VCAnchor memory a = VCAnchor({
            subjectDid: subjectDid,
            issuer: msg.sender,
            vcHash: vcHash,
            metadataURI: metadataURI,
            timestamp: block.timestamp
        });
        vcAnchors[vcHash] = a;
        subjectToVCs[_didKey(subjectDid)].push(vcHash);
        emit VCAnchored(subjectDid, msg.sender, vcHash, metadataURI);
    }

    function getSubjectVCs(string calldata subjectDid) external view returns (bytes32[] memory) {
        return subjectToVCs[_didKey(subjectDid)];
    }
}
