import { Client } from "@elastic/elasticsearch";

// Elasticsearch client singleton
let esClient: Client | null = null;

export function getElasticsearchClient(): Client {
  if (!esClient) {
    const url = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
    const username = process.env.ELASTICSEARCH_USERNAME || "elastic";
    const password = process.env.ELASTICSEARCH_PASSWORD || "";

    esClient = new Client({
      node: url,
      auth: {
        username,
        password,
      },
      // Disable SSL verification for local dev
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return esClient;
}

// Alert structure from Elasticsearch
export interface ESAlert {
  "@timestamp": string;
  "event.severity"?: string | number;
  "rule.name"?: string;
  "source.ip"?: string;
  "destination.ip"?: string;
  "mitre.tactic"?: string;
  "mitre.technique"?: string;
  "labsoc.source"?: string;
  alert?: {
    signature?: string;
    severity?: number;
    category?: string;
  };
  src_ip?: string;
  dest_ip?: string;
  dest_port?: number;
  proto?: string;
  http?: {
    hostname?: string;
    url?: string;
    http_method?: string;
  };
  dns?: {
    query?: { rrname?: string }[];
  };
  tls?: {
    sni?: string;
    subject?: string;
  };
}

export interface ESAlertHit {
  _id: string;
  _index: string;
  _source: ESAlert;
}

// Search parameters
export interface AlertSearchParams {
  indices?: string[];
  from?: number;
  size?: number;
  severity?: string;
  source?: string;
  timeRange?: {
    from: string;
    to: string;
  };
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

// Normalized alert format for Morakib
export interface NormalizedAlert {
  id: string;
  index: string;
  timestamp: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source: string;
  sourceIP: string | null;
  destinationIP: string | null;
  destinationPort: number | null;
  protocol: string | null;
  mitreTactic: string | null;
  mitreTechnique: string | null;
  category: string | null;
  rawData: ESAlert;
}

// Map severity values to standard levels
function normalizeSeverity(
  severity: string | number | undefined
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (!severity) return "LOW";
  
  const s = typeof severity === "number" ? severity : parseInt(severity, 10);
  
  if (!isNaN(s)) {
    if (s >= 4) return "CRITICAL";
    if (s >= 3) return "HIGH";
    if (s >= 2) return "MEDIUM";
    return "LOW";
  }
  
  const strSev = String(severity).toUpperCase();
  if (strSev.includes("CRITICAL") || strSev.includes("CRIT")) return "CRITICAL";
  if (strSev.includes("HIGH") || strSev.includes("MAJOR")) return "HIGH";
  if (strSev.includes("MEDIUM") || strSev.includes("MED")) return "MEDIUM";
  return "LOW";
}

// Normalize ES alert to Morakib format
export function normalizeAlert(hit: ESAlertHit): NormalizedAlert {
  const src = hit._source;
  
  // Get title from various possible fields
  const title =
    src["rule.name"] ||
    src.alert?.signature ||
    "Unknown Alert";

  // Get severity
  const rawSeverity =
    src["event.severity"] ||
    src.alert?.severity;

  // Get IPs
  const sourceIP = src["source.ip"] || src.src_ip || null;
  const destinationIP = src["destination.ip"] || src.dest_ip || null;

  // Get source (suricata, zeek, etc.)
  const source = src["labsoc.source"] || hit._index.split("-")[0] || "unknown";

  return {
    id: hit._id,
    index: hit._index,
    timestamp: src["@timestamp"],
    title,
    severity: normalizeSeverity(rawSeverity),
    source,
    sourceIP,
    destinationIP,
    destinationPort: src.dest_port || null,
    protocol: src.proto || null,
    mitreTactic: src["mitre.tactic"] || null,
    mitreTechnique: src["mitre.technique"] || null,
    category: src.alert?.category || null,
    rawData: src,
  };
}

// Search alerts in Elasticsearch
export async function searchAlerts(
  params: AlertSearchParams = {}
): Promise<{ alerts: NormalizedAlert[]; total: number }> {
  const client = getElasticsearchClient();

  const {
    indices = ["labsoc-alerts*", "suricata-*", "zeek-*"],
    from = 0,
    size = 50,
    severity,
    source,
    timeRange,
    search,
    sortField = "@timestamp",
    sortOrder = "desc",
  } = params;

  // Build query
  const must: object[] = [];
  const filter: object[] = [];

  // Time range filter
  if (timeRange) {
    filter.push({
      range: {
        "@timestamp": {
          gte: timeRange.from,
          lte: timeRange.to,
        },
      },
    });
  } else {
    // Default: last 24 hours
    filter.push({
      range: {
        "@timestamp": {
          gte: "now-24h",
          lte: "now",
        },
      },
    });
  }

  // Severity filter
  if (severity) {
    const severityMap: Record<string, number[]> = {
      CRITICAL: [4, 5],
      HIGH: [3],
      MEDIUM: [2],
      LOW: [1, 0],
    };
    const levels = severityMap[severity.toUpperCase()];
    if (levels) {
      filter.push({
        bool: {
          should: [
            { terms: { "event.severity": levels } },
            { terms: { "alert.severity": levels } },
          ],
        },
      });
    }
  }

  // Source filter (suricata, zeek, etc.)
  if (source) {
    filter.push({
      term: { "labsoc.source": source },
    });
  }

  // Full-text search
  if (search) {
    must.push({
      multi_match: {
        query: search,
        fields: [
          "rule.name",
          "alert.signature",
          "source.ip",
          "destination.ip",
          "mitre.technique",
          "http.hostname",
        ],
        type: "best_fields",
        fuzziness: "AUTO",
      },
    });
  }

  const query = {
    bool: {
      must: must.length > 0 ? must : [{ match_all: {} }],
      filter,
    },
  };

  try {
    const response = await client.search({
      index: indices.join(","),
      from,
      size,
      sort: [{ [sortField]: { order: sortOrder } }],
      query,
    });

    const hits = response.hits.hits as unknown as ESAlertHit[];
    const total =
      typeof response.hits.total === "number"
        ? response.hits.total
        : response.hits.total?.value || 0;

    return {
      alerts: hits.map(normalizeAlert),
      total,
    };
  } catch (error) {
    console.error("Elasticsearch search error:", error);
    throw error;
  }
}

// Get alert by ID
export async function getAlertById(
  index: string,
  id: string
): Promise<NormalizedAlert | null> {
  const client = getElasticsearchClient();

  try {
    const response = await client.get({
      index,
      id,
    });

    if (!response.found) return null;

    return normalizeAlert({
      _id: response._id,
      _index: response._index,
      _source: response._source as ESAlert,
    });
  } catch (error) {
    console.error("Elasticsearch get error:", error);
    return null;
  }
}

// Get aggregated stats
export async function getAlertStats(
  timeRange: { from: string; to: string } = { from: "now-24h", to: "now" }
): Promise<{
  total: number;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
  byHour: { key: string; count: number }[];
}> {
  const client = getElasticsearchClient();

  try {
    const response = await client.search({
      index: "labsoc-alerts*,suricata-*,zeek-*",
      size: 0,
      query: {
        range: {
          "@timestamp": {
            gte: timeRange.from,
            lte: timeRange.to,
          },
        },
      },
      aggs: {
        by_severity: {
          terms: { field: "event.severity.keyword", missing: "unknown" },
        },
        by_source: {
          terms: { field: "labsoc.source.keyword", missing: "unknown" },
        },
        by_hour: {
          date_histogram: {
            field: "@timestamp",
            fixed_interval: "1h",
          },
        },
      },
    });

    const aggs = response.aggregations as {
      by_severity?: { buckets: { key: string; doc_count: number }[] };
      by_source?: { buckets: { key: string; doc_count: number }[] };
      by_hour?: { buckets: { key_as_string: string; doc_count: number }[] };
    };

    const total =
      typeof response.hits.total === "number"
        ? response.hits.total
        : response.hits.total?.value || 0;

    // Normalize severity values to standard CRITICAL/HIGH/MEDIUM/LOW
    const bySeverity: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    
    aggs.by_severity?.buckets.forEach((b) => {
      const key = String(b.key).toLowerCase();
      // Map various severity representations
      if (key === "4" || key === "5" || key === "critical") {
        bySeverity.CRITICAL += b.doc_count;
      } else if (key === "3" || key === "high") {
        bySeverity.HIGH += b.doc_count;
      } else if (key === "2" || key === "medium" || key === "" || key === "unknown") {
        bySeverity.MEDIUM += b.doc_count;
      } else if (key === "1" || key === "0" || key === "low" || key === "info") {
        bySeverity.LOW += b.doc_count;
      } else {
        // Default to MEDIUM for unknown values
        bySeverity.MEDIUM += b.doc_count;
      }
    });

    const bySource: Record<string, number> = {};
    aggs.by_source?.buckets.forEach((b) => {
      bySource[b.key] = b.doc_count;
    });

    const byHour =
      aggs.by_hour?.buckets.map((b) => ({
        key: b.key_as_string,
        count: b.doc_count,
      })) || [];

    return { total, bySeverity, bySource, byHour };
  } catch (error) {
    console.error("Elasticsearch stats error:", error);
    return { total: 0, bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }, bySource: {}, byHour: [] };
  }
}

// Test connection
export async function testConnection(): Promise<boolean> {
  const client = getElasticsearchClient();
  try {
    const response = await client.ping();
    return response === true;
  } catch {
    return false;
  }
}
