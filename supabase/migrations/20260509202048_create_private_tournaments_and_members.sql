/*
  # Create private tournaments and members tables

  1. New Tables
    - `private_tournaments`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `creator_id` (uuid, references users)
      - `invite_code` (text, unique, 6 characters)
      - `created_at` (timestamptz)
    - `tournament_members`
      - `id` (uuid, primary key)
      - `tournament_id` (uuid, references private_tournaments)
      - `user_id` (uuid, references users)
      - `joined_at` (timestamptz)
  2. Security
    - Enable RLS on both tables
    - Members can read tournaments and members
    - Authenticated users can create/join tournaments
*/

CREATE TABLE IF NOT EXISTS private_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournament_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES private_tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE private_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read any tournament"
  ON private_tournaments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tournaments"
  ON private_tournaments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Members can read tournament members"
  ON tournament_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournament_members tm
      WHERE tm.tournament_id = tournament_members.tournament_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join tournaments"
  ON tournament_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave tournaments"
  ON tournament_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_tournament_members_tournament ON tournament_members(tournament_id);
CREATE INDEX idx_tournament_members_user ON tournament_members(user_id);
