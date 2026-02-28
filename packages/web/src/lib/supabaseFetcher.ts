/**
 * Supabase Fetcher Wrapper
 * Centralized error handling for Supabase queries
 */
import type { PostgrestError } from '@supabase/supabase-js';

export class SupabaseError extends Error {
    code: string;
    details: string;
    hint: string;

    constructor(error: PostgrestError) {
        super(error.message);
        this.name = 'SupabaseError';
        this.code = error.code;
        this.details = error.details || '';
        this.hint = error.hint || '';
    }
}

/**
 * Wrapper for Supabase queries with consistent error handling
 */
export async function supabaseFetch<T>(
    query: PromiseLike<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
    const { data, error } = await query;
    if (error) throw new SupabaseError(error);
    return data as T;
}

/**
 * Wrapper for Supabase queries that return count
 */
export async function supabaseFetchWithCount<T>(
    query: PromiseLike<{ data: T | null; error: PostgrestError | null; count: number | null }>
): Promise<{ data: T; count: number }> {
    const { data, error, count } = await query;
    if (error) throw new SupabaseError(error);
    return { data: data as T, count: count || 0 };
}
