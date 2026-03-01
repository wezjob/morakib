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
} from "lucide-react";
import { cn, formatDate, severityColor, statusColor } from "@/lib/utils";
import { useState } from "react";
import { useExportToIRIS, useSubmitInvestigation } from "@/hooks/use-alerts";

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
    };
    suggestedSOP: {
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
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState<string | null>(null);
  const [irisResult, setIrisResult] = useState<{
    success: boolean;
    mock?: boolean;
    case_id?: number;
    case_soc_id?: string;
  } | null>(null);
  
  const exportToIRIS = useExportToIRIS();
  const submitInvestigation = useSubmitInvestigation();

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
                  statusColor(alert.status)
                )}
              >
                {alert.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{alert.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
            Escalader
          </button>
        </div>
      </div>

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
          {/* Suggested SOP */}
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

          {/* Enrichment - AbuseIPDB */}
          {alert.enrichmentData.abuseipdb && (
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
                      alert.enrichmentData.abuseipdb.score > 70
                        ? "text-red-400"
                        : alert.enrichmentData.abuseipdb.score > 30
                        ? "text-yellow-400"
                        : "text-green-400"
                    )}
                  >
                    {alert.enrichmentData.abuseipdb.score}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Pays</span>
                  <span className="text-sm text-white">
                    {alert.enrichmentData.abuseipdb.country}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">ISP</span>
                  <span className="text-sm text-white">
                    {alert.enrichmentData.abuseipdb.isp}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Signalements</span>
                  <span className="text-sm text-red-400">
                    {alert.enrichmentData.abuseipdb.reports}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Enrichment - VirusTotal */}
          {alert.enrichmentData.virustotal && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-white">VirusTotal</h2>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-red-500/10 p-3 text-center">
                  <p className="text-lg font-bold text-red-400">
                    {alert.enrichmentData.virustotal.malicious}
                  </p>
                  <p className="text-xs text-slate-400">Malicious</p>
                </div>
                <div className="flex-1 rounded-lg bg-yellow-500/10 p-3 text-center">
                  <p className="text-lg font-bold text-yellow-400">
                    {alert.enrichmentData.virustotal.suspicious}
                  </p>
                  <p className="text-xs text-slate-400">Suspicious</p>
                </div>
                <div className="flex-1 rounded-lg bg-green-500/10 p-3 text-center">
                  <p className="text-lg font-bold text-green-400">
                    {alert.enrichmentData.virustotal.harmless}
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
