import { AlertsTable } from "@/components/alerts/alerts-table";
import { AlertsFilters } from "@/components/alerts/alerts-filters";
import { AlertTriangle } from "lucide-react";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-white">Alertes</h1>
          </div>
          <p className="text-slate-400 mt-1">
            Gérez et analysez les alertes de sécurité
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Exporter
          </button>
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Filters */}
      <AlertsFilters />

      {/* Alerts Table */}
      <AlertsTable />
    </div>
  );
}
