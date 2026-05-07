import type { AgreementData } from "./pg-data";

const fmtDate = (iso: string) => {
  if (!iso) return "____________";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

const inr = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n || 0));

export function buildAgreementParagraphs(d: AgreementData): string[] {
  const s = d.student;
  const today = fmtDate(new Date().toISOString());
  const paras: string[] = [];

  paras.push(
    `This Agreement cum Promissory Note is executed on ${today} by ${s.name || "____________"}, residing at ${s.permanentAddress || "____________"} (hereinafter referred to as the "Tenant"), in favour of ${d.ownerName} (hereinafter referred to as the "Owner") for accommodation at ${d.pgName}, situated at ${d.pgAddress}.`
  );
  paras.push(
    `The Tenant can be contacted through mobile number ${s.phone || "____________"} and email address ${s.email || "____________"}.`
  );
  paras.push(
    `The Parent/Guardian of the Tenant, namely ${s.parentName || "____________"}, residing at ${s.parentAddress || "____________"}, can be contacted through ${s.parentPhone || "____________"} and ${s.parentEmail || "____________"}.`
  );
  paras.push(
    `The Tenant agrees to occupy the premises for a duration of 11 months commencing from ${fmtDate(d.startDate)} and ending on ${fmtDate(d.endDate)}, with a mandatory one-month notice period, thereby making the total commitment period effectively 12 months.`
  );
  paras.push(
    `The Tenant agrees to comply with all rules, regulations, disciplinary policies, accommodation rules, and operational guidelines mentioned in the Admission Form and any additional rules introduced by the Owner from time to time for the smooth functioning of the PG accommodation.`
  );
  paras.push(`The Tenant has selected the ${d.paymentMode} payment mode.`);

  if (d.paymentMode === "Monthly") {
    paras.push(
      `The Tenant agrees to pay a monthly rent of Rs. ${inr(d.monthlyRent)} on or before the 5th day of every month.`
    );
  } else if (d.paymentMode === "Annual 1 Instalment") {
    paras.push(
      `The Tenant agrees to pay the full annual accommodation amount of Rs. ${inr(d.monthlyRent * 11)} at the commencement of the stay.`
    );
  } else {
    const half = (d.monthlyRent * 11) / 2;
    paras.push(
      `The Tenant agrees to pay the accommodation amount in two instalments. The first instalment of Rs. ${inr(half)} shall be paid at the commencement of the stay and the second instalment of Rs. ${inr(half)} shall be paid within two months from the start date.`
    );
  }

  paras.push(
    `The Tenant further agrees and undertakes to pay the committed accommodation amount for the complete agreed duration of 12 months even if the premises are vacated before completion of the tenure.`
  );
  paras.push(
    `The Tenant shall pay a refundable security deposit amount equivalent to three months' rent, amounting to Rs. ${inr(d.securityDeposit)}, at the time of execution of this Agreement. The said amount shall be refundable at the end of the stay period after deduction of damages, pending dues, or liabilities, if any.`
  );
  paras.push(
    `The Tenant shall additionally pay a one-time maintenance and facilities charge of Rs. ${inr(d.maintenanceCharges)} towards electricity, water supply, maintenance services, and other common amenities for the academic year duration from June to May.`
  );
  paras.push(
    `The Tenant agrees to provide a minimum written notice period of one month before vacating the premises.`
  );
  paras.push(
    `The Tenant shall be fully responsible for any physical damage, loss, negligence, or misuse caused to the room, furniture, fittings, electrical appliances, or any property belonging to the PG accommodation during the period of occupancy. The Owner shall have the right to recover or deduct such charges from the security deposit.`
  );
  paras.push(
    `This Agreement shall be governed and interpreted in accordance with the laws of India and the courts located in Bangalore, Karnataka shall have exclusive jurisdiction over disputes arising from this Agreement. Both parties agree to first attempt amicable settlement and mediation before initiating legal proceedings.`
  );
  paras.push(
    `This Agreement cum Promissory Note shall remain binding upon the Tenant and their heirs, legal representatives, executors, administrators, and assigns.`
  );
  paras.push(
    `The Tenant confirms that the following supporting documents have been submitted during admission and agreement execution: ID Proof, Address Proof, Parent/Guardian ID Proof, Parent/Guardian Address Proof, and Payment Receipts.`
  );
  paras.push(
    `The Tenant hereby declares that they have carefully read, fully understood, and voluntarily agreed to abide by all the terms, conditions, rules, and obligations mentioned in this Agreement.`
  );
  return paras;
}
