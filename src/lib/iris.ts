/**
 * IRIS DFIR Platform Integration
 * API Service for exporting alerts and creating cases in IRIS
 * 
 * IRIS is an open-source DFIR (Digital Forensics and Incident Response) platform
 * Docs: https://dfir-iris.org/
 */

interface IRISConfig {
  baseUrl: string;
  apiKey: string;
}

interface IRISCustomer {
  customer_id: number;
  customer_name: string;
}

interface IRISCase {
  case_id: number;
  case_name: string;
  case_description: string;
  case_customer: number;
  case_soc_id: string;
  case_open_date: string;
  classification_id: number;
  state_id: number;
}

interface IRISCaseCreate {
  case_name: string;
  case_description: string;
  case_customer: number;
  case_soc_id: string;
  classification_id?: number;
}

interface IRISIOCCreate {
  ioc_value: string;
  ioc_type_id: number;
  ioc_description?: string;
  ioc_tlp_id?: number;
  ioc_tags?: string;
}

interface IRISApiResponse<T> {
  status: "success" | "error";
  message: string;
  data: T;
}

// IOC Type IDs in IRIS (standard types)
export const IOC_TYPES = {
  IP: 1,
  DOMAIN: 2,
  URL: 3,
  HASH_MD5: 4,
  HASH_SHA1: 5,
  HASH_SHA256: 6,
  EMAIL: 7,
  FILENAME: 8,
  REGISTRY: 9,
  PORT: 10,
} as const;

// TLP (Traffic Light Protocol) levels
export const TLP_LEVELS = {
  WHITE: 1,
  GREEN: 2,
  AMBER: 3,
  RED: 4,
  AMBER_STRICT: 5,
} as const;

// Case classifications
export const CLASSIFICATIONS = {
  MALWARE: 1,
  PHISHING: 2,
  INTRUSION: 3,
  DENIAL_OF_SERVICE: 4,
  DATA_BREACH: 5,
  INSIDER_THREAT: 6,
  OTHER: 7,
} as const;

class IRISClient {
  private config: IRISConfig;

  constructor(config?: IRISConfig) {
    this.config = config || {
      baseUrl: process.env.IRIS_API_URL || "http://localhost:8000",
      apiKey: process.env.IRIS_API_KEY || "",
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown
  ): Promise<IRISApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IRIS API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Get all customers
  async getCustomers(): Promise<IRISCustomer[]> {
    const result = await this.request<IRISCustomer[]>("GET", "/manage/customers/list");
    return result.data;
  }

  // Create a new case in IRIS
  async createCase(caseData: IRISCaseCreate): Promise<IRISCase> {
    const result = await this.request<IRISCase>("POST", "/manage/cases/add", caseData);
    return result.data;
  }

  // Get case details
  async getCase(caseId: number): Promise<IRISCase> {
    const result = await this.request<IRISCase>("GET", `/manage/cases/${caseId}`);
    return result.data;
  }

  // Add IOC to a case
  async addIOC(caseId: number, ioc: IRISIOCCreate): Promise<unknown> {
    const result = await this.request("POST", `/case/ioc/add?cid=${caseId}`, ioc);
    return result.data;
  }

  // Add multiple IOCs to a case
  async addIOCs(caseId: number, iocs: IRISIOCCreate[]): Promise<unknown[]> {
    return Promise.all(iocs.map((ioc) => this.addIOC(caseId, ioc)));
  }

  // Add a note/evidence to a case
  async addNote(
    caseId: number,
    noteTitle: string,
    noteContent: string,
    groupId?: number
  ): Promise<unknown> {
    const result = await this.request("POST", `/case/notes/add?cid=${caseId}`, {
      note_title: noteTitle,
      note_content: noteContent,
      group_id: groupId || 1,
    });
    return result.data;
  }

  // Add a timeline event to a case
  async addTimelineEvent(
    caseId: number,
    title: string,
    dateTime: string,
    description?: string,
    category?: string
  ): Promise<unknown> {
    const result = await this.request("POST", `/case/timeline/events/add?cid=${caseId}`, {
      event_title: title,
      event_date: dateTime,
      event_content: description || "",
      event_category_id: category ? parseInt(category) : 1,
      event_in_summary: true,
      event_in_graph: true,
    });
    return result.data;
  }
}

// Alert to IRIS Case converter
export function alertToIRISCase(alert: {
  id: string;
  title: string;
  description?: string;
  severity: string;
  source: string;
  sourceIp?: string;
  destIp?: string;
  destPort?: number;
  protocol?: string;
  ruleName?: string;
  createdAt: string;
}): {
  caseData: IRISCaseCreate;
  iocs: IRISIOCCreate[];
} {
  // Map severity to classification
  const classificationMap: Record<string, number> = {
    CRITICAL: CLASSIFICATIONS.INTRUSION,
    HIGH: CLASSIFICATIONS.MALWARE,
    MEDIUM: CLASSIFICATIONS.OTHER,
    LOW: CLASSIFICATIONS.OTHER,
    INFO: CLASSIFICATIONS.OTHER,
  };

  // Build case data
  const caseData: IRISCaseCreate = {
    case_name: `[Morakib] ${alert.title}`,
    case_description: `
Alert exported from Morakib SOC Platform

**Alert Details:**
- ID: ${alert.id}
- Source: ${alert.source}
- Severity: ${alert.severity}
- Rule: ${alert.ruleName || "N/A"}
- Source IP: ${alert.sourceIp || "N/A"}
- Destination IP: ${alert.destIp || "N/A"}
- Destination Port: ${alert.destPort || "N/A"}
- Protocol: ${alert.protocol || "N/A"}

**Description:**
${alert.description || "No description provided"}
    `.trim(),
    case_customer: 1, // Default customer ID, should be configurable
    case_soc_id: `MOK-${alert.id.substring(0, 8).toUpperCase()}`,
    classification_id: classificationMap[alert.severity] || CLASSIFICATIONS.OTHER,
  };

  // Build IOCs from alert data
  const iocs: IRISIOCCreate[] = [];

  if (alert.sourceIp) {
    iocs.push({
      ioc_value: alert.sourceIp,
      ioc_type_id: IOC_TYPES.IP,
      ioc_description: `Source IP from alert: ${alert.title}`,
      ioc_tlp_id: TLP_LEVELS.AMBER,
      ioc_tags: "source,morakib,alert",
    });
  }

  if (alert.destIp) {
    iocs.push({
      ioc_value: alert.destIp,
      ioc_type_id: IOC_TYPES.IP,
      ioc_description: `Destination IP from alert: ${alert.title}`,
      ioc_tlp_id: TLP_LEVELS.AMBER,
      ioc_tags: "destination,morakib,alert",
    });
  }

  if (alert.destPort) {
    iocs.push({
      ioc_value: `${alert.destIp || "*"}:${alert.destPort}/${alert.protocol || "TCP"}`,
      ioc_type_id: IOC_TYPES.PORT,
      ioc_description: `Network port from alert: ${alert.title}`,
      ioc_tlp_id: TLP_LEVELS.GREEN,
      ioc_tags: "port,network,morakib",
    });
  }

  return { caseData, iocs };
}

// Singleton instance
let irisClient: IRISClient | null = null;

export function getIRISClient(): IRISClient {
  if (!irisClient) {
    irisClient = new IRISClient();
  }
  return irisClient;
}

export { IRISClient };
export type { IRISConfig, IRISCase, IRISCaseCreate, IRISIOCCreate, IRISCustomer };
