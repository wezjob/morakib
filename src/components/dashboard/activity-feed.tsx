"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/utils";
import { 
  AlertTriangle, 
  CheckCircle, 
  UserPlus, 
  FileText,
  ArrowUpRight 
} from "lucide-react";

// Static offsets in milliseconds (time ago)
const activityData = [
  {
    id: "1",
    type: "alert_resolved",
    user: "Marie L.",
    message: "a résolu une alerte SSH Brute Force",
    offset: 10 * 60 * 1000, // 10 min ago
  },
  {
    id: "2",
    type: "alert_escalated",
    user: "Ahmed K.",
    message: "a escaladé une alerte critique",
    offset: 25 * 60 * 1000, // 25 min ago
  },
  {
    id: "3",
    type: "sop_updated",
    user: "Jean D.",
    message: "a mis à jour SOP-NET-001",
    offset: 45 * 60 * 1000, // 45 min ago
  },
  {
    id: "4",
    type: "user_joined",
    user: "Sophie M.",
    message: "a rejoint l'équipe SOC",
    offset: 2 * 60 * 60 * 1000, // 2 hours ago
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Activité Équipe</h2>
      </div>

      <div className="divide-y divide-slate-800">
        {activityData.map((activity) => (
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
              <p className="text-xs text-slate-500 mt-1" suppressHydrationWarning>
                {mounted ? formatRelativeTime(new Date(Date.now() - activity.offset)) : "..."}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
