import type { DbAgreement } from "@/lib/agreements-db";
import { generateExtensionPDF, generateExitPDF } from "@/lib/generate-secondary-pdfs";

type Props = {
  agreement: DbAgreement;
  docType: "extension" | "exit";
  onBack: () => void;
};

const fmtDate = (iso: string) => {
  if (!iso) return "____________";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

const inr = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
const blank = (v: string | null | undefined) => v || "____________";

function ExtensionPreview({ a }: { a: DbAgreement }) {
  return (
    <>
      <h3 className="text-center text-lg font-bold mt-2">MADILU PG ACCOMMODATION</h3>
      <p className="text-center text-sm">Kumaraswamy Layout, Bangalore - 560078</p>
      <p className="text-center text-sm mb-4">Contact: 8105127333</p>

      <h4 className="text-center font-bold mt-4 mb-4">RENTAL TENURE EXTENSION AGREEMENT</h4>

      <p className="mb-3">This Extension Agreement is made on this ___ day of ____________ 20__.</p>

      <h4 className="font-bold mt-4 mb-2">BETWEEN</h4>

      <p className="mb-2">Mr. {blank(a.owner_name)}, Proprietor of Madilu PG Accommodation, located at {blank(a.pg_address)}, Kumaraswamy Layout, Bangalore - 560078.</p>
      <p className="mb-3 italic">Hereinafter called the 'PG Owner / First Party'.</p>

      <h4 className="font-bold mb-2">AND</h4>

      <p className="mb-1">Ms./Mr. {blank(a.student_name)}, S/D/o {blank(a.guardian_name)},</p>
      <p className="mb-1">Age: __________, Occupation: Student,</p>
      <p className="mb-1">Mobile: {blank(a.student_phone)}, Aadhaar No: ____________</p>
      <p className="mb-2">Residing in Room No: {blank(a.room_number)} at Madilu PG Accommodation.</p>
      <p className="mb-3 italic">Hereinafter called the 'Student / Second Party'.</p>

      <h4 className="font-bold mt-4 mb-2">RECITALS</h4>
      <p className="mb-2 pl-3">1. The Second Party was admitted to the PG on {fmtDate(a.start_date)} under a rental agreement valid till {fmtDate(a.end_date)}.</p>
      <p className="mb-3 pl-3">2. The Second Party now wishes to extend their stay for a further period.</p>

      <h4 className="font-bold mt-4 mb-2">TERMS & CONDITIONS</h4>

      <p className="font-bold mb-1">1. Extended Period & Mandatory Tenure:</p>
      <p className="mb-1 pl-3">The tenure is hereby extended from ____________ to ____________ for a mandatory period of 12 months.</p>
      <p className="mb-1 pl-3">Extension year shall be 20__.</p>
      <p className="mb-3 pl-3">The Second Party agrees not to vacate before completion of 12 months.</p>

      <p className="font-bold mb-1">2. Rent & Maintenance:</p>
      <p className="mb-3 pl-3">Total: Rs. {inr(a.monthly_rent)}/- per month, payable on or before the 5th of every month.</p>

      <p className="font-bold mb-1">3. Late Payment Penalty:</p>
      <p className="mb-3 pl-3">If rent is not paid on or before the due date, a late fine of Rs. 1000/- shall be applicable for that month.</p>

      <p className="font-bold mb-1">4. Security Deposit:</p>
      <p className="mb-3 pl-3">Previous deposit of Rs. {inr(a.security_deposit)}/- will continue. No new deposit required.</p>

      <p className="font-bold mb-1">5. Rules & Agreement:</p>
      <p className="mb-3 pl-3">All terms of original agreement dated {fmtDate(a.start_date)} will continue to apply.</p>

      <p className="font-bold mb-1">6. Breach:</p>
      <p className="mb-1 pl-3">If dues are pending for 2 consecutive months, the PG Owner can terminate.</p>
      <p className="mb-4 pl-3">If the student vacates before completion of 12 months, security deposit will be forfeited.</p>

      <h4 className="font-bold mt-4 mb-3">SIGNATURES</h4>
      <div className="grid grid-cols-2 gap-8">
        <pre className="text-sm whitespace-pre-wrap font-serif">{"PG Owner: ______________________\nName: " + blank(a.owner_name) + "\nDate: ______________________"}</pre>
        <pre className="text-sm whitespace-pre-wrap font-serif">{"Student: ______________________\nName: " + blank(a.student_name) + "\nDate: ______________________"}</pre>
      </div>
      <div className="grid grid-cols-2 gap-8 mt-4">
        <p className="text-sm">Witness 1: ______________________</p>
        <p className="text-sm">Witness 2: ______________________</p>
      </div>
      <p className="mt-4 text-xs italic text-gray-500">Print on ₹100 E-stamp paper. Keep 2 copies.</p>
    </>
  );
}

function ExitPreview({ a }: { a: DbAgreement }) {
  return (
    <>
      <h3 className="text-center text-lg font-bold mt-2">MADILU PG ACCOMMODATION</h3>
      <p className="text-center text-sm">Kumaraswamy Layout, Bangalore - 560078</p>
      <p className="text-center text-sm mb-4">Contact: 8105127333</p>

      <p className="mb-3">Date: __ / __ / 20__</p>

      <p className="mb-1">To,</p>
      <p className="mb-1">Mr. {blank(a.owner_name)}</p>
      <p className="mb-1">Proprietor, Madilu PG Accommodation</p>
      <p className="mb-3">Kumaraswamy Layout, Bangalore - 560078</p>

      <p className="mb-1">From:</p>
      <p className="mb-1">Name: {blank(a.student_name)}</p>
      <p className="mb-1">Room No: {blank(a.room_number)}</p>
      <p className="mb-1">Mobile: {blank(a.student_phone)}</p>
      <p className="mb-3">Aadhaar No: ____________</p>

      <p className="font-bold mb-3">Subject: Request for Exit and No-Dues Certificate</p>

      <p className="mb-3">Respected Sir,</p>

      <p className="mb-3">I, {blank(a.student_name)}, was residing in Room No {blank(a.room_number)} at Madilu PG Accommodation since {fmtDate(a.start_date)}.</p>

      <p className="mb-3">I hereby confirm that I am vacating the PG premises on ____________ due to ____________.</p>

      <p className="font-bold mb-2">I declare that:</p>
      <p className="mb-1 pl-3">1. All dues cleared: Rent and maintenance paid up to ____________. No pending dues.</p>
      <p className="mb-1 pl-3">2. Room & Property: Room, keys, ID card handed over in good condition.</p>
      <p className="mb-3 pl-3">3. Security Deposit: Kindly refund Rs. {inr(a.security_deposit)}/- to UPI/Bank A/c: ____________ after deducting damages, if any.</p>

      <p className="mb-4">I request you to issue a No-Dues Certificate and confirm my exit.</p>

      <p className="mb-3">Yours obediently,</p>
      <pre className="text-sm whitespace-pre-wrap font-serif mb-4">{"Signature: ______________________\nName: " + blank(a.student_name) + "\nDate: __ / __ / 20__"}</pre>

      <div className="border-t-2 border-gray-300 mt-8 pt-6">
        <h3 className="text-center text-lg font-bold">MADILU PG ACCOMMODATION</h3>
        <p className="text-center text-sm mb-4">Kumaraswamy Layout, Bangalore - 560078</p>

        <h4 className="text-center font-bold mb-4">FOR OFFICE USE - NO DUES CERTIFICATE</h4>

        <p className="mb-3">This is to certify that Mr./Ms. {blank(a.student_name)}, Room No {blank(a.room_number)} has vacated Madilu PG Accommodation on ____________.</p>

        <p className="mb-3">All dues cleared / adjusted.</p>

        <p className="mb-3">Security Deposit of Rs. {inr(a.security_deposit)}/- has been refunded / adjusted on ____________.</p>

        <p className="mb-3">No further claims from either side.</p>

        <p className="italic text-sm text-gray-500 mb-4">Note: For students exiting before 12 months, security deposit forfeited as per Extension Agreement Clause 6.</p>

        <p className="mb-1">PG Owner Signature: ______________________</p>
        <p className="mb-4">Name: {blank(a.owner_name)}    Seal & Date: ______________________</p>

        <div className="border-t border-gray-300 mt-4 pt-4">
          <h4 className="font-bold mb-3">HANDOVER CHECKLIST</h4>
          {["Keys returned", "Room inspection completed - No damages", "Rent paid till: ___________", "Deposit refunded: Rs. _______ on _______", "Agreement copy collected"].map((item, i) => (
            <div key={i} className="flex items-start gap-2 mb-2 text-sm">
              <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm mt-0.5 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function SecondaryDocPreview({ agreement, docType, onBack }: Props) {
  const handleDownload = () => {
    if (docType === "extension") {
      generateExtensionPDF(agreement);
    } else {
      generateExitPDF(agreement);
    }
  };

  const title = docType === "extension" ? "Tenure Extension Agreement" : "Exit / No-Dues Certificate";

  return (
    <div className="glass rounded-3xl p-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold">{title}</h2>
        <p className="text-white/50 text-sm mt-1">Review before downloading. Blank fields are for manual filling.</p>
      </div>

      <div className="rounded-2xl bg-[#fdfaf3] text-[#1a1a1a] p-10 max-h-[600px] overflow-y-auto shadow-2xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <div className="text-[13px] leading-[1.8] text-justify">
          {docType === "extension" ? <ExtensionPreview a={agreement} /> : <ExitPreview a={agreement} />}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="glass glass-hover rounded-xl px-6 py-3 text-sm">← Back</button>
        <button onClick={handleDownload} className="btn-gold rounded-xl px-8 py-3 text-sm font-semibold">Download PDF</button>
      </div>
    </div>
  );
}
