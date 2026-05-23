"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  ArrowLeft,
  Save,
  CheckCircle,
  Clock,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  RefreshCw,
  History,
  AlertTriangle,
} from "lucide-react";
import { useSOPInstance, useUpdateSOPInstance, useValidateSOPInstance, SOPInstanceStatus } from "@/hooks/use-sop-instances";
import { allSOPs, SOPTemplate, SOPStep } from "@/data/sops";
import Link from "next/link";

const statusConfig: Record<SOPInstanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: "Brouillon", color: "bg-slate-500/20 text-slate-400", icon: FileText },
  IN_PROGRESS: { label: "En cours", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  COMPLETED: { label: "Complété", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
  VALIDATED: { label: "Validé", color: "bg-purple-500/20 text-purple-400", icon: UserCheck },
  ARCHIVED: { label: "Archivé", color: "bg-yellow-500/20 text-yellow-400", icon: AlertTriangle },
};

// Temporary user ID - in production this would come from auth
const CURRENT_USER_ID = "demo-user-id";

export default function SOPInstanceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
  const { data: instance, isLoading } = useSOPInstance(id);
  const updateMutation = useUpdateSOPInstance();
  const validateMutation = useValidateSOPInstance();

  const [sopTemplate, setSopTemplate] = useState<SOPTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [validationNotes, setValidationNotes] = useState("");

  // Load SOP template and instance data
  useEffect(() => {
    if (instance) {
      const template = allSOPs.find((s: SOPTemplate) => s.slug === instance.sopSlug);
      setSopTemplate(template || null);
      setCurrentStep(instance.currentStep);
      setChecklistState(instance.checklistState as Record<string, boolean> || {});
      setFormData(instance.formData as Record<string, string> || {});
      setNotes(instance.notes || "");
    }
  }, [instance]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    if (!sopTemplate) return 0;
    
    let totalItems = 0;
    let completedItems = 0;
    
    sopTemplate.steps.forEach((step) => {
      step.checklist?.forEach((item) => {
        totalItems++;
        if (checklistState[item.id]) completedItems++;
      });
    });
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    const newState = { ...checklistState, [itemId]: checked };
    setChecklistState(newState);
    setHasChanges(true);
  };

  const handleFormChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!instance) return;
    
    const completion = calculateCompletion();
    const newStatus = instance.status === "DRAFT" ? "IN_PROGRESS" : instance.status;
    
    try {
      await updateMutation.mutateAsync({
        id: instance.id,
        data: {
          currentStep,
          completionPercent: completion,
          formData,
          checklistState,
          notes,
          status: newStatus as SOPInstanceStatus,
          userId: CURRENT_USER_ID,
        },
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleComplete = async () => {
    if (!instance) return;
    
    try {
      await updateMutation.mutateAsync({
        id: instance.id,
        data: {
          currentStep: sopTemplate?.steps.length || currentStep,
          completionPercent: 100,
          formData,
          checklistState,
          notes,
          status: "COMPLETED",
          userId: CURRENT_USER_ID,
        },
      });
      setCompleteDialogOpen(false);
      setHasChanges(false);
    } catch (error) {
      console.error("Error completing:", error);
    }
  };

  const handleValidate = async () => {
    if (!instance) return;
    
    try {
      await validateMutation.mutateAsync({
        id: instance.id,
        data: {
          validatedById: CURRENT_USER_ID,
          validationNotes,
        },
      });
      setValidateDialogOpen(false);
    } catch (error) {
      console.error("Error validating:", error);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= (sopTemplate?.steps.length || 1)) {
      setCurrentStep(step);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!instance || !sopTemplate) {
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

  const currentStepData: SOPStep | undefined = sopTemplate.steps.find((s) => s.id === currentStep);
  const status = statusConfig[instance.status];
  const StatusIcon = status.icon;
  const completion = calculateCompletion();

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
              {" · "}Sujet: {instance.subjectName}
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
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {updateMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
          {instance.status !== "COMPLETED" && instance.status !== "VALIDATED" && (
            <Button
              onClick={() => setCompleteDialogOpen(true)}
              variant="outline"
              className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Terminer
            </Button>
          )}
          {instance.status === "COMPLETED" && (
            <Button
              onClick={() => setValidateDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Valider
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Progression globale</span>
            <span className="text-sm font-medium text-white">{completion}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>
          <div className="flex justify-between mt-3">
            {sopTemplate.steps.map((step) => {
              const stepCompleted = step.checklist?.every((item) => checklistState[item.id]) ?? false;
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                    currentStep === step.id
                      ? "bg-emerald-600 text-white"
                      : stepCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {stepCompleted && <Check className="h-3 w-3" />}
                  Étape {step.id}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subject Info Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Informations du sujet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-slate-500 text-xs">Nom</Label>
              <p className="text-white">{instance.subjectName}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-xs">Email</Label>
              <p className="text-white">{instance.subjectEmail || "-"}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-xs">Rôle</Label>
              <p className="text-white">{instance.subjectRole || "-"}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-xs">Mentor</Label>
              <p className="text-white">{instance.mentor?.name || "Non assigné"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      {currentStepData && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-sm">
                    {currentStepData.id}
                  </span>
                  {currentStepData.title}
                </CardTitle>
                <CardDescription className="text-slate-400 mt-2">
                  {currentStepData.description}
                </CardDescription>
              </div>
              {currentStepData.timeEstimate && (
                <Badge variant="outline" className="text-slate-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {currentStepData.timeEstimate}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Actions */}
            {currentStepData.actions && currentStepData.actions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Actions à effectuer</h4>
                <ul className="space-y-2">
                  {currentStepData.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-400">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Checklist */}
            {currentStepData.checklist && currentStepData.checklist.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Checklist</h4>
                <div className="space-y-2">
                  {currentStepData.checklist.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checklistState[item.id]
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checklistState[item.id] || false}
                        onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <span className={`${checklistState[item.id] ? "text-emerald-400 line-through" : "text-white"}`}>
                          {item.text}
                        </span>
                        {item.required && (
                          <span className="ml-2 text-xs text-red-400">*</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {currentStepData.tips && currentStepData.tips.length > 0 && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="text-sm font-medium text-blue-400 mb-2">💡 Conseils</h4>
                <ul className="space-y-1">
                  {currentStepData.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-blue-300">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Notes</h4>
              <textarea
                value={formData[`step_${currentStepData.id}_notes`] || ""}
                onChange={(e) => handleFormChange(`step_${currentStepData.id}_notes`, e.target.value)}
                placeholder="Ajoutez des notes pour cette étape..."
                className="w-full h-24 px-3 py-2 rounded-md border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => goToStep(currentStep - 1)}
          disabled={currentStep <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Étape précédente
        </Button>
        <span className="text-slate-400">
          Étape {currentStep} sur {sopTemplate.steps.length}
        </span>
        <Button
          variant="outline"
          onClick={() => goToStep(currentStep + 1)}
          disabled={currentStep >= sopTemplate.steps.length}
        >
          Étape suivante
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* General Notes */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Notes générales</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Notes générales sur ce SOP..."
            className="w-full h-32 px-3 py-2 rounded-md border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </CardContent>
      </Card>

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Terminer ce SOP
            </DialogTitle>
            <DialogDescription>
              Marquer ce SOP comme complété. Il pourra ensuite être validé par un superviseur.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-white font-medium">{instance.title}</p>
              <p className="text-sm text-slate-400 mt-1">Sujet: {instance.subjectName}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <span className="text-sm text-slate-400">{completion}%</span>
              </div>
            </div>
            
            {completion < 100 && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400">
                  ⚠️ La checklist n&apos;est pas complète à 100%. Voulez-vous quand même terminer?
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleComplete}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {updateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Terminer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validate Dialog */}
      <Dialog open={validateDialogOpen} onOpenChange={setValidateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-500" />
              Valider ce SOP
            </DialogTitle>
            <DialogDescription>
              En tant que superviseur, confirmez que ce SOP a été correctement complété.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-white font-medium">{instance.title}</p>
              <p className="text-sm text-slate-400 mt-1">Sujet: {instance.subjectName}</p>
              <p className="text-sm text-slate-400">Mentor: {instance.mentor?.name || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validationNotes">Notes de validation</Label>
              <textarea
                id="validationNotes"
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                placeholder="Commentaires optionnels..."
                className="w-full h-20 px-3 py-2 rounded-md border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setValidateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleValidate}
              disabled={validateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {validateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserCheck className="h-4 w-4 mr-2" />
              )}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
