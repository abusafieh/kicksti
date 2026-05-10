/*
  # Create bracket predictions table

  1. New Tables
    - `bracket_predictions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `round` (text, e.g. R32, R16, QF, SF, F, 3rd)
      - `position` (integer, match index within round)
      - `ft_home_score` (integer, full time home score)
      - `ft_away_score` (integer, full time away score)
      - `et_home_score` (integer, extra time home score, nullable)
      - `et_away_score` (integer, extra time away score, nullable)
      - `pen_home_score` (integer, penalty home score, nullable)
      - `pen_away_score` (integer, penalty away score, nullable)
      - `home_team` (text, team name at time of saving)
      - `away_team` (text, team name at time of saving)
      - `predicted_winner` (text, computed winner at time of saving)
      - `locked` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `bracket_predictions` table
    - Add policies for authenticated users to read, insert, update their own data
  3. Indexes
    - Index on user_id for fast lookups
*/

CREATE TABLE IF NOT EXISTS bracket_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  round text NOT NULL,
  position integer NOT NULL,
  ft_home_score integer,
  ft_away_score integer,
  et_home_score integer,
  et_away_score integer,
  pen_home_score integer,
  pen_away_score integer,
  home_team text,
  away_team text,
  predicted_winner text,
  locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, round, position)
);

ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bracket predictions"
  ON bracket_predictions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bracket predictions"
  ON bracket_predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bracket predictions"
  ON bracket_predictions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bracket_predictions_user_id ON bracket_predictions(user_id);
