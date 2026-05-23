"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

interface GovernanceDoc {
  id: string;
  code: string;
  title: string;
  section: string;
  objective: string;
  alignment: string;
  details: string[];
  workflowStatus: string;
  leadSignatureLabel: string | null;
  signatureLabel: string | null;
}

function GovernancePrintContent() {
  const searchParams = useSearchParams();
  const [docs, setDocs] = useState<GovernanceDoc[]>([]);

  const section = searchParams.get("section") || "";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (section) params.set("section", section);
    return params.toString();
  }, [section]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/governance-docs?${queryString}`);
      const payload = await response.json();
      setDocs(payload.documents || []);
      setTimeout(() => window.print(), 350);
    };

    void load();
  }, [queryString]);

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-black print:p-4">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold">MORAKIB SOC</h1>
        <p className="text-sm">Dossier de gouvernance - Impression officielle</p>
        <p className="text-xs">Genere le {new Date().toLocaleString("fr-FR")}</p>
      </div>

      {docs.map((doc) => (
        <article key={doc.id} className="mb-6 break-inside-avoid border border-black/20 p-4">
          <h2 className="text-lg font-semibold">{doc.code} - {doc.title}</h2>
          <p className="mt-1 text-sm">Section: {doc.section}</p>
          <p className="text-sm">Workflow: {doc.workflowStatus}</p>
          <p className="text-sm">Signature Lead: {doc.leadSignatureLabel || "N/A"}</p>
          <p className="text-sm">Signature Admin/RSSI: {doc.signatureLabel || "N/A"}</p>

          <p className="mt-3 text-sm"><strong>Objectif:</strong> {doc.objective}</p>
          <p className="mt-1 text-sm"><strong>Alignement:</strong> {doc.alignment}</p>

          <p className="mt-3 text-sm font-semibold">Contenu detaille:</p>
          <ul className="list-disc pl-6 text-sm">
            {doc.details.map((detail) => (
              <li key={`${doc.id}-${detail}`}>{detail}</li>
            ))}
          </ul>
        </article>
      ))}

      <p className="mt-8 text-right text-xs">Classification: INTERNE - SOC</p>
    </div>
  );
}

export default function GovernancePrintPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl bg-white p-8 text-black">Chargement...</div>}>
      <GovernancePrintContent />
    </Suspense>
  );
}
