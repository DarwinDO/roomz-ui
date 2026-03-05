/**
 * Migration: Cron job for cleaning up expired payment orders
 * Automatically cancels orders that have passed their expiration time
 */
-- ============================================
-- Function: Cleanup expired payment orders
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_payment_orders() RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_updated INTEGER := 0;
v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN -- Update expired pending orders to 'expired' status
UPDATE payment_orders
SET status = 'expired',
    updated_at = v_now
WHERE status = 'pending'
    AND expires_at < v_now;
GET DIAGNOSTICS v_updated = ROW_COUNT;
-- Log the cleanup (optional, can be removed if too verbose)
IF v_updated > 0 THEN RAISE NOTICE 'Payment orders cleanup: % orders expired at %',
v_updated,
v_now;
END IF;
RETURN v_updated;
END;
$$;
-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_payment_orders() TO service_role;
COMMENT ON FUNCTION cleanup_expired_payment_orders() IS 'Cleans up expired payment orders by setting their status to expired.
Called by pg_cron schedule. Returns number of orders updated.';
-- ============================================
-- Schedule: Run cleanup every 10 minutes
-- ============================================
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Remove existing schedule if exists (for idempotency)
SELECT cron.unschedule('cleanup-expired-payment-orders')
WHERE EXISTS (
        SELECT 1
        FROM cron.job
        WHERE jobname = 'cleanup-expired-payment-orders'
    );
-- Schedule the cleanup job (runs every 10 minutes)
SELECT cron.schedule(
        'cleanup-expired-payment-orders',
        -- unique job name
        '*/10 * * * *',
        -- cron expression: every 10 minutes
        'SELECT cleanup_expired_payment_orders()' -- SQL to execute
    );
-- ============================================
-- Alternative: Schedule with logging to table
-- ============================================
-- Create cleanup log table if not exists
CREATE TABLE IF NOT EXISTS payment_cleanup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ran_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    orders_expired INTEGER DEFAULT 0,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================
-- Performance Index: For efficient cleanup queries
-- ============================================
-- This index speeds up the cleanup query that searches for expired pending orders
CREATE INDEX IF NOT EXISTS idx_payment_orders_status_expires_at ON payment_orders(status, expires_at)
WHERE status = 'pending';
-- Function with logging
CREATE OR REPLACE FUNCTION cleanup_expired_payment_orders_with_logging() RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_updated INTEGER := 0;
v_now TIMESTAMP WITH TIME ZONE := NOW();
v_order_ids UUID [];
BEGIN -- Get IDs of orders that will be expired (for logging)
SELECT ARRAY_AGG(id) INTO v_order_ids
FROM payment_orders
WHERE status = 'pending'
    AND expires_at < v_now;
-- Update expired pending orders to 'expired' status
UPDATE payment_orders
SET status = 'expired',
    updated_at = v_now
WHERE status = 'pending'
    AND expires_at < v_now;
GET DIAGNOSTICS v_updated = ROW_COUNT;
-- Log the cleanup
IF v_updated > 0 THEN
INSERT INTO payment_cleanup_logs (orders_expired, details)
VALUES (
        v_updated,
        JSONB_BUILD_OBJECT(
            'expired_order_ids',
            v_order_ids,
            'cleanup_time',
            v_now
        )
    );
END IF;
RETURN v_updated;
END;
$$;
COMMENT ON FUNCTION cleanup_expired_payment_orders_with_logging() IS 'Cleans up expired payment orders with logging to payment_cleanup_logs table.
Use this version if you need audit trail of cleanup operations.';