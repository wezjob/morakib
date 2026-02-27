// ============================================
// MORAKIB - Type Definitions
// ============================================

export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type AlertStatus = "NEW" | "ASSIGNED" | "INVESTIGATING" | "RESOLVED" | "ESCALATED" | "FALSE_POSITIVE";
export type AlertSource = "SURICATA" | "ZEEK" | "FILEBEAT" | "ELASTIC" | "CUSTOM";
export type UserRole = "ANALYST_JUNIOR" | "ANALYST_SENIOR" | "LEAD" | "ADMIN";
export type InvestigationConclusion = "TRUE_POSITIVE" | "FALSE_POSITIVE" | "NEEDS_ESCALATION" | "INCONCLUSIVE";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatarUrl: string | null;
  teamId: string | null;
}

export interface Alert {
  id: string;
  title: string;
  description: string | null;
  severity: AlertSeverity;
  status: AlertStatus;
  source: AlertSource;
  sourceIp: string | null;
  destIp: string | null;
  sourcePort: number | null;
  destPort: number | null;
  protocol: string | null;
  ruleName: string | null;
  ruleId: string | null;
  rawLog: Record<string, unknown> | null;
  enrichmentData: Record<string, unknown> | null;
  assignedToId: string | null;
  assignedTo?: User | null;
  detectedAt: Date;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SOP {
  id: string;
  title: string;
  slug: string;
  category: string;
  alertTypes: string[];
  contentMarkdown: string;
  checklist: ChecklistItem[] | null;
  examples: SOPExample[] | null;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
}

export interface SOPExample {
  id: string;
  title: string;
  description: string;
  query?: string;
  screenshot?: string;
}

export interface Investigation {
  id: string;
  alertId: string;
  alert?: Alert;
  analystId: string;
  analyst?: User;
  sopId: string | null;
  sop?: SOP | null;
  checklistResults: Record<string, boolean> | null;
  findings: string | null;
  conclusion: InvestigationConclusion | null;
  actionsTaken: string[] | null;
  timeSpentMinutes: number | null;
  irisIncidentId: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface Task {
  id: string;
  analystId: string;
  analyst?: User;
  alertId: string | null;
  alert?: Alert | null;
  type: "INVESTIGATE_ALERT" | "REVIEW_SOP" | "TRAINING" | "OTHER";
  title: string;
  description: string | null;
  priority: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueDate: Date | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface DashboardStats {
  alertsNew: number;
  alertsInProgress: number;
  alertsResolvedToday: number;
  mttrMinutes: number;
  truePositiveRate: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}
