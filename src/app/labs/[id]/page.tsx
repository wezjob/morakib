"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Terminal,
  Lightbulb,
  AlertCircle,
  Check,
  X,
  Trophy,
  Star,
  Play,
  RotateCcw,
  FileText,
  Database
} from "lucide-react";
import { getLabById, Lab, LabStep, LabExercise } from "@/data/labs";
import { getLogsForLab } from "@/data/sandbox-logs";
import { SandboxTerminal, QuickCommands } from "@/components/labs/SandboxTerminal";
import { LogViewer } from "@/components/labs/LogViewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface GuideProgress {
  id?: string;
  guideId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  completionPercentage: number;
  completed: boolean;
  score: number | null;
  checklistState: Record<string, Record<string, boolean>>;
  exerciseResults: Record<string, { answer: string; isCorrect: boolean }>;
  totalTimeSeconds: number;
}

export default function LabDetailPage() {
  const params = useParams();
  const router = useRouter();
  const labId = params.id as string;
  
  const [lab, setLab] = useState<Lab | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState<GuideProgress | null>(null);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    theory: true,
    scenario: true,
    tasks: true,
    commands: false,
    exercises: true,
    tips: false,
    sandbox: true,
    logs: true
  });
  const [startTime] = useState<number>(Date.now());
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [finalExamAnswers, setFinalExamAnswers] = useState<Record<string, string>>({});
  const [finalExamSubmitted, setFinalExamSubmitted] = useState(false);
  const terminalRef = useRef<{ executeCommand: (cmd: string) => void }>(null);

  // Get logs for this lab
  const labLogs = lab ? getLogsForLab(lab.id) : {};

  useEffect(() => {
    const foundLab = getLabById(labId);
    if (foundLab) {
      setLab(foundLab);
      fetchProgress(foundLab.id, foundLab.steps.length);
    }
  }, [labId]);

  const fetchProgress = async (guideId: string, totalSteps: number) => {
    try {
      const res = await fetch(`/api/guide-progress?guideId=${guideId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.guideId) {
          setProgress(data);
          setCurrentStepIndex(Math.max(0, (data.currentStep || 1) - 1));
          // Restore exercise answers
          if (data.exerciseResults) {
            const answers: Record<string, string> = {};
            Object.entries(data.exerciseResults).forEach(([key, val]: [string, any]) => {
              answers[key] = val.answer;
            });
            setExerciseAnswers(answers);
          }
        } else {
          // Initialize progress
          setProgress({
            guideId,
            currentStep: 1,
            totalSteps,
            completedSteps: [],
            completionPercentage: 0,
            completed: false,
            score: null,
            checklistState: {},
            exerciseResults: {},
            totalTimeSeconds: 0
          });
        }
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  const saveProgress = useCallback(async (updatedProgress: Partial<GuideProgress>) => {
    if (!lab) return;

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const newProgress = {
      ...progress,
      ...updatedProgress,
      guideId: lab.id,
      totalSteps: lab.steps.length,
      totalTimeSeconds: (progress?.totalTimeSeconds || 0) + elapsedSeconds
    };

    try {
      await fetch("/api/guide-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProgress)
      });
      setProgress(newProgress as GuideProgress);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [lab, progress, startTime]);

  const currentStep = lab?.steps[currentStepIndex];

  const isStepCompleted = (stepId: number) => {
    return progress?.completedSteps?.includes(stepId) || false;
  };

  const completeCurrentStep = () => {
    if (!currentStep || !progress) return;
    
    const newCompletedSteps = [...(progress.completedSteps || [])];
    if (!newCompletedSteps.includes(currentStep.id)) {
      newCompletedSteps.push(currentStep.id);
    }
    
    const completionPercentage = Math.round((newCompletedSteps.length / (lab?.steps.length || 1)) * 100);
    
    saveProgress({
      completedSteps: newCompletedSteps,
      completionPercentage,
      currentStep: currentStepIndex + 1
    });
  };

  const goToNextStep = () => {
    if (!lab) return;
    if (currentStepIndex < lab.steps.length - 1) {
      completeCurrentStep();
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Last step - show final exam
      completeCurrentStep();
      setShowFinalExam(true);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleExerciseAnswer = (exerciseId: string, answer: string) => {
    setExerciseAnswers(prev => ({ ...prev, [exerciseId]: answer }));
  };

  const checkExercise = (exercise: LabExercise) => {
    const userAnswer = exerciseAnswers[exercise.id] || "";
    const isCorrect = userAnswer.toLowerCase().trim() === exercise.correctAnswer?.toLowerCase().trim();
    
    setShowResults(prev => ({ ...prev, [exercise.id]: true }));
    
    // Save exercise result
    const newExerciseResults = {
      ...(progress?.exerciseResults || {}),
      [exercise.id]: { answer: userAnswer, isCorrect }
    };
    saveProgress({ exerciseResults: newExerciseResults });
  };

  const calculateFinalScore = () => {
    if (!lab) return 0;
    let correct = 0;
    lab.finalExam.forEach(q => {
      const answer = finalExamAnswers[q.id] || "";
      if (answer.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim()) {
        correct++;
      }
    });
    return Math.round((correct / lab.finalExam.length) * 100);
  };

  const submitFinalExam = async () => {
    if (!lab) return;
    const score = calculateFinalScore();
    const passed = score >= lab.passingScore;
    
    await saveProgress({
      score,
      completed: passed,
      completionPercentage: 100
    });
    
    setFinalExamSubmitted(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!lab) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Chargement du lab...</p>
        </div>
      </div>
    );
  }

  if (showFinalExam) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFinalExam(false)}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Examen Final</h1>
            <p className="text-slate-400">{lab.title}</p>
          </div>
        </div>

        {!finalExamSubmitted ? (
          <>
            {/* Exam Questions */}
            <div className="space-y-6">
              {lab.finalExam.map((question, idx) => (
                <div key={question.id} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Question {idx + 1}: {question.question}
                  </h3>
                  
                  {question.type === "multiple-choice" && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => (
                        <label 
                          key={optIdx}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            finalExamAnswers[question.id] === option
                              ? "border-purple-500 bg-purple-500/10"
                              : "border-slate-700 bg-slate-800 hover:border-slate-600"
                          }`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={finalExamAnswers[question.id] === option}
                            onChange={(e) => setFinalExamAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                            className="text-purple-500"
                          />
                          <span className="text-white">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {question.type === "text" && (
                    <div>
                      <input
                        type="text"
                        value={finalExamAnswers[question.id] || ""}
                        onChange={(e) => setFinalExamAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                        placeholder="Votre réponse..."
                        className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                      {question.hint && (
                        <p className="mt-2 text-xs text-slate-500">
                          <Lightbulb className="h-3 w-3 inline mr-1" />
                          Indice: {question.hint}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                onClick={submitFinalExam}
                className="px-8 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Trophy className="h-5 w-5" />
                Soumettre l'examen
              </button>
            </div>
          </>
        ) : (
          /* Results */
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            {calculateFinalScore() >= lab.passingScore ? (
              <>
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Félicitations!</h2>
                <p className="text-slate-400 mb-4">Vous avez réussi l'examen final!</p>
                <div className="text-4xl font-bold text-emerald-400 mb-4">{calculateFinalScore()}%</div>
                <p className="text-sm text-slate-500 mb-6">Score minimum requis: {lab.passingScore}%</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Star className="h-5 w-5" />
                  Certification obtenue: {lab.certification}
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <X className="h-10 w-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Score insuffisant</h2>
                <p className="text-slate-400 mb-4">Vous devez obtenir au moins {lab.passingScore}% pour réussir.</p>
                <div className="text-4xl font-bold text-red-400 mb-4">{calculateFinalScore()}%</div>
                <button
                  onClick={() => {
                    setFinalExamSubmitted(false);
                    setFinalExamAnswers({});
                  }}
                  className="mt-4 px-6 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2 mx-auto"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réessayer
                </button>
              </>
            )}

            {/* Show Correct Answers */}
            <div className="mt-8 text-left space-y-4">
              <h3 className="text-lg font-semibold text-white">Correction:</h3>
              {lab.finalExam.map((q, idx) => {
                const userAnswer = finalExamAnswers[q.id] || "";
                const isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
                return (
                  <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                    <p className="font-medium text-white mb-2">Q{idx + 1}: {q.question}</p>
                    <p className="text-sm">
                      <span className="text-slate-400">Votre réponse: </span>
                      <span className={isCorrect ? "text-emerald-400" : "text-red-400"}>{userAnswer || "(vide)"}</span>
                    </p>
                    {!isCorrect && (
                      <p className="text-sm">
                        <span className="text-slate-400">Bonne réponse: </span>
                        <span className="text-emerald-400">{q.correctAnswer}</span>
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-slate-500 mt-2">{q.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <Link
              href="/labs"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
            >
              Retour aux Labs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Steps Navigator */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <Link
              href="/labs"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux Labs
            </Link>

            <h2 className="text-lg font-semibold text-white mb-2">{lab.title}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <Clock className="h-3 w-3" />
              {lab.duration}
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Progression</span>
                <span className="text-white">{progress?.completionPercentage || 0}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${progress?.completionPercentage || 0}%` }}
                />
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-2">
              {lab.steps.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    idx === currentStepIndex
                      ? "bg-purple-500/20 border border-purple-500/50"
                      : isStepCompleted(step.id)
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : "bg-slate-800 border border-slate-700 hover:border-slate-600"
                  }`}
                >
                  {isStepCompleted(step.id) ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  ) : idx === currentStepIndex ? (
                    <Play className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      idx === currentStepIndex ? "text-purple-400" : "text-white"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500">{step.estimatedTime}</p>
                  </div>
                </button>
              ))}

              {/* Final Exam Button */}
              <button
                onClick={() => setShowFinalExam(true)}
                disabled={(progress?.completionPercentage || 0) < 100}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  (progress?.completionPercentage || 0) >= 100
                    ? "bg-yellow-500/20 border border-yellow-500/50 hover:bg-yellow-500/30"
                    : "bg-slate-800/50 border border-slate-700 opacity-50 cursor-not-allowed"
                }`}
              >
                <Trophy className={`h-5 w-5 ${
                  (progress?.completionPercentage || 0) >= 100 ? "text-yellow-400" : "text-slate-500"
                }`} />
                <div>
                  <p className="text-sm font-medium text-white">Examen Final</p>
                  <p className="text-xs text-slate-500">
                    {(progress?.completionPercentage || 0) >= 100 
                      ? "Prêt" 
                      : "Complétez toutes les étapes"}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {currentStep && (
            <>
              {/* Step Header */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center gap-2 text-sm text-purple-400 mb-2">
                  <Target className="h-4 w-4" />
                  Étape {currentStepIndex + 1} sur {lab.steps.length}
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{currentStep.title}</h1>
                <p className="text-slate-400">{currentStep.objective}</p>
              </div>

              {/* Theory Section */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <button
                  onClick={() => toggleSection("theory")}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                    <span className="font-semibold text-white">Théorie</span>
                  </div>
                  {expandedSections.theory ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>
                {expandedSections.theory && (
                  <div className="p-6 pt-0 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentStep.theory}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Scenario Section */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <button
                  onClick={() => toggleSection("scenario")}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-400" />
                    <span className="font-semibold text-white">Scénario du Lab</span>
                  </div>
                  {expandedSections.scenario ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>
                {expandedSections.scenario && (
                  <div className="p-6 pt-0 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentStep.scenario}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <button
                  onClick={() => toggleSection("tasks")}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="font-semibold text-white">Tâches à effectuer</span>
                  </div>
                  {expandedSections.tasks ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>
                {expandedSections.tasks && (
                  <div className="p-6 pt-0">
                    <ul className="space-y-3">
                      {currentStep.tasks.map((task, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-0.5 w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-xs text-slate-400">
                            {idx + 1}
                          </div>
                          <span className="text-slate-300">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Commands Section */}
              {currentStep.commands && currentStep.commands.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                  <button
                    onClick={() => toggleSection("commands")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-green-400" />
                      <span className="font-semibold text-white">Commandes</span>
                    </div>
                    {expandedSections.commands ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </button>
                  {expandedSections.commands && (
                    <div className="p-6 pt-0 space-y-4">
                      {currentStep.commands.map((cmd, idx) => (
                        <div key={idx} className="space-y-2">
                          <p className="text-sm text-slate-400">{cmd.description}</p>
                          <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                            <code className="text-emerald-400 text-sm">{cmd.command}</code>
                          </pre>
                          {cmd.expectedOutput && (
                            <p className="text-xs text-slate-500">
                              Résultat attendu: <span className="text-slate-400">{cmd.expectedOutput}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Exercises Section */}
              {currentStep.exercises && currentStep.exercises.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                  <button
                    onClick={() => toggleSection("exercises")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-400" />
                      <span className="font-semibold text-white">Exercices</span>
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                        {currentStep.exercises.length}
                      </span>
                    </div>
                    {expandedSections.exercises ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </button>
                  {expandedSections.exercises && (
                    <div className="p-6 pt-0 space-y-6">
                      {currentStep.exercises.map((exercise, idx) => (
                        <div 
                          key={exercise.id} 
                          className={`p-4 rounded-lg border ${
                            showResults[exercise.id]
                              ? exerciseAnswers[exercise.id]?.toLowerCase().trim() === exercise.correctAnswer?.toLowerCase().trim()
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : "border-red-500/50 bg-red-500/10"
                              : "border-slate-700 bg-slate-800"
                          }`}
                        >
                          <p className="font-medium text-white mb-3">
                            {idx + 1}. {exercise.question}
                          </p>

                          {exercise.type === "multiple-choice" && exercise.options && (
                            <div className="space-y-2 mb-4">
                              {exercise.options.map((option, optIdx) => (
                                <label 
                                  key={optIdx}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    showResults[exercise.id]
                                      ? option === exercise.correctAnswer
                                        ? "border-emerald-500 bg-emerald-500/20"
                                        : exerciseAnswers[exercise.id] === option
                                          ? "border-red-500 bg-red-500/20"
                                          : "border-slate-700 bg-slate-900"
                                      : exerciseAnswers[exercise.id] === option
                                        ? "border-purple-500 bg-purple-500/10"
                                        : "border-slate-700 bg-slate-900 hover:border-slate-600"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={exercise.id}
                                    value={option}
                                    checked={exerciseAnswers[exercise.id] === option}
                                    onChange={(e) => handleExerciseAnswer(exercise.id, e.target.value)}
                                    disabled={showResults[exercise.id]}
                                    className="text-purple-500"
                                  />
                                  <span className="text-white">{option}</span>
                                  {showResults[exercise.id] && option === exercise.correctAnswer && (
                                    <Check className="h-4 w-4 text-emerald-400 ml-auto" />
                                  )}
                                </label>
                              ))}
                            </div>
                          )}

                          {exercise.type === "text" && (
                            <div className="mb-4">
                              <input
                                type="text"
                                value={exerciseAnswers[exercise.id] || ""}
                                onChange={(e) => handleExerciseAnswer(exercise.id, e.target.value)}
                                disabled={showResults[exercise.id]}
                                placeholder="Votre réponse..."
                                className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                              />
                              {exercise.hint && !showResults[exercise.id] && (
                                <p className="mt-2 text-xs text-slate-500">
                                  <Lightbulb className="h-3 w-3 inline mr-1" />
                                  Indice: {exercise.hint}
                                </p>
                              )}
                            </div>
                          )}

                          {!showResults[exercise.id] ? (
                            <button
                              onClick={() => checkExercise(exercise)}
                              disabled={!exerciseAnswers[exercise.id]}
                              className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Vérifier
                            </button>
                          ) : (
                            <div className="text-sm">
                              {exerciseAnswers[exercise.id]?.toLowerCase().trim() === exercise.correctAnswer?.toLowerCase().trim() ? (
                                <p className="text-emerald-400 flex items-center gap-2">
                                  <Check className="h-4 w-4" />
                                  Correct!
                                </p>
                              ) : (
                                <p className="text-red-400 flex items-center gap-2">
                                  <X className="h-4 w-4" />
                                  Incorrect. Bonne réponse: {exercise.correctAnswer}
                                </p>
                              )}
                              {exercise.explanation && (
                                <p className="mt-2 text-slate-400">{exercise.explanation}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tips Section */}
              {currentStep.tips && currentStep.tips.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                  <button
                    onClick={() => toggleSection("tips")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-400" />
                      <span className="font-semibold text-white">Conseils</span>
                    </div>
                    {expandedSections.tips ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </button>
                  {expandedSections.tips && (
                    <div className="p-6 pt-0">
                      <ul className="space-y-2">
                        {currentStep.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-300">
                            <Lightbulb className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* ===== SANDBOX SECTION ===== */}
              <div className="rounded-xl border border-emerald-500/30 bg-slate-900 overflow-hidden">
                <button
                  onClick={() => toggleSection("sandbox")}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-emerald-400" />
                    <span className="font-semibold text-white">🔬 Sandbox - Environnement Pratique</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      Interactif
                    </span>
                  </div>
                  {expandedSections.sandbox ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>
                {expandedSections.sandbox && (
                  <div className="p-4 pt-0 space-y-4">
                    <p className="text-sm text-slate-400">
                      Utilisez le terminal ci-dessous pour exécuter les commandes du lab. 
                      Tapez <code className="text-emerald-400">help</code> pour voir les commandes disponibles.
                    </p>
                    <SandboxTerminal 
                      labId={labId}
                      onCommandExecuted={(cmd, output) => {
                        console.log("Command executed:", cmd);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ===== LOGS SECTION ===== */}
              {Object.keys(labLogs).length > 0 && (
                <div className="rounded-xl border border-blue-500/30 bg-slate-900 overflow-hidden">
                  <button
                    onClick={() => toggleSection("logs")}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-400" />
                      <span className="font-semibold text-white">📋 Logs à Analyser</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                        {Object.keys(labLogs).length} sources
                      </span>
                    </div>
                    {expandedSections.logs ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </button>
                  {expandedSections.logs && (
                    <div className="p-4 pt-0 space-y-4">
                      <p className="text-sm text-slate-400">
                        Voici les logs réels du scénario. Analysez-les pour répondre aux exercices.
                      </p>
                      {Object.entries(labLogs).map(([title, logs]) => (
                        <LogViewer 
                          key={title}
                          title={title}
                          logs={logs}
                          type={title.includes("Headers") ? "email-headers" : "json"}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Checkpoint */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-emerald-400 mb-1">Checkpoint</h3>
                    <p className="text-slate-300">{currentStep.checkpoint}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={goToPrevStep}
                  disabled={currentStepIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Étape précédente
                </button>
                <button
                  onClick={goToNextStep}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
                >
                  {currentStepIndex === lab.steps.length - 1 ? (
                    <>
                      Passer à l'examen
                      <Trophy className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Étape suivante
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
