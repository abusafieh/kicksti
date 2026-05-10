/*
  # Create predictions table

  1. New Tables
    - `predictions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `match_id` (uuid, references matches)
      - `predicted_home_score` (integer, not null)
      - `predicted_away_score` (integer, not null)
      - `locked` (boolean, default false)
      - `points_awarded` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS
    - Users can read their own predictions
    - Users can read all predictions for finished matches (for leaderboard)
    - Users can insert/update own predictions
  3. Indexes
    - Unique constraint on user_id + match_id
*/

CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home_score integer NOT NULL,
  predicted_away_score integer NOT NULL,
  locked boolean DEFAULT false,
  points_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read all predictions for scoring"
  ON predictions FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unlocked predictions"
  ON predictions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND locked = false)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update predictions"
  ON predictions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
