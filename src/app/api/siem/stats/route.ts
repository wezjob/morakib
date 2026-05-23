import { NextRequest, NextResponse } from "next/server";
import { getAlertStats } from "@/lib/elasticsearch";

interface CachedStatsResponse {
  total: number;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
  byHour: { key: string; count: number }[];
  timeRange: {
    from: string;
    to: string;
  };
  connected: boolean;
  degraded?: boolean;
  message?: string;
  cacheAgeMs?: number;
}

let lastStatsCache: CachedStatsResponse | null = null;
let lastStatsCacheAt = 0;
let lastErrorLogAt = 0;

function logSIEMErrorThrottled(context: string, error: unknown) {
  const now = Date.now();
  if (now - lastErrorLogAt > 30000) {
    console.error(context, error);
    lastErrorLogAt = now;
  }
}

// GET /api/siem/stats - Get aggregated statistics from Elasticsearch
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const timeFrom = searchParams.get("timeFrom") || "now-24h";
  const timeTo = searchParams.get("timeTo") || "now";

  try {
    const stats = await getAlertStats({
      from: timeFrom,
      to: timeTo,
    });

    const responsePayload: CachedStatsResponse = {
      ...stats,
      timeRange: {
        from: timeFrom,
        to: timeTo,
      },
      connected: true,
      degraded: false,
    };

    lastStatsCache = responsePayload;
    lastStatsCacheAt = Date.now();

    return NextResponse.json(responsePayload);
  } catch (error) {
    logSIEMErrorThrottled("SIEM stats error:", error);

    if (lastStatsCache) {
      return NextResponse.json({
        ...lastStatsCache,
        connected: false,
        degraded: true,
        message: "SIEM temporairement indisponible. Affichage des dernieres statistiques en cache.",
        cacheAgeMs: Date.now() - lastStatsCacheAt,
      });
    }

    return NextResponse.json(
      {
        error: "SIEM temporairement indisponible",
        details: error instanceof Error ? error.message : "Unknown error",
        total: 0,
        bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
        bySource: {},
        byHour: [],
        timeRange: {
          from: timeFrom,
          to: timeTo,
        },
        connected: false,
        degraded: true,
        message: "SIEM indisponible. Aucune statistique en cache pour le moment.",
      },
      { status: 200 }
    );
  }
}
