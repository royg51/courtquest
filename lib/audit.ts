// Audit trail service layer.
//
// recordAudit() is deliberately non-blocking: writing an audit row must NEVER
// break the action it's recording. A failed audit write is logged + reported
// to Sentry but swallowed — same principle as lib/email.ts. (The trade-off:
// in the rare event the audit insert fails, the action still succeeds and we
// lose one log line rather than 500-ing a legitimate admin action. For a
// trail that exists to investigate disputes, availability of the underlying
// action wins over guaranteed-complete logging.)

import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';
import { db } from '@/lib/db';

export type AuditAction =
  | 'ROLE_CHANGED'
  | 'TOURNAMENT_UPDATED'
  | 'TOURNAMENT_DELETED'
  | 'MATCH_SCORE_UPDATED'
  | 'MATCH_SCHEDULED'
  | 'COURTS_AUTO_ASSIGNED'
  | 'BRACKET_GENERATED';

export type AuditEntityType = 'USER' | 'TOURNAMENT' | 'MATCH' | 'BRACKET';

export interface AuditActor {
  id: string | null;
  email: string | null;
}

export interface RecordAuditInput {
  actor: AuditActor;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

// Prisma's Json columns reject `undefined` — normalize to Prisma.JsonNull so
// "no snapshot" is stored as an explicit null rather than throwing.
function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: input.actor.id ?? undefined,
        actorEmail: input.actor.email ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? undefined,
        before: toJson(input.before),
        after: toJson(input.after),
        metadata: toJson(input.metadata),
      },
    });
  } catch (error) {
    console.error(`[audit] failed to record "${input.action}":`, error);
    Sentry.captureException(error, { tags: { audit: input.action } });
  }
}

// Picks just the fields that actually changed between two records, returning
// parallel before/after objects — so a TOURNAMENT_UPDATED entry stores
// "name: A -> B" instead of a full row diff full of unchanged columns.
export function diffChangedFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>
): { before: Partial<T>; after: Partial<T> } {
  const changedBefore: Partial<T> = {};
  const changedAfter: Partial<T> = {};
  for (const key of Object.keys(after) as (keyof T)[]) {
    const next = after[key];
    if (next !== undefined && next !== before[key]) {
      changedBefore[key] = before[key];
      changedAfter[key] = next as T[keyof T];
    }
  }
  return { before: changedBefore, after: changedAfter };
}

export interface ListAuditLogsOptions {
  page?: number;
  pageSize?: number;
  action?: AuditAction;
  entityType?: AuditEntityType;
}

// Paginated read for the admin viewer. Newest first.
export async function listAuditLogs(options: ListAuditLogsOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 50));

  const where = {
    ...(options.action ? { action: options.action } : {}),
    ...(options.entityType ? { entityType: options.entityType } : {}),
  };

  const [total, logs] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { logs, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export type AuditLogRow = Awaited<ReturnType<typeof listAuditLogs>>['logs'][number];
