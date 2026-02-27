"use client";

import { formatRelativeTime } from "@/lib/utils";
import { 
  AlertTriangle, 
  CheckCircle, 
  UserPlus, 
  FileText,
  ArrowUpRight 
} from "lucide-react";

const activities = [
  {
    id: "1",
    type: "alert_resolved",
    user: "Marie L.",
    message: "a résolu une alerte SSH Brute Force",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: "2",
    type: "alert_escalated",
    user: "Ahmed K.",
    message: "a escaladé une alerte critique",
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: "3",
    type: "sop_updated",
    user: "Jean D.",
    message: "a mis à jour SOP-NET-001",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: "4",
    type: "user_joined",
    user: "Sophie M.",
    message: "a rejoint l'équipe SOC",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

const activityIcons: Record<string, React.ReactNode> = {
  alert_resolved: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  alert_escalated: <ArrowUpRight className="h-4 w-4 text-red-500" />,
  sop_updated: <FileText className="h-4 w-4 text-blue-500" />,
  user_joined: <UserPlus className="h-4 w-4 text-purple-500" />,
  alert_new: <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

export function ActivityFeed() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Activité Équipe</h2>
      </div>

      <div className="divide-y divide-slate-800">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 px-6 py-4"
          >
            {/* Icon */}
            <div className="mt-0.5">
              {activityIcons[activity.type]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300">
                <span className="font-medium text-white">{activity.user}</span>{" "}
                {activity.message}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
