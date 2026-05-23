"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Edit,
  History,
  CheckCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  Calendar,
  Mail,
  User,
  Check,
  X,
  RefreshCw,
  Download,
} from "lucide-react";
import { useSOPInstance, SOPInstanceStatus } from "@/hooks/use-sop-instances";
import { allSOPs, SOPTemplate, SOPStep, SOPChecklistItem } from "@/data/sops";

const statusConfig: Record<SOPInstanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: "Brouillon", color: "bg-slate-500/20 text-slate-400", icon: FileText },
  IN_PROGRESS: { label: "En cours", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  COMPLETED: { label: "Complété", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
  VALIDATED: { label: "Validé", color: "bg-purple-500/20 text-purple-400", icon: UserCheck },
  ARCHIVED: { label: "Archivé", color: "bg-yellow-500/20 text-yellow-400", icon: AlertTriangle },
};

export default function SOPInstanceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: instance, isLoading } = useSOPInstance(id);

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

  const sopTemplate = allSOPs.find((s: SOPTemplate) => s.slug === instance.sopSlug);
  const status = statusConfig[instance.status];
  const StatusIcon = status.icon;
  const checklistState = instance.checklistState as Record<string, boolean> || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sops/instances">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{instance.title}</h1>
              <Badge className={status.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-slate-400">
              <span className="font-mono text-emerald-400">{instance.reference}</span>
              {" · "}Version {instance.version}
              {" · "}{instance.sopTitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/sops/instances/${id}/history`}>
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              Historique
            </Button>
          </Link>
          <Link href={`/sops/instances/${id}/edit`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Progression</span>
            <span className="text-sm font-medium text-white">{instance.completionPercent}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                instance.status === "VALIDATED"
                  ? "bg-purple-500"
                  : instance.status === "COMPLETED"
                  ? "bg-emerald-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${instance.completionPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column - Subject & Mentor info */}
        <div className="space-y-6">
          {/* Subject Info */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-500" />
                Sujet du SOP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Nom complet</p>
                <p className="text-white text-lg">{instance.subjectName}</p>
              </div>
              {instance.subjectEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <p className="text-slate-300">{instance.subjectEmail}</p>
                </div>
              )}
              {instance.subjectRole && (
                <div>
                  <p className="text-xs text-slate-500">Rôle</p>
                  <p className="text-slate-300">{instance.subjectRole}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mentor Info */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                Mentor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {instance.mentor ? (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {instance.mentor.name?.slice(0, 2).toUpperCase() || "??"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white">{instance.mentor.name}</p>
                    <p className="text-sm text-slate-400">{instance.mentor.email}</p>
                    {instance.mentor.role && (
                      <Badge className="mt-1 bg-slate-700 text-slate-300">
                        {instance.mentor.role}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Aucun mentor assigné</p>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Créé le</span>
                <span className="text-white">
                  {new Date(instance.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              {instance.startedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Démarré le</span>
                  <span className="text-white">
                    {new Date(instance.startedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
              {instance.completedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Complété le</span>
                  <span className="text-emerald-400">
                    {new Date(instance.completedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
              {instance.validatedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Validé le</span>
                  <span className="text-purple-400">
                    {new Date(instance.validatedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
              {instance.dueDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Date limite</span>
                  <span className={`${new Date(instance.dueDate) < new Date() ? "text-red-400" : "text-white"}`}>
                    {new Date(instance.dueDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation Info */}
          {instance.validatedBy && (
            <Card className="bg-slate-900 border-slate-800 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400 text-lg flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {instance.validatedBy.name?.slice(0, 2).toUpperCase() || "??"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white">{instance.validatedBy.name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(instance.validatedAt!).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
                {instance.validationNotes && (
                  <div className="p-3 rounded bg-slate-800/50 border border-slate-700">
                    <p className="text-sm text-slate-300">{instance.validationNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right columns - Checklist */}
        <div className="col-span-2 space-y-6">
          {sopTemplate?.steps.map((step: SOPStep) => {
            const stepItems = step.checklist || [];
            const completedItems = stepItems.filter((item: SOPChecklistItem) => checklistState[item.id]);
            const allCompleted = stepItems.length > 0 && completedItems.length === stepItems.length;
            
            return (
              <Card key={step.id} className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                          allCompleted ? "bg-emerald-600" : "bg-slate-700"
                        }`}
                      >
                        {allCompleted ? <Check className="h-4 w-4" /> : step.id}
                      </span>
                      {step.title}
                    </CardTitle>
                    {stepItems.length > 0 && (
                      <Badge className={allCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}>
                        {completedItems.length}/{stepItems.length}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-slate-400">
                    {step.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stepItems.length > 0 ? (
                    <div className="space-y-2">
                      {stepItems.map((item: SOPChecklistItem) => {
                        const isChecked = checklistState[item.id];
                        return (
                          <div
                            key={item.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${
                              isChecked
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : "bg-slate-800/30 border-slate-700"
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                                isChecked ? "bg-emerald-500 text-white" : "bg-slate-700"
                              }`}
                            >
                              {isChecked ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 text-slate-500" />}
                            </div>
                            <span
                              className={`${
                                isChecked ? "text-emerald-400 line-through" : "text-slate-300"
                              }`}
                            >
                              {item.text}
                              {item.required && !isChecked && (
                                <span className="ml-1 text-red-400">*</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Aucun élément de checklist pour cette étape</p>
                  )}

                  {/* Step notes if present */}
                  {instance.formData && (instance.formData as Record<string, string>)[`step_${step.id}_notes`] && (
                    <div className="mt-4 p-3 rounded bg-slate-800/50 border border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Notes de l&apos;étape</p>
                      <p className="text-sm text-slate-300">
                        {(instance.formData as Record<string, string>)[`step_${step.id}_notes`]}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* General Notes */}
          {instance.notes && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Notes générales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded bg-slate-800/50 border border-slate-700">
                  <p className="text-slate-300 whitespace-pre-wrap">{instance.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
