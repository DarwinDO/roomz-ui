-- Premium Deals Migration
-- Adds is_premium_only column to deals table
-- Created: 2026-02-27
-- Add is_premium_only column to deals table
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS is_premium_only BOOLEAN DEFAULT false;
-- Create index for querying premium-only deals
CREATE INDEX IF NOT EXISTS idx_deals_is_premium_only ON deals(is_premium_only)
WHERE is_premium_only = true;