/**
 * Context exports
 * Separates context definition from exports to fix Fast Refresh warnings
 */

export { AuthProvider, useAuth } from './AuthContext';
export type { UserProfile } from './AuthContext';
