/**
 * User utility functions
 */

/**
 * Get user initials from full name or email
 * Used for avatar fallback display
 */
export function getUserInitials(fullName?: string | null, email?: string | null): string {
    if (fullName) {
        return fullName
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || '?';
}
