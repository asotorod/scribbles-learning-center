-- =============================================
-- PREPARE FK CONSTRAINTS FOR ACCOUNT DELETION
-- =============================================
-- Ensures DELETE FROM users WHERE id = $1 cascades cleanly
-- without blocking on foreign key violations.

-- Messages: CASCADE delete when user is deleted
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_recipient_id_fkey
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;

-- Absences: SET NULL when parent is deleted (preserve absence history)
ALTER TABLE absences DROP CONSTRAINT IF EXISTS absences_reported_by_fkey;
ALTER TABLE absences ADD CONSTRAINT absences_reported_by_fkey
  FOREIGN KEY (reported_by) REFERENCES parents(id) ON DELETE SET NULL;

ALTER TABLE absences DROP CONSTRAINT IF EXISTS absences_acknowledged_by_fkey;
ALTER TABLE absences ADD CONSTRAINT absences_acknowledged_by_fkey
  FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL;

-- Child check-ins: SET NULL when parent is deleted (preserve attendance history)
ALTER TABLE child_checkins DROP CONSTRAINT IF EXISTS child_checkins_checked_in_by_parent_id_fkey;
ALTER TABLE child_checkins ADD CONSTRAINT child_checkins_checked_in_by_parent_id_fkey
  FOREIGN KEY (checked_in_by_parent_id) REFERENCES parents(id) ON DELETE SET NULL;

ALTER TABLE child_checkins DROP CONSTRAINT IF EXISTS child_checkins_checked_out_by_parent_id_fkey;
ALTER TABLE child_checkins ADD CONSTRAINT child_checkins_checked_out_by_parent_id_fkey
  FOREIGN KEY (checked_out_by_parent_id) REFERENCES parents(id) ON DELETE SET NULL;

-- Notifications: SET NULL when sender user is deleted
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_sent_by_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_sent_by_fkey
  FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL;
