"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  User,
  Settings,
  Shield,
  Activity,
  BookOpen,
  Users,
  Award,
  Briefcase,
  FolderTree,
  ShieldCheck,
  Database,
  Plug,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

type NavItem = {
  id: string;
  name: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
  leadOrAdminOnly?: boolean;
  children?: NavItem[];
};

type NavSection = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    id: "dashboard",
    title: "",
    icon: LayoutDashboard,
    items: [
      {
        id: "dash-main",
        name: "Dashboard",
        icon: LayoutDashboard,
        children: [
          { id: "dash-home", name: "Accueil", href: "/", icon: LayoutDashboard },
          { id: "dash-kpi", name: "KPI", href: "/analytics", icon: BarChart3 },
          { id: "dash-tasks", name: "Mes tâches", href: "/profile", icon: User },
          { id: "dash-siem", name: "SIEM", href: "/siem", icon: Activity, badge: "LIVE" },
        ],
      },
    ],
  },
  {
    id: "incidents",
    title: "",
    icon: AlertTriangle,
    items: [
      {
        id: "incidents-main",
        name: "Gestion incidents",
        href: "/alerts",
        icon: AlertTriangle,
        children: [
          { id: "incidents-open", name: "Incidents ouverts", href: "/alerts", icon: AlertTriangle },
          { id: "incidents-new", name: "Nouveau", href: "/alerts?action=new", icon: AlertTriangle },
          { id: "incidents-evidence", name: "Preuves", href: "/alerts?view=evidence", icon: FileText },
          { id: "incidents-close", name: "Clôture", href: "/alerts?view=closure", icon: ClipboardCheck },
        ],
      },
    ],
  },
  {
    id: "docs-ops",
    title: "",
    icon: FolderTree,
    items: [
      {
        id: "docs-main",
        name: "DOC OPS",
        icon: FolderTree,
        children: [
          { id: "docs-playbooks", name: "Playbooks", href: "/sops?section=playbooks", icon: FileText },
          { id: "docs-runbooks", name: "Runbooks", href: "/guide", icon: BookOpen },
          { id: "docs-sops", name: "SOP", href: "/sops?section=sops", icon: ClipboardCheck },
        ],
      },
    ],
  },
  {
    id: "governance",
    title: "",
    icon: ShieldCheck,
    items: [
      {
        id: "gov-main",
        name: "Pilotage SOC",
        icon: ShieldCheck,
        leadOrAdminOnly: true,
        children: [
          { id: "gov-index", name: "Index", href: "/management/governance", icon: FileText, leadOrAdminOnly: true },
          { id: "gov-foundation", name: "Cadre", href: "/management/foundations", icon: Shield, leadOrAdminOnly: true },
          { id: "gov-org", name: "Rôles", href: "/management/organization", icon: Users, leadOrAdminOnly: true },
          { id: "gov-process", name: "Processus", href: "/management/processes", icon: Briefcase, leadOrAdminOnly: true },
          { id: "gov-kpi", name: "Reporting", href: "/management/metrics", icon: BarChart3, leadOrAdminOnly: true },
          { id: "gov-audit", name: "Conformité", href: "/management/compliance", icon: Settings, leadOrAdminOnly: true },
          { id: "gov-roadmap", name: "Roadmap", href: "/management/roadmap", icon: Award, leadOrAdminOnly: true },
        ],
      },
    ],
  },
  {
    id: "training",
    title: "",
    icon: GraduationCap,
    items: [
      {
        id: "train-main",
        name: "Parcours",
        icon: GraduationCap,
        children: [
          { id: "train-guide", name: "Guide", href: "/guide", icon: GraduationCap },
          { id: "train-progress", name: "Progression", href: "/profile", icon: User },
          { id: "train-labs", name: "Labs", href: "/labs", icon: BookOpen },
          { id: "train-plan", name: "Renforcement", href: "/management/training", icon: Users, leadOrAdminOnly: true },
        ],
      },
    ],
  },
  {
    id: "admin",
    title: "",
    icon: Settings,
    items: [
      {
        id: "admin-main",
        name: "Administration",
        href: "/admin",
        icon: Settings,
        adminOnly: true,
        children: [
          { id: "admin-users", name: "Utilisateurs", href: "/admin", icon: Users, adminOnly: true },
          { id: "admin-alerts", name: "Alertes", href: "/admin", icon: AlertTriangle, adminOnly: true },
          { id: "admin-audit", name: "Audit", href: "/admin", icon: FileText, adminOnly: true },
          { id: "admin-settings", name: "Paramètres", href: "/admin", icon: Settings, adminOnly: true },
        ],
      },
    ],
  },
  {
    id: "integrations",
    title: "7. Intégrations",
    icon: Plug,
    items: [
      {
        id: "int-main",
        name: "Connecteurs",
        icon: Plug,
        children: [
          { id: "int-siem-live", name: "SIEM Live", href: "/siem", icon: Activity, badge: "LIVE" },
          { id: "int-api", name: "API SIEM/SOAR", href: "/siem", icon: Database },
          { id: "int-export", name: "Exports PDF", href: "/analytics", icon: FileText },
        ],
      },
    ],
  },
];

// Role labels
const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  LEAD: "Team Lead",
  ANALYST_SENIOR: "Analyste Senior",
  ANALYST_JUNIOR: "Analyste Junior",
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  
  const userRole = (session?.user as any)?.role;
  const userName = session?.user?.name || session?.user?.email || "Utilisateur";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  
  const isAdmin = userRole === "ADMIN";
  const isLead = userRole === "LEAD";

  const isItemVisible = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.leadOrAdminOnly && !(isLead || isAdmin)) return false;
    return true;
  };

  const isPathActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  const activeParentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const section of navSections) {
      for (const item of section.items) {
        const visibleChildren = item.children?.filter(isItemVisible) ?? [];
        if (visibleChildren.some((child) => isPathActive(child.href))) {
          ids.add(item.id);
        }
      }
    }
    return ids;
  }, [pathname, isAdmin, isLead]);

  useEffect(() => {
    if (activeParentIds.size === 0) return;
    setOpenMenus((prev) => {
      const next = { ...prev };
      activeParentIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, [activeParentIds]);

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-800">
        <Shield className="h-8 w-8 text-emerald-500" />
        <span className="text-xl font-bold text-white">Morakib</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto">
        {navSections.map((section) => {
          const SectionIcon = section.icon;
          const visibleItems = section.items.filter((item) => {
            if (item.adminOnly && !isAdmin) return false;
            if (item.leadOrAdminOnly && !(isLead || isAdmin)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.id} className="space-y-1">
              {section.title.trim().length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <SectionIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{section.title}</span>
                </div>
              )}

              {visibleItems.map((item) => {
                const ItemIcon = item.icon || ChevronRight;
                const visibleChildren = item.children?.filter(isItemVisible) ?? [];
                const hasChildren = visibleChildren.length > 0;
                const isOpen = !!openMenus[item.id] || activeParentIds.has(item.id);
                const isActive = isPathActive(item.href) || visibleChildren.some((child) => isPathActive(child.href));

                if (hasChildren) {
                  return (
                    <div key={`${section.title}-${item.id}`} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleMenu(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-emerald-600/20 text-emerald-300"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <ItemIcon className="h-4 w-4" />
                        <span className="truncate text-left">{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white animate-pulse">
                            {item.badge}
                          </span>
                        )}
                        {isOpen ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
                      </button>

                      {isOpen && (
                        <div className="space-y-1">
                          {visibleChildren.map((child) => {
                            const ChildIcon = child.icon || ChevronRight;
                            const childIsActive = isPathActive(child.href);

                            return (
                              <Link
                                key={`${section.title}-${item.id}-${child.id}`}
                                href={child.href || "#"}
                                className={cn(
                                  "ml-4 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                  childIsActive
                                    ? "bg-emerald-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                              >
                                <ChildIcon className="h-3.5 w-3.5" />
                                <span className="truncate">{child.name}</span>
                                {child.badge && (
                                  <span className="ml-auto rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white animate-pulse">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={`${section.title}-${item.id}`}
                    href={item.href || "#"}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <ItemIcon className="h-4 w-4" />
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer - User Info */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center",
            isAdmin ? "bg-red-600" : isLead ? "bg-purple-600" : "bg-emerald-600"
          )}>
            <span className="text-sm font-medium text-white">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{roleLabels[userRole] || userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
