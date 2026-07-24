import type { AgreementData } from "@/lib/pg-data";
import { buildAgreementSections, type AgreementSection } from "@/lib/agreement-text";
import { generateAgreementPDF } from "@/lib/generate-pdf";

type Props = {
  data: AgreementData;
  onBack: () => void;
  onDone: () => void;
  saving?: boolean;
  submitLabel?: string;
};

function SectionRenderer({ sections }: { sections: AgreementSection[] }) {
  return (
    <>
      {sections.map((sec, i) => {
        switch (sec.type) {
          case "header":
            return <h3 key={i} className="text-center text-lg font-bold mt-4">{sec.text}</h3>;
          case "subheader":
            return <p key={i} className="text-center text-sm mb-4">{sec.text}</p>;
          case "clause-title":
            return <h4 key={i} className="font-bold mt-6 mb-2 text-[15px]">{sec.text}</h4>;
          case "section-title":
            return <h5 key={i} className="font-bold mt-5 mb-2 text-[14px] uppercase tracking-wide">{sec.text}</h5>;
          case "paragraph":
            return <p key={i} className="mb-3">{sec.text}</p>;
          case "sub-clause":
            return <p key={i} className="mb-2" style={{ paddingLeft: (sec.indent || 0) * 16 }}>{sec.text}</p>;
          case "signature-row":
            if (sec.columns && sec.columns.length === 2) {
              return (
                <div key={i} className="grid grid-cols-2 gap-8 mt-4 mb-2">
                  <pre className="text-sm whitespace-pre-wrap font-serif">{sec.columns[0]}</pre>
                  <pre className="text-sm whitespace-pre-wrap font-serif">{sec.columns[1]}</pre>
                </div>
              );
            }
            return <pre key={i} className="mt-4 mb-2 text-sm whitespace-pre-wrap font-serif">{sec.text}</pre>;
          case "note":
            return <p key={i} className="mt-6 text-xs italic text-gray-500 whitespace-pre-wrap">{sec.text}</p>;
          default:
            return null;
        }
      })}
    </>
  );
}

export function PreviewStep({ data, onBack, onDone, saving, submitLabel }: Props) {
  const mainSections = buildAgreementSections(data);

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
        <div className="text-[13px] leading-[1.8] text-justify">
          <SectionRenderer sections={mainSections} />
        </div>
      </div>

      <div className="flex justify-between mt-8 gap-3 flex-wrap">
        <button onClick={onBack} className="glass glass-hover rounded-xl px-6 py-3 text-sm">← Back to Edit</button>
        <div className="flex gap-3">
          <button onClick={() => generateAgreementPDF(data)} className="glass glass-hover rounded-xl px-6 py-3 text-sm">
            Download PDF
          </button>
          <button onClick={handleDownload} disabled={saving} className="btn-gold rounded-xl px-8 py-3 text-sm font-semibold disabled:opacity-40">
            {saving ? "Saving..." : submitLabel || "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
