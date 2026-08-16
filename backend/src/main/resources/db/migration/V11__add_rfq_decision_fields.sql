ALTER TABLE rfqs
ADD COLUMN accepted_quotation_id UUID REFERENCES quotations(id);

CREATE INDEX idx_rfqs_accepted_quotation ON rfqs(accepted_quotation_id);
