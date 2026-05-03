import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand
} from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });

// --- USERS (auto-sorted, ALL stays first)
const USERS = [
  "ALL",
  ...[
    "alice@corp.com",
    "bob@corp.com",
    "eve@corp.com",
    "nora@corp.com",
    "liam@corp.com",
    "maya@corp.com",
    "rachel@corp.com",
    "owen@corp.com",
    "priya@corp.com",
    "sam@corp.com",
    "jules@corp.com",
    "zara@corp.com",
    "noah@corp.com",
    "felix@corp.com",
    "irene@corp.com",
    "tessa@corp.com",
    "viktor@corp.com",
    "elena@corp.com",
    "aarav@corp.com",
    "bianca@corp.com",
    "caleb@corp.com",
    "dina@corp.com",
    "ethan@corp.com",
    "farah@corp.com",
    "gavin@corp.com",
    "hana@corp.com",
    "isaac@corp.com",
    "joana@corp.com",
    "kiran@corp.com",
    "luca@corp.com",
    "maria@corp.com",
    "nikhil@corp.com",
    "olga@corp.com",
    "pavel@corp.com",
    "quinn@corp.com",
    "rina@corp.com",
    "soren@corp.com",
    "tara@corp.com",
    "umar@corp.com",
    "val@corp.com"
  ].sort()
];

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || "GET";

  let query = "";
  let userEmail = "bob@corp.com";
  let dateRange = "all";

  if (method === "POST") {
    const decoded = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf-8")
      : event.body;

    const params = new URLSearchParams(decoded);

    query = params.get("query") || "";
    userEmail = params.get("user") || userEmail;
    dateRange = params.get("dateRange") || "all";
  }

  if (method === "GET" || !query) {
    return htmlPage("", userEmail, query, [], dateRange);
  }

  // --- filters
  const filters = [];

  if (userEmail !== "ALL") {
    filters.push({
      equals: {
        key: "userAccess",
        value: userEmail
      }
    });
  }

  const now = Math.floor(Date.now() / 1000);

  const ranges = {
    "1m": 30 * 24 * 60 * 60,
    "3m": 90 * 24 * 60 * 60,
    "6m": 180 * 24 * 60 * 60,
    "1y": 365 * 24 * 60 * 60,
    "2y": 730 * 24 * 60 * 60
  };

  if (dateRange !== "all" && ranges[dateRange]) {
    filters.push({
      greaterThanOrEquals: {
        key: "timestamp",
        value: now - ranges[dateRange]
      }
    });
  }

  let filter;
  if (filters.length === 1) filter = filters[0];
  if (filters.length > 1) filter = { andAll: filters };

  try {
    const command = new RetrieveAndGenerateCommand({
      input: { text: query },
      retrieveAndGenerateConfiguration: {
        type: "KNOWLEDGE_BASE",
        knowledgeBaseConfiguration: {
          knowledgeBaseId: "OVXXXXXXXXX",
          modelArn:
            "arn:aws:bedrock:us-east-1:111111111111:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0",
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: 50,
              ...(filter ? { filter } : {})
            }
          }
        }
      }
    });

    const response = await client.send(command);
    const answer = response.output?.text || "No response";

    // --- group emails
    const grouped = new Map();

    for (const citation of response.citations || []) {
      for (const ref of citation.retrievedReferences || []) {
        const uri = ref.location?.s3Location?.uri || "unknown";
        const text = ref.content?.text || "";

        if (!grouped.has(uri)) {
          grouped.set(uri, { source: uri, texts: [] });
        }

        const entry = grouped.get(uri);
        if (!entry.texts.includes(text)) {
          entry.texts.push(text);
        }
      }
    }

    const sources = Array.from(grouped.values());

    return htmlPage(answer, userEmail, query, sources, dateRange);

  } catch (err) {
    return htmlPage("ERROR: " + err.message, userEmail, query, [], dateRange);
  }
};

// --- HTML
function htmlPage(answer, userEmail, query, sources, dateRange) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: `
<html>
<body style="font-family:sans-serif; max-width:900px; margin:auto;">

<h2>RAG Demo</h2>

<form method="POST">

<label>User:</label>
<select name="user">
  ${USERS.map(u => opt(u, userEmail)).join("")}
</select>

<br/><br/>

<label>Date range:</label>
<select name="dateRange">
  ${opt("all", dateRange, "All time")}
  ${opt("1m", dateRange, "Last month")}
  ${opt("3m", dateRange, "Last 3 months")}
  ${opt("6m", dateRange, "Last 6 months")}
  ${opt("1y", dateRange, "Last year")}
  ${opt("2y", dateRange, "Last 2 years")}
</select>

<br/><br/>

<input name="query" value="${esc(query)}"
       style="width:100%; padding:8px"
       placeholder="Ask something"/>

<br/><br/>

<button type="submit">Ask</button>

</form>

<hr/>

<b>User:</b> ${userEmail}<br/>
<b>Date filter:</b> ${dateRange}

<h3>Summary (LLM)</h3>
<pre style="background:#f5f5f5; padding:10px; white-space: pre-wrap; word-break: break-word;">
${esc(answer)}
</pre>

<h3>Emails used to generate this summary (not exhaustive)</h3>
${
  sources.length === 0
    ? "<i>No sources</i>"
    : sources.map((s, i) => `
<div style="border:1px solid #ddd; padding:10px; margin-bottom:15px;">
  <b>Email ${i + 1}</b><br/>
  <b>Source:</b> ${esc(s.source)}<br/><br/>
  <pre style="white-space: pre-wrap; word-break: break-word; background:#fafafa; padding:10px;">
${esc(s.texts.join("\n\n---\n\n"))}
</pre>
</div>
`).join("")
}

</body>
</html>
`
  };
}

// helpers
function opt(value, selected, label) {
  const display = value === "ALL" ? "All users" : label || value;
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${display}</option>`;
}

function esc(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}