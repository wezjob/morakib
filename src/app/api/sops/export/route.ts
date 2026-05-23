import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { db } from "@/lib/db";
import { getSOPBySlug } from "@/data/sops";

export const runtime = "nodejs";

type ExportSOPPayload = {
  title: string;
  category: string;
  description?: string;
  status?: string;
  severity?: string;
  estimatedTime?: string;
  alertTypes?: string[];
  checklist?: string[];
  procedures?: string[];
  detection?: string[];
  mitigation?: string[];
  dataSources?: string[];
  elkQueries?: { description: string; query: string }[];
  contentMarkdown?: string;
  sourceLabel: string;
};

function stripMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "- ")
    .replace(/^\s*\d+[.)]\s+/gm, "- ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function resolveSOP(identifier: string, source: "auto" | "custom" | "template"): Promise<ExportSOPPayload | null> {
  if (source !== "template") {
    const dbSOPById = await db.sOP.findUnique({ where: { id: identifier } });
    const dbSOPBySlug = dbSOPById ? null : await db.sOP.findUnique({ where: { slug: identifier } });
    const dbSOP = dbSOPById || dbSOPBySlug;

    if (dbSOP) {
      return {
        title: dbSOP.title,
        category: dbSOP.category,
        description: undefined,
        status: dbSOP.status,
        severity: dbSOP.severity || undefined,
        estimatedTime: dbSOP.estimatedTime || undefined,
        alertTypes: dbSOP.alertTypes,
        checklist: dbSOP.checklist,
        procedures: dbSOP.procedures,
        detection: dbSOP.detection,
        mitigation: dbSOP.mitigation,
        dataSources: dbSOP.dataSources,
        elkQueries: (dbSOP.elkQueries as { description: string; query: string }[]) || [],
        contentMarkdown: dbSOP.contentMarkdown || undefined,
        sourceLabel: "SOP personnalisee",
      };
    }
  }

  if (source !== "custom") {
    const template = getSOPBySlug(identifier);
    if (template) {
      return {
        title: template.title,
        category: template.category,
        description: template.description,
        status: "PUBLISHED",
        severity: "MEDIUM",
        alertTypes: template.alertTypes,
        checklist: template.steps.flatMap((step) =>
          (step.checklist || []).map((item) => `Etape ${step.id} - ${item.text}`)
        ),
        procedures: template.steps.map((step) => `Etape ${step.id}: ${step.title}`),
        detection: [],
        mitigation: [],
        dataSources: [],
        elkQueries: template.steps.flatMap((step) => step.commands || []),
        contentMarkdown: template.steps
          .map((step) => {
            const actions = step.actions.map((action) => `- ${action}`).join("\n");
            return `## Etape ${step.id} - ${step.title}\n${step.description}\n\n${actions}`;
          })
          .join("\n\n"),
        sourceLabel: "SOP standard",
      };
    }
  }

  return null;
}

async function generatePdfBuffer(sop: ExportSOPPayload): Promise<Buffer> {
  const pdf = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    pdf.on("data", (chunk) => chunks.push(chunk as Buffer));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    pdf.fontSize(18).fillColor("#0f172a").text("MORAKIB SOC", { continued: false });
    pdf.fontSize(10).fillColor("#64748b").text("Export SOP");
    pdf.moveDown(0.4);

    pdf.fillColor("#000000").fontSize(16).text(sop.title, { underline: true });
    pdf.moveDown(0.4);
    pdf.fontSize(10).fillColor("#334155").text(`Source: ${sop.sourceLabel}`);
    pdf.text(`Categorie: ${sop.category}`);

    if (sop.status) pdf.text(`Statut: ${sop.status}`);
    if (sop.severity) pdf.text(`Severite: ${sop.severity}`);
    if (sop.estimatedTime) pdf.text(`Temps estime: ${sop.estimatedTime}`);

    pdf.text(`Genere le ${new Date().toLocaleString("fr-FR")}`);
    pdf.moveDown(0.8);

    if (sop.description) {
      pdf.fontSize(13).fillColor("#0f172a").text("Description");
      pdf.moveDown(0.2);
      pdf.fontSize(11).fillColor("#111827").text(sop.description);
      pdf.moveDown(0.8);
    }

    if (sop.alertTypes && sop.alertTypes.length > 0) {
      pdf.fontSize(13).fillColor("#0f172a").text("Types d'alertes");
      pdf.moveDown(0.2);
      for (const alertType of sop.alertTypes) {
        pdf.fontSize(10).fillColor("#111827").text(`- ${alertType}`, { indent: 10 });
      }
      pdf.moveDown(0.8);
    }

    if (sop.procedures && sop.procedures.length > 0) {
      pdf.fontSize(13).fillColor("#0f172a").text("Procedures");
      pdf.moveDown(0.2);
      for (const procedure of sop.procedures) {
        pdf.fontSize(10).fillColor("#111827").text(`- ${procedure}`, { indent: 10 });
      }
      pdf.moveDown(0.8);
    }

    if (sop.checklist && sop.checklist.length > 0) {
      pdf.fontSize(13).fillColor("#0f172a").text("Checklist");
      pdf.moveDown(0.2);
      for (const item of sop.checklist) {
        pdf.fontSize(10).fillColor("#111827").text(`- ${item}`, { indent: 10 });
      }
      pdf.moveDown(0.8);
    }

    if (sop.elkQueries && sop.elkQueries.length > 0) {
      pdf.fontSize(13).fillColor("#0f172a").text("Requetes ELK");
      pdf.moveDown(0.2);
      for (const query of sop.elkQueries) {
        if (query.description) {
          pdf.fontSize(10).fillColor("#111827").text(`- ${query.description}`, { indent: 10 });
        }
        if (query.query) {
          pdf.font("Courier").fontSize(9).fillColor("#334155").text(query.query, {
            indent: 20,
          });
          pdf.font("Helvetica");
        }
        pdf.moveDown(0.2);
      }
      pdf.moveDown(0.8);
    }

    if (sop.detection && sop.detection.length > 0) {
      pdf.fontSize(13).fillColor("#0f172a").text("Detection");
      pdf.moveDown(0.2);
      for (const item of sop.detection) {
        pdf.fontSize(10).fillColor("#111827").text(`- ${item}`, { indent: 10 });
      }
      pdf.moveDown(0.8);
    }

    if (sop.mitigation && sop.mitigation.length > 0) {
      pdf.fontSize(13).fillColor("#0f172a").text("Mitigation");
      pdf.moveDown(0.2);
      for (const item of sop.mitigation) {
        pdf.fontSize(10).fillColor("#111827").text(`- ${item}`, { indent: 10 });
      }
      pdf.moveDown(0.8);
    }

    if (sop.dataSources && sop.dataSources.length > 0) {
      pdf.fontSize(13).fillColor("#0f172a").text("Sources de donnees");
      pdf.moveDown(0.2);
      for (const item of sop.dataSources) {
        pdf.fontSize(10).fillColor("#111827").text(`- ${item}`, { indent: 10 });
      }
      pdf.moveDown(0.8);
    }

    if (sop.contentMarkdown) {
      pdf.fontSize(13).fillColor("#0f172a").text("Contenu detaille");
      pdf.moveDown(0.2);
      pdf.fontSize(10).fillColor("#111827").text(stripMarkdown(sop.contentMarkdown));
    }

    pdf.moveDown(1);
    pdf.fontSize(9).fillColor("#64748b").text("Classification: INTERNE - SOC", { align: "right" });

    pdf.end();
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");
    const sourceParam = (searchParams.get("source") || "auto").toLowerCase();

    if (!identifier) {
      return NextResponse.json({ error: "identifier is required" }, { status: 400 });
    }

    if (sourceParam !== "auto" && sourceParam !== "custom" && sourceParam !== "template") {
      return NextResponse.json({ error: "source must be auto, custom or template" }, { status: 400 });
    }

    const source = sourceParam as "auto" | "custom" | "template";
    const sop = await resolveSOP(identifier, source);

    if (!sop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    const pdfBuffer = await generatePdfBuffer(sop);
    const safeTitle = sop.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sop-${safeTitle || "export"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error exporting SOP PDF:", error);
    return NextResponse.json({ error: "Failed to export SOP PDF" }, { status: 500 });
  }
}
