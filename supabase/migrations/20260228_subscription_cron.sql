-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Create function to expire subscriptions
CREATE OR REPLACE FUNCTION expire_subscriptions() RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN -- Mark expired subscriptions
UPDATE subscriptions
SET status = 'expired',
    updated_at = now()
WHERE status = 'active'
    AND current_period_end IS NOT NULL
    AND current_period_end < now();
-- Update users who no longer have active subscriptions
UPDATE users
SET is_premium = false,
    updated_at = now()
WHERE is_premium = true
    AND premium_until IS NOT NULL
    AND premium_until < now()
    AND id NOT IN (
        SELECT user_id
        FROM subscriptions
        WHERE status = 'active'
            AND (
                current_period_end IS NULL
                OR current_period_end > now()
            )
    );
-- Mark expired payment_orders
UPDATE payment_orders
SET status = 'expired',
    updated_at = now()
WHERE status = 'pending'
    AND expires_at < now();
END;
$$;
-- Schedule cron job (every hour at minute 0)
SELECT cron.schedule(
        'expire-subscriptions',
        '0 * * * *',
        'SELECT expire_subscriptions()'
    );