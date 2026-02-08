-- Add photo consent columns to children table for COPPA compliance
ALTER TABLE children
ADD COLUMN IF NOT EXISTS photo_consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_consent_date TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN children.photo_consent_given IS 'Whether parent/guardian has given consent to upload child photos';
COMMENT ON COLUMN children.photo_consent_date IS 'Timestamp when photo consent was given';
