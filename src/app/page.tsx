import { DashboardStats } from "@/components/dashboard/stats";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";
import { MyTasks } from "@/components/dashboard/my-tasks";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Vue d&apos;ensemble de votre activité SOC</p>
      </div>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Alerts - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentAlerts />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <MyTasks />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
