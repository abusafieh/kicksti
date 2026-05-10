/*
  # Create users profile table

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, not null)
      - `display_name` (text, not null)
      - `country` (text, not null)
      - `favourite_team` (text, not null)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `users` table
    - Authenticated users can read all users (for leaderboards)
    - Users can insert and update their own profile
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  country text NOT NULL,
  favourite_team text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
