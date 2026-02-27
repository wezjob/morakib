"use client";

import { Bell, Search, Moon, Sun } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [notifications] = useState(3);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
      {/* Search */}
      <div className="flex flex-1 items-center max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher alertes, SOPs..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {notifications}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
          <Moon className="h-5 w-5" />
        </button>

        {/* Status */}
        <div className="flex items-center gap-2 rounded-lg bg-emerald-900/30 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-emerald-400">En ligne</span>
        </div>
      </div>
    </header>
  );
}
