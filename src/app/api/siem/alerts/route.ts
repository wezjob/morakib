import { NextRequest, NextResponse } from "next/server";
import { searchAlerts, getAlertStats, testConnection } from "@/lib/elasticsearch";

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

  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      return NextResponse.json(
        { error: "Cannot connect to Elasticsearch", connected: false },
        { status: 503 }
      );
    }

    const from = (page - 1) * limit;

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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("SIEM alerts error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch alerts from SIEM",
        details: error instanceof Error ? error.message : "Unknown error",
        connected: false,
      },
      { status: 500 }
    );
  }
}
