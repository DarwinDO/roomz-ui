/**
 * Database Types Re-export
 * 
 * This file re-exports database types from @roomz/shared
 * to maintain backward compatibility with existing import paths.
 * 
 * @deprecated Import directly from @roomz/shared/services/database.types when possible
 */

export * from '@roomz/shared/services/database.types';
export type { Database, Tables, Enums } from '@roomz/shared/services/database.types';

