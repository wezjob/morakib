import { NextRequest, NextResponse } from "next/server";
import { searchAlerts } from "@/lib/elasticsearch";

interface CachedAlertsResponse {
  alerts: Awaited<ReturnType<typeof searchAlerts>>["alerts"];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timeRange: {
    from: string;
    to: string;
  };
  connected: boolean;
  degraded?: boolean;
  message?: string;
  cacheAgeMs?: number;
}

let lastAlertsCache: CachedAlertsResponse | null = null;
let lastAlertsCacheAt = 0;
let lastErrorLogAt = 0;

function logSIEMErrorThrottled(context: string, error: unknown) {
  const now = Date.now();
  if (now - lastErrorLogAt > 30000) {
    console.error(context, error);
    lastErrorLogAt = now;
  }
}

// GET /api/siem/alerts - Fetch alerts from Elasticsearch
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const severity = searchParams.get("severity") || undefined;
  const source = searchParams.get("source") || undefined;
  const search = searchParams.get("search") || undefined;
  const timeFrom = searchParams.get("timeFrom") || "now-24h";
  const timeTo = searchParams.get("timeTo") || "now";
  const from = (page - 1) * limit;

  try {
    const { alerts, total } = await searchAlerts({
      from,
      size: limit,
      severity,
      source,
      search,
      timeRange: {
        from: timeFrom,
        to: timeTo,
      },
    });

    const responsePayload: CachedAlertsResponse = {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timeRange: {
        from: timeFrom,
        to: timeTo,
      },
      connected: true,
      degraded: false,
    };

    lastAlertsCache = responsePayload;
    lastAlertsCacheAt = Date.now();

    return NextResponse.json(responsePayload);
  } catch (error) {
    logSIEMErrorThrottled("SIEM alerts error:", error);

    if (lastAlertsCache) {
      return NextResponse.json({
        ...lastAlertsCache,
        connected: false,
        degraded: true,
        message: "SIEM temporairement indisponible. Affichage des dernieres donnees en cache.",
        cacheAgeMs: Date.now() - lastAlertsCacheAt,
      });
    }

    return NextResponse.json(
      { 
        error: "SIEM temporairement indisponible",
        details: error instanceof Error ? error.message : "Unknown error",
        alerts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        timeRange: {
          from: timeFrom,
          to: timeTo,
        },
        connected: false,
        degraded: true,
        message: "SIEM indisponible. Aucune donnee en cache pour le moment.",
      },
      { status: 200 }
    );
  }
}
