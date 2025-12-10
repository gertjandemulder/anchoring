import {ethers} from "ethers";
import {getContractAddr} from "../../scripts/util";
import artifact from "../../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json";

export class Verifier {
    provider: ethers.JsonRpcProvider;
    registry: ethers.Contract;
    contractAddr: string;
    
    constructor() {
        const rpc = "http://127.0.0.1:8545";
        this.contractAddr = getContractAddr();
        this.provider = new ethers.JsonRpcProvider(rpc);
        this.registry = new ethers.Contract(this.contractAddr, (artifact as any).abi, this.provider);
    }

    async verifyVc(vc: any): Promise<any> {
        console.log('@chain-service - verifier - verifyVc')
        const VC = JSON.stringify(vc);
        console.log('vc')
        console.log(VC)
        const expectedSubjectDid = vc['credentialSubject']['@id'];
        const buf = Buffer.from(VC);
        const vcHash = ethers.keccak256(buf);
        const anchor = await (this.registry as any).vcAnchors(vcHash);
        const exists = anchor && anchor.timestamp && Number(anchor.timestamp) > 0;
        const subjectMatch = exists && anchor.subjectDid === expectedSubjectDid;

        const result = {
            contract: this.contractAddr,
            subjectExpected: expectedSubjectDid,
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
        console.log('result: ', result)
        return result;
    }

    
}