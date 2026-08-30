-- V39__add_terms_and_privacy_acceptance_to_users.sql
-- Add audit fields for Terms of Service and Privacy Policy acceptance

ALTER TABLE users
    ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN terms_version VARCHAR(20) NULL,
    ADD COLUMN privacy_accepted_at TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN privacy_version VARCHAR(20) NULL;
