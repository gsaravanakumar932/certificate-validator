-- CertIntel database schema (PostgreSQL)
-- Separate from code; use when enabling DB persistence.

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY,
  common_name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
  key_type TEXT NOT NULL,
  key_size INTEGER NOT NULL,
  signature_algorithm TEXT NOT NULL,
  environment TEXT NOT NULL,
  location TEXT NOT NULL,
  domain TEXT,
  ip TEXT,
  port INTEGER,
  san TEXT[],
  tls_version TEXT,
  chain_trusted BOOLEAN,
  fingerprint_sha256 TEXT,
  source TEXT NOT NULL,
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  risk_score INTEGER,
  compliance_status TEXT
);

CREATE TABLE IF NOT EXISTS scan_targets (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  target TEXT NOT NULL,
  port INTEGER,
  environment TEXT NOT NULL,
  tags TEXT[]
);

CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE,
  target_id UUID REFERENCES scan_targets(id),
  found_certificate_ids UUID[]
);

CREATE TABLE IF NOT EXISTS compliance_policies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  min_key_size INTEGER NOT NULL,
  allowed_key_types TEXT[] NOT NULL,
  allowed_signature_algorithms TEXT[] NOT NULL,
  min_tls_version TEXT
);

CREATE TABLE IF NOT EXISTS certificate_issues (
  id UUID PRIMARY KEY,
  certificate_id UUID REFERENCES certificates(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  certificate_id UUID REFERENCES certificates(id),
  type TEXT NOT NULL,
  details JSONB
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  period TEXT NOT NULL, -- daily, weekly
  summary JSONB NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_valid_to ON certificates(valid_to);
CREATE INDEX IF NOT EXISTS idx_certificates_common_name ON certificates(common_name);
CREATE INDEX IF NOT EXISTS idx_certificates_issuer ON certificates(issuer);
CREATE INDEX IF NOT EXISTS idx_alerts_certificate_id ON alerts(certificate_id);
