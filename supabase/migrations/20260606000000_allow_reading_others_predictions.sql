/*
  # Allow viewing other users' predictions

  Enables the "view another player's predictions" feature and fixes the
  leaderboard (which needs to read every user's points).

  Previously authenticated users could only SELECT their own rows in
  `predictions` and `bracket_predictions`. These permissive SELECT policies
  let any authenticated user read all prediction rows (read-only; insert and
  update remain owner-only).
*/

-- Predictions: any authenticated user can read all rows
DROP POLICY IF EXISTS "Authenticated can read all predictions" ON predictions;
CREATE POLICY "Authenticated can read all predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (true);

-- Bracket predictions: any authenticated user can read all rows
DROP POLICY IF EXISTS "Authenticated can read all bracket predictions" ON bracket_predictions;
CREATE POLICY "Authenticated can read all bracket predictions"
  ON bracket_predictions FOR SELECT
  TO authenticated
  USING (true);
