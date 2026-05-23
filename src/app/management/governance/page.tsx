"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { governanceNav, GovernanceSectionKey } from "@/data/governance-docs";

interface GovernanceApiDocument {
  id: string;
  code: string;
  section: GovernanceSectionKey;
  title: string;
  objective: string;
  alignment: string;
  details: string[];
}

const sectionLabelMap: Record<GovernanceSectionKey, string> = {
  foundations: "Documents Fondateurs",
  organization: "Organisation & Roles",
  processes: "Processus",
  metrics: "Reporting & Metriques",
  compliance: "Conformite",
  roadmap: "Roadmap",
};

export default function GovernanceSearchPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<GovernanceApiDocument[]>([]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    return params.toString();
  }, [search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/governance-docs?${queryString}`);
        const payload = await response.json();
        setDocuments((payload.documents || []) as GovernanceApiDocument[]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [queryString]);

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <h1 className="text-2xl font-bold text-white">Recherche Gouvernance SOC</h1>
        <p className="mt-2 text-sm text-gray-300">
          Index global de tous les documents de gouvernance avec recherche transversale.
        </p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par code, titre, objectif, alignement ou detail"
            className="w-full rounded-lg border border-gray-700 bg-gray-950/60 py-2 pl-10 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-red-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {governanceNav.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="rounded-lg border border-gray-700 bg-gray-900/30 px-3 py-2 text-sm text-gray-300 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {loading ? <p className="text-sm text-gray-300">Recherche en cours...</p> : null}

      {!loading ? (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <article key={doc.id} className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300">
                  {doc.code}
                </span>
                <span className="rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-300">
                  {sectionLabelMap[doc.section]}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">{doc.title}</h2>
              <p className="mt-2 text-sm text-gray-200">{doc.objective}</p>
              <p className="mt-2 text-sm text-gray-400">{doc.alignment}</p>
              <Link
                href={governanceNav.find((item) => item.key === doc.section)?.href || "/management"}
                className="mt-3 inline-flex text-sm text-red-300 hover:text-red-200"
              >
                Ouvrir la section
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
