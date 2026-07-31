import { jsPDF } from "jspdf";
import type { AgreementData } from "./pg-data";
import { buildAgreementSections, type AgreementSection, type TextSegment } from "./agreement-text";

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

  const renderSegmented = (segments: TextSegment[], maxW: number, leftOffset = 0) => {
    const fullText = segments.map(s => s.text).join("");
    const boldMap: boolean[] = [];
    for (const seg of segments) {
      for (let c = 0; c < seg.text.length; c++) boldMap.push(!!seg.bold);
    }

    type WordRun = { text: string; bold: boolean };
    type SegWord = { runs: WordRun[] };
    const segWords: SegWord[] = [];
    const re = /\S+/g;
    let match;
    while ((match = re.exec(fullText)) !== null) {
      const runs: WordRun[] = [];
      let curBold = boldMap[match.index];
      let cur = "";
      for (let c = 0; c < match[0].length; c++) {
        const b = boldMap[match.index + c];
        if (b !== curBold) {
          if (cur) runs.push({ text: cur, bold: curBold });
          curBold = b;
          cur = match[0][c];
        } else {
          cur += match[0][c];
        }
      }
      if (cur) runs.push({ text: cur, bold: curBold });
      segWords.push({ runs });
    }

    const measureWord = (sw: SegWord) => {
      let w = 0;
      for (const r of sw.runs) {
        doc.setFont("times", r.bold ? "bold" : "normal");
        w += doc.getTextWidth(r.text);
      }
      return w;
    };

    doc.setFont("times", "normal");
    const spW = doc.getTextWidth(" ");

    let lineWords: SegWord[] = [];
    let lineW = 0;

    const flushLine = () => {
      if (!lineWords.length) return;
      ensure(LINE_H);
      let x = LEFT + leftOffset;
      for (let i = 0; i < lineWords.length; i++) {
        if (i > 0) x += spW;
        for (const r of lineWords[i].runs) {
          doc.setFont("times", r.bold ? "bold" : "normal");
          doc.text(r.text, x, y);
          x += doc.getTextWidth(r.text);
        }
      }
      y += LINE_H;
      lineWords = [];
      lineW = 0;
    };

    for (const sw of segWords) {
      const ww = measureWord(sw);
      const needed = lineWords.length > 0 ? spW + ww : ww;
      if (lineW + needed > maxW && lineWords.length > 0) flushLine();
      if (lineWords.length > 0) lineW += spW;
      lineWords.push(sw);
      lineW += ww;
    }
    flushLine();
    doc.setFont("times", "normal");
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
        if (sec.segments) {
          renderSegmented(sec.segments, TEXT_W);
        } else {
          writeLines(lines);
        }
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
        if (sec.segments) {
          renderSegmented(sec.segments, TEXT_W - indent, indent);
        } else {
          writeLines(lines, indent);
        }
        y += 1.5;
        break;
      }
      case "signature-row": {
        if (sec.columns && sec.columns.length === 2) {
          const colW = (TEXT_W - 10) / 2;
          const leftLines = sec.columns[0].split("\n");
          const rightLines = sec.columns[1].split("\n");
          const maxLines = Math.max(leftLines.length, rightLines.length);
          ensure(maxLines * LINE_H + 10);
          y += 5;
          const startY = y;
          doc.setFontSize(FONT_SIZE);
          for (let i = 0; i < leftLines.length; i++) {
            if (i === 0) doc.setFont("times", "bold");
            else doc.setFont("times", "normal");
            doc.text(leftLines[i], LEFT, y);
            y += LINE_H;
          }
          doc.setFont("times", "normal");
          y = startY;
          for (let i = 0; i < rightLines.length; i++) {
            if (i === 0) doc.setFont("times", "bold");
            else doc.setFont("times", "normal");
            doc.text(rightLines[i], LEFT + colW + 10, y);
            y += LINE_H;
          }
          doc.setFont("times", "normal");
          y = startY + maxLines * LINE_H + 8;
        } else {
          const sigLines = sec.text.split("\n");
          ensure(sigLines.length * LINE_H + 8);
          y += 5;
          for (let i = 0; i < sigLines.length; i++) {
            if (i === 0) doc.setFont("times", "bold");
            else doc.setFont("times", "normal");
            doc.text(sigLines[i], LEFT, y);
            y += LINE_H;
          }
          doc.setFont("times", "normal");
          y += 8;
        }
        break;
      }
      case "witness-row": {
        if (sec.columns && sec.columns.length === 2) {
          const colW = (TEXT_W - 10) / 2;
          const boxW = 55;
          const boxH = 18;
          const totalNeeded = LINE_H * 2 + boxH + 8;
          ensure(totalNeeded);
          y += 3;
          doc.setFontSize(FONT_SIZE);
          doc.setFont("times", "normal");

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

          y = Math.max(leftBoxEnd, rightBoxEnd) + 8;
        }
        break;
      }
      case "blank-space": {
        const pageMid = PAGE_H / 2;
        if (y < pageMid) {
          y = pageMid;
        }
        break;
      }
      case "note":
        break;
    }
  };

  const mainSections = buildAgreementSections(d);

  for (let i = 0; i < mainSections.length; i++) {
    const sec = mainSections[i];
    if (sec.type === "clause-title" && sec.text === "WITNESSES") {
      const witnessRow = mainSections[i + 1];
      if (witnessRow?.type === "witness-row") {
        const boxH = 18;
        const totalNeeded = LINE_H + 1 + 3 + LINE_H * 2 + 2 + boxH + 8;
        ensure(totalNeeded);
        renderSection(sec);
        renderSection(witnessRow);
        i++;
        continue;
      }
    }
    if (sec.type === "clause-title" && sec.text === "SPECIAL NOTES (If Any):") {
      const blankSec = mainSections[i + 1];
      y += 2;
      doc.setFont("times", "bold");
      doc.setFontSize(FONT_SIZE);
      doc.text(sec.text, LEFT, y);
      doc.setFont("times", "normal");
      y += LINE_H + 1;
      if (blankSec?.type === "blank-space") {
        i++;
      }
      continue;
    }
    renderSection(sec);
  }

  const filename = `Agreement_${d.student.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  doc.save(filename);
}
