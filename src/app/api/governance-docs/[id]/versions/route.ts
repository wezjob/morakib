import { NextRequest, NextResponse } from "next/server";
import { listGovernanceDocVersions } from "@/lib/governance-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const versions = await listGovernanceDocVersions(id);
    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error loading governance versions:", error);
    return NextResponse.json({ error: "Failed to load governance versions" }, { status: 500 });
  }
}
