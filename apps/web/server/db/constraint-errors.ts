/**
 * Drizzle wraps driver errors, so the pg fields are reached through the cause chain.
 * Database constraints are the final authority on uniqueness and referential integrity:
 * a pre-flight SELECT would still lose a race against a concurrent write.
 */
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

type PostgresError = {
  code: string;
  constraint?: string;
};

function findPostgresError(error: unknown): PostgresError | null {
  let current: unknown = error;

  while (current) {
    if (typeof current === "object" && "code" in current) {
      const { code } = current as { code?: unknown };

      // SQLSTATE codes are always five characters, which filters out unrelated
      // `code` properties on wrapper errors.
      if (typeof code === "string" && code.length === 5) {
        return current as PostgresError;
      }
    }

    current = (current as { cause?: unknown }).cause;
  }

  return null;
}

export function isUniqueViolation(error: unknown): boolean {
  return findPostgresError(error)?.code === UNIQUE_VIOLATION;
}

export function isForeignKeyViolation(error: unknown): boolean {
  return findPostgresError(error)?.code === FOREIGN_KEY_VIOLATION;
}

/** Names the constraint that failed, so callers can tell two foreign keys apart. */
export function violatedConstraint(error: unknown): string | undefined {
  return findPostgresError(error)?.constraint;
}
