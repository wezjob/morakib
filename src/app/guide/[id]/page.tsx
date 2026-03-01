"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  BookOpen, 
  CheckCircle, 
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Lightbulb,
  ExternalLink,
  ListChecks,
  Terminal,
  GraduationCap
} from "lucide-react";
import { getGuideById, guides } from "@/data/guides";

const levelColors: Record<string, string> = {
  "Débutant": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "Intermédiaire": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "Avancé": "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function GuideDetailPage() {
  const params = useParams();
  const guide = getGuideById(params.id as string);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  if (!guide) {
    notFound();
  }

  const step = guide.steps[currentStep];
  const progress = ((completedSteps.length) / guide.steps.length) * 100;

  const handleCopyCommand = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const toggleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(s => s !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const goToNextStep = () => {
    if (currentStep < guide.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link 
          href="/guide"
          className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-6 w-6 text-purple-500" />
            <span className={`px-2 py-0.5 text-xs rounded-full border ${levelColors[guide.level]}`}>
              {guide.level}
            </span>
            <span className="text-xs text-slate-500">{guide.category}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{guide.title}</h1>
          <p className="text-slate-400 mt-1">{guide.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {guide.duration}
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {guide.steps.length} étapes
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              {completedSteps.length}/{guide.steps.length} complétées
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progression</span>
          <span className="text-sm font-medium text-white">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {guide.steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all
                ${idx === currentStep 
                  ? 'bg-purple-500 text-white ring-2 ring-purple-500/50' 
                  : completedSteps.includes(idx)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }
              `}
            >
              {completedSteps.includes(idx) ? <Check className="h-4 w-4" /> : idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Steps List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Objectives */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Objectifs
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              {guide.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps Navigation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-purple-500" />
              Étapes
            </h3>
            <div className="space-y-1">
              {guide.steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2
                    ${idx === currentStep 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                      : completedSteps.includes(idx)
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-400 hover:bg-slate-800'
                    }
                  `}
                >
                  <span className={`
                    flex items-center justify-center w-5 h-5 rounded-full text-[10px] flex-shrink-0
                    ${idx === currentStep 
                      ? 'bg-purple-500 text-white' 
                      : completedSteps.includes(idx)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }
                  `}>
                    {completedSteps.includes(idx) ? <Check className="h-3 w-3" /> : idx + 1}
                  </span>
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1">
              {guide.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Step Content */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-500 text-white text-sm">
                  {currentStep + 1}
                </span>
                {step.title}
              </h2>
              <button
                onClick={() => toggleStepComplete(currentStep)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1
                  ${completedSteps.includes(currentStep)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-emerald-500/50'
                  }
                `}
              >
                {completedSteps.includes(currentStep) ? (
                  <>
                    <Check className="h-3 w-3" />
                    Complété
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Marquer complété
                  </>
                )}
              </button>
            </div>

            {/* Markdown Content */}
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-code:text-emerald-400 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-table:border-collapse prose-th:border prose-th:border-slate-700 prose-th:bg-slate-800 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-slate-700 prose-td:px-3 prose-td:py-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {step.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Commands */}
          {step.commands && step.commands.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-500" />
                Commandes utiles
              </h3>
              <div className="space-y-3">
                {step.commands.map((cmd, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-700 bg-slate-800 overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{cmd.description}</span>
                      <button
                        onClick={() => handleCopyCommand(cmd.command)}
                        className="p-1 rounded hover:bg-slate-700 transition-colors"
                      >
                        {copiedCommand === cmd.command ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                    <div className="p-3 bg-slate-950">
                      <code className="text-xs font-mono text-emerald-400 break-all">
                        {cmd.command}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {step.tips && step.tips.length > 0 && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6">
              <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Conseils
              </h3>
              <ul className="space-y-2">
                {step.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checklist */}
          {step.checklist && step.checklist.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-purple-500" />
                Checklist de l&apos;étape
              </h3>
              <div className="space-y-2">
                {step.checklist.map((item, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                ${currentStep === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                }
              `}
            >
              <ChevronLeft className="h-4 w-4" />
              Étape précédente
            </button>

            {currentStep < guide.steps.length - 1 ? (
              <button
                onClick={goToNextStep}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-all flex items-center gap-2"
              >
                Étape suivante
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href="/guide"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center gap-2"
              >
                Terminer le guide
                <Check className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Conclusion (visible when on last step or all completed) */}
      {(currentStep === guide.steps.length - 1 || completedSteps.length === guide.steps.length) && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-emerald-400 prose-p:text-slate-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {guide.conclusion}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Resources */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-purple-500" />
          Ressources complémentaires
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {guide.resources.map((resource, idx) => (
            <a
              key={idx}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors group"
            >
              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-purple-400" />
              <span className="text-sm text-slate-300 group-hover:text-white truncate">
                {resource.title}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
