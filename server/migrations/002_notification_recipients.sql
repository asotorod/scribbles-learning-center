-- =============================================
-- NOTIFICATION RECIPIENTS & ENHANCEMENTS
-- =============================================

-- Track which parents receive which notifications
CREATE TABLE IF NOT EXISTS notification_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_recip_parent ON notification_recipients(parent_id);
CREATE INDEX IF NOT EXISTS idx_notif_recip_notification ON notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_recip_unread ON notification_recipients(parent_id) WHERE read_at IS NULL;

-- Add sender tracking and target type to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES users(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) DEFAULT 'all';
