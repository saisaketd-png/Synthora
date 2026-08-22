-- V34: Supplier Onboarding, Representative Contacts, Contact Verification Flags, and Company Logo Fields

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS authorized_representative_name VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS authorized_representative_designation VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS logo_storage_path VARCHAR(1000);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS logo_content_type VARCHAR(100);
