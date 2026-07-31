import type { AgreementData } from "./pg-data";
import { amountInWords } from "./utils";

const parseLocal = (iso: string): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

const fmtDate = (iso: string) => {
  const d = parseLocal(iso);
  if (!d) return "____________";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

const fmtDay = (iso: string) => {
  const d = parseLocal(iso);
  if (!d) return "___";
  return d.getDate().toString();
};

const fmtMonthYear = (iso: string) => {
  const d = parseLocal(iso);
  if (!d) return "_______, ____";
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

const inr = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
const blank = (v: string) => v || "____________";

const calcMonths = (startIso: string, endIso: string): number => {
  const s = parseLocal(startIso);
  const e = parseLocal(endIso);
  if (!s || !e) return 12;
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (e.getDate() >= s.getDate()) months += 1;
  return months || 12;
};

const WORD_MAP: Record<number, string> = {
  1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six",
  7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten", 11: "Eleven", 12: "Twelve",
  13: "Thirteen", 14: "Fourteen", 15: "Fifteen", 16: "Sixteen", 17: "Seventeen",
  18: "Eighteen", 19: "Nineteen", 20: "Twenty", 21: "Twenty-One", 22: "Twenty-Two",
  23: "Twenty-Three", 24: "Twenty-Four",
};
const numberToWordsForMonths = (n: number): string => WORD_MAP[n] || String(n);

export type AgreementSection = {
  type: "header" | "subheader" | "paragraph" | "clause-title" | "sub-clause" | "signature-row" | "witness-row" | "note" | "section-title" | "blank-space";
  text: string;
  bold?: boolean;
  indent?: number;
  columns?: string[];
};

export function buildAgreementSections(d: AgreementData): AgreementSection[] {
  const s = d.student;
  const sections: AgreementSection[] = [];

  sections.push({ type: "header", text: "MADILU PG ACCOMMODATION", bold: true });
  sections.push({ type: "subheader", text: "Kumaraswamy Layout, Bengaluru, Karnataka" });
  sections.push({ type: "header", text: "PAYING GUEST LICENSE AGREEMENT", bold: true });

  sections.push({ type: "paragraph", text: `This Paying Guest License Agreement is made and executed at Bengaluru on this ${fmtDay(d.startDate)} day of ${fmtMonthYear(d.startDate)}.` });

  sections.push({ type: "clause-title", text: "BETWEEN", bold: true });

  sections.push({ type: "paragraph", text: `FIRST PARTY / OWNER: Madilu PG Accommodation, a proprietorship concern, represented by its Proprietor ${blank(d.ownerName)}, S/o ${blank(d.ownerFatherName)}, aged ${blank(d.ownerAge)} years, residing at ${blank(d.pgAddress)} (hereinafter referred to as the "Owner", which expression shall, unless repugnant to the context, include his/her heirs, successors, legal representatives and assigns).` });

  const relationLabel = s.guardianRelation ? `${s.guardianRelation}` : "Son/Daughter of";
  sections.push({ type: "paragraph", text: `SECOND PARTY / RESIDENT: ${blank(s.name)}, ${relationLabel} ${blank(s.guardianName)}, aged ${blank(d.residentAge)} years, permanent address: ${blank(s.permanentAddress)}, currently studying at ${blank(d.residentCollege)}, Student ID: ${blank(d.residentStudentId)}, Aadhaar No: ${blank(d.residentAadhaar)}, Mobile: ${blank(s.contactNumber)}, Email: ${blank(s.email)} (hereinafter referred to as the "Resident").` });

  sections.push({ type: "paragraph", text: `THIRD PARTY / GUARANTOR/PARENT: ${blank(s.guardianName)}, aged ${blank(d.parentAge)} years, residing at ${blank(s.guardianAddress)}, Mobile: ${blank(s.guardianPhone)}, Email: ${blank(s.guardianEmail)} (hereinafter referred to as the "Guarantor/Parent").` });

  sections.push({ type: "clause-title", text: "WHEREAS", bold: true });

  sections.push({ type: "sub-clause", text: "A. The Owner is running and managing a Paying Guest accommodation facility under the name and style of \"Madilu PG Accommodation\" at Kumaraswamy Layout, Bengaluru, Karnataka.", indent: 1 });
  const monthsDuration = calcMonths(d.startDate, d.endDate);
  const monthsLabel = `${monthsDuration} (${numberToWordsForMonths(monthsDuration)}) months`;
  sections.push({ type: "sub-clause", text: `B. The Resident has approached the Owner seeking accommodation as a Paying Guest in Room No. ${blank(d.roomNumber)} of the said PG facility for a period of ${monthsLabel}.`, indent: 1 });
  sections.push({ type: "sub-clause", text: "C. The Owner has agreed to grant a temporary license to the Resident for use and occupation of a bed space in the said room, subject to the terms and conditions set forth herein.", indent: 1 });

  sections.push({ type: "paragraph", text: "NOW THEREFORE, in consideration of the mutual covenants and agreements herein contained, the Parties agree as follows:" });

  // Clause 1
  sections.push({ type: "clause-title", text: "CLAUSE 1 — NATURE OF AGREEMENT & DURATION", bold: true });
  sections.push({ type: "sub-clause", text: "1.1 This Agreement is a temporary, revocable license to use and occupy a bed space in the designated room of the PG facility. It does not create any tenancy, lease, sub-lease, or any right of exclusive possession in favour of the Resident. The physical possession of the premises shall at all times remain with the Owner.", indent: 1 });
  sections.push({ type: "sub-clause", text: `1.2 This License shall be valid for a period of ${monthsLabel} commencing from ${fmtDate(d.startDate)} and ending on ${fmtDate(d.endDate)}.`, indent: 1 });

  // Clause 2
  sections.push({ type: "clause-title", text: "CLAUSE 2 — LICENSE FEE & SECURITY DEPOSIT", bold: true });
  if (d.paymentMode === "Monthly") {
    sections.push({ type: "sub-clause", text: `2.1 The Resident shall pay a Monthly License Fee of Rs. ${inr(d.monthlyRent)}/- (Rupees ${amountInWords(d.monthlyRent)} only) payable on or before the 5th day of each calendar month via UPI/Bank Transfer to the Owner's designated account.`, indent: 1 });
  } else if (d.instalments?.length) {
    const count = d.instalments.length;
    const total = d.instalments.reduce((sum, i) => sum + (i.amount || 0), 0);
    let text = `2.1 The Resident shall pay the License Fee of Rs. ${inr(total)}/- (Rupees ${amountInWords(total)} only) in ${count} instalment(s) via UPI/Bank Transfer to the Owner's designated account:`;
    d.instalments.forEach((inst, idx) => {
      text += ` (${String.fromCharCode(97 + idx)}) Instalment ${idx + 1} of Rs. ${inr(inst.amount)}/- (Rupees ${amountInWords(inst.amount)} only) due on ${fmtDate(inst.dueDate)};`;
    });
    text = text.replace(/;$/, ".");
    sections.push({ type: "sub-clause", text, indent: 1 });
  }
  sections.push({ type: "sub-clause", text: `2.2 In the event of late payment beyond the due date, a late payment fine of 10% of the due amount OR Rs. 1,000/-, whichever is higher, shall be levied. Intimation of dues shall be made via Crib software/WhatsApp.`, indent: 1 });
  sections.push({ type: "sub-clause", text: `2.3 The Resident shall pay an interest-free Security Deposit of Rs. ${inr(d.securityDeposit)}/- (Rupees ${amountInWords(d.securityDeposit)} only) at the time of execution of this Agreement. The said deposit shall be refundable at the time of vacating the premises, after deduction of any damages, pending dues, maintenance charges, or notice period shortfall, if applicable.`, indent: 1 });

  // Clause 3
  sections.push({ type: "clause-title", text: "CLAUSE 3 — MANDATORY LOCK-IN & NOTICE PERIOD", bold: true });
  sections.push({ type: "sub-clause", text: `3.1 There shall be a mandatory lock-in period of ${monthsLabel} from the date of commencement. In the event of early exit by the Resident during the lock-in period, the balance rent for the remaining months shall become immediately payable and the entire Security Deposit shall stand forfeited.`, indent: 1 });
  sections.push({ type: "sub-clause", text: "3.2 After completion of the lock-in period, the Resident shall provide a minimum of 30 (Thirty) days written notice via WhatsApp/Email before vacating. Failure to provide such notice shall result in deduction of one month's rent from the Security Deposit.", indent: 1 });

  // Clause 4
  sections.push({ type: "clause-title", text: "CLAUSE 4 — SCOPE OF FACILITIES & UTILITIES", bold: true });
  sections.push({ type: "sub-clause", text: "4.1 The License Fee includes the use of the following facilities: bed, mattress, locker/wardrobe, Wi-Fi, water supply, and housekeeping services.", indent: 1 });
  sections.push({ type: "sub-clause", text: "4.2 Use of heavy electrical appliances such as induction cooktops, room heaters, or air coolers is strictly prohibited without prior written consent of the Owner and payment of applicable extra charges.", indent: 1 });
  sections.push({ type: "sub-clause", text: "4.3 The Resident shall be liable for any electrical damage caused due to misuse or unauthorized use of appliances. Repair costs shall be recovered from the Resident or deducted from the Security Deposit.", indent: 1 });

  // Clause 5
  sections.push({ type: "clause-title", text: "CLAUSE 5 — MANDATORY HOUSE RULES & CONDUCT", bold: true });
  sections.push({ type: "sub-clause", text: "5.1 Curfew time is 9:30 PM. Late entry shall be permitted only with prior approval from both the Parent/Guarantor and the Owner.", indent: 1 });
  sections.push({ type: "sub-clause", text: "5.2 No visitors shall be allowed inside the PG premises without explicit written permission from the Owner.", indent: 1 });
  sections.push({ type: "sub-clause", text: "5.3 ZERO TOLERANCE POLICY: Consumption, possession, or distribution of alcohol, tobacco, cigarettes, e-cigarettes/vapes, or any narcotic/illegal substance within the premises shall result in immediate expulsion from the PG facility and forfeiture of the entire Security Deposit.", indent: 1 });
  sections.push({ type: "sub-clause", text: "5.4 Quiet hours shall be observed from 11:00 PM to 7:00 AM. No loud music, shouting, or nuisance behavior shall be permitted during these hours.", indent: 1 });

  // Clause 6
  sections.push({ type: "clause-title", text: "CLAUSE 6 — AMC (ANNUAL MAINTENANCE CHARGES)", bold: true });
  sections.push({ type: "paragraph", text: `An Annual Maintenance Charge of Rs. ${inr(d.maintenanceCharges)}/- (Rupees ${amountInWords(d.maintenanceCharges)} only) shall be payable per academic year at the time of admission/renewal. This charge is non-refundable and covers maintenance of furniture, fixtures, Wi-Fi infrastructure, water systems, and common areas.` });

  // Clause 7
  sections.push({ type: "clause-title", text: "CLAUSE 7 — POLICE VERIFICATION & COMPLIANCE DOCUMENTS", bold: true });
  sections.push({ type: "paragraph", text: "The Resident and Parent/Guarantor have submitted copies of Aadhaar Card, College ID, and Parent/Guardian ID at the time of admission. The Resident hereby provides consent for police verification through the Karnataka State Police (KSP) portal as required by law." });

  // Clause 8
  sections.push({ type: "clause-title", text: "CLAUSE 8 — LIABILITY & PERSONAL BELONGINGS", bold: true });
  sections.push({ type: "sub-clause", text: "8.1 The Owner shall not be liable for any loss, theft, or damage to the personal belongings of the Resident.", indent: 1 });
  sections.push({ type: "sub-clause", text: "8.2 Any damage caused to the property of the PG facility shall be evaluated by the Owner, and the cost of repair/replacement shall be recovered from the Resident or deducted from the Security Deposit.", indent: 1 });

  // Clause 9
  sections.push({ type: "clause-title", text: "CLAUSE 9 — TERMINATION OF LICENSE & COMPLIANCE", bold: true });
  sections.push({ type: "sub-clause", text: "9.1 The Owner reserves the right to terminate this License and evict the Resident within 24 hours in the event of: (a) non-payment of License Fee within 10 days of the due date; (b) violation of the Zero Tolerance Policy under Clause 5.3; (c) any illegal activity or conduct bringing disrepute to the PG facility.", indent: 1 });
  sections.push({ type: "sub-clause", text: "9.2 The Resident and Parent/Guarantor shall abide by all rules and regulations of the PG facility, which form an integral part of this Agreement.", indent: 1 });

  // Clause 10
  sections.push({ type: "clause-title", text: "CLAUSE 10 — JURISDICTION", bold: true });
  sections.push({ type: "paragraph", text: "This Agreement shall be governed by and construed in accordance with the laws of India. The courts located in Bengaluru, Karnataka shall have exclusive jurisdiction over any disputes arising out of or in connection with this Agreement. Both parties agree to first attempt amicable settlement and mediation before initiating any legal proceedings." });

  // Clause 11
  sections.push({ type: "clause-title", text: "CLAUSE 11 — COMPLIANCE WITH ADMISSION FORM RULES", bold: true });
  sections.push({ type: "paragraph", text: "The Second Party/Resident and the Third Party/Guarantor/Parent shall strictly abide by all rules, regulations, and conditions mentioned in the Admission Form signed at the time of joining. The Admission Form shall form an integral part of this Agreement, and any violation of the rules stated therein shall be treated as a breach of this Agreement." });

  // Signature blocks
  sections.push({ type: "signature-row", text: "", columns: [
    `FIRST PARTY / OWNER\n\n\nSignature: ______________________\nFor\nMadilu PG Accommodation,\nProprietor\n${blank(d.ownerName)}`,
    `SECOND PARTY / RESIDENT\n\n\nSignature: ______________________\n${blank(s.name)}`,
  ]});

  sections.push({ type: "signature-row", text: `THIRD PARTY / GUARANTOR/PARENT\n\n\nSignature: ______________________\n${blank(s.guardianName)}` });

  sections.push({ type: "clause-title", text: "WITNESSES", bold: true });
  const witness1Name = d.createdByManagerName || "______________________";
  sections.push({ type: "witness-row", text: "", columns: [
    `1.\nName: ${witness1Name}\n[Signature Box]`,
    `2.\nName: ______________________\n[Signature Box]`,
  ]});

  sections.push({ type: "clause-title", text: "SPECIAL NOTES (If Any):", bold: true });
  sections.push({ type: "blank-space", text: "" });

  return sections;
}

export function buildAgreementParagraphs(d: AgreementData): string[] {
  const sections = buildAgreementSections(d);
  return sections.map(s => {
    if (s.bold && (s.type === "clause-title" || s.type === "header" || s.type === "section-title")) {
      return `**${s.text}**`;
    }
    if ((s.type === "signature-row" || s.type === "witness-row") && s.columns) {
      return s.columns.join("\n\n");
    }
    return s.text;
  });
}
