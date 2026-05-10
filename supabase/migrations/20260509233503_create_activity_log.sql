/*
  # Create activity log table

  1. New Tables
    - `activity_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users, nullable for anonymous actions)
      - `action` (text, not null) - the action type (signup, prediction, rate_limited, suspicious)
      - `metadata` (jsonb) - additional context about the action
      - `ip_address` (text) - the IP address of the request
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `activity_log` table
    - Only service_role can insert and read activity logs
    - No user-facing access
*/

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert activity logs"
  ON activity_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read activity logs"
  ON activity_log FOR SELECT
  TO service_role
  USING (true);
