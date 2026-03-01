"use client";

import { useState, useEffect } from "react";
import { useSOPs } from "@/hooks/use-sops";
import { useSubmitInvestigation } from "@/hooks/use-alerts";
import { CheckCircle2, Circle, Loader2, Send, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  title: string;
  severity: string;
  source: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sop?: any;
}

interface InvestigationPanelProps {
  alert: Alert;
  onComplete: () => void;
  onCancel: () => void;
}

// Default checklist if no SOP is selected
const defaultChecklist = [
  { id: "1", text: "Vérifier l'authenticité de l'alerte", required: true },
  { id: "2", text: "Analyser les logs associés", required: true },
  { id: "3", text: "Identifier les assets impactés", required: true },
  { id: "4", text: "Vérifier les IOCs (IP, domaines, hashes)", required: false },
  { id: "5", text: "Documenter les observations", required: true },
  { id: "6", text: "Déterminer la conclusion", required: true },
];

export function InvestigationPanel({
  alert,
  onComplete,
  onCancel,
}: InvestigationPanelProps) {
  const { data: sops } = useSOPs();
  const submitInvestigation = useSubmitInvestigation();
  
  const [selectedSopId, setSelectedSopId] = useState<string | null>(alert.sop?.id || null);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(15);

  // Get checklist from selected SOP or use default
  const selectedSop = sops?.find((s) => s.id === selectedSopId);
  const checklist = selectedSop?.checklist?.length
    ? selectedSop.checklist.map((text, i) => ({
        id: String(i + 1),
        text,
        required: i < 3, // First 3 items are required
      }))
    : defaultChecklist;

  // Reset checklist state when SOP changes
  useEffect(() => {
    setChecklistState({});
  }, [selectedSopId]);

  const toggleCheckItem = (id: string) => {
    setChecklistState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedItems = Object.values(checklistState).filter(Boolean).length;
  const progress = Math.round((completedItems / checklist.length) * 100);
  const requiredCompleted = checklist
    .filter((item) => item.required)
    .every((item) => checklistState[item.id]);

  const handleSubmit = async () => {
    if (!conclusion) return;

    try {
      await submitInvestigation.mutateAsync({
        alertId: alert.id,
        analystId: "current-user", // TODO: get from session
        sopId: selectedSopId || undefined,
        findings,
        conclusion: conclusion as "TRUE_POSITIVE" | "FALSE_POSITIVE" | "NEEDS_ESCALATION" | "INCONCLUSIVE",
        checklistCompleted: checklistState,
        timeSpentMinutes: timeSpent,
      });
      onComplete();
    } catch (error) {
      console.error("Failed to submit investigation:", error);
    }
  };

  const canSubmit = conclusion && requiredCompleted && findings.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* SOP Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <FileText className="inline h-4 w-4 mr-2" />
          SOP à suivre
        </label>
        <select
          value={selectedSopId || ""}
          onChange={(e) => setSelectedSopId(e.target.value || null)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Aucune SOP (checklist par défaut)</option>
          {sops?.map((sop) => (
            <option key={sop.id} value={sop.id}>
              {sop.title} ({sop.category})
            </option>
          ))}
        </select>
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">
            Checklist d&apos;investigation
          </h3>
          <span className="text-sm text-slate-400">{progress}% complété</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {checklist.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleCheckItem(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                checklistState[item.id]
                  ? "bg-emerald-900/30 text-emerald-300"
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
              )}
            >
              {checklistState[item.id] ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-slate-500 flex-shrink-0" />
              )}
              <span className="text-sm flex-1">
                {item.text}
                {item.required && <span className="text-red-400 ml-1">*</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Findings */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Mes observations *
        </label>
        <textarea
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          placeholder="Décrivez vos observations, analyses et conclusions..."
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none resize-none"
        />
      </div>

      {/* Time Spent */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Temps passé (minutes)
        </label>
        <input
          type="number"
          value={timeSpent}
          onChange={(e) => setTimeSpent(parseInt(e.target.value) || 0)}
          min={1}
          max={480}
          className="w-32 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Conclusion */}
      <div>
        <p className="text-sm font-medium text-slate-300 mb-3">Conclusion *</p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "TRUE_POSITIVE", label: "True Positive", color: "red" },
            { value: "FALSE_POSITIVE", label: "False Positive", color: "green" },
            { value: "NEEDS_ESCALATION", label: "Escalation", color: "orange" },
            { value: "INCONCLUSIVE", label: "Inconclusif", color: "slate" },
          ].map((c) => (
            <button
              key={c.value}
              onClick={() => setConclusion(c.value)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                conclusion === c.value
                  ? c.color === "red"
                    ? "bg-red-600 text-white"
                    : c.color === "green"
                    ? "bg-green-600 text-white"
                    : c.color === "orange"
                    ? "bg-orange-600 text-white"
                    : "bg-slate-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitInvestigation.isPending}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitInvestigation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Soumettre
        </button>
      </div>
    </div>
  );
}
