-- Flyway Migration V44: Admin Configuration, Platform Policies, Feature Flags, Announcements & Catalog Taxonomy

CREATE TABLE platform_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    data_type VARCHAR(20) NOT NULL DEFAULT 'STRING',
    description TEXT,
    impact_warning TEXT,
    updated_by VARCHAR(150),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_platform_settings_category ON platform_settings(category);

CREATE TABLE platform_feature_flags (
    feature_key VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    impact_warning TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    requires_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
    is_dangerous BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by VARCHAR(150),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE platform_announcements (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'INFO',
    audience VARCHAR(64) NOT NULL DEFAULT 'ALL',
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    send_in_app BOOLEAN NOT NULL DEFAULT TRUE,
    send_email BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP,
    created_by VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_status ON platform_announcements(status);
CREATE INDEX idx_announcements_audience ON platform_announcements(audience);
CREATE INDEX idx_announcements_created ON platform_announcements(created_at DESC);

CREATE TABLE catalog_taxonomies (
    id UUID PRIMARY KEY,
    taxonomy_type VARCHAR(64) NOT NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(64) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_catalog_taxonomies_type_code UNIQUE (taxonomy_type, code)
);

CREATE INDEX idx_catalog_taxonomies_type ON catalog_taxonomies(taxonomy_type);
CREATE INDEX idx_catalog_taxonomies_active ON catalog_taxonomies(active);

-- Seed Safe Initial Feature Flags
INSERT INTO platform_feature_flags (feature_key, name, description, impact_warning, enabled, requires_confirmation, is_dangerous, updated_by, updated_at) VALUES
('MARKETPLACE_RFQ_ENABLED', 'RFQ Creation', 'Allows buyers to submit chemical RFQs across verified suppliers.', 'Disabling this will prevent buyers from posting new RFQs. Existing RFQs and negotiations will continue unaffected.', TRUE, FALSE, FALSE, 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('MARKETPLACE_QUOTATION_ENABLED', 'Quotation Submission', 'Allows suppliers to submit quotations for active RFQs.', 'Disabling this will prevent suppliers from submitting new quotes. Existing quotations remain viewable and actionable.', TRUE, FALSE, FALSE, 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('MARKETPLACE_ORDERS_ENABLED', 'Purchase Order Creation', 'Allows buyers to accept quotes and generate binding purchase orders.', 'Disabling this prevents buyers from issuing new purchase orders.', TRUE, FALSE, FALSE, 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('MARKETPLACE_SHIPMENTS_ENABLED', 'Shipment Tracking & Updates', 'Allows suppliers to dispatch shipments and update tracking details.', 'Disabling this will block suppliers from creating or updating shipment dispatch tracking.', TRUE, FALSE, FALSE, 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('BUYER_REGISTRATION_ENABLED', 'Buyer Self-Registration', 'Allows new enterprise chemical buyers to register accounts.', 'Disabling this blocks new buyer registrations across public registration flows.', TRUE, FALSE, FALSE, 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('SUPPLIER_REGISTRATION_ENABLED', 'Supplier Self-Registration', 'Allows chemical manufacturers and distributors to register.', 'Disabling this blocks new supplier onboarding registrations.', TRUE, FALSE, FALSE, 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('SUPPLIER_VERIFICATION_SUBMISSION_ENABLED', 'Supplier Verification Submission', 'Allows registered suppliers to submit KYC and compliance evidence for admin review.', 'Disabling this prevents suppliers from submitting verification dossiers.', TRUE, FALSE, FALSE, 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('SUPPLIER_OFFERINGS_ENABLED', 'Supplier Offering Creation', 'Allows verified suppliers to publish product offerings against catalog items.', 'Disabling this prevents suppliers from listing new product offerings.', TRUE, FALSE, FALSE, 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('ADMIN_OFFERING_CREATION_ENABLED', 'Admin-Created Supplier Offerings', 'Permits administrators to create verified supplier offerings on behalf of partners.', 'Disabling this restricts offering creation exclusively to authenticated supplier representatives.', TRUE, FALSE, FALSE, 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('MAINTENANCE_MODE_ENABLED', 'Platform Maintenance Mode', 'Restricts public and commercial trading interactions for scheduled platform maintenance.', 'CRITICAL: Enabling Maintenance Mode restricts public and commercial marketplace interactions for buyers and suppliers. Administrators retain full access to administrative operations and control centers.', FALSE, TRUE, TRUE, 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP);

-- Seed Safe Initial Platform Settings
INSERT INTO platform_settings (setting_key, setting_value, category, data_type, description, impact_warning, updated_by, updated_at) VALUES
('QUOTATION_DEFAULT_VALIDITY_DAYS', '14', 'COMMERCIAL', 'INTEGER', 'Default validity period in days for submitted supplier quotations.', 'Changing this affects the default expiration date calculated for newly submitted quotations.', 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('MINIMUM_LEAD_TIME_DAYS', '1', 'COMMERCIAL', 'INTEGER', 'Minimum delivery lead time days suppliers must specify when quoting.', 'Suppliers cannot submit quotations with a lead time less than this value.', 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('ALLOWED_CURRENCIES', 'INR,USD,EUR', 'COMMERCIAL', 'STRING', 'Comma-separated ISO currency codes accepted on the marketplace.', 'Only quotations and offerings in these currencies can be created.', 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('BUYER_RFQ_DAILY_LIMIT', '50', 'BUYER', 'INTEGER', 'Maximum number of RFQs an individual buyer account can submit per calendar day.', 'Prevents automated spam and bulk request flooding from buyer accounts.', 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP),
('PLATFORM_SUPPORT_EMAIL', 'support@kemkendra.com', 'COMMUNICATION', 'STRING', 'Public support contact email displayed in legal and compliance notices.', 'Appears in system notifications, legal disclaimers, and customer support links.', 'SYSTEM_BOOTSTRAP', CURRENT_TIMESTAMP);

-- Seed Initial Taxonomy
INSERT INTO catalog_taxonomies (id, taxonomy_type, name, code, description, active, display_order, created_at, updated_at) VALUES
(gen_random_uuid(), 'CATEGORY', 'Active Pharmaceutical Ingredients (API)', 'API', 'Active pharmaceutical substances used in pharmaceutical manufacturing', TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'CATEGORY', 'Pharmaceutical Intermediates', 'INTERMEDIATE', 'Chemical compounds produced during chemical synthesis of APIs', TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'CATEGORY', 'Excipients', 'EXCIPIENT', 'Inactive substances serving as the vehicle or medium for a drug', TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'CATEGORY', 'Industrial & Laboratory Solvents', 'SOLVENT', 'Substances that dissolve a solute resulting in a solution', TRUE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'CATEGORY', 'Specialty Chemicals', 'SPECIALTY_CHEMICAL', 'Chemical products providing a wide variety of effects upon which many other industries rely', TRUE, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'CATEGORY', 'Laboratory Reagents & Chemicals', 'LAB_CHEMICAL', 'Chemical substances with high degree of purity for analytical testing', TRUE, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'GRADE', 'USP Grade (United States Pharmacopeia)', 'USP', 'Meets the standards of the United States Pharmacopeia', TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'GRADE', 'EP / Ph. Eur. Grade (European Pharmacopoeia)', 'EP', 'Meets the standards of the European Pharmacopoeia', TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'GRADE', 'IP Grade (Indian Pharmacopoeia)', 'IP', 'Meets the standards of the Indian Pharmacopoeia', TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'GRADE', 'Analytical Reagent (AR Grade)', 'AR', 'High chemical purity suited for analytical laboratory use', TRUE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'GRADE', 'Technical / Industrial Grade', 'TECH', 'Commercial grade intended for industrial manufacturing processes', TRUE, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'PACKAGING', 'HDPE Drum (25 kg / 50 kg)', 'HDPE_DRUM', 'High-density polyethylene sealed drum', TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'PACKAGING', 'Fiber Drum (25 kg)', 'FIBER_DRUM', 'Fiberboard drum with inner polyethylene liner', TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'PACKAGING', 'IBC Tote (1000 Liters / 1000 kg)', 'IBC_TOTE', 'Intermediate bulk container for liquid and granular chemicals', TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'PACKAGING', 'ISO Tank Container (20,000 Liters)', 'ISO_TANK', 'Intermodal container for bulk liquids', TRUE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'PACKAGING', 'Multi-wall Paper Bag (25 kg)', 'PAPER_BAG', 'Multi-ply craft paper bag with moisture barrier liner', TRUE, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'UNIT', 'Kilograms (kg)', 'KG', 'Mass metric kilogram unit', TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'UNIT', 'Metric Tons (MT)', 'MT', 'Metric ton (1,000 kg)', TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'UNIT', 'Liters (L)', 'L', 'Liquid volume liter unit', TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'UNIT', 'Grams (g)', 'G', 'Mass metric gram unit', TRUE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
