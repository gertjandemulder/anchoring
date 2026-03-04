import { ethers, EventLog, Log } from "ethers";
import { getContractAddr } from "../../scripts/util";
import artifact from "../../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json";

type ExplorerSummary = {
  event: string;
  count: number;
};

type BlockRow = {
  number: number;
  hash: string;
  timestamp: number;
  transactions: number;
};

type ActivityRow = {
  block: number;
  tx: string;
  event: string;
  details: string;
};

type DidRow = {
  did: string;
  controller: string;
  docHash: string;
  active: boolean;
};

type AnchorRow = {
  block: number;
  tx: string;
  subjectDid: string;
  issuer: string;
  vcHash: string;
  metadataURI: string;
};

type SubjectRow = {
  subjectDid: string;
  vcHashes: string[];
};

export type ExplorerOverview = {
  generatedAt: string;
  contract: string;
  latestBlock: number;
  summary: ExplorerSummary[];
  blocks: BlockRow[];
  activity: ActivityRow[];
  dids: DidRow[];
  vcAnchors: AnchorRow[];
  subjects: SubjectRow[];
};

export class Explorer {
  provider: ethers.JsonRpcProvider;
  registry: ethers.Contract;
  contractAddr: string;

  constructor() {
    const rpc = process.env.RPC_URL || "http://127.0.0.1:8545";
    this.contractAddr = getContractAddr();
    this.provider = new ethers.JsonRpcProvider(rpc);
    this.registry = new ethers.Contract(this.contractAddr, (artifact as any).abi, this.provider);
  }

  async getOverview(): Promise<ExplorerOverview> {
    const didRegistered = this.filterEventLogs(
      await this.registry.queryFilter(this.registry.filters.DIDRegistered(), 0, "latest"),
    );
    const didUpdated = this.filterEventLogs(
      await this.registry.queryFilter(this.registry.filters.DIDUpdated(), 0, "latest"),
    );
    const didDeactivated = this.filterEventLogs(
      await this.registry.queryFilter(this.registry.filters.DIDDeactivated(), 0, "latest"),
    );
    const vcAnchored = this.filterEventLogs(
      await this.registry.queryFilter(this.registry.filters.VCAnchored(), 0, "latest"),
    );

    const summary: ExplorerSummary[] = [
      { event: "DIDRegistered", count: didRegistered.length },
      { event: "DIDUpdated", count: didUpdated.length },
      { event: "DIDDeactivated", count: didDeactivated.length },
      { event: "VCAnchored", count: vcAnchored.length },
    ];

    const latestBlock = await this.provider.getBlockNumber();
    const blockCount = Math.min(latestBlock + 1, 10);
    const blockNumbers = Array.from({ length: blockCount }, (_, index) => latestBlock - index);
    const blocks = (
      await Promise.all(blockNumbers.map(async (blockNumber) => this.provider.getBlock(blockNumber)))
    )
      .filter((block): block is NonNullable<typeof block> => block !== null)
      .map((block) => ({
        number: block.number,
        hash: block.hash ?? "",
        timestamp: Number(block.timestamp),
        transactions: block.transactions.length,
      }));

    const dids = await Promise.all(
      Array.from(new Set(didRegistered.map((event) => String(event.args[0])))).map(async (did) => {
        const [controller, docHash, active] = await this.registry.getDID(did);
        return {
          did,
          controller: String(controller),
          docHash: String(docHash),
          active: Boolean(active),
        };
      }),
    );

    const vcAnchors = vcAnchored.map((event) => ({
      block: event.blockNumber,
      tx: event.transactionHash,
      subjectDid: String(event.args[0]),
      issuer: String(event.args[1]),
      vcHash: String(event.args[2]),
      metadataURI: String(event.args[3]),
    }));

    const subjectIndex = new Map<string, string[]>();
    for (const anchor of vcAnchors) {
      const vcHashes = subjectIndex.get(anchor.subjectDid) || [];
      vcHashes.push(anchor.vcHash);
      subjectIndex.set(anchor.subjectDid, vcHashes);
    }

    const subjects = Array.from(subjectIndex.entries())
      .map(([subjectDid, vcHashes]) => ({ subjectDid, vcHashes }))
      .sort((left, right) => left.subjectDid.localeCompare(right.subjectDid));

    const activity = [
      ...didRegistered.map((event) => ({
        block: event.blockNumber,
        tx: event.transactionHash,
        event: "DIDRegistered",
        details: `${String(event.args[0])} by ${String(event.args[1])}`,
      })),
      ...didUpdated.map((event) => ({
        block: event.blockNumber,
        tx: event.transactionHash,
        event: "DIDUpdated",
        details: `${String(event.args[0])} -> ${String(event.args[1])}`,
      })),
      ...didDeactivated.map((event) => ({
        block: event.blockNumber,
        tx: event.transactionHash,
        event: "DIDDeactivated",
        details: String(event.args[0]),
      })),
      ...vcAnchored.map((event) => ({
        block: event.blockNumber,
        tx: event.transactionHash,
        event: "VCAnchored",
        details: `${String(event.args[0])} -> ${String(event.args[2])}`,
      })),
    ].sort((left, right) => right.block - left.block);

    return {
      generatedAt: new Date().toISOString(),
      contract: this.contractAddr,
      latestBlock,
      summary,
      blocks,
      activity,
      dids,
      vcAnchors,
      subjects,
    };
  }

  private filterEventLogs(events: Array<Log | EventLog>): EventLog[] {
    return events.filter((event): event is EventLog => "args" in event);
  }
}
