import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIRISClient, alertToIRISCase } from "@/lib/iris";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Fetch the alert from database
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        assignedTo: true,
      },
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    // Check if IRIS is configured
    if (!process.env.IRIS_API_URL || !process.env.IRIS_API_KEY) {
      // Return mock response for development/demo
      console.log("[IRIS] Mock export - IRIS not configured");
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Export simulé (IRIS non configuré)",
        case: {
          case_id: Math.floor(Math.random() * 1000) + 1,
          case_name: `[Morakib] ${alert.title}`,
          case_soc_id: `MOK-${alert.id.substring(0, 8).toUpperCase()}`,
        },
      });
    }

    // Convert alert to IRIS case format
    const { caseData, iocs } = alertToIRISCase({
      id: alert.id,
      title: alert.title,
      description: alert.description || undefined,
      severity: alert.severity,
      source: alert.source,
      sourceIp: alert.sourceIp || undefined,
      destIp: alert.destIp || undefined,
      destPort: alert.destPort || undefined,
      protocol: alert.protocol || undefined,
      ruleName: alert.ruleName || undefined,
      createdAt: alert.createdAt.toISOString(),
    });

    // Get IRIS client and create case
    const irisClient = getIRISClient();
    
    // Create case in IRIS
    const createdCase = await irisClient.createCase(caseData);

    // Add IOCs if any
    if (iocs.length > 0) {
      await irisClient.addIOCs(createdCase.case_id, iocs);
    }

    // Add initial timeline event
    await irisClient.addTimelineEvent(
      createdCase.case_id,
      "Alert received from Morakib",
      alert.createdAt.toISOString(),
      `Alert imported from Morakib SOC Platform. Original severity: ${alert.severity}`
    );

    // Update alert with IRIS case reference (optional - add irisCase field to Prisma schema if needed)
    // await prisma.alert.update({
    //   where: { id },
    //   data: { irisCaseId: createdCase.case_id.toString() },
    // });

    return NextResponse.json({
      success: true,
      message: "Alert exported to IRIS successfully",
      case: {
        case_id: createdCase.case_id,
        case_name: createdCase.case_name,
        case_soc_id: caseData.case_soc_id,
      },
      iocs_added: iocs.length,
    });
  } catch (error) {
    console.error("[IRIS Export Error]", error);
    return NextResponse.json(
      { 
        error: "Failed to export to IRIS", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
