"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const tasks = [
  {
    id: "1",
    title: "Analyser alerte SSH Brute Force",
    type: "INVESTIGATE_ALERT",
    priority: 1,
    status: "IN_PROGRESS",
    dueDate: new Date(Date.now() + 30 * 60 * 1000),
  },
  {
    id: "2",
    title: "Revoir SOP DNS Tunneling",
    type: "REVIEW_SOP",
    priority: 2,
    status: "PENDING",
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "Formation: Analyse Zeek logs",
    type: "TRAINING",
    priority: 3,
    status: "PENDING",
    dueDate: null,
  },
];

const typeColors: Record<string, string> = {
  INVESTIGATE_ALERT: "text-orange-400",
  REVIEW_SOP: "text-blue-400",
  TRAINING: "text-purple-400",
  OTHER: "text-slate-400",
};

export function MyTasks() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Mes Tâches</h2>
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
          {tasks.length} en cours
        </span>
      </div>

      <div className="divide-y divide-slate-800">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 px-6 py-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            {/* Status icon */}
            {task.status === "COMPLETED" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
            ) : task.status === "IN_PROGRESS" ? (
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-slate-500 mt-0.5" />
            )}

            {/* Task info */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  task.status === "COMPLETED"
                    ? "text-slate-500 line-through"
                    : "text-white"
                )}
              >
                {task.title}
              </p>
              <p className={cn("text-xs mt-1", typeColors[task.type])}>
                {task.type === "INVESTIGATE_ALERT" && "Investigation"}
                {task.type === "REVIEW_SOP" && "Révision SOP"}
                {task.type === "TRAINING" && "Formation"}
              </p>
            </div>

            {/* Priority */}
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-xs font-bold",
                task.priority === 1 && "bg-red-500/20 text-red-400",
                task.priority === 2 && "bg-yellow-500/20 text-yellow-400",
                task.priority === 3 && "bg-blue-500/20 text-blue-400"
              )}
            >
              {task.priority}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 px-6 py-3">
        <button className="text-sm text-emerald-400 hover:text-emerald-300">
          + Ajouter une tâche
        </button>
      </div>
    </div>
  );
}
