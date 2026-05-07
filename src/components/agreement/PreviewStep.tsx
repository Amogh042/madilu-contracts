import type { AgreementData } from "@/lib/pg-data";
import { buildAgreementParagraphs } from "@/lib/agreement-text";
import { generateAgreementPDF } from "@/lib/generate-pdf";

type Props = {
  data: AgreementData;
  onBack: () => void;
  onDone: () => void;
};

export function PreviewStep({ data, onBack, onDone }: Props) {
  const paras = buildAgreementParagraphs(data);

  const handleDownload = () => {
    generateAgreementPDF(data);
    onDone();
  };

  return (
    <div className="glass rounded-3xl p-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold">Agreement Preview</h2>
        <p className="text-white/50 text-sm mt-1">Review the full agreement before generating the stamp-paper PDF</p>
      </div>

      <div className="rounded-2xl bg-[#fdfaf3] text-[#1a1a1a] p-10 max-h-[600px] overflow-y-auto shadow-2xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <h3 className="text-center text-xl font-bold underline mb-8">AGREEMENT CUM PROMISSORY NOTE</h3>
        <div className="space-y-4 text-[14px] leading-[1.8] text-justify">
          {paras.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="mt-16 space-y-6 text-sm">
          <div>Tenant Signature: ______________________ &nbsp;&nbsp; Date: ______________________</div>
          <div>Parent/Guardian Signature: ______________________ &nbsp;&nbsp; Date: ______________________</div>
          <div>Owner Signature: ______________________ &nbsp;&nbsp; Date: ______________________</div>
        </div>
      </div>

      <div className="flex justify-between mt-8 gap-3 flex-wrap">
        <button onClick={onBack} className="glass glass-hover rounded-xl px-6 py-3 text-sm">← Back to Edit</button>
        <button onClick={handleDownload} className="btn-gold rounded-xl px-8 py-3 text-sm font-semibold">
          ⬇ Download PDF
        </button>
      </div>
    </div>
  );
}
