-- [Company] Security — PostgreSQL schema
CREATE TABLE IF NOT EXISTS enquiries (
  enquiry_id          SERIAL PRIMARY KEY,
  reference           TEXT UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name           TEXT NOT NULL,
  company_name        TEXT,
  email               TEXT NOT NULL,
  phone               TEXT,
  country             TEXT,
  industry            TEXT,
  company_size        TEXT,
  service             TEXT,
  contact_method      TEXT,
  meeting_date        TEXT,
  budget              TEXT,
  timeline            TEXT,
  project_description TEXT,
  source              TEXT DEFAULT 'enquiry',
  ip                  TEXT,
  status              TEXT NOT NULL DEFAULT 'New'
);
CREATE INDEX IF NOT EXISTS idx_enquiries_status  ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at);

CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
