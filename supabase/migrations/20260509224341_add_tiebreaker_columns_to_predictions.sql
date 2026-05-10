/*
  # Add tiebreaker columns to predictions table

  1. Modified Tables
    - `predictions`
      - `exact_score_points` (numeric, default 0) - 1 if exact scoreline, 0.5 if one team correct
      - `half_predictions_correct` (integer, default 0) - count of correct half/ET half predictions

  2. Notes
    - These fields are used for leaderboard tiebreaker calculations
    - Populated by the calculate-scores edge function
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'predictions' AND column_name = 'exact_score_points'
  ) THEN
    ALTER TABLE predictions ADD COLUMN exact_score_points numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'predictions' AND column_name = 'half_predictions_correct'
  ) THEN
    ALTER TABLE predictions ADD COLUMN half_predictions_correct integer DEFAULT 0;
  END IF;
END $$;
