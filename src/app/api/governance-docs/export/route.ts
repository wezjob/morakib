import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
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

async function generatePdfBuffer(title: string, docs: Awaited<ReturnType<typeof listGovernanceDocs>>) {
  const pdf = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    pdf.on("data", (chunk) => chunks.push(chunk as Buffer));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    pdf.fontSize(18).fillColor("#8b0000").text("MORAKIB SOC", { continued: false });
    pdf.fontSize(10).fillColor("#6b7280").text("Document de gouvernance - Diffusion interne controlee");
    pdf.moveDown(0.3);
    pdf.fillColor("#000").fontSize(16).text(title, { underline: true });
    pdf.moveDown(0.5);
    pdf.fontSize(10).fillColor("#444").text(`Genere le ${new Date().toLocaleString("fr-FR")}`);
    pdf.fillColor("#000");
    pdf.moveDown(1);

    for (const doc of docs) {
      pdf.fontSize(13).text(`${doc.code} - ${doc.title}`);
      pdf.moveDown(0.2);

      pdf.fontSize(10).fillColor("#333").text(`Section: ${doc.section}`);
      pdf.fillColor("#000");

      pdf.moveDown(0.2);
      pdf.fontSize(11).text(`Objectif: ${doc.objective}`);
      pdf.moveDown(0.2);
      pdf.fontSize(11).text(`Alignement: ${doc.alignment}`);
      pdf.moveDown(0.3);
      pdf.fontSize(11).text("Contenu detaille:");
      pdf.fontSize(10).fillColor("#333").text(`Workflow: ${doc.workflowStatus}`);
      if (doc.leadSignatureLabel) {
        pdf.fontSize(10).fillColor("#333").text(`Signature Lead: ${doc.leadSignatureLabel}`);
      }
      if (doc.signatureLabel) {
        pdf.fontSize(10).fillColor("#333").text(`Signature Admin/RSSI: ${doc.signatureLabel}`);
      }

      for (const detail of doc.details) {
        pdf.fontSize(10).text(`- ${detail}`, { indent: 12 });
      }

      pdf.moveDown(1);
      if (pdf.y > 720) {
        pdf.addPage();
      }
    }

    pdf.moveDown(1);
    pdf.fontSize(9).fillColor("#6b7280").text("Classification: INTERNE - SOC", { align: "right" });

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
