"use client";

import { AlertDetailView } from "@/components/alerts/alert-detail-view";
import { useAlert } from "@/hooks/use-alerts";
import { Loader2 } from "lucide-react";

export default function AlertDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: alert, isLoading, error } = useAlert(params.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="rounded-xl border border-red-800/50 bg-red-900/20 p-6 text-center">
        <p className="text-red-400">Incident introuvable ou inaccessible.</p>
      </div>
    );
  }

  const normalizedAlert = {
    ...alert,
    description: alert.description || "Aucune description",
    sourceIp: alert.sourceIp || "N/A",
    destIp: alert.destIp || "N/A",
    sourcePort: alert.sourcePort || 0,
    destPort: alert.destPort || 0,
    protocol: alert.protocol || "N/A",
    ruleName: alert.ruleName || "N/A",
    ruleId: alert.ruleId || "N/A",
    detectedAt: new Date(alert.detectedAt),
    rawLog: (alert.rawLog as Record<string, unknown>) || {},
    enrichmentData: (alert.enrichmentData as Record<string, unknown>) || {},
    suggestedSOP: undefined,
  };

  return <AlertDetailView alert={normalizedAlert as any} />;
}
