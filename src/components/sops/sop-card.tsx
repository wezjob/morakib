"use client";

import Link from "next/link";
import { FileText, Clock, User, Tag, ArrowRight, Shield } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface SOPCardProps {
  sop: {
    id: string;
    title: string;
    slug: string;
    category: string;
    contentMarkdown?: string;
    alertTypes: string[];
    version?: number;
    updatedAt: string | Date;
    mitreTechniques?: string[];
    severity?: string;
    createdBy?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

const categoryColors: Record<string, string> = {
  Authentification: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Réseau: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Malware: "bg-red-500/10 text-red-400 border-red-500/30",
  Web: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Endpoint: "bg-green-500/10 text-green-400 border-green-500/30",
  Cloud: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  Intrusion: "bg-red-500/10 text-red-400 border-red-500/30",
  Phishing: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  DDoS: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  DataLeak: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  Network: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Ransomware: "bg-red-500/10 text-red-400 border-red-500/30",
  "Lateral Movement": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  "Credential Access": "bg-violet-500/10 text-violet-400 border-violet-500/30",
  "Command & Control": "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

const severityColors: Record<string, string> = {
  LOW: "bg-green-500/10 text-green-400",
  MEDIUM: "bg-yellow-500/10 text-yellow-400",
  HIGH: "bg-orange-500/10 text-orange-400",
  CRITICAL: "bg-red-500/10 text-red-400",
};

// Extract description from markdown content
function getDescription(contentMarkdown?: string): string {
  if (!contentMarkdown) return "Aucune description disponible.";

  const lines = contentMarkdown.split("\n");

  const findValueAfterHeader = (headerPattern: RegExp) => {
    const headerIndex = lines.findIndex((line) => headerPattern.test(line.trim()));
    if (headerIndex < 0) return null;

    for (let i = headerIndex + 1; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith("#")) break;
      if (line.startsWith("|")) continue;
      return line;
    }
    return null;
  };

  const scenario = findValueAfterHeader(/^##\s+Scenario/i);
  if (scenario) return scenario.slice(0, 170);

  const objective = lines.find((line) => /^Objective\s*:/i.test(line.trim()));
  if (objective) return objective.replace(/^Objective\s*:/i, "").trim().slice(0, 170);

  const plainLines = lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith("#") && !trimmed.startsWith("|");
  });

  return plainLines[0]?.slice(0, 170) || "Aucune description disponible.";
}

export function SOPCard({ sop }: SOPCardProps) {
  const description = getDescription(sop.contentMarkdown);
  const author = sop.createdBy?.name || "Système";
  const version = sop.version || 1;
  const hasMitre = sop.mitreTechniques && sop.mitreTechniques.length > 0;

  return (
    <Link
      href={`/sops/custom/${sop.slug}`}
      className="group rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-slate-700 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${hasMitre ? "bg-red-500/10" : "bg-blue-500/10"}`}>
            {hasMitre ? (
              <Shield className="h-5 w-5 text-red-400" />
            ) : (
              <FileText className="h-5 w-5 text-blue-500" />
            )}
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">{sop.slug}</span>
            <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
              {sop.title}
            </h3>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
              categoryColors[sop.category] || "bg-slate-500/10 text-slate-400"
            }`}
          >
            {sop.category}
          </span>
          {sop.severity && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                severityColors[sop.severity] || severityColors.MEDIUM
              }`}
            >
              {sop.severity}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm text-slate-400 line-clamp-2">{description}</p>

      {/* MITRE Techniques */}
      {hasMitre && (
        <div className="mt-3 flex flex-wrap gap-1">
          {sop.mitreTechniques!.slice(0, 3).map((tid) => (
            <span
              key={tid}
              className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-mono text-red-400"
            >
              {tid}
            </span>
          ))}
          {sop.mitreTechniques!.length > 3 && (
            <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
              +{sop.mitreTechniques!.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Alert Types */}
      {!hasMitre && sop.alertTypes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {sop.alertTypes.slice(0, 3).map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-400"
            >
              <Tag className="h-3 w-3" />
              {type}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {author}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(new Date(sop.updatedAt))}
          </span>
          <span>v{version}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
      </div>
    </Link>
  );
}
