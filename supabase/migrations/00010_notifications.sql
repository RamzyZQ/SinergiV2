-- ============================================================================
-- Migration: 00010_notifications.sql
-- Description: Create notifications table for user notifications
-- ============================================================================

CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jenis        notification_type NOT NULL,                           -- Notification type
  judul        TEXT NOT NULL,                                        -- Title
  pesan        TEXT,                                                 -- Message body
  dibaca       BOOLEAN NOT NULL DEFAULT false,                       -- Read status
  status_kirim notification_send_status NOT NULL DEFAULT 'pending',  -- Delivery status
  retry_count  INTEGER NOT NULL DEFAULT 0,                           -- Number of send retries
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'User notifications for scholarship application events';

-- Composite index: efficiently query unread notifications per user
CREATE INDEX idx_notifications_user_id_dibaca ON notifications(user_id, dibaca);
