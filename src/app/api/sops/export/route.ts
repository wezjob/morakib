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
  checklistByStep?: { title: string; actions: string[] }[];
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
      const checklistByStep = template.steps
        .map((step) => ({
          title: `Etape ${step.id} : "${step.title}"`,
          actions: (step.checklist || []).map((item) => item.text.trim()).filter(Boolean),
        }))
        .filter((entry) => entry.actions.length > 0);

      return {
        title: template.title,
        category: template.category,
        description: template.description,
        status: "PUBLISHED",
        severity: "MEDIUM",
        alertTypes: template.alertTypes,
        checklist: checklistByStep.flatMap((entry) => entry.actions),
        checklistByStep,
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

function ensureSpace(pdf: PDFKit.PDFDocument, minHeight: number) {
  const bottomLimit = pdf.page.height - pdf.page.margins.bottom;
  if (pdf.y + minHeight > bottomLimit) {
    pdf.addPage();
  }
}

function drawHeader(pdf: PDFKit.PDFDocument, sop: ExportSOPPayload, generatedAt: string) {
  const contentWidth = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
  const headerTop = pdf.y;
  const headerHeight = 84;

  pdf.save();
  pdf.roundedRect(pdf.page.margins.left, headerTop, contentWidth, headerHeight, 10).fill("#0f172a");
  pdf.restore();

  pdf.fillColor("#e2e8f0").font("Helvetica-Bold").fontSize(12).text("MORAKIB SOC", pdf.page.margins.left + 16, headerTop + 14);
  pdf.fillColor("#94a3b8").font("Helvetica").fontSize(9).text("Document operationnel - export SOP", pdf.page.margins.left + 16, headerTop + 30);

  pdf.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16).text(sop.title, pdf.page.margins.left + 16, headerTop + 48, {
    width: contentWidth - 180,
    ellipsis: true,
  });

  pdf.fillColor("#cbd5e1").font("Helvetica").fontSize(9).text(`Genere le ${generatedAt}`, pdf.page.margins.left + contentWidth - 145, headerTop + 14, {
    width: 130,
    align: "right",
  });

  pdf.y = headerTop + headerHeight + 14;
}

function drawMetaPanel(pdf: PDFKit.PDFDocument, sop: ExportSOPPayload) {
  const contentWidth = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
  const panelTop = pdf.y;
  const panelHeight = 68;
  const left = pdf.page.margins.left;

  pdf.save();
  pdf.roundedRect(left, panelTop, contentWidth, panelHeight, 8).fill("#f8fafc");
  pdf.restore();

  const entries = [
    ["Source", sop.sourceLabel],
    ["Categorie", sop.category],
    ["Statut", sop.status || "N/A"],
    ["Severite", sop.severity || "N/A"],
    ["Temps estime", sop.estimatedTime || "N/A"],
  ];

  const firstRowY = panelTop + 14;
  const secondRowY = panelTop + 38;
  const colWidth = contentWidth / 3;

  entries.forEach(([label, value], idx) => {
    const row = idx < 3 ? firstRowY : secondRowY;
    const col = idx < 3 ? idx : idx - 3;
    const x = left + col * colWidth + 12;

    pdf.fillColor("#64748b").font("Helvetica-Bold").fontSize(8).text(label, x, row);
    pdf.fillColor("#0f172a").font("Helvetica").fontSize(10).text(value, x, row + 10, {
      width: colWidth - 24,
      ellipsis: true,
    });
  });

  pdf.y = panelTop + panelHeight + 16;
}

function writeSectionTitle(pdf: PDFKit.PDFDocument, title: string) {
  ensureSpace(pdf, 36);
  const left = pdf.page.margins.left;
  const width = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;

  pdf.save();
  pdf.roundedRect(left, pdf.y, width, 24, 6).fill("#e2e8f0");
  pdf.restore();

  pdf.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text(title, left + 10, pdf.y + 7);
  pdf.moveDown(1.8);
}

function writeBulletList(
  pdf: PDFKit.PDFDocument,
  items: string[],
  bulletColor = "#0f172a",
  listStyle: "bullet" | "checkbox" = "bullet"
) {
  const left = pdf.page.margins.left;
  const textX = left + 14;
  const maxWidth = pdf.page.width - pdf.page.margins.right - textX;

  for (const rawItem of items) {
    const item = rawItem.trim();
    if (!item) continue;
    ensureSpace(pdf, 20);

    const currentY = pdf.y;
    if (listStyle === "checkbox") {
      pdf.save();
      pdf.roundedRect(left + 1, currentY + 3, 8, 8, 1.5).lineWidth(1).stroke("#64748b");
      pdf.restore();
    } else {
      pdf.fillColor(bulletColor).font("Helvetica-Bold").fontSize(11).text("•", left + 2, currentY + 1);
    }

    pdf.fillColor("#111827").font("Helvetica").fontSize(10).text(item, textX, currentY, {
      width: maxWidth,
      lineGap: 2,
    });
    pdf.moveDown(0.2);
  }

  pdf.moveDown(0.6);
}

function writeCodeBlock(pdf: PDFKit.PDFDocument, content: string) {
  const left = pdf.page.margins.left;
  const width = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
  const text = content.trim();
  if (!text) return;

  const textHeight = Math.max(pdf.heightOfString(text, { width: width - 30, lineGap: 1 }), 18);
  const blockHeight = textHeight + 14;

  ensureSpace(pdf, blockHeight + 8);
  const blockTop = pdf.y;

  pdf.save();
  pdf.roundedRect(left, blockTop, width, blockHeight, 6).fill("#f1f5f9");
  pdf.restore();

  pdf.fillColor("#334155").font("Courier").fontSize(8.5).text(text, left + 12, blockTop + 7, {
    width: width - 24,
    lineGap: 1,
  });
  pdf.font("Helvetica");
  pdf.y = blockTop + blockHeight + 6;
}

type DetailedContentBlock = {
  title: string;
  paragraphs: string[];
  bullets: string[];
};

function parseDetailedContent(markdown: string): DetailedContentBlock[] {
  const lines = markdown.split("\n");
  const blocks: DetailedContentBlock[] = [];
  let current: DetailedContentBlock = { title: "Vue d'ensemble", paragraphs: [], bullets: [] };
  let paragraphBuffer: string[] = [];
  let inCodeFence = false;

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const paragraph = paragraphBuffer.join(" ").replace(/\s+/g, " ").trim();
      if (paragraph) current.paragraphs.push(paragraph);
      paragraphBuffer = [];
    }
  };

  const pushCurrentBlock = () => {
    flushParagraph();
    if (current.paragraphs.length > 0 || current.bullets.length > 0) {
      blocks.push(current);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const headingMatch = line.match(/^#{2,6}\s+(.+)$/);
    if (headingMatch) {
      pushCurrentBlock();
      current = { title: headingMatch[1].trim(), paragraphs: [], bullets: [] };
      continue;
    }

    const bulletMatch = line.match(/^[-*+]\s+(.+)$/) || line.match(/^\d+[.)]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      const bulletText = bulletMatch[1].trim();
      if (bulletText) current.bullets.push(bulletText);
      continue;
    }

    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith("#")) continue;
    paragraphBuffer.push(line);
  }

  pushCurrentBlock();

  if (blocks.length === 0) {
    const fallback = stripMarkdown(markdown);
    if (fallback) {
      return [{ title: "Vue d'ensemble", paragraphs: [fallback], bullets: [] }];
    }
  }

  return blocks;
}

function writeDetailedContent(pdf: PDFKit.PDFDocument, markdown: string) {
  const blocks = parseDetailedContent(markdown);
  const left = pdf.page.margins.left;
  const width = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;

  for (const block of blocks) {
    const estimatedHeight = 34 + block.paragraphs.length * 24 + block.bullets.length * 20;
    ensureSpace(pdf, Math.max(estimatedHeight, 52));

    const blockTop = pdf.y;
    pdf.save();
    pdf.roundedRect(left, blockTop, width, 24, 6).fill("#f1f5f9");
    pdf.restore();

    pdf.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10.5).text(block.title, left + 10, blockTop + 7);
    pdf.y = blockTop + 30;

    for (const paragraph of block.paragraphs) {
      ensureSpace(pdf, 24);
      pdf.fillColor("#1f2937").font("Helvetica").fontSize(9.8).text(paragraph, left, pdf.y, {
        width,
        lineGap: 2,
      });
      pdf.moveDown(0.5);
    }

    if (block.bullets.length > 0) {
      writeBulletList(pdf, block.bullets, "#334155", "bullet");
    }

    pdf.moveDown(0.5);
  }
}

function writeChecklistByStep(
  pdf: PDFKit.PDFDocument,
  checklistByStep: { title: string; actions: string[] }[]
) {
  const left = pdf.page.margins.left;

  for (const stepEntry of checklistByStep) {
    ensureSpace(pdf, 24);
    pdf.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10.5).text(stepEntry.title, left, pdf.y, {
      lineGap: 1,
    });
    pdf.moveDown(0.3);
    writeBulletList(pdf, stepEntry.actions, "#0284c7", "checkbox");
  }
}

async function generatePdfBuffer(sop: ExportSOPPayload): Promise<Buffer> {
  const pdf = new PDFDocument({ size: "A4", margin: 42, bufferPages: true });
  const chunks: Buffer[] = [];
  const generatedAt = new Date().toLocaleString("fr-FR");

  return await new Promise<Buffer>((resolve, reject) => {
    pdf.on("data", (chunk) => chunks.push(chunk as Buffer));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    drawHeader(pdf, sop, generatedAt);
    drawMetaPanel(pdf, sop);

    if (sop.description) {
      writeSectionTitle(pdf, "Description");
      pdf.fillColor("#111827").font("Helvetica").fontSize(10.5).text(sop.description, {
        lineGap: 2,
      });
      pdf.moveDown(1);
    }

    if (sop.alertTypes && sop.alertTypes.length > 0) {
      writeSectionTitle(pdf, "Types d'alertes");
      writeBulletList(pdf, sop.alertTypes, "#ea580c");
    }

    if (sop.procedures && sop.procedures.length > 0) {
      writeSectionTitle(pdf, "Procedures");
      writeBulletList(pdf, sop.procedures);
    }

    if (sop.checklist && sop.checklist.length > 0) {
      writeSectionTitle(pdf, "Checklist operationnelle");
      if (sop.checklistByStep && sop.checklistByStep.length > 0) {
        writeChecklistByStep(pdf, sop.checklistByStep);
      } else {
        writeBulletList(pdf, sop.checklist, "#0284c7", "checkbox");
      }
    }

    if (sop.elkQueries && sop.elkQueries.length > 0) {
      writeSectionTitle(pdf, "Requetes ELK");
      for (const query of sop.elkQueries) {
        if (query.description) {
          ensureSpace(pdf, 22);
          pdf.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text(query.description);
          pdf.moveDown(0.2);
        }
        if (query.query) {
          writeCodeBlock(pdf, query.query);
        }
        pdf.moveDown(0.3);
      }
      pdf.moveDown(0.4);
    }

    if (sop.detection && sop.detection.length > 0) {
      writeSectionTitle(pdf, "Detection");
      writeBulletList(pdf, sop.detection, "#7c3aed");
    }

    if (sop.mitigation && sop.mitigation.length > 0) {
      writeSectionTitle(pdf, "Mitigation");
      writeBulletList(pdf, sop.mitigation, "#16a34a");
    }

    if (sop.dataSources && sop.dataSources.length > 0) {
      writeSectionTitle(pdf, "Sources de donnees");
      writeBulletList(pdf, sop.dataSources, "#0891b2");
    }

    if (sop.contentMarkdown) {
      writeSectionTitle(pdf, "Contenu detaille");
      writeDetailedContent(pdf, sop.contentMarkdown);
    }

    const range = pdf.bufferedPageRange();
    for (let i = 0; i < range.count; i += 1) {
      pdf.switchToPage(i);
      const footerY = pdf.page.height - pdf.page.margins.bottom + 6;
      const pageNumber = `Page ${i + 1}/${range.count}`;

      pdf.save();
      pdf.moveTo(pdf.page.margins.left, footerY - 6).lineTo(pdf.page.width - pdf.page.margins.right, footerY - 6).stroke("#e2e8f0");
      pdf.restore();

      pdf.fillColor("#64748b").font("Helvetica").fontSize(8.5).text("Classification: INTERNE - SOC", pdf.page.margins.left, footerY, {
        width: 220,
      });
      pdf.text(pageNumber, pdf.page.width - pdf.page.margins.right - 90, footerY, {
        width: 90,
        align: "right",
      });
    }

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
