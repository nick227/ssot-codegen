/**
 * Constants for DMMF Parser
 * 
 * Default function names and system field names used throughout parsing.
 */

/**
 * Prisma DB-managed default function names
 * These are handled by the database, not the client
 * 
 * Note: This list is based on Prisma schema language specification.
 * Future Prisma versions may add new default functions.
 * Unknown defaults are treated conservatively (not generated in client code).
 * 
 * Provider-Specific Considerations:
 * - PostgreSQL: sequence(), gen_random_uuid()
 * - MySQL: AUTO_INCREMENT (via autoincrement())
 * - SQLite: autoincrement()
 * - MongoDB: auto(), ObjectId()
 * 
 * These provider-specific functions are typically wrapped in dbgenerated()
 * or use the generic functions above. For advanced provider-specific handling,
 * generators can check field.default and implement custom logic.
 * 
 * Future Enhancement: Add datasource.provider to ParseOptions for provider-aware validation.
 */
export const DB_MANAGED_DEFAULTS = ['autoincrement', 'uuid', 'cuid', 'dbgenerated'] as const

/**
 * Prisma client-managed default function names
 * These are evaluated on the client side and passed to the database
 */
export const CLIENT_MANAGED_DEFAULTS = ['now'] as const

/**
 * System-managed timestamp field names
 */
export const SYSTEM_TIMESTAMP_FIELDS = ['createdAt', 'updatedAt'] as const





