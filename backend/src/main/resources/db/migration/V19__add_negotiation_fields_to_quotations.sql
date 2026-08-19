-- Migration V19: Add negotiation tracking fields to quotations table

ALTER TABLE quotations
    ADD COLUMN actor_type VARCHAR(20) NOT NULL DEFAULT 'SUPPLIER',
    ADD COLUMN action_type VARCHAR(30) NOT NULL DEFAULT 'INITIAL_QUOTATION',
    ADD COLUMN commercial_message TEXT;

COMMENT ON COLUMN quotations.actor_type IS 'Actor who submitted this revision: SUPPLIER or BUYER';
COMMENT ON COLUMN quotations.action_type IS 'Action type: INITIAL_QUOTATION, COUNTER_OFFER, REVISED_QUOTATION';
COMMENT ON COLUMN quotations.commercial_message IS 'Optional commercial message associated with counter offers or revised terms';
