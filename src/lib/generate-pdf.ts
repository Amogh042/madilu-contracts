import { jsPDF } from "jspdf";
import type { AgreementData } from "./pg-data";
import { buildAgreementParagraphs } from "./agreement-text";

const PAGE_W = 210;
const PAGE_H = 297;
const LEFT = 28;
const RIGHT = 24;
const BOTTOM = 25;
const FIRST_TOP = 110;
const TOP = 25;
const LINE_H = 6.3; // ~1.8 line-height for 12pt
const TEXT_W = PAGE_W - LEFT - RIGHT;

export function generateAgreementPDF(d: AgreementData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  let y = FIRST_TOP;
  let pageNum = 1;

  const newPage = () => {
    doc.addPage();
    pageNum++;
    y = TOP;
  };

  const ensure = (needed: number) => {
    if (y + needed > PAGE_H - BOTTOM) newPage();
  };

  // Title
  ensure(20);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  const title = "AGREEMENT CUM PROMISSORY NOTE";
  const titleW = doc.getTextWidth(title);
  const tx = (PAGE_W - titleW) / 2;
  doc.text(title, tx, y);
  doc.setLineWidth(0.3);
  doc.line(tx, y + 1.2, tx + titleW, y + 1.2);
  y += 12;

  doc.setFont("times", "normal");
  doc.setFontSize(12);

  const paras = buildAgreementParagraphs(d);
  for (const p of paras) {
    const lines = doc.splitTextToSize(p, TEXT_W) as string[];
    for (const line of lines) {
      ensure(LINE_H);
      doc.text(line, LEFT, y, { maxWidth: TEXT_W, align: "justify" });
      y += LINE_H;
    }
    y += 3;
  }

  // Signature section
  y += 30;
  if (y + 50 > PAGE_H - BOTTOM) newPage();
  const sig = (label: string) => {
    ensure(LINE_H * 2 + 6);
    doc.text(`${label}: ______________________`, LEFT, y);
    y += LINE_H;
    doc.text(`Date: ______________________`, LEFT, y);
    y += LINE_H + 6;
  };
  sig("Tenant Signature");
  sig("Parent/Guardian Signature");
  sig("Owner Signature");

  const filename = `Agreement_${d.student.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  doc.save(filename);
}
