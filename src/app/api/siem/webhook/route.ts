import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AlertSeverity, AlertStatus, AlertSource, Prisma } from "@/generated/prisma";

// Webhook secret for authentication (should match n8n/logstash config)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "morakib-webhook-secret";

// Map Suricata severity to Morakib AlertSeverity enum
function mapSeverity(severity: number | string): AlertSeverity {
  const s = typeof severity === "number" ? severity : parseInt(severity, 10);
  if (!isNaN(s)) {
    if (s >= 4) return AlertSeverity.CRITICAL;
    if (s >= 3) return AlertSeverity.HIGH;
    if (s >= 2) return AlertSeverity.MEDIUM;
    return AlertSeverity.LOW;
  }
  return AlertSeverity.MEDIUM;
}

// Suricata EVE JSON alert format
interface SuricataAlert {
  timestamp: string;
  event_type: string;
  src_ip: string;
  src_port?: number;
  dest_ip: string;
  dest_port?: number;
  proto?: string;
  alert?: {
    signature_id: number;
    signature: string;
    category: string;
    severity: number;
    gid?: number;
    rev?: number;
    metadata?: {
      mitre_tactic_id?: string[];
      mitre_technique_id?: string[];
    };
  };
  http?: {
    hostname?: string;
    url?: string;
    http_method?: string;
    http_user_agent?: string;
  };
  dns?: {
    query?: { rrname?: string }[];
    rrname?: string;
  };
  flow_id?: number;
  in_iface?: string;
}

// Zeek alert format
interface ZeekAlert {
  ts: number;
  "id.orig_h"?: string;
  "id.orig_p"?: number;
  "id.resp_h"?: string;
  "id.resp_p"?: number;
  proto?: string;
  uid?: string;
  notice?: {
    note: string;
    msg: string;
  };
}

// POST /api/siem/webhook - Receive alerts from Suricata/Zeek/Logstash
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get("Authorization");
    const secretFromHeader = authHeader?.replace("Bearer ", "");
    
    if (secretFromHeader !== WEBHOOK_SECRET && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Handle batch of alerts or single alert
    const alerts = Array.isArray(body) ? body : [body];
    const results = [];

    for (const alertData of alerts) {
      try {
        // Determine alert type and normalize
        let normalizedAlert;

        if (alertData.event_type || alertData.alert) {
          // Suricata format
          normalizedAlert = normalizeSuricataAlert(alertData as SuricataAlert);
        } else if (alertData.ts && (alertData["id.orig_h"] || alertData.notice)) {
          // Zeek format
          normalizedAlert = normalizeZeekAlert(alertData as ZeekAlert);
        } else {
          // Generic format - try to extract what we can
          normalizedAlert = normalizeGenericAlert(alertData);
        }

        if (normalizedAlert) {
          // Create alert in database
          const created = await db.alert.create({
            data: normalizedAlert as Prisma.AlertCreateInput,
          });
          results.push({ success: true, id: created.id });
        }
      } catch (err) {
        console.error("Error processing alert:", err);
        results.push({ success: false, error: String(err) });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Processed ${alerts.length} alerts`,
      success: successCount,
      errors: errorCount,
      results,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook", details: String(error) },
      { status: 500 }
    );
  }
}

// Normalize Suricata alert
function normalizeSuricataAlert(alert: SuricataAlert) {
  if (!alert.alert) return null;

  const mitreTechnique = alert.alert.metadata?.mitre_technique_id?.[0];
  const mitreTactic = alert.alert.metadata?.mitre_tactic_id?.[0];

  return {
    title: alert.alert.signature,
    source: AlertSource.SURICATA,
    severity: mapSeverity(alert.alert.severity),
    status: AlertStatus.NEW,
    sourceIp: alert.src_ip,
    destIp: alert.dest_ip,
    sourcePort: alert.src_port,
    destPort: alert.dest_port,
    protocol: alert.proto,
    description: `[${alert.alert.category}] ${alert.alert.signature}`,
    ruleName: alert.alert.signature,
    ruleId: String(alert.alert.signature_id),
    rawLog: {
      ...alert,
      mitre: mitreTechnique || mitreTactic ? {
        technique: mitreTechnique,
        tactic: mitreTactic,
      } : undefined,
    },
    detectedAt: new Date(alert.timestamp),
  };
}

// Normalize Zeek alert
function normalizeZeekAlert(alert: ZeekAlert) {
  const title = alert.notice?.note || "Zeek Alert";
  const description = alert.notice?.msg || "Network activity detected by Zeek";

  return {
    title,
    source: AlertSource.ZEEK,
    severity: AlertSeverity.MEDIUM,
    status: AlertStatus.NEW,
    sourceIp: alert["id.orig_h"],
    destIp: alert["id.resp_h"],
    sourcePort: alert["id.orig_p"],
    destPort: alert["id.resp_p"],
    protocol: alert.proto,
    description,
    rawLog: JSON.parse(JSON.stringify(alert)) as Record<string, unknown>,
    detectedAt: new Date(alert.ts * 1000), // Zeek ts is Unix epoch
  };
}

// Normalize generic alert format
function normalizeGenericAlert(alert: Record<string, unknown>) {
  // Map source string to AlertSource enum
  const sourceStr = String(alert.source || "CUSTOM").toUpperCase();
  let alertSource: AlertSource = AlertSource.CUSTOM;
  if (sourceStr === "SURICATA") alertSource = AlertSource.SURICATA;
  else if (sourceStr === "ZEEK") alertSource = AlertSource.ZEEK;
  else if (sourceStr === "FILEBEAT") alertSource = AlertSource.FILEBEAT;
  else if (sourceStr === "ELASTIC") alertSource = AlertSource.ELASTIC;

  return {
    title: String(alert.title || alert.name || alert.signature || "Unknown Alert"),
    source: alertSource,
    severity: mapSeverity(alert.severity as number || 2),
    status: AlertStatus.NEW,
    sourceIp: (alert.source_ip as string) || (alert.src_ip as string) || null,
    destIp: (alert.destination_ip as string) || (alert.dest_ip as string) || null,
    sourcePort: (alert.source_port as number) || (alert.src_port as number) || null,
    destPort: (alert.destination_port as number) || (alert.dest_port as number) || null,
    protocol: (alert.protocol as string) || (alert.proto as string) || null,
    description: String(alert.message || alert.description || "Alert received via webhook"),
    rawLog: alert,
    detectedAt: alert.timestamp ? new Date(alert.timestamp as string) : new Date(),
  };
}

// GET /api/siem/webhook - Health check
export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "Webhook endpoint ready to receive alerts",
    expectedFormat: {
      suricata: "Suricata EVE JSON format",
      zeek: "Zeek JSON logs",
      generic: {
        title: "string",
        source: "string",
        severity: "number (1-5)",
        source_ip: "string",
        destination_ip: "string",
        message: "string",
      },
    },
    authentication: "Bearer token in Authorization header",
  });
}
