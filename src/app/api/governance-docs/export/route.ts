import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { governanceNav, GovernanceSectionKey } from "@/data/governance-docs";
import { listGovernanceDocs } from "@/lib/governance-store";

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

function sectionLabel(section?: GovernanceSectionKey) {
  if (!section) return "Gouvernance-SOC";
  return governanceNav.find((item) => item.key === section)?.label ?? section;
}

function ensureSpace(pdf: PDFKit.PDFDocument, minHeight: number) {
  const bottomLimit = pdf.page.height - pdf.page.margins.bottom;
  if (pdf.y + minHeight > bottomLimit) {
    pdf.addPage();
  }
}

function drawHeader(pdf: PDFKit.PDFDocument, title: string, generatedAt: string) {
  const contentWidth = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
  const top = pdf.y;
  const height = 86;

  pdf.save();
  pdf.roundedRect(pdf.page.margins.left, top, contentWidth, height, 10).fill("#0f172a");
  pdf.restore();

  pdf.fillColor("#e2e8f0").font("Helvetica-Bold").fontSize(12).text("MORAKIB SOC", pdf.page.margins.left + 16, top + 14);
  pdf.fillColor("#94a3b8").font("Helvetica").fontSize(9).text("Dossier gouvernance - diffusion interne controlee", pdf.page.margins.left + 16, top + 30);

  pdf.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15).text(title, pdf.page.margins.left + 16, top + 48, {
    width: contentWidth - 190,
    ellipsis: true,
  });

  pdf.fillColor("#cbd5e1").font("Helvetica").fontSize(9).text(`Genere le ${generatedAt}`, pdf.page.margins.left + contentWidth - 145, top + 14, {
    width: 130,
    align: "right",
  });

  pdf.y = top + height + 14;
}

function drawSummary(pdf: PDFKit.PDFDocument, docsCount: number, sectionName: string) {
  const contentWidth = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
  const top = pdf.y;
  const height = 58;
  const left = pdf.page.margins.left;

  pdf.save();
  pdf.roundedRect(left, top, contentWidth, height, 8).fill("#f8fafc");
  pdf.restore();

  pdf.fillColor("#64748b").font("Helvetica-Bold").fontSize(8).text("SECTION", left + 12, top + 12);
  pdf.fillColor("#0f172a").font("Helvetica").fontSize(10).text(sectionName, left + 12, top + 22, {
    width: contentWidth * 0.65,
    ellipsis: true,
  });

  pdf.fillColor("#64748b").font("Helvetica-Bold").fontSize(8).text("NB DOCUMENTS", left + contentWidth - 120, top + 12, {
    width: 108,
    align: "right",
  });
  pdf.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text(String(docsCount), left + contentWidth - 120, top + 22, {
    width: 108,
    align: "right",
  });

  pdf.y = top + height + 16;
}

function writeSectionTitle(pdf: PDFKit.PDFDocument, title: string) {
  ensureSpace(pdf, 34);
  const left = pdf.page.margins.left;
  const width = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;

  pdf.save();
  pdf.roundedRect(left, pdf.y, width, 24, 6).fill("#e2e8f0");
  pdf.restore();

  pdf.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text(title, left + 10, pdf.y + 7);
  pdf.moveDown(1.8);
}

function writeBulletList(pdf: PDFKit.PDFDocument, items: string[], color = "#0f172a") {
  const left = pdf.page.margins.left;
  const textX = left + 14;
  const maxWidth = pdf.page.width - pdf.page.margins.right - textX;

  for (const rawItem of items) {
    const item = rawItem.trim();
    if (!item) continue;

    ensureSpace(pdf, 20);
    const y = pdf.y;
    pdf.fillColor(color).font("Helvetica-Bold").fontSize(11).text("•", left + 2, y + 1);
    pdf.fillColor("#111827").font("Helvetica").fontSize(10).text(item, textX, y, {
      width: maxWidth,
      lineGap: 2,
    });
    pdf.moveDown(0.2);
  }

  pdf.moveDown(0.5);
}

function writeDocCard(
  pdf: PDFKit.PDFDocument,
  doc: Awaited<ReturnType<typeof listGovernanceDocs>>[number]
) {
  const left = pdf.page.margins.left;
  const width = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
  const detailLines = [
    `Section: ${doc.section}`,
    `Workflow: ${doc.workflowStatus}`,
    `Signature Lead: ${doc.leadSignatureLabel || "N/A"}`,
    `Signature Admin/RSSI: ${doc.signatureLabel || "N/A"}`,
    `Objectif: ${doc.objective}`,
    `Alignement: ${doc.alignment}`,
  ];

  const detailsHeight = detailLines.reduce(
    (acc, line) => acc + pdf.heightOfString(line, { width: width - 32, lineGap: 1 }),
    0
  );
  const cardHeight = Math.max(detailsHeight + 38, 96);
  ensureSpace(pdf, cardHeight + 12);

  const top = pdf.y;
  pdf.save();
  pdf.roundedRect(left, top, width, cardHeight, 8).fill("#ffffff");
  pdf.roundedRect(left, top, width, cardHeight, 8).lineWidth(0.8).stroke("#e2e8f0");
  pdf.restore();

  pdf.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text(`${doc.code} - ${doc.title}`, left + 12, top + 10, {
    width: width - 24,
    ellipsis: true,
  });

  let lineY = top + 30;
  for (const line of detailLines) {
    pdf.fillColor("#334155").font("Helvetica").fontSize(9.5).text(line, left + 12, lineY, {
      width: width - 24,
      lineGap: 1,
    });
    lineY += pdf.heightOfString(line, { width: width - 24, lineGap: 1 }) + 2;
  }

  pdf.y = top + cardHeight + 8;

  if (doc.details.length > 0) {
    writeSectionTitle(pdf, "Points cles");
    writeBulletList(pdf, doc.details, "#475569");
  }

  pdf.moveDown(0.3);
}

async function generatePdfBuffer(title: string, docs: Awaited<ReturnType<typeof listGovernanceDocs>>) {
  const pdf = new PDFDocument({ size: "A4", margin: 42, bufferPages: true });
  const chunks: Buffer[] = [];
  const generatedAt = new Date().toLocaleString("fr-FR");

  return await new Promise<Buffer>((resolve, reject) => {
    pdf.on("data", (chunk) => chunks.push(chunk as Buffer));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    drawHeader(pdf, title, generatedAt);
    drawSummary(pdf, docs.length, title);

    for (const doc of docs) {
      writeDocCard(pdf, doc);
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

async function generateDocxBuffer(title: string, docs: Awaited<ReturnType<typeof listGovernanceDocs>>) {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: title, bold: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "MORAKIB SOC - Document de gouvernance interne", bold: true })],
    }),
    new Paragraph({
      children: [new TextRun(`Genere le ${new Date().toLocaleString("fr-FR")}`)],
    }),
    new Paragraph({ text: "" }),
  ];

  for (const doc of docs) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `${doc.code} - ${doc.title}`, bold: true })],
      }),
      new Paragraph({ children: [new TextRun({ text: `Section: ${doc.section}` })] }),
      new Paragraph({ children: [new TextRun({ text: `Workflow: ${doc.workflowStatus}` })] }),
      new Paragraph({ children: [new TextRun({ text: `Signature Lead: ${doc.leadSignatureLabel || "N/A"}` })] }),
      new Paragraph({ children: [new TextRun({ text: `Signature Admin/RSSI: ${doc.signatureLabel || "N/A"}` })] }),
      new Paragraph({ children: [new TextRun({ text: `Objectif: ${doc.objective}` })] }),
      new Paragraph({ children: [new TextRun({ text: `Alignement: ${doc.alignment}` })] }),
      new Paragraph({ children: [new TextRun({ text: "Contenu detaille:" })] })
    );

    for (const detail of doc.details) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun(detail)],
        })
      );
    }

    children.push(new Paragraph({ text: "" }));
  }

  const document = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(document);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = parseSection(searchParams.get("section"));
    const format = (searchParams.get("format") || "pdf").toLowerCase();
    const layout = (searchParams.get("layout") || "official").toLowerCase();

    if (format !== "pdf" && format !== "docx") {
      return NextResponse.json({ error: "Format must be pdf or docx" }, { status: 400 });
    }

    if (layout !== "official" && layout !== "simple") {
      return NextResponse.json({ error: "Layout must be official or simple" }, { status: 400 });
    }

    const docs = await listGovernanceDocs({ section });
    const label = sectionLabel(section);
    const title = `${layout === "official" ? "Dossier Officiel" : "Export"} ${label} - Gouvernance SOC`;

    if (format === "pdf") {
      const pdfBuffer = await generatePdfBuffer(title, docs);
      const pdfBody = new Uint8Array(pdfBuffer);
      return new NextResponse(pdfBody, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="governance-${section || "all"}.pdf"`,
        },
      });
    }

    const docxBuffer = await generateDocxBuffer(title, docs);
    const docxBody = new Uint8Array(docxBuffer);
    return new NextResponse(docxBody, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="governance-${section || "all"}.docx"`,
      },
    });
  } catch (error) {
    console.error("Error exporting governance docs:", error);
    return NextResponse.json({ error: "Failed to export governance docs" }, { status: 500 });
  }
}
