"use client";

import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
  Copy,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Globe,
  Shield,
  User,
  Send,
  Loader2,
  Plus,
  CheckCheck,
  RotateCcw,
} from "lucide-react";
import { cn, formatDate, severityColor, statusColor } from "@/lib/utils";
import { useState } from "react";
import {
  useAddEvidence,
  useCloseAlert,
  useExportToIRIS,
  useReopenAlert,
  useSubmitInvestigation,
} from "@/hooks/use-alerts";

type EvidenceItem = {
  id: string;
  title: string;
  description: string;
  artifactType: string;
  artifactValue: string;
  createdAt: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
};

type ActionHistoryItem = {
  id: string;
  action: "EVIDENCE_ADDED" | "INCIDENT_CLOSED" | "INCIDENT_REOPENED";
  details: string;
  createdAt: string;
};

interface AlertDetailViewProps {
  alert: {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    source: string;
    sourceIp: string;
    destIp: string;
    sourcePort: number;
    destPort: number;
    protocol: string;
    ruleName: string;
    ruleId: string;
    detectedAt: Date;
    rawLog: Record<string, unknown>;
    enrichmentData: {
      abuseipdb?: {
        score: number;
        country: string;
        isp: string;
        reports: number;
      };
      virustotal?: {
        malicious: number;
        suspicious: number;
        harmless: number;
      };
      evidenceItems?: EvidenceItem[];
      actionHistory?: ActionHistoryItem[];
      closure?: {
        summary: string;
        closedAt: string;
      };
    };
    suggestedSOP?: {
      id: string;
      title: string;
      code: string;
    };
  };
}

const checklist = [
  { id: "1", text: "Vérifier si l'IP source est connue (asset interne, VPN, etc.)", required: true },
  { id: "2", text: "Consulter l'historique des connexions de l'IP source", required: true },
  { id: "3", text: "Vérifier si des connexions SSH ont réussi", required: true },
  { id: "4", text: "Identifier le compte ciblé", required: true },
  { id: "5", text: "Vérifier les logs système de la machine cible", required: false },
  { id: "6", text: "Déterminer si c'est un scan automatisé ou ciblé", required: false },
];

export function AlertDetailView({ alert }: AlertDetailViewProps) {
  const enrichment = alert.enrichmentData || {};
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(alert.status);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(
    Array.isArray(enrichment.evidenceItems) ? enrichment.evidenceItems : []
  );
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceType, setEvidenceType] = useState("log");
  const [evidenceValue, setEvidenceValue] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [closeSummary, setCloseSummary] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>(
    Array.isArray(enrichment.actionHistory) ? enrichment.actionHistory : []
  );
  const [irisResult, setIrisResult] = useState<{
    success: boolean;
    mock?: boolean;
    case_id?: number;
    case_soc_id?: string;
  } | null>(null);
  const [actionResult, setActionResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const exportToIRIS = useExportToIRIS();
  const submitInvestigation = useSubmitInvestigation();
  const addEvidence = useAddEvidence();
  const closeAlert = useCloseAlert();
  const reopenAlert = useReopenAlert();

  const handleExportToIRIS = async () => {
    try {
      const result = await exportToIRIS.mutateAsync(alert.id);
      setIrisResult({
        success: result.success,
        mock: result.mock,
        case_id: result.case.case_id,
        case_soc_id: result.case.case_soc_id,
      });
    } catch (error) {
      console.error("Export to IRIS failed:", error);
      setIrisResult({ success: false });
    }
  };

  const toggleCheckItem = (id: string) => {
    setChecklistState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddEvidence = async () => {
    if (!evidenceTitle.trim() || !evidenceDescription.trim()) {
      setActionResult({ type: "error", message: "Titre et description de preuve requis." });
      return;
    }

    try {
      const payload = (await addEvidence.mutateAsync({
        alertId: alert.id,
        title: evidenceTitle,
        description: evidenceDescription,
        artifactType: evidenceType,
        artifactValue: evidenceValue,
        file: evidenceFile,
      })) as {
        evidence?: EvidenceItem;
        alert?: { status?: string; enrichmentData?: { actionHistory?: ActionHistoryItem[] } };
      };

      if (payload?.evidence) {
        setEvidenceItems((prev) => [...prev, payload.evidence as EvidenceItem]);
      }
      if (payload?.alert?.status) {
        setCurrentStatus(payload.alert.status);
      }
      if (Array.isArray(payload?.alert?.enrichmentData?.actionHistory)) {
        setActionHistory(payload.alert.enrichmentData.actionHistory);
      }

      setEvidenceTitle("");
      setEvidenceDescription("");
      setEvidenceType("log");
      setEvidenceValue("");
      setEvidenceFile(null);
      setActionResult({ type: "success", message: "Preuve ajoutée avec succès." });
    } catch (error) {
      console.error("Failed to add evidence:", error);
      setActionResult({ type: "error", message: "Impossible d'ajouter la preuve." });
    }
  };

  const handleCloseIncident = async () => {
    if (!closeSummary.trim()) {
      setActionResult({ type: "error", message: "Le résumé de clôture est obligatoire." });
      return;
    }

    try {
      const payload = (await closeAlert.mutateAsync({
        alertId: alert.id,
        resolutionSummary: closeSummary,
      })) as {
        alert?: { status?: string; enrichmentData?: { actionHistory?: ActionHistoryItem[] } };
      };

      if (payload?.alert?.status) {
        setCurrentStatus(payload.alert.status);
      }
      if (Array.isArray(payload?.alert?.enrichmentData?.actionHistory)) {
        setActionHistory(payload.alert.enrichmentData.actionHistory);
      }
      setActionResult({ type: "success", message: "Incident clôturé." });
    } catch (error) {
      console.error("Failed to close alert:", error);
      setActionResult({ type: "error", message: "Impossible de clôturer l'incident." });
    }
  };

  const handleReopenIncident = async () => {
    if (!reopenReason.trim()) {
      setActionResult({ type: "error", message: "Le motif de réouverture est obligatoire." });
      return;
    }

    try {
      const payload = (await reopenAlert.mutateAsync({
        alertId: alert.id,
        reason: reopenReason,
      })) as {
        alert?: { status?: string; enrichmentData?: { actionHistory?: ActionHistoryItem[] } };
      };

      if (payload?.alert?.status) {
        setCurrentStatus(payload.alert.status);
      }
      if (Array.isArray(payload?.alert?.enrichmentData?.actionHistory)) {
        setActionHistory(payload.alert.enrichmentData.actionHistory);
      }
      setActionResult({ type: "success", message: "Incident réouvert." });
    } catch (error) {
      console.error("Failed to reopen alert:", error);
      setActionResult({ type: "error", message: "Impossible de réouvrir l'incident." });
    }
  };

  const completedItems = Object.values(checklistState).filter(Boolean).length;
  const progress = Math.round((completedItems / checklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/alerts"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded text-sm font-bold",
                  severityColor(alert.severity)
                )}
              >
                {alert.severity.charAt(0)}
              </span>
              <h1 className="text-xl font-bold text-white">{alert.title}</h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusColor(currentStatus)
                )}
              >
                {currentStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{alert.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => document.getElementById("evidence-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="flex items-center gap-2 rounded-lg border border-blue-700 bg-blue-900/40 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-800/40"
          >
            <Plus className="h-4 w-4" />
            Nouvelle preuve
          </button>
          <button
            onClick={handleExportToIRIS}
            disabled={exportToIRIS.isPending}
            className="flex items-center gap-2 rounded-lg border border-purple-700 bg-purple-900/50 px-4 py-2 text-sm font-medium text-purple-300 hover:bg-purple-800/50 disabled:opacity-50"
          >
            {exportToIRIS.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Export IRIS
          </button>
          <button className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Assigner
          </button>
          <button
            onClick={handleCloseIncident}
            disabled={closeAlert.isPending || currentStatus === "RESOLVED"}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {closeAlert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Clôturer
          </button>
          <button
            onClick={handleReopenIncident}
            disabled={reopenAlert.isPending || currentStatus !== "RESOLVED"}
            className="flex items-center gap-2 rounded-lg border border-amber-700 bg-amber-900/40 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-800/40 disabled:opacity-50"
          >
            {reopenAlert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Réouvrir
          </button>
        </div>
      </div>

      {actionResult && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            actionResult.type === "success"
              ? "border-emerald-800/60 bg-emerald-900/20 text-emerald-300"
              : "border-red-800/60 bg-red-900/20 text-red-300"
          )}
        >
          {actionResult.message}
        </div>
      )}

      {/* IRIS Export Result */}
      {irisResult && (
        <div
          className={`rounded-xl border p-4 ${
            irisResult.success
              ? "border-green-800/50 bg-green-900/20"
              : "border-red-800/50 bg-red-900/20"
          }`}
        >
          {irisResult.success ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-400">
                  Exporté vers IRIS avec succès
                  {irisResult.mock && " (mode démo)"}
                </p>
                <p className="text-sm text-slate-400">
                  Case ID: {irisResult.case_id} | SOC ID: {irisResult.case_soc_id}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-red-400">Échec de l&apos;export vers IRIS</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Alert Details & Investigation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alert Info */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Informations de l&apos;Alerte
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Source IP</p>
                <p className="text-sm font-mono text-white">{alert.sourceIp}:{alert.sourcePort}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Destination IP</p>
                <p className="text-sm font-mono text-white">{alert.destIp}:{alert.destPort}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Protocole</p>
                <p className="text-sm text-white">{alert.protocol}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Source</p>
                <p className="text-sm text-white">{alert.source}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Règle</p>
                <p className="text-sm text-white">{alert.ruleName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Détecté</p>
                <p className="text-sm text-white">{formatDate(alert.detectedAt)}</p>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Checklist d&apos;Investigation
              </h2>
              <span className="text-sm text-slate-400">{progress}% complété</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="space-y-3">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleCheckItem(item.id)}
                  className="flex items-start gap-3 w-full text-left p-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {checklistState[item.id] ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      checklistState[item.id]
                        ? "text-slate-500 line-through"
                        : "text-white"
                    )}
                  >
                    {item.text}
                    {item.required && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Example Query */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Exemple de Requête Kibana
            </h2>
            <div className="relative">
              <pre className="log-viewer text-sm overflow-x-auto">
                {`source.ip: "${alert.sourceIp}" AND event.category: "authentication"`}
              </pre>
              <button className="absolute top-2 right-2 rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={`http://localhost:5601/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-24h,to:now))&_a=(columns:!(_source),filters:!(),index:'suricata-*',interval:auto,query:(language:kuery,query:'source.ip:%20%22${alert.sourceIp}%22'),sort:!())`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir dans Kibana
              </a>
              <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                <Copy className="h-4 w-4" />
                Copier
              </button>
            </div>
          </div>

          {/* Findings */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Mes Findings
            </h2>
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Décrivez vos observations et conclusions..."
              className="w-full h-32 rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none resize-none"
            />
            
            {/* Conclusion */}
            <div className="mt-4">
              <p className="text-sm font-medium text-white mb-2">Conclusion:</p>
              <div className="flex flex-wrap gap-2">
                {["TRUE_POSITIVE", "FALSE_POSITIVE", "NEEDS_ESCALATION"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setConclusion(c)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      conclusion === c
                        ? c === "TRUE_POSITIVE"
                          ? "bg-red-600 text-white"
                          : c === "FALSE_POSITIVE"
                          ? "bg-green-600 text-white"
                          : "bg-orange-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    {c === "TRUE_POSITIVE" && "True Positive"}
                    {c === "FALSE_POSITIVE" && "False Positive"}
                    {c === "NEEDS_ESCALATION" && "Escalation requise"}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={async () => {
                  if (!conclusion) return;
                  try {
                    await submitInvestigation.mutateAsync({
                      alertId: alert.id,
                      analystId: "current-user", // TODO: get from session
                      findings,
                      conclusion: conclusion as "TRUE_POSITIVE" | "FALSE_POSITIVE" | "NEEDS_ESCALATION" | "INCONCLUSIVE",
                      checklistCompleted: checklistState,
                    });
                    window.alert("Investigation soumise avec succès!");
                  } catch (error) {
                    console.error("Failed to submit investigation:", error);
                  }
                }}
                disabled={!conclusion || submitInvestigation.isPending}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitInvestigation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Soumettre Investigation
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Enrichment & SOP */}
        <div className="space-y-6">
          {/* Incident Actions */}
          <div id="evidence-panel" className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Actions incident</h2>

            <div className="space-y-3">
              <p className="text-sm font-medium text-blue-200">Ajouter une nouvelle preuve</p>
              <input
                value={evidenceTitle}
                onChange={(e) => setEvidenceTitle(e.target.value)}
                placeholder="Titre de la preuve (ex: Log SSH suspect)"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <textarea
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                placeholder="Description et contexte de la preuve"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                rows={3}
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  placeholder="Type (log, fichier, hash, capture...)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <input
                  value={evidenceValue}
                  onChange={(e) => setEvidenceValue(e.target.value)}
                  placeholder="Valeur / artefact"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <input
                type="file"
                onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:text-xs file:text-white"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddEvidence}
                  disabled={addEvidence.isPending}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {addEvidence.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Ajouter la preuve
                </button>
              </div>
            </div>

            <div className="mt-5 border-t border-blue-900/60 pt-4">
              <p className="text-sm font-medium text-blue-200 mb-3">Clôture incident</p>
              <textarea
                value={closeSummary}
                onChange={(e) => setCloseSummary(e.target.value)}
                placeholder="Résumé de clôture (actions effectuées, impact, recommandations)"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                rows={3}
              />

              <p className="text-sm font-medium text-amber-200 mt-4 mb-2">Réouverture incident</p>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Motif de réouverture (nouvelle preuve, faux diagnostic, etc.)"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                rows={2}
              />
            </div>
          </div>

          {/* Evidence List */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Preuves collectées</h2>
            {evidenceItems.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune preuve enregistrée pour cet incident.</p>
            ) : (
              <div className="space-y-3">
                {evidenceItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{item.artifactType}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{item.description}</p>
                    {item.artifactValue ? <p className="mt-1 text-xs font-mono text-slate-400">{item.artifactValue}</p> : null}
                    {item.filePath ? (
                      <a
                        href={item.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-blue-300 hover:text-blue-200"
                      >
                        Fichier: {item.fileName || "télécharger"}
                      </a>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500">Ajoutée le {formatDate(new Date(item.createdAt))}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action History */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Historique des actions</h2>
            {actionHistory.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune action enregistrée.</p>
            ) : (
              <ol className="space-y-3">
                {[...actionHistory]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((entry) => (
                    <li key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                      <p className="text-sm text-white">{entry.details}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(new Date(entry.createdAt))}</p>
                    </li>
                  ))}
              </ol>
            )}
          </div>

          {/* Suggested SOP */}
          {alert.suggestedSOP ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white">SOP Recommandé</h2>
            </div>
            <p className="text-sm text-slate-300 mb-2">{alert.suggestedSOP.code}</p>
            <p className="text-sm font-medium text-white mb-4">
              {alert.suggestedSOP.title}
            </p>
            <Link
              href={`/sops/ssh-brute-force`}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 w-full justify-center"
            >
              <FileText className="h-4 w-4" />
              Ouvrir le SOP
            </Link>
          </div>
          ) : null}

          {/* Enrichment - AbuseIPDB */}
          {enrichment.abuseipdb && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-white">AbuseIPDB</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Score de confiance</span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      enrichment.abuseipdb.score > 70
                        ? "text-red-400"
                        : enrichment.abuseipdb.score > 30
                        ? "text-yellow-400"
                        : "text-green-400"
                    )}
                  >
                    {enrichment.abuseipdb.score}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Pays</span>
                  <span className="text-sm text-white">
                    {enrichment.abuseipdb.country}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">ISP</span>
                  <span className="text-sm text-white">
                    {enrichment.abuseipdb.isp}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Signalements</span>
                  <span className="text-sm text-red-400">
                    {enrichment.abuseipdb.reports}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Enrichment - VirusTotal */}
          {enrichment.virustotal && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-white">VirusTotal</h2>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-red-500/10 p-3 text-center">
                  <p className="text-lg font-bold text-red-400">
                    {enrichment.virustotal.malicious}
                  </p>
                  <p className="text-xs text-slate-400">Malicious</p>
                </div>
                <div className="flex-1 rounded-lg bg-yellow-500/10 p-3 text-center">
                  <p className="text-lg font-bold text-yellow-400">
                    {enrichment.virustotal.suspicious}
                  </p>
                  <p className="text-xs text-slate-400">Suspicious</p>
                </div>
                <div className="flex-1 rounded-lg bg-green-500/10 p-3 text-center">
                  <p className="text-lg font-bold text-green-400">
                    {enrichment.virustotal.harmless}
                  </p>
                  <p className="text-xs text-slate-400">Clean</p>
                </div>
              </div>
            </div>
          )}

          {/* Raw Log */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Log Brut</h2>
              <button className="text-slate-400 hover:text-white">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <pre className="log-viewer text-xs overflow-x-auto max-h-64">
              {JSON.stringify(alert.rawLog, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
