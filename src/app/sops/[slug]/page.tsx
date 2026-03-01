"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Copy, 
  FileText,
  Users,
  Target,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCheck,
  BarChart3,
  AlertTriangle,
  Terminal,
  ClipboardList,
  Bookmark,
  Share2,
  Loader2
} from "lucide-react";
import { getSOPBySlug, type SOPTemplate, type SOPStep } from "@/data/sops";

interface ChecklistState {
  [stepId: number]: {
    [itemId: string]: boolean;
  };
}

export default function SOPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [sop, setSop] = useState<SOPTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));
  const [checklistState, setChecklistState] = useState<ChecklistState>({});
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Load SOP from data
  useEffect(() => {
    const sopData = getSOPBySlug(slug);
    if (sopData) {
      setSop(sopData);
      // Initialize checklist state
      const initialState: ChecklistState = {};
      sopData.steps.forEach(step => {
        if (step.checklist) {
          initialState[step.id] = {};
          step.checklist.forEach(item => {
            initialState[step.id][item.id] = false;
          });
        }
      });
      setChecklistState(initialState);
      
      // Try to load saved state from localStorage
      const savedState = localStorage.getItem(`sop-checklist-${slug}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setChecklistState(parsed.checklist || initialState);
          if (parsed.activeStep) setActiveStep(parsed.activeStep);
          if (parsed.startTime) setStartTime(new Date(parsed.startTime));
        } catch (e) {
          console.error("Error loading saved state", e);
        }
      }
    }
    setLoading(false);
  }, [slug]);

  // Save state to localStorage
  useEffect(() => {
    if (sop && Object.keys(checklistState).length > 0) {
      localStorage.setItem(`sop-checklist-${slug}`, JSON.stringify({
        checklist: checklistState,
        activeStep,
        startTime: startTime?.toISOString()
      }));
    }
  }, [checklistState, activeStep, startTime, slug, sop]);

  // Timer for elapsed time
  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);

  const toggleStep = (stepId: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const toggleChecklistItem = (stepId: number, itemId: string) => {
    setChecklistState(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        [itemId]: !prev[stepId]?.[itemId]
      }
    }));
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const startProcedure = () => {
    setStartTime(new Date());
    setActiveStep(1);
    setExpandedSteps(new Set([1]));
  };

  const resetProcedure = () => {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser la progression ?")) {
      setStartTime(null);
      setElapsedTime(0);
      setActiveStep(1);
      const initialState: ChecklistState = {};
      sop?.steps.forEach(step => {
        if (step.checklist) {
          initialState[step.id] = {};
          step.checklist.forEach(item => {
            initialState[step.id][item.id] = false;
          });
        }
      });
      setChecklistState(initialState);
      localStorage.removeItem(`sop-checklist-${slug}`);
    }
  };

  const getStepProgress = (step: SOPStep): { completed: number; total: number; percentage: number } => {
    if (!step.checklist) return { completed: 0, total: 0, percentage: 100 };
    const stepState = checklistState[step.id] || {};
    const completed = Object.values(stepState).filter(Boolean).length;
    const total = step.checklist.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 100 };
  };

  const getTotalProgress = (): { completed: number; total: number; percentage: number } => {
    if (!sop) return { completed: 0, total: 0, percentage: 0 };
    let completed = 0;
    let total = 0;
    sop.steps.forEach(step => {
      if (step.checklist) {
        const stepState = checklistState[step.id] || {};
        completed += Object.values(stepState).filter(Boolean).length;
        total += step.checklist.length;
      }
    });
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <p className="mt-4 text-slate-400">SOP non trouvée</p>
        </div>
      </div>
    );
  }

  const totalProgress = getTotalProgress();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux SOPs
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <FileText className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{sop.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-medium text-slate-400">
                  {sop.category}
                </span>
                <span className="text-sm text-slate-500">v{sop.version}</span>
              </div>
            </div>
          </div>
          <p className="text-slate-400 mt-3 max-w-2xl">{sop.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white">
            <Bookmark className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress & Start Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <div className="h-3 w-48 rounded-full bg-slate-800">
                <div 
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${totalProgress.percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-white">
                {totalProgress.completed}/{totalProgress.total} ({totalProgress.percentage}%)
              </span>
            </div>
            
            {/* Timer */}
            {startTime && (
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{formatTime(elapsedTime)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!startTime ? (
              <button
                onClick={startProcedure}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                <Play className="h-4 w-4" />
                Démarrer la procédure
              </button>
            ) : (
              <>
                <button
                  onClick={resetProcedure}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                >
                  Réinitialiser
                </button>
                {totalProgress.percentage === 100 && (
                  <button
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Terminé !
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps - Main Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-500" />
            Étapes de la procédure
          </h2>
          
          {sop.steps.map((step) => {
            const progress = getStepProgress(step);
            const isExpanded = expandedSteps.has(step.id);
            const isActive = activeStep === step.id;
            const isCompleted = progress.percentage === 100;
            
            return (
              <div 
                key={step.id}
                className={`rounded-xl border transition-colors ${
                  isActive 
                    ? "border-emerald-500/50 bg-emerald-500/5" 
                    : isCompleted 
                      ? "border-emerald-600/30 bg-slate-900" 
                      : "border-slate-800 bg-slate-900"
                }`}
              >
                {/* Step Header */}
                <button
                  onClick={() => {
                    toggleStep(step.id);
                    setActiveStep(step.id);
                  }}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500"
                          : "bg-slate-800 text-slate-400"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-white">{step.title}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        {step.responsible && (
                          <span className="text-xs text-slate-500">{step.responsible}</span>
                        )}
                        {step.timeEstimate && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {step.timeEstimate}
                          </span>
                        )}
                        {step.checklist && (
                          <span className="text-xs text-slate-500">
                            {progress.completed}/{progress.total} tâches
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {step.checklist && (
                      <div className="h-1.5 w-20 rounded-full bg-slate-800">
                        <div 
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </button>
                
                {/* Step Content */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-4 space-y-4">
                    {/* Description */}
                    <p className="text-slate-400 text-sm">{step.description}</p>
                    
                    {/* Actions */}
                    {step.actions && step.actions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Actions :</h4>
                        <ul className="space-y-1">
                          {step.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                              <span className="text-emerald-500 mt-1">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Checklist */}
                    {step.checklist && step.checklist.length > 0 && (
                      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Checklist
                        </h4>
                        <div className="space-y-2">
                          {step.checklist.map((item) => {
                            const isChecked = checklistState[step.id]?.[item.id] || false;
                            return (
                              <label
                                key={item.id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                  isChecked ? "bg-emerald-500/10" : "hover:bg-slate-700/50"
                                }`}
                              >
                                <button
                                  onClick={() => toggleChecklistItem(step.id, item.id)}
                                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                                    isChecked
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : "border-slate-600 hover:border-emerald-500"
                                  }`}
                                >
                                  {isChecked && <CheckCircle2 className="h-3 w-3" />}
                                </button>
                                <span className={`text-sm flex-1 ${
                                  isChecked ? "text-slate-500 line-through" : "text-slate-300"
                                }`}>
                                  {item.text}
                                </span>
                                {item.required && !isChecked && (
                                  <span className="text-xs text-amber-500">Requis</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Commands */}
                    {step.commands && step.commands.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-blue-400" />
                          Requêtes / Commandes
                        </h4>
                        <div className="space-y-2">
                          {step.commands.map((cmd, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-700 bg-slate-950 overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-slate-700">
                                <span className="text-xs text-slate-400">{cmd.description}</span>
                                <button
                                  onClick={() => copyCommand(cmd.command)}
                                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                                >
                                  {copiedCommand === cmd.command ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                      Copié
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      Copier
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="p-3 text-sm text-emerald-400 overflow-x-auto font-mono">
                                {cmd.command}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Tips */}
                    {step.tips && step.tips.length > 0 && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                        <h4 className="text-sm font-medium text-amber-400 mb-2">💡 Conseils</h4>
                        <ul className="space-y-1">
                          {step.tips.map((tip, idx) => (
                            <li key={idx} className="text-sm text-amber-200/70">
                              • {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Next Step Button */}
                    {step.id < sop.steps.length && (
                      <button
                        onClick={() => {
                          setActiveStep(step.id + 1);
                          setExpandedSteps(new Set([...expandedSteps, step.id + 1]));
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        Étape suivante
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Objectives */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="font-medium text-white flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-emerald-500" />
              Objectifs
            </h3>
            <ul className="space-y-2">
              {sop.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Roles */}
          {sop.roles && sop.roles.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="font-medium text-white flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-blue-500" />
                Rôles
              </h3>
              <div className="space-y-3">
                {sop.roles.map((role, idx) => (
                  <div key={idx}>
                    <h4 className="text-sm font-medium text-blue-400">{role.role}</h4>
                    <ul className="mt-1 space-y-0.5">
                      {role.responsibilities.map((resp, ridx) => (
                        <li key={ridx} className="text-xs text-slate-500">• {resp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* KPIs */}
          {sop.kpis && sop.kpis.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="font-medium text-white flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                KPIs
              </h3>
              <div className="space-y-2">
                {sop.kpis.map((kpi, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-800/50 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">{kpi.name}</span>
                      <span className="text-xs font-mono text-emerald-400">{kpi.target}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{kpi.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Escalation Matrix */}
          {sop.escalationMatrix && sop.escalationMatrix.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="font-medium text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Matrice d&apos;Escalade
              </h3>
              <div className="space-y-2">
                {sop.escalationMatrix.map((esc, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-800/50 p-2 text-xs">
                    <div className="font-medium text-amber-400">{esc.level}</div>
                    <div className="text-slate-400 mt-1">{esc.criteria}</div>
                    <div className="flex items-center justify-between mt-1 text-slate-500">
                      <span>{esc.contact}</span>
                      <span className="text-emerald-400">SLA: {esc.sla}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Templates Section */}
      {sop.templates && sop.templates.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sop.templates.map((template, idx) => (
              <div key={idx} className="rounded-lg border border-slate-700 bg-slate-950 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                  <span className="font-medium text-slate-300">{template.name}</span>
                  <button
                    onClick={() => copyCommand(template.content)}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-white"
                  >
                    {copiedCommand === template.content ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copier
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-sm text-slate-400 overflow-x-auto max-h-60 font-mono whitespace-pre-wrap">
                  {template.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
