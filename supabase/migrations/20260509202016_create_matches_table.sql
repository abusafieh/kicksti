/*
  # Create matches table

  1. New Tables
    - `matches`
      - `id` (uuid, primary key)
      - `home_team` (text, not null)
      - `away_team` (text, not null)
      - `group_name` (text, not null) - the group letter (A-L)
      - `match_date` (date, not null)
      - `kickoff_time` (timestamptz, not null)
      - `status` (text, default 'upcoming') - upcoming/live/finished
      - `home_score` (integer)
      - `away_score` (integer)
      - `home_score_ht` (integer)
      - `away_score_ht` (integer)
  2. Security
    - Enable RLS
    - All authenticated users can read matches
    - Only service role can insert/update (via edge functions)
*/

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team text NOT NULL,
  away_team text NOT NULL,
  group_name text NOT NULL,
  match_date date NOT NULL,
  kickoff_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  home_score integer,
  away_score integer,
  home_score_ht integer,
  away_score_ht integer
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read matches"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert matches"
  ON matches FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update matches"
  ON matches FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
