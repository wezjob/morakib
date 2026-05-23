"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  History,
  RefreshCw,
  FileText,
  CheckCircle,
  Edit,
  UserCheck,
  Plus,
  Clock,
} from "lucide-react";
import { useSOPInstance, useSOPInstanceHistory, SOPInstanceStatus } from "@/hooks/use-sop-instances";

const actionConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  created: { label: "Créé", icon: Plus, color: "bg-emerald-500/20 text-emerald-400" },
  updated: { label: "Modifié", icon: Edit, color: "bg-blue-500/20 text-blue-400" },
  step_completed: { label: "Étape complétée", icon: CheckCircle, color: "bg-cyan-500/20 text-cyan-400" },
  completed: { label: "Terminé", icon: CheckCircle, color: "bg-emerald-500/20 text-emerald-400" },
  validated: { label: "Validé", icon: UserCheck, color: "bg-purple-500/20 text-purple-400" },
};

const statusConfig: Record<SOPInstanceStatus, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "text-slate-400" },
  IN_PROGRESS: { label: "En cours", color: "text-blue-400" },
  COMPLETED: { label: "Complété", color: "text-emerald-400" },
  VALIDATED: { label: "Validé", color: "text-purple-400" },
  ARCHIVED: { label: "Archivé", color: "text-yellow-400" },
};

export default function SOPInstanceHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  
  const { data: instance, isLoading: loadingInstance } = useSOPInstance(id);
  const { data: historyData, isLoading: loadingHistory } = useSOPInstanceHistory(id);

  const isLoading = loadingInstance || loadingHistory;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Instance non trouvée</p>
        <Link href="/sops/instances">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/sops/instances/${id}/edit`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-emerald-500" />
              <h1 className="text-2xl font-bold text-white">Historique</h1>
            </div>
            <p className="text-slate-400">
              <span className="font-mono text-emerald-400">{instance.reference}</span>
              {" · "}{instance.title}
            </p>
          </div>
        </div>
        <Link href={`/sops/instances/${id}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Éditer
          </Button>
        </Link>
      </div>

      {/* Instance Summary */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-4">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-slate-500">SOP</p>
              <p className="text-white">{instance.sopTitle}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sujet</p>
              <p className="text-white">{instance.subjectName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Mentor</p>
              <p className="text-white">{instance.mentor?.name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Version actuelle</p>
              <p className="text-white">v{instance.version}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Progression</p>
              <p className="text-white">{instance.completionPercent}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-500" />
            Chronologie des modifications
          </CardTitle>
          <CardDescription className="text-slate-400">
            {historyData?.pagination.total || 0} entrée(s) dans l&apos;historique
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!historyData?.history.length ? (
            <p className="text-center text-slate-400 py-8">Aucun historique</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />
              
              <div className="space-y-6">
                {historyData.history.map((entry, index) => {
                  const action = actionConfig[entry.action] || {
                    label: entry.action,
                    icon: FileText,
                    color: "bg-slate-500/20 text-slate-400",
                  };
                  const ActionIcon = action.icon;
                  
                  return (
                    <div key={entry.id} className="relative pl-14">
                      {/* Timeline dot */}
                      <div className={`absolute left-4 w-5 h-5 rounded-full flex items-center justify-center ${action.color}`}>
                        <ActionIcon className="h-3 w-3" />
                      </div>
                      
                      <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={action.color}>
                                {action.label}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                v{entry.version}
                              </span>
                            </div>
                            <p className="text-white mt-2">{entry.description}</p>
                            {entry.statusBefore && entry.statusAfter && entry.statusBefore !== entry.statusAfter && (
                              <p className="text-sm text-slate-400 mt-1">
                                Statut: {" "}
                                <span className={statusConfig[entry.statusBefore as SOPInstanceStatus]?.color || ""}>
                                  {statusConfig[entry.statusBefore as SOPInstanceStatus]?.label || entry.statusBefore}
                                </span>
                                {" → "}
                                <span className={statusConfig[entry.statusAfter as SOPInstanceStatus]?.color || ""}>
                                  {statusConfig[entry.statusAfter as SOPInstanceStatus]?.label || entry.statusAfter}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">
                              {entry.user.name || entry.user.email}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(entry.createdAt).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Show changes if available */}
                        {entry.changes && Object.keys(entry.changes).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-2">Modifications:</p>
                            <div className="space-y-1">
                              {Object.entries(entry.changes).map(([field, change]) => (
                                <div key={field} className="text-xs">
                                  <span className="text-slate-400">{field}:</span>{" "}
                                  <span className="text-red-400">
                                    {String(change.old)}
                                  </span>
                                  {" → "}
                                  <span className="text-emerald-400">
                                    {String(change.new)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Connection to next */}
                      {index < historyData.history.length - 1 && (
                        <div className="absolute left-6 bottom-0 w-0.5 h-6 bg-slate-700" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
