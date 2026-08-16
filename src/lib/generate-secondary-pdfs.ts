import { jsPDF } from "jspdf";
import type { DbAgreement } from "./agreements-db";

const PAGE_W = 210;
const PAGE_H = 297;
const LEFT = 25;
const RIGHT = 20;
const BOTTOM = 20;
const FIRST_TOP = 110;
const TOP = 25;
const TEXT_W = PAGE_W - LEFT - RIGHT;

const fmtDate = (iso: string) => {
  if (!iso) return "____________";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

const inr = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
const blank = (v: string | null | undefined) => v || "____________";

function writeHeader(doc: jsPDF, y: number): number {
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  const t1 = "MADILU PG ACCOMMODATION";
  doc.text(t1, (PAGE_W - doc.getTextWidth(t1)) / 2, y);
  y += 6;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  const t2 = "Kumaraswamy Layout, Bangalore - 560078";
  doc.text(t2, (PAGE_W - doc.getTextWidth(t2)) / 2, y);
  y += 5;
  const t3 = "Contact: 8105127333";
  doc.text(t3, (PAGE_W - doc.getTextWidth(t3)) / 2, y);
  y += 8;
  return y;
}

// ─── TENURE EXTENSION ───

export function generateExtensionPDF(a: DbAgreement) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const EXT_FIRST_TOP = 55;
  let y = EXT_FIRST_TOP;
  const LH = 5.2;
  const maxY = PAGE_H - BOTTOM;

  const ensure = (needed: number) => {
    if (y + needed > maxY) {
      doc.addPage();
      y = TOP;
    }
  };

  const writeLine = (text: string, bold = false, fontSize = 11, indent = 0) => {
    doc.setFont("times", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, TEXT_W - indent) as string[];
    for (const line of lines) {
      ensure(LH);
      doc.text(line, LEFT + indent, y);
      y += LH;
    }
    doc.setFont("times", "normal");
    doc.setFontSize(11);
  };

  const writeGap = (g = 2) => {
    y += g;
  };

  y = writeHeader(doc, y);

  doc.setFont("times", "bold");
  doc.setFontSize(12);
  const title = "RENTAL TENURE EXTENSION AGREEMENT";
  doc.text(title, (PAGE_W - doc.getTextWidth(title)) / 2, y);
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  y += 8;

  writeLine("This Extension Agreement is made on this ___ day of ____________ 20__.");
  writeGap();

  writeLine("BETWEEN", true);
  writeGap();

  writeLine(
    `Mr. ${blank(a.owner_name)}, Proprietor of Madilu PG Accommodation, located at ${blank(a.pg_address)}, Kumaraswamy Layout, Bangalore - 560078.`,
  );
  writeLine("Hereinafter called the 'PG Owner / First Party'.");
  writeGap();

  writeLine("AND", true);
  writeGap();

  writeLine(`Ms./Mr. ${blank(a.student_name)}, S/D/o ${blank(a.guardian_name)},`);
  writeLine(`Age: ${blank(a.resident_age)}, Occupation: Student,`);
  writeLine(`Mobile: ${blank(a.student_phone)}, Aadhaar No: ____________`);
  writeLine(`Residing in Room No: ${blank(a.room_number)} at Madilu PG Accommodation.`);
  writeLine("Hereinafter called the 'Student / Second Party'.");
  writeGap();

  writeLine("RECITALS", true);
  writeGap();
  writeLine(
    `1. The Second Party was admitted to the PG on ${fmtDate(a.start_date)} under a rental agreement valid till ${fmtDate(a.end_date)}.`,
    false,
    11,
    3,
  );
  writeLine(
    "2. The Second Party now wishes to extend their stay for a further period.",
    false,
    11,
    3,
  );
  writeGap();

  writeLine("TERMS & CONDITIONS", true);
  writeGap();

  writeLine("1. Extended Period & Mandatory Tenure:", true, 11);
  writeLine(
    "The tenure is hereby extended from ____________ to ____________ for a mandatory period of 12 months.",
    false,
    11,
    3,
  );
  writeLine("Extension year shall be 20__.", false, 11, 3);
  writeLine("The Second Party agrees not to vacate before completion of 12 months.", false, 11, 3);
  writeGap();

  writeLine("2. Rent & Maintenance:", true, 11);
  writeLine(
    `Total: Rs. ${inr(a.monthly_rent)}/- per month, payable on or before the 5th of every month.`,
    false,
    11,
    3,
  );
  writeGap();

  writeLine("3. Late Payment Penalty:", true, 11);
  writeLine(
    "If rent is not paid on or before the due date, a late fine of Rs. 1000/- shall be applicable for that month.",
    false,
    11,
    3,
  );
  writeGap();

  writeLine("4. Security Deposit:", true, 11);
  writeLine(
    `Previous deposit of Rs. ${inr(a.security_deposit)}/- will continue. No new deposit required.`,
    false,
    11,
    3,
  );
  writeGap();

  writeLine("5. Rules & Agreement:", true, 11);
  writeLine(
    `All terms of original agreement dated ${fmtDate(a.start_date)} will continue to apply.`,
    false,
    11,
    3,
  );
  writeGap();

  writeLine("6. Breach:", true, 11);
  writeLine(
    "If dues are pending for 2 consecutive months, the PG Owner can terminate.",
    false,
    11,
    3,
  );
  writeLine(
    "If the student vacates before completion of 12 months, security deposit will be forfeited.",
    false,
    11,
    3,
  );
  writeGap(4);

  writeLine("SIGNATURES", true);
  writeGap(3);

  ensure(LH * 3 + 6 + LH + 6 + LH);

  const colW = (TEXT_W - 10) / 2;
  const sigY = y;
  doc.text("PG Owner: ______________________", LEFT, y);
  y += LH;
  doc.text(`Name: ${blank(a.owner_name)}`, LEFT, y);
  y += LH;
  doc.text("Date: ______________________", LEFT, y);
  y += LH;
  y = sigY;
  doc.text("Student: ______________________", LEFT + colW + 10, y);
  y += LH;
  doc.text(`Name: ${blank(a.student_name)}`, LEFT + colW + 10, y);
  y += LH;
  doc.text("Date: ______________________", LEFT + colW + 10, y);
  y += LH;

  y += 6;
  const witY = y;
  doc.text("Witness 1: ______________________", LEFT, y);
  y = witY;
  doc.text("Witness 2: ______________________", LEFT + colW + 10, y);
  y += LH + 6;

  const filename = `Extension_${a.student_name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  doc.save(filename);
}

// ─── EXIT / NO-DUES CERTIFICATE ───

export function generateExitPDF(a: DbAgreement) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const LH = 5.5;
  const maxY = PAGE_H - BOTTOM;

  const ensure = (needed: number) => {
    if (y + needed > maxY) {
      doc.addPage();
      y = TOP;
    }
  };

  const writeLine = (text: string, bold = false, fontSize = 11, indent = 0) => {
    doc.setFont("times", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, TEXT_W - indent) as string[];
    for (const line of lines) {
      ensure(LH);
      doc.text(line, LEFT + indent, y);
      y += LH;
    }
    doc.setFont("times", "normal");
    doc.setFontSize(11);
  };

  const writeGap = (g = 2) => {
    y += g;
  };

  // ─── PAGE 1: Vacating Letter ───
  let y = 25;

  y = writeHeader(doc, y);

  writeLine("Date: __ / __ / 20__");
  writeGap(3);

  writeLine("To,");
  writeLine(`Mr. ${blank(a.owner_name)}`);
  writeLine("Proprietor, Madilu PG Accommodation");
  writeLine("Kumaraswamy Layout, Bangalore - 560078");
  writeGap(3);

  writeLine("From:");
  writeLine(`Name: ${blank(a.student_name)}`);
  writeLine(`Room No: ${blank(a.room_number)}`);
  writeLine(`Mobile: ${blank(a.student_phone)}`);
  writeLine("Aadhaar No: ____________");
  writeGap(3);

  writeLine("Subject: Request for Exit and No-Dues Certificate", true);
  writeGap(3);

  writeLine("Respected Sir,");
  writeGap();

  writeLine(
    `I, ${blank(a.student_name)}, was residing in Room No ${blank(a.room_number)} at Madilu PG Accommodation since ${fmtDate(a.start_date)}.`,
  );
  writeGap();

  writeLine(
    "I hereby confirm that I am vacating the PG premises on ____________ due to ____________.",
  );
  writeGap();

  writeLine("I declare that:", true);
  writeLine(
    "1. All dues cleared: Rent and maintenance paid up to ____________. No pending dues.",
    false,
    11,
    3,
  );
  writeLine("2. Room & Property: Room, keys, ID card handed over in good condition.", false, 11, 3);
  writeLine(
    `3. Security Deposit: Kindly refund Rs. ${inr(a.security_deposit)}/- to UPI/Bank A/c: ____________ after deducting damages, if any.`,
    false,
    11,
    3,
  );
  writeGap(3);

  writeLine("I request you to issue a No-Dues Certificate and confirm my exit.");
  writeGap(4);

  writeLine("Yours obediently,");
  writeGap(3);
  writeLine("Signature: ______________________");
  writeLine(`Name: ${blank(a.student_name)}`);
  writeLine("Date: __ / __ / 20__");

  // ─── PAGE 2: No-Dues Certificate + Checklist ───
  doc.addPage();
  y = 25;

  y = writeHeader(doc, y);

  doc.setFont("times", "bold");
  doc.setFontSize(12);
  const certTitle = "FOR OFFICE USE - NO DUES CERTIFICATE";
  doc.text(certTitle, (PAGE_W - doc.getTextWidth(certTitle)) / 2, y);
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  y += 8;

  writeLine(
    `This is to certify that Mr./Ms. ${blank(a.student_name)}, Room No ${blank(a.room_number)} has vacated Madilu PG Accommodation on ____________.`,
  );
  writeGap();

  writeLine("All dues cleared / adjusted.");
  writeGap();

  writeLine(
    `Security Deposit of Rs. ${inr(a.security_deposit)}/- has been refunded / adjusted on ____________.`,
  );
  writeGap();

  writeLine("No further claims from either side.");
  writeGap(3);

  doc.setFont("times", "italic");
  doc.setFontSize(10);
  writeLine(
    "Note: For students exiting before 12 months, security deposit forfeited as per Extension Agreement Clause 6.",
    false,
    10,
  );
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  writeGap(4);

  writeLine("PG Owner Signature: ______________________");
  writeLine(`Name: ${blank(a.owner_name)}    Seal & Date: ______________________`);
  writeGap(6);

  doc.setLineWidth(0.3);
  doc.line(LEFT, y, LEFT + TEXT_W, y);
  y += 6;

  writeLine("HANDOVER CHECKLIST", true, 12);
  writeGap(3);

  const checkItems = [
    "Keys returned",
    "Room inspection completed - No damages",
    "Rent paid till: ___________",
    "Deposit refunded: Rs. _______ on _______",
    "Agreement copy collected",
  ];

  for (const item of checkItems) {
    doc.rect(LEFT, y - 3.5, 4, 4);
    doc.text(item, LEFT + 7, y);
    y += LH + 2;
  }

  const filename = `Exit_NoDues_${a.student_name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  doc.save(filename);
}
