import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type EvidenceItem = {
  id: string;
  title: string;
  description: string;
  artifactType: string;
  artifactValue: string;
  createdAt: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
};

type ActionHistoryItem = {
  id: string;
  action: "EVIDENCE_ADDED" | "INCIDENT_CLOSED" | "INCIDENT_REOPENED";
  details: string;
  createdAt: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};
    let uploadedFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        title: formData.get("title"),
        description: formData.get("description"),
        artifactType: formData.get("artifactType"),
        artifactValue: formData.get("artifactValue"),
      };

      const file = formData.get("file");
      uploadedFile = file instanceof File ? file : null;
    } else {
      body = (await request.json()) as Record<string, unknown>;
    }

    if (!body?.title || !body?.description) {
      return NextResponse.json(
        { error: "title and description are required" },
        { status: 400 }
      );
    }

    const existing = await db.alert.findUnique({
      where: { id },
      select: { enrichmentData: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const currentEnrichment =
      existing.enrichmentData && typeof existing.enrichmentData === "object"
        ? (existing.enrichmentData as Record<string, unknown>)
        : {};

    const currentEvidence = Array.isArray(currentEnrichment.evidenceItems)
      ? (currentEnrichment.evidenceItems as EvidenceItem[])
      : [];

    const currentHistory = Array.isArray(currentEnrichment.actionHistory)
      ? (currentEnrichment.actionHistory as ActionHistoryItem[])
      : [];

    let uploadedMeta: Pick<EvidenceItem, "fileName" | "filePath" | "fileSize"> = {};
    if (uploadedFile) {
      const safeFileName = uploadedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const relativeDir = path.join("uploads", "alerts", id);
      const absoluteDir = path.join(process.cwd(), "public", relativeDir);
      await mkdir(absoluteDir, { recursive: true });

      const fileName = `${Date.now()}-${safeFileName}`;
      const absoluteFilePath = path.join(absoluteDir, fileName);
      const arrayBuffer = await uploadedFile.arrayBuffer();
      await writeFile(absoluteFilePath, Buffer.from(arrayBuffer));

      uploadedMeta = {
        fileName,
        filePath: `/${relativeDir}/${fileName}`,
        fileSize: uploadedFile.size,
      };
    }

    const newEvidence: EvidenceItem = {
      id: crypto.randomUUID(),
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      artifactType: String(body.artifactType || "log"),
      artifactValue: String(body.artifactValue || ""),
      createdAt: new Date().toISOString(),
      ...uploadedMeta,
    };

    const newHistoryItem: ActionHistoryItem = {
      id: crypto.randomUUID(),
      action: "EVIDENCE_ADDED",
      details: `Preuve ajoutée: ${newEvidence.title}`,
      createdAt: new Date().toISOString(),
    };

    const enrichmentData = {
      ...currentEnrichment,
      evidenceItems: [...currentEvidence, newEvidence],
      actionHistory: [...currentHistory, newHistoryItem],
      lastEvidenceAt: new Date().toISOString(),
    };

    const updatedAlert = await db.alert.update({
      where: { id },
      data: {
        enrichmentData,
        status: existing.status === "NEW" ? "INVESTIGATING" : undefined,
      },
      select: {
        id: true,
        status: true,
        enrichmentData: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, alert: updatedAlert, evidence: newEvidence });
  } catch (error) {
    console.error("Error adding evidence:", error);
    return NextResponse.json({ error: "Failed to add evidence" }, { status: 500 });
  }
}
