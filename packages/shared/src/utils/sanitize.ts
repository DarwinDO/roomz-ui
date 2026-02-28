/**
 * Sanitize a user search input for use in SQL `ilike` patterns.
 * Escapes `%` and `_` which are wildcard characters in PostgreSQL LIKE/ILIKE.
 */
export function sanitizeSearchInput(query: string): string {
    return query.replace(/[%_]/g, '\\$&');
}
