-- NIST CSF Compliance: Audit logging, account lockout, and session tracking

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user_created ON audit_log (user_id, created_at);
CREATE INDEX idx_audit_log_action ON audit_log (action);

-- Add security columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP NULL;
