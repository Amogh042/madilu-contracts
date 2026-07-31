import { jsPDF } from "jspdf";
import type { AgreementData } from "./pg-data";
import { buildAgreementSections, type AgreementSection } from "./agreement-text";

const PAGE_W = 210;
const PAGE_H = 297;
const LEFT = 25;
const RIGHT = 20;
const BOTTOM = 20;
const FIRST_TOP = 110;
const TOP = 25;
const LINE_H = 5.5;
const TEXT_W = PAGE_W - LEFT - RIGHT;
const FONT_SIZE = 11.5;

export function generateAgreementPDF(d: AgreementData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("times", "normal");
  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(0, 0, 0);

  let y = FIRST_TOP;

  const newPage = () => {
    doc.addPage();
    y = TOP;
  };

  const remaining = () => PAGE_H - BOTTOM - y;

  const ensure = (needed: number) => {
    if (remaining() < needed) newPage();
  };

  const writeLines = (lines: string[], leftOffset = 0) => {
    for (const line of lines) {
      ensure(LINE_H);
      doc.text(line, LEFT + leftOffset, y, { maxWidth: TEXT_W - leftOffset });
      y += LINE_H;
    }
  };

  const writeCentered = (text: string, fontSize: number, bold: boolean) => {
    doc.setFont("times", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const tw = doc.getTextWidth(text);
    doc.text(text, (PAGE_W - tw) / 2, y);
    doc.setFont("times", "normal");
    doc.setFontSize(FONT_SIZE);
  };

  const renderSection = (sec: AgreementSection) => {
    switch (sec.type) {
      case "header": {
        ensure(10);
        writeCentered(sec.text, 14, true);
        y += 7;
        break;
      }
      case "subheader": {
        ensure(8);
        writeCentered(sec.text, 10, false);
        y += 5;
        break;
      }
      case "clause-title": {
        const nextContentHeight = LINE_H * 4;
        if (remaining() < LINE_H + 1 + nextContentHeight) {
          newPage();
        }
        y += 2;
        doc.setFont("times", "bold");
        doc.setFontSize(FONT_SIZE);
        doc.text(sec.text, LEFT, y);
        doc.setFont("times", "normal");
        y += LINE_H + 1;
        break;
      }
      case "section-title": {
        ensure(LINE_H * 4);
        y += 3;
        doc.setFont("times", "bold");
        doc.setFontSize(10.5);
        doc.text(sec.text, LEFT, y);
        doc.setFont("times", "normal");
        doc.setFontSize(FONT_SIZE);
        y += LINE_H + 1;
        break;
      }
      case "paragraph": {
        doc.setFont("times", "normal");
        doc.setFontSize(FONT_SIZE);
        const lines = doc.splitTextToSize(sec.text, TEXT_W) as string[];
        if (lines.length <= 3) {
          ensure(lines.length * LINE_H);
        } else if (remaining() < 3 * LINE_H) {
          newPage();
        }
        writeLines(lines);
        y += 1.5;
        break;
      }
      case "sub-clause": {
        doc.setFont("times", "normal");
        doc.setFontSize(FONT_SIZE);
        const indent = (sec.indent || 0) * 5;
        const lines = doc.splitTextToSize(sec.text, TEXT_W - indent) as string[];
        if (lines.length <= 3) {
          ensure(lines.length * LINE_H);
        } else if (remaining() < 3 * LINE_H) {
          newPage();
        }
        writeLines(lines, indent);
        y += 1.5;
        break;
      }
      case "signature-row": {
        if (sec.columns && sec.columns.length === 2) {
          const colW = (TEXT_W - 10) / 2;
          const leftLines = sec.columns[0].split("\n");
          const rightLines = sec.columns[1].split("\n");
          const maxLines = Math.max(leftLines.length, rightLines.length);
          ensure(maxLines * LINE_H + 6);
          y += 3;
          const startY = y;
          doc.setFontSize(FONT_SIZE);
          for (const line of leftLines) {
            doc.text(line, LEFT, y);
            y += LINE_H;
          }
          y = startY;
          for (const line of rightLines) {
            doc.text(line, LEFT + colW + 10, y);
            y += LINE_H;
          }
          y = startY + maxLines * LINE_H + 3;
        } else {
          const sigLines = sec.text.split("\n");
          ensure(sigLines.length * LINE_H + 4);
          y += 3;
          for (const line of sigLines) {
            doc.text(line, LEFT, y);
            y += LINE_H;
          }
          y += 3;
        }
        break;
      }
      case "witness-row": {
        if (sec.columns && sec.columns.length === 2) {
          const colW = (TEXT_W - 10) / 2;
          const boxW = 50;
          const boxH = 20;
          ensure(LINE_H * 2 + boxH + 10);
          y += 3;
          doc.setFontSize(FONT_SIZE);

          const witness1Lines = sec.columns[0].split("\n").filter(l => !l.includes("[Signature Box]"));
          const witness2Lines = sec.columns[1].split("\n").filter(l => !l.includes("[Signature Box]"));

          const startY = y;
          for (const line of witness1Lines) {
            doc.text(line, LEFT, y);
            y += LINE_H;
          }
          y += 2;
          doc.setLineWidth(0.3);
          doc.rect(LEFT, y, boxW, boxH);
          const leftBoxEnd = y + boxH;

          y = startY;
          const rightX = LEFT + colW + 10;
          for (const line of witness2Lines) {
            doc.text(line, rightX, y);
            y += LINE_H;
          }
          y += 2;
          doc.rect(rightX, y, boxW, boxH);
          const rightBoxEnd = y + boxH;

          y = Math.max(leftBoxEnd, rightBoxEnd) + 5;
        }
        break;
      }
      case "blank-space": {
        y += 45;
        break;
      }
      case "note":
        break;
    }
  };

  const mainSections = buildAgreementSections(d);
  for (const sec of mainSections) {
    renderSection(sec);
  }

  const filename = `Agreement_${d.student.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  doc.save(filename);
}
