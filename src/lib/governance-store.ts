import { db } from "@/lib/db";
import {
  governanceDocuments as defaultGovernanceDocuments,
  GovernanceSectionKey,
  governanceNav,
} from "@/data/governance-docs";

export type GovernanceWorkflowStatus =
  | "DRAFT"
  | "IN_REVIEW_LEAD"
  | "IN_REVIEW_ADMIN"
  | "APPROVED";

export interface GovernanceActor {
  id?: string;
  name?: string;
  role?: string;
}

export interface GovernanceDocRow {
  id: string;
  code: string;
  section: GovernanceSectionKey;
  title: string;
  objective: string;
  alignment: string;
  details: string[];
  sortOrder: number;
  workflowStatus: GovernanceWorkflowStatus;
  submittedForReviewAt: Date | null;
  leadReviewedAt: Date | null;
  leadReviewedById: string | null;
  leadReviewedByName: string | null;
  leadReviewedByRole: string | null;
  leadSignatureLabel: string | null;
  approvedAt: Date | null;
  approvedById: string | null;
  approvedByName: string | null;
  approvedByRole: string | null;
  signatureLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GovernanceDocVersionRow {
  id: string;
  documentId: string;
  versionNo: number;
  action: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface GovernanceNotificationRow {
  id: string;
  documentId: string | null;
  recipientRole: string;
  recipientUserId: string | null;
  title: string;
  message: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface GovernanceWorkflowAuditRow {
  versionId: string;
  documentId: string;
  code: string;
  title: string;
  section: GovernanceSectionKey;
  action: string;
  actorName: string | null;
  actorRole: string | null;
  createdAt: Date;
}

const SECTION_KEYS = governanceNav.map((item) => item.key);

function isSectionKey(value: string): value is GovernanceSectionKey {
  return SECTION_KEYS.includes(value as GovernanceSectionKey);
}

function normalizeTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeStatus(value: unknown): GovernanceWorkflowStatus {
  if (value === "IN_REVIEW_LEAD" || value === "IN_REVIEW_ADMIN" || value === "APPROVED") {
    return value;
  }
  return "DRAFT";
}

function mapDocRow(row: any): GovernanceDocRow {
  const section = isSectionKey(String(row.section)) ? (row.section as GovernanceSectionKey) : "foundations";
  return {
    id: String(row.id),
    code: String(row.code),
    section,
    title: String(row.title),
    objective: String(row.objective),
    alignment: String(row.alignment),
    details: normalizeTextArray(row.details_json),
    sortOrder: Number(row.sort_order ?? 0),
    workflowStatus: normalizeStatus(row.workflow_status),
    submittedForReviewAt: row.submitted_for_review_at ? new Date(row.submitted_for_review_at) : null,
    leadReviewedAt: row.lead_reviewed_at ? new Date(row.lead_reviewed_at) : null,
    leadReviewedById: row.lead_reviewed_by_id ? String(row.lead_reviewed_by_id) : null,
    leadReviewedByName: row.lead_reviewed_by_name ? String(row.lead_reviewed_by_name) : null,
    leadReviewedByRole: row.lead_reviewed_by_role ? String(row.lead_reviewed_by_role) : null,
    leadSignatureLabel: row.lead_signature_label ? String(row.lead_signature_label) : null,
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    approvedById: row.approved_by_id ? String(row.approved_by_id) : null,
    approvedByName: row.approved_by_name ? String(row.approved_by_name) : null,
    approvedByRole: row.approved_by_role ? String(row.approved_by_role) : null,
    signatureLabel: row.signature_label ? String(row.signature_label) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapVersionRow(row: any): GovernanceDocVersionRow {
  return {
    id: String(row.id),
    documentId: String(row.document_id),
    versionNo: Number(row.version_no),
    action: String(row.action),
    actorId: row.actor_id ? String(row.actor_id) : null,
    actorName: row.actor_name ? String(row.actor_name) : null,
    actorRole: row.actor_role ? String(row.actor_role) : null,
    payload: (row.payload_json as Record<string, unknown>) || {},
    createdAt: new Date(row.created_at),
  };
}

function mapNotificationRow(row: any): GovernanceNotificationRow {
  return {
    id: String(row.id),
    documentId: row.document_id ? String(row.document_id) : null,
    recipientRole: String(row.recipient_role),
    recipientUserId: row.recipient_user_id ? String(row.recipient_user_id) : null,
    title: String(row.title),
    message: String(row.message),
    link: row.link ? String(row.link) : null,
    readAt: row.read_at ? new Date(row.read_at) : null,
    createdAt: new Date(row.created_at),
  };
}

function mapAuditRow(row: any): GovernanceWorkflowAuditRow {
  const section = isSectionKey(String(row.section)) ? (row.section as GovernanceSectionKey) : "foundations";
  return {
    versionId: String(row.version_id),
    documentId: String(row.document_id),
    code: String(row.code),
    title: String(row.title),
    section,
    action: String(row.action),
    actorName: row.actor_name ? String(row.actor_name) : null,
    actorRole: row.actor_role ? String(row.actor_role) : null,
    createdAt: new Date(row.created_at),
  };
}

async function writeVersion(
  documentId: string,
  action: string,
  payload: Record<string, unknown>,
  actor?: GovernanceActor
) {
  const versionRows = await db.$queryRawUnsafe<Array<{ next_version: number }>>(
    `
    SELECT COALESCE(MAX(version_no), 0) + 1 AS next_version
    FROM governance_document_versions
    WHERE document_id = $1
  `,
    documentId
  );

  const nextVersion = Number(versionRows[0]?.next_version ?? 1);

  await db.$executeRawUnsafe(
    `
    INSERT INTO governance_document_versions (
      id,
      document_id,
      version_no,
      action,
      actor_id,
      actor_name,
      actor_role,
      payload_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
  `,
    crypto.randomUUID(),
    documentId,
    nextVersion,
    action,
    actor?.id || null,
    actor?.name || null,
    actor?.role || null,
    JSON.stringify(payload)
  );
}

async function createGovernanceNotification(input: {
  documentId?: string | null;
  recipientRole: string;
  recipientUserId?: string | null;
  title: string;
  message: string;
  link?: string | null;
}) {
  await ensureGovernanceTable();

  await db.$executeRawUnsafe(
    `
    INSERT INTO governance_notifications (
      id,
      document_id,
      recipient_role,
      recipient_user_id,
      title,
      message,
      link
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `,
    crypto.randomUUID(),
    input.documentId || null,
    input.recipientRole,
    input.recipientUserId || null,
    input.title,
    input.message,
    input.link || null
  );
}

export async function ensureGovernanceTable() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS governance_documents (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      section TEXT NOT NULL,
      title TEXT NOT NULL,
      objective TEXT NOT NULL,
      alignment TEXT NOT NULL,
      details_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      sort_order INTEGER NOT NULL DEFAULT 0,
      workflow_status TEXT NOT NULL DEFAULT 'DRAFT',
      submitted_for_review_at TIMESTAMPTZ NULL,
      lead_reviewed_at TIMESTAMPTZ NULL,
      lead_reviewed_by_id TEXT NULL,
      lead_reviewed_by_name TEXT NULL,
      lead_reviewed_by_role TEXT NULL,
      lead_signature_label TEXT NULL,
      approved_at TIMESTAMPTZ NULL,
      approved_by_id TEXT NULL,
      approved_by_name TEXT NULL,
      approved_by_role TEXT NULL,
      signature_label TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'DRAFT'`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS lead_reviewed_at TIMESTAMPTZ NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS lead_reviewed_by_id TEXT NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS lead_reviewed_by_name TEXT NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS lead_reviewed_by_role TEXT NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS lead_signature_label TEXT NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS approved_by_id TEXT NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS approved_by_name TEXT NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS approved_by_role TEXT NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE governance_documents ADD COLUMN IF NOT EXISTS signature_label TEXT NULL`);

  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_governance_documents_section
      ON governance_documents(section);
  `);

  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_governance_documents_sort
      ON governance_documents(section, sort_order, code);
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS governance_document_versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      version_no INTEGER NOT NULL,
      action TEXT NOT NULL,
      actor_id TEXT NULL,
      actor_name TEXT NULL,
      actor_role TEXT NULL,
      payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_governance_document_versions_doc
      ON governance_document_versions(document_id, created_at DESC);
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS governance_notifications (
      id TEXT PRIMARY KEY,
      document_id TEXT NULL,
      recipient_role TEXT NOT NULL,
      recipient_user_id TEXT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT NULL,
      read_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_governance_notifications_role
      ON governance_notifications(recipient_role, read_at, created_at DESC);
  `);
}

export async function seedGovernanceDocumentsIfEmpty() {
  await ensureGovernanceTable();

  const countRows = await db.$queryRawUnsafe<Array<{ count: bigint | number | string }>>(
    `SELECT COUNT(*)::bigint AS count FROM governance_documents`
  );
  const currentCount = Number(countRows[0]?.count ?? 0);

  if (currentCount > 0) {
    return;
  }

  for (const section of SECTION_KEYS) {
    const docs = defaultGovernanceDocuments[section];
    for (let i = 0; i < docs.length; i += 1) {
      const doc = docs[i];
      const id = crypto.randomUUID();

      await db.$executeRawUnsafe(
        `
        INSERT INTO governance_documents (
          id,
          code,
          section,
          title,
          objective,
          alignment,
          details_json,
          sort_order,
          workflow_status,
          lead_reviewed_at,
          lead_reviewed_by_name,
          lead_reviewed_by_role,
          lead_signature_label,
          approved_at,
          approved_by_name,
          approved_by_role,
          signature_label
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 'APPROVED', NOW(), $9, $10, $11, NOW(), $12, $13, $14)
      `,
        id,
        doc.id,
        section,
        doc.title,
        doc.objective,
        doc.alignment,
        JSON.stringify(doc.details),
        i + 1,
        "System Lead",
        "LEAD",
        "Seed Lead Signature",
        "System Admin",
        "ADMIN",
        "Seed Admin Signature"
      );

      await writeVersion(
        id,
        "seed-approved",
        {
          code: doc.id,
          section,
          title: doc.title,
          workflow: "APPROVED",
        },
        { id: "system", name: "System Seed", role: "SYSTEM" }
      );
    }
  }
}

export async function listGovernanceDocs(params?: {
  section?: GovernanceSectionKey;
  search?: string;
}) {
  await seedGovernanceDocumentsIfEmpty();

  const section = params?.section;
  const search = params?.search?.trim();

  const values: unknown[] = [];
  const whereClauses: string[] = [];

  if (section) {
    values.push(section);
    whereClauses.push(`section = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const idx = values.length;
    whereClauses.push(`(
      code ILIKE $${idx}
      OR title ILIKE $${idx}
      OR objective ILIKE $${idx}
      OR alignment ILIKE $${idx}
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(details_json) AS d(value)
        WHERE d.value ILIKE $${idx}
      )
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const rows = await db.$queryRawUnsafe<any[]>(
    `
    SELECT
      id,
      code,
      section,
      title,
      objective,
      alignment,
      details_json,
      sort_order,
      workflow_status,
      submitted_for_review_at,
      lead_reviewed_at,
      lead_reviewed_by_id,
      lead_reviewed_by_name,
      lead_reviewed_by_role,
      lead_signature_label,
      approved_at,
      approved_by_id,
      approved_by_name,
      approved_by_role,
      signature_label,
      created_at,
      updated_at
    FROM governance_documents
    ${whereSql}
    ORDER BY section ASC, sort_order ASC, code ASC
  `,
    ...values
  );

  return rows.map(mapDocRow);
}

export async function getGovernanceDocById(id: string) {
  await seedGovernanceDocumentsIfEmpty();

  const rows = await db.$queryRawUnsafe<any[]>(
    `
    SELECT
      id,
      code,
      section,
      title,
      objective,
      alignment,
      details_json,
      sort_order,
      workflow_status,
      submitted_for_review_at,
      lead_reviewed_at,
      lead_reviewed_by_id,
      lead_reviewed_by_name,
      lead_reviewed_by_role,
      lead_signature_label,
      approved_at,
      approved_by_id,
      approved_by_name,
      approved_by_role,
      signature_label,
      created_at,
      updated_at
    FROM governance_documents
    WHERE id = $1
    LIMIT 1
  `,
    id
  );

  if (!rows[0]) return null;
  return mapDocRow(rows[0]);
}

export async function listGovernanceDocVersions(documentId: string) {
  await ensureGovernanceTable();

  const rows = await db.$queryRawUnsafe<any[]>(
    `
    SELECT
      id,
      document_id,
      version_no,
      action,
      actor_id,
      actor_name,
      actor_role,
      payload_json,
      created_at
    FROM governance_document_versions
    WHERE document_id = $1
    ORDER BY version_no DESC
  `,
    documentId
  );

  return rows.map(mapVersionRow);
}

export async function listGovernanceNotifications(params: {
  recipientRole: string;
  recipientUserId?: string;
  unreadOnly?: boolean;
  limit?: number;
}) {
  await ensureGovernanceTable();

  const values: unknown[] = [params.recipientRole];
  const whereClauses = ["recipient_role = $1"];

  if (params.recipientUserId) {
    values.push(params.recipientUserId);
    whereClauses.push(`(recipient_user_id IS NULL OR recipient_user_id = $${values.length})`);
  }

  if (params.unreadOnly) {
    whereClauses.push("read_at IS NULL");
  }

  const limit = Math.max(1, Math.min(200, params.limit ?? 50));
  values.push(limit);

  const rows = await db.$queryRawUnsafe<any[]>(
    `
    SELECT
      id,
      document_id,
      recipient_role,
      recipient_user_id,
      title,
      message,
      link,
      read_at,
      created_at
    FROM governance_notifications
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY created_at DESC
    LIMIT $${values.length}
  `,
    ...values
  );

  return rows.map(mapNotificationRow);
}

export async function markGovernanceNotificationsAsRead(ids: string[]) {
  await ensureGovernanceTable();
  if (ids.length === 0) return;

  await db.$executeRawUnsafe(
    `
    UPDATE governance_notifications
    SET read_at = NOW()
    WHERE id = ANY($1::text[])
  `,
    ids
  );
}

export async function listGovernanceWorkflowAudit(params?: {
  section?: GovernanceSectionKey;
  fromDate?: Date;
  toDate?: Date;
}) {
  await ensureGovernanceTable();

  const values: unknown[] = [];
  const whereClauses: string[] = [
    `v.action IN ('submitted-to-lead-review', 'lead-approved', 'admin-approved', 'reset-to-draft')`,
  ];

  if (params?.section) {
    values.push(params.section);
    whereClauses.push(`d.section = $${values.length}`);
  }

  if (params?.fromDate) {
    values.push(params.fromDate);
    whereClauses.push(`v.created_at >= $${values.length}`);
  }

  if (params?.toDate) {
    values.push(params.toDate);
    whereClauses.push(`v.created_at <= $${values.length}`);
  }

  const rows = await db.$queryRawUnsafe<any[]>(
    `
    SELECT
      v.id AS version_id,
      v.document_id,
      d.code,
      d.title,
      d.section,
      v.action,
      v.actor_name,
      v.actor_role,
      v.created_at
    FROM governance_document_versions v
    INNER JOIN governance_documents d ON d.id = v.document_id
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY v.created_at DESC
  `,
    ...values
  );

  return rows.map(mapAuditRow);
}

export async function createGovernanceDoc(
  input: {
    code: string;
    section: GovernanceSectionKey;
    title: string;
    objective: string;
    alignment: string;
    details: string[];
    sortOrder?: number;
  },
  actor?: GovernanceActor
) {
  await seedGovernanceDocumentsIfEmpty();

  const rowId = crypto.randomUUID();
  const sortOrder = input.sortOrder ?? 999;

  await db.$executeRawUnsafe(
    `
    INSERT INTO governance_documents (
      id,
      code,
      section,
      title,
      objective,
      alignment,
      details_json,
      sort_order,
      workflow_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 'DRAFT')
  `,
    rowId,
    input.code,
    input.section,
    input.title,
    input.objective,
    input.alignment,
    JSON.stringify(input.details),
    sortOrder
  );

  await writeVersion(
    rowId,
    "created",
    {
      code: input.code,
      section: input.section,
      title: input.title,
      workflow: "DRAFT",
    },
    actor
  );

  return getGovernanceDocById(rowId);
}

export async function updateGovernanceDoc(
  id: string,
  input: Partial<{
    code: string;
    section: GovernanceSectionKey;
    title: string;
    objective: string;
    alignment: string;
    details: string[];
    sortOrder: number;
  }>,
  actor?: GovernanceActor
) {
  const existing = await getGovernanceDocById(id);
  if (!existing) return null;

  const code = input.code ?? existing.code;
  const section = input.section ?? existing.section;
  const title = input.title ?? existing.title;
  const objective = input.objective ?? existing.objective;
  const alignment = input.alignment ?? existing.alignment;
  const details = input.details ?? existing.details;
  const sortOrder = input.sortOrder ?? existing.sortOrder;

  await db.$executeRawUnsafe(
    `
    UPDATE governance_documents
    SET
      code = $2,
      section = $3,
      title = $4,
      objective = $5,
      alignment = $6,
      details_json = $7::jsonb,
      sort_order = $8,
      updated_at = NOW()
    WHERE id = $1
  `,
    id,
    code,
    section,
    title,
    objective,
    alignment,
    JSON.stringify(details),
    sortOrder
  );

  await writeVersion(
    id,
    "updated",
    {
      before: {
        code: existing.code,
        section: existing.section,
        title: existing.title,
      },
      after: {
        code,
        section,
        title,
      },
    },
    actor
  );

  return getGovernanceDocById(id);
}

export async function setGovernanceDocWorkflow(
  id: string,
  status: GovernanceWorkflowStatus,
  actor?: GovernanceActor,
  signatureLabel?: string
) {
  const existing = await getGovernanceDocById(id);
  if (!existing) return null;

  if (status === "IN_REVIEW_LEAD") {
    await db.$executeRawUnsafe(
      `
      UPDATE governance_documents
      SET
        workflow_status = 'IN_REVIEW_LEAD',
        submitted_for_review_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
      id
    );

    await writeVersion(
      id,
      "submitted-to-lead-review",
      {
        previousStatus: existing.workflowStatus,
        newStatus: "IN_REVIEW_LEAD",
      },
      actor
    );

    await createGovernanceNotification({
      documentId: id,
      recipientRole: "LEAD",
      title: "Document en attente de validation Lead",
      message: `${existing.code} - ${existing.title} a ete soumis pour revue Lead.`,
      link: `/management/${existing.section}`,
    });

    return getGovernanceDocById(id);
  }

  if (status === "IN_REVIEW_ADMIN") {
    const leadSignature = signatureLabel || `${actor?.name || "Lead"} (${actor?.role || "LEAD"})`;

    await db.$executeRawUnsafe(
      `
      UPDATE governance_documents
      SET
        workflow_status = 'IN_REVIEW_ADMIN',
        lead_reviewed_at = NOW(),
        lead_reviewed_by_id = $2,
        lead_reviewed_by_name = $3,
        lead_reviewed_by_role = $4,
        lead_signature_label = $5,
        updated_at = NOW()
      WHERE id = $1
    `,
      id,
      actor?.id || null,
      actor?.name || null,
      actor?.role || null,
      leadSignature
    );

    await writeVersion(
      id,
      "lead-approved",
      {
        previousStatus: existing.workflowStatus,
        newStatus: "IN_REVIEW_ADMIN",
        leadSignature,
      },
      actor
    );

    await createGovernanceNotification({
      documentId: id,
      recipientRole: "ADMIN",
      title: "Document en attente de validation Admin/RSSI",
      message: `${existing.code} - ${existing.title} attend la validation finale Admin/RSSI.`,
      link: `/management/${existing.section}`,
    });

    return getGovernanceDocById(id);
  }

  if (status === "APPROVED") {
    const adminSignature = signatureLabel || `${actor?.name || "Admin"} (${actor?.role || "ADMIN"})`;

    await db.$executeRawUnsafe(
      `
      UPDATE governance_documents
      SET
        workflow_status = 'APPROVED',
        approved_at = NOW(),
        approved_by_id = $2,
        approved_by_name = $3,
        approved_by_role = $4,
        signature_label = $5,
        updated_at = NOW()
      WHERE id = $1
    `,
      id,
      actor?.id || null,
      actor?.name || null,
      actor?.role || null,
      adminSignature
    );

    await writeVersion(
      id,
      "admin-approved",
      {
        previousStatus: existing.workflowStatus,
        newStatus: "APPROVED",
        adminSignature,
      },
      actor
    );

    await createGovernanceNotification({
      documentId: id,
      recipientRole: "LEAD",
      title: "Document approuve",
      message: `${existing.code} - ${existing.title} a ete approuve en validation finale.`,
      link: `/management/${existing.section}`,
    });

    return getGovernanceDocById(id);
  }

  await db.$executeRawUnsafe(
    `
    UPDATE governance_documents
    SET
      workflow_status = 'DRAFT',
      submitted_for_review_at = NULL,
      lead_reviewed_at = NULL,
      lead_reviewed_by_id = NULL,
      lead_reviewed_by_name = NULL,
      lead_reviewed_by_role = NULL,
      lead_signature_label = NULL,
      approved_at = NULL,
      approved_by_id = NULL,
      approved_by_name = NULL,
      approved_by_role = NULL,
      signature_label = NULL,
      updated_at = NOW()
    WHERE id = $1
  `,
    id
  );

  await writeVersion(
    id,
    "reset-to-draft",
    {
      previousStatus: existing.workflowStatus,
      newStatus: "DRAFT",
    },
    actor
  );

  return getGovernanceDocById(id);
}

export async function deleteGovernanceDoc(id: string, actor?: GovernanceActor) {
  const existing = await getGovernanceDocById(id);
  if (!existing) return;

  await writeVersion(
    id,
    "deleted",
    {
      code: existing.code,
      title: existing.title,
      section: existing.section,
      workflow: existing.workflowStatus,
    },
    actor
  );

  await db.$executeRawUnsafe(`DELETE FROM governance_documents WHERE id = $1`, id);
}
