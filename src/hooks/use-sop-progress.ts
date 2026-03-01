import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface ChecklistState {
  [stepId: number]: {
    [itemId: string]: boolean;
  };
}

interface SOPProgressData {
  checklistState: ChecklistState;
  activeStep: number;
  startedAt: string | null;
  completed: boolean;
  completionPercentage: number;
  elapsedSeconds: number;
}

export function useSOPProgress(sopSlug: string) {
  const { data: session } = useSession();
  const [progress, setProgress] = useState<SOPProgressData>({
    checklistState: {},
    activeStep: 1,
    startedAt: null,
    completed: false,
    completionPercentage: 0,
    elapsedSeconds: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load progress from server
  useEffect(() => {
    if (!session?.user) {
      // Fall back to localStorage for non-authenticated users
      const savedState = localStorage.getItem(`sop-checklist-${sopSlug}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setProgress({
            checklistState: parsed.checklist || {},
            activeStep: parsed.activeStep || 1,
            startedAt: parsed.startTime || null,
            completed: parsed.completed || false,
            completionPercentage: parsed.completionPercentage || 0,
            elapsedSeconds: parsed.elapsedSeconds || 0
          });
        } catch (e) {
          console.error("Error loading saved state", e);
        }
      }
      setLoading(false);
      return;
    }

    async function loadProgress() {
      try {
        const res = await fetch(`/api/sop-progress?sopSlug=${encodeURIComponent(sopSlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            setProgress({
              checklistState: data.checklistState || {},
              activeStep: data.activeStep || 1,
              startedAt: data.startedAt || null,
              completed: data.completed || false,
              completionPercentage: data.completionPercentage || 0,
              elapsedSeconds: data.elapsedSeconds || 0
            });
          }
        }
      } catch (error) {
        console.error("Error loading progress:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, [sopSlug, session]);

  // Save progress to server
  const saveProgress = useCallback(async (newProgress: Partial<SOPProgressData>) => {
    const updatedProgress = { ...progress, ...newProgress };
    setProgress(updatedProgress);

    // Save to localStorage as backup
    localStorage.setItem(`sop-checklist-${sopSlug}`, JSON.stringify({
      checklist: updatedProgress.checklistState,
      activeStep: updatedProgress.activeStep,
      startTime: updatedProgress.startedAt,
      completed: updatedProgress.completed,
      completionPercentage: updatedProgress.completionPercentage,
      elapsedSeconds: updatedProgress.elapsedSeconds
    }));

    // If authenticated, save to server
    if (session?.user) {
      setSaving(true);
      try {
        await fetch("/api/sop-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sopSlug,
            checklistState: updatedProgress.checklistState,
            activeStep: updatedProgress.activeStep,
            startTime: updatedProgress.startedAt,
            completed: updatedProgress.completed,
            elapsedSeconds: updatedProgress.elapsedSeconds
          })
        });
      } catch (error) {
        console.error("Error saving progress:", error);
      } finally {
        setSaving(false);
      }
    }
  }, [progress, sopSlug, session]);

  // Update checklist item
  const toggleChecklistItem = useCallback((stepId: number, itemId: string) => {
    const newChecklistState = {
      ...progress.checklistState,
      [stepId]: {
        ...progress.checklistState[stepId],
        [itemId]: !progress.checklistState[stepId]?.[itemId]
      }
    };
    saveProgress({ checklistState: newChecklistState });
  }, [progress.checklistState, saveProgress]);

  // Update active step
  const setActiveStep = useCallback((stepId: number) => {
    saveProgress({ activeStep: stepId });
  }, [saveProgress]);

  // Start procedure
  const startProcedure = useCallback(() => {
    saveProgress({
      startedAt: new Date().toISOString(),
      activeStep: 1
    });
  }, [saveProgress]);

  // Reset progress
  const resetProgress = useCallback(async () => {
    const initialProgress: SOPProgressData = {
      checklistState: {},
      activeStep: 1,
      startedAt: null,
      completed: false,
      completionPercentage: 0,
      elapsedSeconds: 0
    };
    setProgress(initialProgress);

    localStorage.removeItem(`sop-checklist-${sopSlug}`);

    if (session?.user) {
      try {
        await fetch(`/api/sop-progress?sopSlug=${encodeURIComponent(sopSlug)}`, {
          method: "DELETE"
        });
      } catch (error) {
        console.error("Error resetting progress:", error);
      }
    }
  }, [sopSlug, session]);

  // Mark as completed
  const markCompleted = useCallback(() => {
    saveProgress({ completed: true });
  }, [saveProgress]);

  // Update elapsed time
  const updateElapsedTime = useCallback((seconds: number) => {
    saveProgress({ elapsedSeconds: seconds });
  }, [saveProgress]);

  return {
    progress,
    loading,
    saving,
    toggleChecklistItem,
    setActiveStep,
    startProcedure,
    resetProgress,
    markCompleted,
    updateElapsedTime
  };
}
