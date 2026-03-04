// scripts/exploreChain.ts
import { Explorer } from "../src/controllers/explorer";

async function main() {
  const explorer = new Explorer();
  const overview = await explorer.getOverview();

  console.log("\n== Summary ==");
  console.table(overview.summary);

  console.log("\n== Recent Blocks ==");
  console.table(overview.blocks);

  console.log("\n== Recent Activity ==");
  console.table(overview.activity);

  console.log("\n== DID Snapshot ==");
  console.table(overview.dids);

  console.log("\n== VC Anchors ==");
  console.table(overview.vcAnchors);

  console.log("\n== Subject → vcHash[] ==");
  for (const row of overview.subjects) {
    console.log(row.subjectDid, "→", row.vcHashes.length ? row.vcHashes.join(", ") : "(none)");
  }
}

main().catch(err => { console.error(err); process.exit(1); });
