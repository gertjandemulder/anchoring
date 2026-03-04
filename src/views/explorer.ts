export function renderExplorerPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SecuWeb Anchors Block Explorer</title>
  <style>
    :root {
      color-scheme: light;
      font-family: "SF Mono", "Menlo", "Consolas", monospace;
      --bg: #f5f7fb;
      --surface: #ffffff;
      --line: #d4d9e4;
      --text: #142033;
      --muted: #5b6678;
      --accent: #0f766e;
      --accent-ink: #ffffff;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background:
        radial-gradient(circle at top right, rgba(15, 118, 110, 0.12), transparent 30%),
        linear-gradient(180deg, #eef4ff 0%, var(--bg) 42%);
      color: var(--text);
    }

    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }

    header {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    h1, h2 {
      margin: 0;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    h1 {
      font-size: clamp(2rem, 6vw, 3.25rem);
      line-height: 1;
    }

    h2 {
      font-size: 1rem;
      margin-bottom: 12px;
    }

    p {
      margin: 0;
      line-height: 1.5;
    }

    .eyebrow {
      color: var(--accent);
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 10px;
    }

    .lede {
      margin-top: 10px;
      color: var(--muted);
      max-width: 62ch;
    }

    .actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    button,
    a.button {
      border: 0;
      border-radius: 999px;
      padding: 10px 16px;
      font: inherit;
      cursor: pointer;
      background: var(--accent);
      color: var(--accent-ink);
      text-decoration: none;
    }

    a.button.secondary {
      background: transparent;
      color: var(--accent);
      border: 1px solid var(--accent);
    }

    .status {
      display: grid;
      gap: 6px;
      padding: 16px;
      margin-bottom: 20px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: 0 12px 30px rgba(20, 32, 51, 0.06);
    }

    .grid {
      display: grid;
      gap: 20px;
    }

    .cards {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .card,
    .panel {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 12px 30px rgba(20, 32, 51, 0.06);
    }

    .card .label {
      color: var(--muted);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .card .value {
      margin-top: 8px;
      font-size: 1.8rem;
      font-weight: 700;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
    }

    th,
    td {
      padding: 10px 0;
      text-align: left;
      vertical-align: top;
      border-bottom: 1px solid var(--line);
      word-break: break-word;
    }

    th {
      color: var(--muted);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    tbody tr:last-child td {
      border-bottom: 0;
    }

    .mono {
      font-size: 0.85rem;
    }

    .empty {
      color: var(--muted);
      font-style: italic;
    }

    @media (max-width: 720px) {
      main {
        padding-inline: 14px;
      }

      .panel {
        overflow-x: auto;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <p class="eyebrow">SecuWeb Anchors</p>
        <h1>Block Explorer</h1>
        <p class="lede">Live view of the local Hardhat chain, including recent blocks, DID activity, and anchored credentials.</p>
      </div>
      <div class="actions">
        <button id="refresh" type="button">Refresh</button>
        <a class="button secondary" href="/explorer/data" target="_blank" rel="noreferrer">Raw JSON</a>
      </div>
    </header>

    <section id="status" class="status">
      <div>Loading chain data...</div>
    </section>

    <section class="grid">
      <div class="panel">
        <h2>Summary</h2>
        <div id="summary" class="cards"></div>
      </div>

      <div class="panel">
        <h2>Recent Blocks</h2>
        <div id="blocks"></div>
      </div>

      <div class="panel">
        <h2>Recent Activity</h2>
        <div id="activity"></div>
      </div>

      <div class="panel">
        <h2>DID Snapshot</h2>
        <div id="dids"></div>
      </div>

      <div class="panel">
        <h2>VC Anchors</h2>
        <div id="anchors"></div>
      </div>

      <div class="panel">
        <h2>Subject Index</h2>
        <div id="subjects"></div>
      </div>
    </section>
  </main>

  <script>
    const refreshButton = document.getElementById("refresh");
    const statusNode = document.getElementById("status");
    const summaryNode = document.getElementById("summary");
    const blocksNode = document.getElementById("blocks");
    const activityNode = document.getElementById("activity");
    const didsNode = document.getElementById("dids");
    const anchorsNode = document.getElementById("anchors");
    const subjectsNode = document.getElementById("subjects");

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function formatTimestamp(unixSeconds) {
      return new Date(Number(unixSeconds) * 1000).toLocaleString();
    }

    function renderTable(rows, columns, emptyLabel) {
      if (!rows.length) {
        return '<p class="empty">' + escapeHtml(emptyLabel) + '</p>';
      }

      const head = columns
        .map((column) => '<th>' + escapeHtml(column.label) + '</th>')
        .join("");
      const body = rows
        .map((row) => {
          const cells = columns
            .map((column) => {
              const rawValue = typeof column.render === "function" ? column.render(row) : row[column.key];
              const classes = column.className ? ' class="' + escapeHtml(column.className) + '"' : "";
              return '<td' + classes + '>' + escapeHtml(rawValue ?? "") + '</td>';
            })
            .join("");
          return "<tr>" + cells + "</tr>";
        })
        .join("");

      return "<table><thead><tr>" + head + "</tr></thead><tbody>" + body + "</tbody></table>";
    }

    function renderSummary(summary) {
      if (!summary.length) {
        summaryNode.innerHTML = '<p class="empty">No contract activity found yet.</p>';
        return;
      }

      summaryNode.innerHTML = summary
        .map((row) => (
          '<div class="card">' +
            '<div class="label">' + escapeHtml(row.event) + '</div>' +
            '<div class="value">' + escapeHtml(row.count) + '</div>' +
          '</div>'
        ))
        .join("");
    }

    async function load() {
      refreshButton.disabled = true;
      statusNode.innerHTML = "<div>Refreshing chain data...</div>";

      try {
        const response = await fetch("/explorer/data", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        statusNode.innerHTML =
          "<div><strong>Contract:</strong> <span class=\\"mono\\">" + escapeHtml(data.contract) + "</span></div>" +
          "<div><strong>Latest block:</strong> " + escapeHtml(data.latestBlock) + "</div>" +
          "<div><strong>Updated:</strong> " + escapeHtml(new Date(data.generatedAt).toLocaleString()) + "</div>";

        renderSummary(data.summary);
        blocksNode.innerHTML = renderTable(
          data.blocks,
          [
            { key: "number", label: "Block" },
            { key: "hash", label: "Hash", className: "mono" },
            { key: "timestamp", label: "Timestamp", render: (row) => formatTimestamp(row.timestamp) },
            { key: "transactions", label: "Tx Count" }
          ],
          "No blocks found."
        );
        activityNode.innerHTML = renderTable(
          data.activity,
          [
            { key: "block", label: "Block" },
            { key: "event", label: "Event" },
            { key: "details", label: "Details" },
            { key: "tx", label: "Tx Hash", className: "mono" }
          ],
          "No contract events found."
        );
        didsNode.innerHTML = renderTable(
          data.dids,
          [
            { key: "did", label: "DID" },
            { key: "controller", label: "Controller", className: "mono" },
            { key: "docHash", label: "Doc Hash", className: "mono" },
            { key: "active", label: "Active" }
          ],
          "No DIDs registered yet."
        );
        anchorsNode.innerHTML = renderTable(
          data.vcAnchors,
          [
            { key: "block", label: "Block" },
            { key: "subjectDid", label: "Subject" },
            { key: "issuer", label: "Issuer", className: "mono" },
            { key: "vcHash", label: "VC Hash", className: "mono" },
            { key: "metadataURI", label: "Metadata URI" }
          ],
          "No VC anchors found."
        );
        subjectsNode.innerHTML = renderTable(
          data.subjects.map((row) => ({
            subjectDid: row.subjectDid,
            vcHashes: row.vcHashes.join(", ")
          })),
          [
            { key: "subjectDid", label: "Subject" },
            { key: "vcHashes", label: "VC Hashes", className: "mono" }
          ],
          "No subject index available yet."
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        statusNode.innerHTML = '<div class="empty">Failed to load explorer data: ' + escapeHtml(message) + '</div>';
        summaryNode.innerHTML = "";
        blocksNode.innerHTML = "";
        activityNode.innerHTML = "";
        didsNode.innerHTML = "";
        anchorsNode.innerHTML = "";
        subjectsNode.innerHTML = "";
      } finally {
        refreshButton.disabled = false;
      }
    }

    refreshButton.addEventListener("click", load);
    load();
    window.setInterval(load, 15000);
  </script>
</body>
</html>`;
}
