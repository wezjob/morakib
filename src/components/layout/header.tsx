"use client";

import { Bell, Search, Moon, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();
  const [notifications] = useState(3);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      ANALYST_JUNIOR: { label: "Junior", color: "bg-blue-500/20 text-blue-400" },
      ANALYST_SENIOR: { label: "Senior", color: "bg-purple-500/20 text-purple-400" },
      LEAD: { label: "Lead", color: "bg-orange-500/20 text-orange-400" },
      ADMIN: { label: "Admin", color: "bg-red-500/20 text-red-400" },
    };
    return roles[role] || roles.ANALYST_JUNIOR;
  };

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

        {/* User Menu */}
        {session?.user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
                {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white">
                  {session.user.name || session.user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-slate-400">{session.user.email}</p>
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-800 bg-slate-900 shadow-xl z-50">
                <div className="p-3 border-b border-slate-800">
                  <p className="text-sm font-medium text-white">
                    {session.user.name || "Analyste"}
                  </p>
                  <p className="text-xs text-slate-400">{session.user.email}</p>
                  {session.user.role && (
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadge(session.user.role).color}`}>
                      {getRoleBadge(session.user.role).label}
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    Mon Profil
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
