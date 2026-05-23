import { NextRequest, NextResponse } from "next/server";
import { getAlertStats, testConnection } from "@/lib/elasticsearch";

// GET /api/siem/stats - Get aggregated statistics from Elasticsearch
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const timeFrom = searchParams.get("timeFrom") || "now-24h";
  const timeTo = searchParams.get("timeTo") || "now";

  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      return NextResponse.json(
        { error: "Cannot connect to Elasticsearch", connected: false },
        { status: 503 }
      );
    }

    const stats = await getAlertStats({
      from: timeFrom,
      to: timeTo,
    });

    return NextResponse.json({
      ...stats,
      timeRange: {
        from: timeFrom,
        to: timeTo,
      },
      connected: true,
    });
  } catch (error) {
    console.error("SIEM stats error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch stats from SIEM",
        details: error instanceof Error ? error.message : "Unknown error",
        connected: false,
      },
      { status: 500 }
    );
  }
}
