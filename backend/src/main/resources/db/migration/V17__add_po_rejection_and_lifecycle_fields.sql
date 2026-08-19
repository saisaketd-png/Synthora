-- Phase 2H.6: Purchase Order Fulfillment and Rejection Lifecycle
-- Adds columns to track supplier rejection reason and fulfillment lifecycle timestamps.

ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS processing_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
