-- Migration 004: Emergency Contacts table + authorized_pickups parent_id
-- Adds multi-entry emergency contacts per child and tracks which parent added authorized pickups

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_child ON emergency_contacts(child_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_parent ON emergency_contacts(parent_id);

-- Add parent_id to authorized_pickups to track which parent added each pickup
ALTER TABLE authorized_pickups ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES parents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_authorized_pickups_parent ON authorized_pickups(parent_id);
CREATE INDEX IF NOT EXISTS idx_authorized_pickups_child ON authorized_pickups(child_id);

-- Migrate existing single emergency contacts from children table into new table
-- Uses the primary parent for each child as the parent_id
INSERT INTO emergency_contacts (child_id, parent_id, name, phone, is_primary)
SELECT DISTINCT ON (c.id)
    c.id,
    pc.parent_id,
    c.emergency_contact_name,
    c.emergency_contact_phone,
    true
FROM children c
JOIN parent_children pc ON c.id = pc.child_id AND pc.is_primary_contact = true
WHERE c.emergency_contact_name IS NOT NULL
  AND c.emergency_contact_name != ''
  AND c.emergency_contact_phone IS NOT NULL
  AND c.emergency_contact_phone != ''
  AND NOT EXISTS (
    SELECT 1 FROM emergency_contacts ec WHERE ec.child_id = c.id
  );
