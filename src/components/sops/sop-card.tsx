"use client";

import Link from "next/link";
import { FileText, Clock, User, Tag, ArrowRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface SOPCardProps {
  sop: {
    id: string;
    title: string;
    slug: string;
    category: string;
    code: string;
    description: string;
    alertTypes: string[];
    version: number;
    updatedAt: Date;
    author: string;
  };
}

const categoryColors: Record<string, string> = {
  Authentification: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Réseau: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Malware: "bg-red-500/10 text-red-400 border-red-500/30",
  Web: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Endpoint: "bg-green-500/10 text-green-400 border-green-500/30",
  Cloud: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
};

export function SOPCard({ sop }: SOPCardProps) {
  return (
    <Link
      href={`/sops/${sop.slug}`}
      className="group rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-slate-700 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">{sop.code}</span>
            <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
              {sop.title}
            </h3>
          </div>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
            categoryColors[sop.category] || "bg-slate-500/10 text-slate-400"
          }`}
        >
          {sop.category}
        </span>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm text-slate-400 line-clamp-2">{sop.description}</p>

      {/* Alert Types */}
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

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {sop.author}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(sop.updatedAt)}
          </span>
          <span>v{sop.version}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
      </div>
    </Link>
  );
}
