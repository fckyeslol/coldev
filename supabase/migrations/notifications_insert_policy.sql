-- Allow authenticated users to insert notifications where they are the actor.
-- (read/update policies for own notifications already exist in schema.sql.)
DROP POLICY IF EXISTS "Users insert notifications they cause" ON notifications;
CREATE POLICY "Users insert notifications they cause"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- Don't notify yourself about your own actions.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_no_self;
ALTER TABLE notifications ADD CONSTRAINT notifications_no_self
  CHECK (user_id <> actor_id);

NOTIFY pgrst, 'reload schema';
