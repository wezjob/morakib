import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { GovernanceSectionKey } from "@/data/governance-docs";
import { listGovernanceWorkflowAudit } from "@/lib/governance-store";

function parseSection(section?: string | null): GovernanceSectionKey | undefined {
  if (!section) return undefined;
  if (
    section === "foundations" ||
    section === "organization" ||
    section === "processes" ||
    section === "metrics" ||
    section === "compliance" ||
    section === "roadmap"
  ) {
    return section;
  }
  return undefined;
}

function csvEscape(value: unknown) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\n") || raw.includes("\"")) {
    return `"${raw.replace(/\"/g, "\"\"")}"`;
  }
  return raw;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role as string | undefined;

    if (!session?.user || (userRole !== "ADMIN" && userRole !== "LEAD")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const section = parseSection(searchParams.get("section"));

    const rows = await listGovernanceWorkflowAudit({ section });

    const header = [
      "timestamp",
      "document_code",
      "document_title",
      "section",
      "action",
      "actor_name",
      "actor_role",
      "document_id",
      "version_id",
    ];

    const lines = [header.join(",")];
    for (const row of rows) {
      lines.push(
        [
          row.createdAt.toISOString(),
          row.code,
          row.title,
          row.section,
          row.action,
          row.actorName || "",
          row.actorRole || "",
          row.documentId,
          row.versionId,
        ]
          .map(csvEscape)
          .join(",")
      );
    }

    const csv = lines.join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="governance-workflow-audit${section ? `-${section}` : ""}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting governance workflow audit:", error);
    return NextResponse.json({ error: "Failed to export workflow audit" }, { status: 500 });
  }
}
