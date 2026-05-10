/*
  # Add knockout stage columns to matches table

  1. Modified Tables
    - `matches`
      - `et_home_score` (integer, extra time home score)
      - `et_away_score` (integer, extra time away score)
      - `et_home_score_ht` (integer, extra time first half home score)
      - `et_away_score_ht` (integer, extra time first half away score)
      - `pen_home_score` (integer, penalty shootout home score)
      - `pen_away_score` (integer, penalty shootout away score)
      - `match_type` (text, 'group' or 'knockout', default 'group')

  2. Notes
    - These columns support knockout stage match results
    - match_type distinguishes scoring rules applied
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'et_home_score'
  ) THEN
    ALTER TABLE matches ADD COLUMN et_home_score integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'et_away_score'
  ) THEN
    ALTER TABLE matches ADD COLUMN et_away_score integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'et_home_score_ht'
  ) THEN
    ALTER TABLE matches ADD COLUMN et_home_score_ht integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'et_away_score_ht'
  ) THEN
    ALTER TABLE matches ADD COLUMN et_away_score_ht integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'pen_home_score'
  ) THEN
    ALTER TABLE matches ADD COLUMN pen_home_score integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'pen_away_score'
  ) THEN
    ALTER TABLE matches ADD COLUMN pen_away_score integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'match_type'
  ) THEN
    ALTER TABLE matches ADD COLUMN match_type text DEFAULT 'group';
  END IF;
END $$;
