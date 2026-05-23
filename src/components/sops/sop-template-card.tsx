"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { 
  FileText, 
  Clock, 
  Users, 
  Target, 
  ChevronRight,
  Play,
  Download,
} from "lucide-react";
import { type SOPTemplate } from "@/data/sops";

interface SOPTemplateCardProps {
  sop: SOPTemplate;
}

const categoryColors: Record<string, string> = {
  Personnel: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Opérations: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Incidents: "bg-red-500/10 text-red-400 border-red-500/30",
  Alertes: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Proactif: "bg-green-500/10 text-green-400 border-green-500/30",
  Vulnérabilités: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Communication: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  Reporting: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
};

const categoryIcons: Record<string, string> = {
  Personnel: "👥",
  Opérations: "⚙️",
  Incidents: "🔥",
  Alertes: "🔔",
  Proactif: "🎯",
  Vulnérabilités: "🛡️",
  Communication: "📢",
  Reporting: "📊",
};

export function SOPTemplateCard({ sop }: SOPTemplateCardProps) {
  const totalSteps = sop.steps.length;
  const totalChecklist = sop.steps.reduce(
    (acc, step) => acc + (step.checklist?.length || 0), 
    0
  );
  const totalKpis = sop.kpis?.length || 0;

  const downloadPDF = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const url = `/api/sops/export?identifier=${encodeURIComponent(sop.slug)}&source=template`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Link
      href={`/sops/${sop.slug}`}
      className="group rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xl">
            {categoryIcons[sop.category] || "📋"}
          </div>
          <div>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ categoryColors[sop.category] || "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
              {sop.category}
            </span>
            <h3 className="mt-1 font-semibold text-white group-hover:text-emerald-400 transition-colors">
              {sop.title}
            </h3>
          </div>
        </div>
        <span className="text-xs text-slate-500">v{sop.version}</span>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-slate-400 line-clamp-2">
        {sop.description}
      </p>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{totalSteps} étapes</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="h-3.5 w-3.5" />
          <span>{totalChecklist} tâches</span>
        </div>
        {totalKpis > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{totalKpis} KPIs</span>
          </div>
        )}
      </div>

      {/* Objectives Preview */}
      <div className="mt-4 space-y-1">
        {sop.objectives.slice(0, 2).map((obj, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-emerald-500">✓</span>
            <span className="line-clamp-1">{obj}</span>
          </div>
        ))}
        {sop.objectives.length > 2 && (
          <span className="text-xs text-slate-600">
            +{sop.objectives.length - 2} autres objectifs
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          {sop.alertTypes.slice(0, 2).map((type) => (
            <span
              key={type}
              className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-400"
            >
              {type}
            </span>
          ))}
          {sop.alertTypes.length > 2 && (
            <span className="text-xs text-slate-600">
              +{sop.alertTypes.length - 2}
            </span>
          )}
          <button
            type="button"
            onClick={downloadPDF}
            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
          >
            <Download className="h-3 w-3" />
            PDF
          </button>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-emerald-500 group-hover:translate-x-1 transition-transform">
          <Play className="h-4 w-4" />
          <span>Démarrer</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
