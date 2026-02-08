-- Add Expo push token column to users table for push notifications
ALTER TABLE users
ADD COLUMN IF NOT EXISTS expo_push_token VARCHAR(100);

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_users_expo_push_token ON users(expo_push_token) WHERE expo_push_token IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.expo_push_token IS 'Expo push notification token for mobile app notifications';
