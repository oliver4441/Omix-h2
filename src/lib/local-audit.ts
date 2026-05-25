import { getLocalDb } from "@/lib/local-db";

interface AuditLogOptions {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  schoolId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Write an entry to the audit log.
 * Uses the local SQLite database (not the primary PostgreSQL).
 * Fire-and-forget — errors are logged but don't block the calling operation.
 */
export async function auditLog(options: AuditLogOptions): Promise<void> {
  try {
    const db = getLocalDb();
    await db.auditLog.create({
      data: {
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        userId: options.userId,
        schoolId: options.schoolId,
        metadata: options.metadata
          ? JSON.stringify(options.metadata)
          : null,
      },
    });
  } catch (error) {
    // Audit log failures should not break the main operation
    console.error("Audit log write failed:", error);
  }
}

/**
 * Shorthand helpers for common audit events
 */
export const audit = {
  created: (entity: string, entityId: string, userId?: string, schoolId?: string, metadata?: Record<string, unknown>) =>
    auditLog({ action: "created", entity, entityId, userId, schoolId, metadata }),

  updated: (entity: string, entityId: string, userId?: string, schoolId?: string, metadata?: Record<string, unknown>) =>
    auditLog({ action: "updated", entity, entityId, userId, schoolId, metadata }),

  deleted: (entity: string, entityId: string, userId?: string, schoolId?: string) =>
    auditLog({ action: "deleted", entity, entityId, userId, schoolId }),

  viewed: (entity: string, entityId: string, userId?: string, schoolId?: string) =>
    auditLog({ action: "viewed", entity, entityId, userId, schoolId }),

  login: (userId: string, schoolId?: string) =>
    auditLog({ action: "login", entity: "user", entityId: userId, userId, schoolId }),

  logout: (userId: string, schoolId?: string) =>
    auditLog({ action: "logout", entity: "user", entityId: userId, userId, schoolId }),

  export: (entity: string, userId?: string, schoolId?: string, metadata?: Record<string, unknown>) =>
    auditLog({ action: "export", entity, userId, schoolId, metadata }),
};
