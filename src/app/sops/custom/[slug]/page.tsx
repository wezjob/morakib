"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Shield,
  Terminal,
  ListChecks,
  Eye,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Play,
  CheckCircle2,
  Circle,
  Database,
  Edit,
  ClipboardCheck,
  Layers,
  Gauge,
} from "lucide-react";
import {
  getTacticById,
  getTechniqueById,
  MITRE_TECHNIQUES,
  type MitreTechnique,
} from "@/data/mitre-attack";
import { Modal } from "@/components/ui/modal";
import { SOPFormMitre } from "@/components/sops/sop-form-mitre";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CustomSOP {
  id: string;
  title: string;
  slug: string;
  category: string;
  alertTypes: string[];
  contentMarkdown: string;
  checklist?: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  mitreTactics?: string[];
  mitreTechniques?: string[];
  elkQueries?: { description: string; query: string }[];
  procedures?: string[];
  detection?: string[];
  mitigation?: string[];
  dataSources?: string[];
  severity?: string;
  estimatedTime?: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchSOP(slug: string): Promise<CustomSOP | null> {
  const res = await fetch(`/api/sops/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

const severityColors: Record<string, string> = {
  LOW: "bg-green-500/20 text-green-400 border-green-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
};

type TableData = {
  headers: string[];
  rows: string[][];
};

type MarkdownSection = {
  title: string;
  content: string;
};

function parseSections(markdown: string): MarkdownSection[] {
  const lines = markdown.split("\n");
  const sections: MarkdownSection[] = [];
  let currentTitle = "Vue d'ensemble";
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentContent.join("\n").trim()) {
        sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
      }
      currentTitle = line.replace(/^##\s+/, "").trim();
      currentContent = [];
    } else if (!line.startsWith("# ")) {
      currentContent.push(line);
    }
  }

  if (currentContent.join("\n").trim()) {
    sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
  }

  return sections;
}

function parseFirstTable(markdownSection: string): TableData | null {
  const lines = markdownSection.split("\n").map((line) => line.trim());
  const tableStart = lines.findIndex((line) => line.includes("|") && !line.startsWith("### "));
  if (tableStart < 0 || tableStart + 1 >= lines.length) return null;

  const separator = lines[tableStart + 1];
  if (!separator.includes("---")) return null;

  const headers = lines[tableStart]
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  const rows: string[][] = [];
  for (let i = tableStart + 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes("|")) break;
    if (line.startsWith("### ")) break;
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (cells.length > 0) rows.push(cells);
  }

  if (headers.length === 0 || rows.length === 0) return null;
  return { headers, rows };
}

function parsePhaseBlocks(markdownSection: string) {
  const lines = markdownSection.split("\n");
  const phases: { title: string; content: string }[] = [];
  let currentTitle = "Phase";
  let currentContent: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("### ")) {
      if (currentContent.join("\n").trim()) {
        phases.push({ title: currentTitle, content: currentContent.join("\n").trim() });
      }
      currentTitle = line.replace(/^###\s+/, "").trim();
      currentContent = [];
    } else {
      currentContent.push(rawLine);
    }
  }

  if (currentContent.join("\n").trim()) {
    phases.push({ title: currentTitle, content: currentContent.join("\n").trim() });
  }

  return phases.filter((phase) => phase.title !== "Phase");
}

function sectionAnchorId(prefix: string, rawTitle: string, index: number) {
  const slug = rawTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${prefix}-${slug || "section"}-${index}`;
}

export default function CustomSOPDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [copiedQuery, setCopiedQuery] = useState<number | null>(null);
  const [procedureChecks, setProcedureChecks] = useState<Set<number>>(new Set());
  const [checklistChecks, setChecklistChecks] = useState<Set<number>>(new Set());
  const [playbookActionChecks, setPlaybookActionChecks] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: sop, isLoading, error, refetch } = useQuery({
    queryKey: ["sop", slug],
    queryFn: () => fetchSOP(slug),
  });

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedQuery(index);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const toggleProcedure = (index: number) => {
    const newChecks = new Set(procedureChecks);
    if (newChecks.has(index)) {
      newChecks.delete(index);
    } else {
      newChecks.add(index);
    }
    setProcedureChecks(newChecks);
  };

  const toggleChecklist = (index: number) => {
    const newChecks = new Set(checklistChecks);
    if (newChecks.has(index)) {
      newChecks.delete(index);
    } else {
      newChecks.add(index);
    }
    setChecklistChecks(newChecks);
  };

  const isPlaybook =
    sop?.category === "Playbook NIST" || sop?.slug.startsWith("nist-playbook") || false;

  const playbookSections = useMemo(() => {
    if (!isPlaybook || !sop?.contentMarkdown) return [] as MarkdownSection[];
    return parseSections(sop.contentMarkdown);
  }, [isPlaybook, sop?.contentMarkdown]);

  const classificationSection = useMemo(() => {
    return playbookSections.find((section) =>
      section.title.toLowerCase().includes("incident classification")
    );
  }, [playbookSections]);

  const classificationTable = useMemo(() => {
    if (!classificationSection) return null;
    return parseFirstTable(classificationSection.content);
  }, [classificationSection]);

  const phasesSection = useMemo(() => {
    return playbookSections.find((section) =>
      section.title.toLowerCase().includes("phases and actions")
    );
  }, [playbookSections]);

  const phaseBlocks = useMemo(() => {
    if (!phasesSection) return [] as { title: string; content: string }[];
    return parsePhaseBlocks(phasesSection.content);
  }, [phasesSection]);

  const togglePlaybookAction = (actionKey: string) => {
    setPlaybookActionChecks((prev) => {
      const next = new Set(prev);
      if (next.has(actionKey)) {
        next.delete(actionKey);
      } else {
        next.add(actionKey);
      }
      return next;
    });
  };

  const jumpToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !sop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-400">SOP introuvable</p>
        <Link
          href="/sops"
          className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux SOPs
        </Link>
      </div>
    );
  }

  const techniques: MitreTechnique[] = (sop.mitreTechniques || [])
    .map((id) => getTechniqueById(id))
    .filter((t): t is MitreTechnique => t !== undefined);

  const procedureProgress =
    sop.procedures && sop.procedures.length > 0
      ? Math.round((procedureChecks.size / sop.procedures.length) * 100)
      : 0;

  const checklistProgress =
    sop.checklist && sop.checklist.length > 0
      ? Math.round((checklistChecks.size / sop.checklist.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/sops"
            className="flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>SOPs</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-600" />
          <span className="text-white font-medium">{sop.title}</span>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <Edit className="h-4 w-4" />
          Modifier
        </button>
      </div>

      {/* Title Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{sop.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                  {sop.category}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    severityColors[sop.severity || "MEDIUM"]
                  }`}
                >
                  {sop.severity || "MEDIUM"}
                </span>
                {sop.estimatedTime && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {sop.estimatedTime}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    sop.status === "PUBLISHED"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : sop.status === "DRAFT"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {sop.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Types */}
        {sop.alertTypes && sop.alertTypes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-500 mb-2 block">Types d&apos;alertes :</span>
            <div className="flex flex-wrap gap-2">
              {sop.alertTypes.map((type) => (
                <span
                  key={type}
                  className="rounded bg-orange-500/10 px-2 py-1 text-xs text-orange-400"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MITRE ATT&CK Section */}
      {techniques.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">
              MITRE ATT&CK Framework
            </h2>
          </div>

          {/* Tactics Grid */}
          {sop.mitreTactics && sop.mitreTactics.length > 0 && (
            <div className="mb-4">
              <span className="text-xs text-slate-500 mb-2 block">Tactiques :</span>
              <div className="flex flex-wrap gap-2">
                {sop.mitreTactics.map((tacticId) => {
                  const tactic = getTacticById(tacticId);
                  if (!tactic) return null;
                  return (
                    <a
                      key={tacticId}
                      href={`https://attack.mitre.org/tactics/${tacticId}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 hover:border-slate-600"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tactic.color }}
                      />
                      <span className="font-mono text-xs text-slate-500">
                        {tacticId}
                      </span>
                      <span className="text-sm text-white">{tactic.name}</span>
                      <ExternalLink className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Techniques Cards */}
          <div className="space-y-3">
            <span className="text-xs text-slate-500 block">Techniques :</span>
            {techniques.map((technique) => (
              <div
                key={technique.id}
                className="rounded-lg border border-slate-700 bg-slate-800 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <a
                      href={`https://attack.mitre.org/techniques/${technique.id.replace(
                        ".",
                        "/"
                      )}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2"
                    >
                      <span className="font-mono text-sm text-red-400">
                        {technique.id}
                      </span>
                      <span className="text-white font-medium">
                        {technique.name}
                      </span>
                      <ExternalLink className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100" />
                    </a>
                    <p className="mt-1 text-sm text-slate-400">
                      {technique.description}
                    </p>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {technique.platforms.map((p) => (
                    <span
                      key={p}
                      className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* ELK Queries */}
          {sop.elkQueries && sop.elkQueries.length > 0 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">
                  Requêtes ELK / KQL
                </h2>
              </div>
              <div className="space-y-4">
                {sop.elkQueries.map((query, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-slate-900 border border-slate-700 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                      <span className="text-sm text-slate-300">
                        {query.description || `Requête ${index + 1}`}
                      </span>
                      <button
                        onClick={() => copyToClipboard(query.query, index)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400"
                      >
                        {copiedQuery === index ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copié!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copier
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-sm font-mono text-emerald-400 overflow-x-auto">
                      {query.query}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detection Methods */}
          {sop.detection && sop.detection.length > 0 && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">
                  Méthodes de détection
                </h2>
              </div>
              <ul className="space-y-2">
                {sop.detection.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Sources */}
          {sop.dataSources && sop.dataSources.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-5 w-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-white">
                  Sources de données
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {sop.dataSources.map((ds) => (
                  <span
                    key={ds}
                    className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300"
                  >
                    {ds}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Procedure Steps */}
          {sop.procedures && sop.procedures.length > 0 && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ListChecks className="h-5 w-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">
                    Procédure d&apos;investigation
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${procedureProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {procedureProgress}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {sop.procedures.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => toggleProcedure(index)}
                    className={`w-full flex items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                      procedureChecks.has(index)
                        ? "bg-purple-500/20 border border-purple-500/30"
                        : "bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {procedureChecks.has(index) ? (
                        <CheckCircle2 className="h-5 w-5 text-purple-400" />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-600 text-xs text-slate-400">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        procedureChecks.has(index)
                          ? "text-purple-300 line-through"
                          : "text-slate-300"
                      }`}
                    >
                      {step}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          {sop.checklist && sop.checklist.length > 0 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ListChecks className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">
                    Checklist de validation
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${checklistProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {checklistProgress}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {sop.checklist.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => toggleChecklist(index)}
                    className={`w-full flex items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                      checklistChecks.has(index)
                        ? "bg-emerald-500/20 border border-emerald-500/30"
                        : "bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {checklistChecks.has(index) ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        checklistChecks.has(index)
                          ? "text-emerald-300 line-through"
                          : "text-slate-300"
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mitigation */}
          {sop.mitigation && sop.mitigation.length > 0 && (
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <h2 className="text-lg font-semibold text-white">
                  Mesures de mitigation
                </h2>
              </div>
              <ul className="space-y-2">
                {sop.mitigation.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Content Markdown */}
      {isPlaybook && sop.contentMarkdown ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-6">
            <h2 className="text-lg font-semibold text-white">Sommaire opérationnel</h2>
            <p className="mt-2 text-sm text-slate-300">
              Accès rapide aux blocs exploitables pour l&apos;analyse.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {classificationTable ? (
                <button
                  onClick={() => jumpToSection("playbook-definitions")}
                  className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  Définitions de l&apos;incident
                </button>
              ) : null}
              {phaseBlocks.map((phase, phaseIndex) => {
                const phaseId = sectionAnchorId("playbook-phase", phase.title, phaseIndex);
                return (
                  <button
                    key={phaseId}
                    onClick={() => jumpToSection(phaseId)}
                    className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  >
                    {phase.title}
                  </button>
                );
              })}
              <button
                onClick={() => jumpToSection("playbook-reference")}
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                Référence complète
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Layers className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Vue opérationnelle du Playbook</h2>
            </div>
            <p className="text-sm text-slate-300">
              Les sections sont structurées pour exécution terrain: définitions, actions et suivi.
            </p>
          </div>

          {classificationTable ? (
            <div id="playbook-definitions" className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-6 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <Gauge className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-semibold text-white">Définitions de l&apos;incident</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {classificationTable.rows.map((row, index) => (
                  <div key={`${row[0]}-${index}`} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{row[0]}</p>
                    <p className="mt-1 text-sm text-white">{row[1] || "-"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {phaseBlocks.length > 0 ? (
            <div className="space-y-4">
              {phaseBlocks.map((phase, phaseIndex) => {
                const phaseId = sectionAnchorId("playbook-phase", phase.title, phaseIndex);
                const table = parseFirstTable(phase.content);
                const actions = table?.rows || [];
                const completedCount = actions.filter((_, actionIndex) =>
                  playbookActionChecks.has(`${phaseIndex}-${actionIndex}`)
                ).length;
                const progress = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0;

                return (
                  <div id={phaseId} key={phase.title} className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6 scroll-mt-24">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-white">{phase.title}</h3>
                      {actions.length > 0 ? (
                        <span className="text-xs text-violet-300">{completedCount}/{actions.length} ({progress}%)</span>
                      ) : null}
                    </div>

                    {actions.length > 0 ? (
                      <div className="space-y-2">
                        {actions.map((row, actionIndex) => {
                          const actionKey = `${phaseIndex}-${actionIndex}`;
                          const checked = playbookActionChecks.has(actionKey);
                          return (
                            <button
                              key={`${phase.title}-${actionIndex}`}
                              onClick={() => togglePlaybookAction(actionKey)}
                              className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                                checked
                                  ? "border-violet-400/40 bg-violet-500/20"
                                  : "border-slate-700 bg-slate-900/70 hover:bg-slate-800"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {checked ? (
                                    <CheckCircle2 className="h-4 w-4 text-violet-300" />
                                  ) : (
                                    <ClipboardCheck className="h-4 w-4 text-slate-500" />
                                  )}
                                </div>
                                <div>
                                  <p className={`text-sm font-medium ${checked ? "text-violet-200" : "text-slate-200"}`}>
                                    {row[0] || "Action"}
                                  </p>
                                  <p className={`mt-1 text-sm ${checked ? "text-violet-100" : "text-slate-400"}`}>
                                    {row[1] || "-"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{phase.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div id="playbook-reference" className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 scroll-mt-24">
            <h2 className="text-lg font-semibold text-white mb-4">Référence complète</h2>
            <div className="prose prose-invert prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-700 [&_th]:bg-slate-900 [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:border-slate-700 [&_td]:px-3 [&_td]:py-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{sop.contentMarkdown}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : sop.contentMarkdown ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Description détaillée
          </h2>
          <div className="prose prose-invert prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-700 [&_th]:bg-slate-900 [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:border-slate-700 [&_td]:px-3 [&_td]:py-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{sop.contentMarkdown}</ReactMarkdown>
          </div>
        </div>
      ) : null}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier la SOP"
        size="xl"
      >
        <SOPFormMitre
          sop={sop}
          onSuccess={() => {
            setShowEditModal(false);
            refetch();
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
}
