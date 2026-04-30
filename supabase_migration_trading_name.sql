-- PurpLedger Migration: Trading Name / Owner Name / Platform Version
-- Run this in Supabase SQL Editor

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS trading_name TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS platform_version INTEGER DEFAULT 0;

-- Backfill: Copy business_name → trading_name for all existing merchants
UPDATE merchants SET trading_name = business_name WHERE trading_name IS NULL;
