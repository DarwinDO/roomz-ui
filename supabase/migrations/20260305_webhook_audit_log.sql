/**
 * Migration: Webhook audit logging
 * Tracks all webhook requests for debugging, compliance, and idempotency
 */
-- ============================================
-- Table: Webhook audit logs
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Request identification
    provider TEXT NOT NULL DEFAULT 'sepay',
    -- 'sepay', 'stripe', etc.
    webhook_id TEXT,
    -- Provider's webhook/event ID
    event_type TEXT,
    -- Event type (e.g., 'payment.received')
    -- Order/payment reference
    order_code TEXT,
    -- Our internal order code (e.g., ROOMZ123)
    transaction_id TEXT,
    -- Provider's transaction ID
    amount NUMERIC,
    -- Transaction amount
    -- Request metadata
    request_method TEXT DEFAULT 'POST',
    request_headers JSONB,
    -- Store relevant headers
    request_body JSONB,
    -- Full webhook payload
    request_ip INET,
    -- Source IP address
    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending',
    -- 'pending', 'processing', 'success', 'failed', 'ignored'
    processing_result JSONB,
    -- Result from processing (e.g., RPC response)
    error_message TEXT,
    -- Error if processing failed
    -- Signature verification
    signature_valid BOOLEAN,
    -- Whether signature was valid
    signature_provided BOOLEAN,
    -- Whether signature was present
    -- Timing
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    -- When processing completed
    processing_duration_ms INTEGER,
    -- How long processing took
    -- Idempotency
    idempotency_key TEXT UNIQUE,
    -- Unique key to prevent duplicates
    -- User reference (if applicable)
    user_id UUID REFERENCES users(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_code ON webhook_audit_logs(order_code);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_transaction_id ON webhook_audit_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at ON webhook_audit_logs(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_idempotency_key ON webhook_audit_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider_event ON webhook_audit_logs(provider, event_type);
-- ============================================
-- RLS Policies
-- ============================================
-- Enable RLS
ALTER TABLE webhook_audit_logs ENABLE ROW LEVEL SECURITY;
-- Only service role can read/write
CREATE POLICY "Service role can manage webhook logs" ON webhook_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Admins can read
CREATE POLICY "Admins can read webhook logs" ON webhook_audit_logs FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE users.id = auth.uid()
                AND users.role = 'admin'
        )
    );
-- ============================================
-- RPC Function: Log webhook request
-- ============================================
CREATE OR REPLACE FUNCTION log_webhook_request(
        p_provider TEXT,
        p_webhook_id TEXT,
        p_event_type TEXT,
        p_order_code TEXT,
        p_transaction_id TEXT,
        p_amount NUMERIC,
        p_request_headers JSONB,
        p_request_body JSONB,
        p_request_ip INET,
        p_signature_valid BOOLEAN,
        p_signature_provided BOOLEAN,
        p_idempotency_key TEXT,
        p_user_id UUID DEFAULT NULL
    ) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_log_id UUID;
BEGIN
INSERT INTO webhook_audit_logs (
        provider,
        webhook_id,
        event_type,
        order_code,
        transaction_id,
        amount,
        request_headers,
        request_body,
        request_ip,
        status,
        signature_valid,
        signature_provided,
        idempotency_key,
        user_id
    )
VALUES (
        p_provider,
        p_webhook_id,
        p_event_type,
        p_order_code,
        p_transaction_id,
        p_amount,
        p_request_headers,
        p_request_body,
        p_request_ip,
        'pending',
        p_signature_valid,
        p_signature_provided,
        p_idempotency_key,
        p_user_id
    ) ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id INTO v_log_id;
RETURN v_log_id;
END;
$$;
COMMENT ON FUNCTION log_webhook_request IS 'Logs an incoming webhook request. Returns the log ID or NULL if duplicate (idempotency key already exists).';
GRANT EXECUTE ON FUNCTION log_webhook_request TO service_role;
-- ============================================
-- RPC Function: Update webhook processing result
-- ============================================
CREATE OR REPLACE FUNCTION update_webhook_result(
        p_log_id UUID,
        p_status TEXT,
        p_result JSONB DEFAULT NULL,
        p_error_message TEXT DEFAULT NULL
    ) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE webhook_audit_logs
SET status = p_status,
    processing_result = p_result,
    error_message = p_error_message,
    processed_at = NOW(),
    processing_duration_ms = EXTRACT(
        EPOCH
        FROM (NOW() - received_at)
    ) * 1000
WHERE id = p_log_id;
END;
$$;
COMMENT ON FUNCTION update_webhook_result IS 'Updates the processing result for a webhook log entry.';
GRANT EXECUTE ON FUNCTION update_webhook_result TO service_role;
-- ============================================
-- RPC Function: Check idempotency (prevent duplicates)
-- ============================================
CREATE OR REPLACE FUNCTION check_webhook_idempotency(p_idempotency_key TEXT) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN EXISTS(
        SELECT 1
        FROM webhook_audit_logs
        WHERE idempotency_key = p_idempotency_key
            AND status IN ('success', 'processing')
    );
END;
$$;
COMMENT ON FUNCTION check_webhook_idempotency IS 'Checks if a webhook with the given idempotency key has already been processed.
Returns TRUE if already processed (should skip), FALSE otherwise.';
GRANT EXECUTE ON FUNCTION check_webhook_idempotency TO service_role;
-- ============================================
-- View: Recent webhook summary (for admin dashboard)
-- ============================================
CREATE OR REPLACE VIEW webhook_summary AS
SELECT DATE_TRUNC('hour', received_at) as hour,
    provider,
    event_type,
    status,
    COUNT(*) as count,
    AVG(processing_duration_ms) as avg_duration_ms
FROM webhook_audit_logs
WHERE received_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', received_at),
    provider,
    event_type,
    status
ORDER BY hour DESC;
-- Grant access to admin users
GRANT SELECT ON webhook_summary TO authenticated;