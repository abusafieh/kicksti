/*
  # Reseed World Cup 2026 matches with official fixtures

  1. Changes
    - Clears all existing predictions, bracket predictions, and matches
    - Reseeds with official FIFA World Cup 2026 group stage fixtures (72 matches across 12 groups)
    - All kickoff times in UTC

  2. Groups
    - A: Mexico, South Africa, South Korea, Czechia
    - B: Canada, Bosnia and Herzegovina, Qatar, Switzerland
    - C: Brazil, Morocco, Haiti, Scotland
    - D: USA, Paraguay, Australia, Türkiye
    - E: Germany, Curaçao, Ivory Coast, Ecuador
    - F: Netherlands, Japan, Sweden, Tunisia
    - G: Belgium, Egypt, Iran, New Zealand
    - H: Spain, Cape Verde, Saudi Arabia, Uruguay
    - I: France, Senegal, Iraq, Norway
    - J: Argentina, Algeria, Austria, Jordan
    - K: Portugal, DR Congo, Uzbekistan, Colombia
    - L: England, Croatia, Ghana, Panama

  3. Important Notes
    - This is a destructive migration that removes all prior prediction data
    - Required to correct incorrect team/group data from initial seed
*/

DELETE FROM predictions;
DELETE FROM bracket_predictions;
DELETE FROM matches;

-- Group A: Mexico, South Africa, South Korea, Czechia
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('Mexico', 'South Africa', 'A', '2026-06-11', '2026-06-11T21:00:00Z', 'upcoming'),
('South Korea', 'Czechia', 'A', '2026-06-11', '2026-06-12T04:00:00Z', 'upcoming'),
('Czechia', 'South Africa', 'A', '2026-06-18', '2026-06-18T17:00:00Z', 'upcoming'),
('Mexico', 'South Korea', 'A', '2026-06-18', '2026-06-19T03:00:00Z', 'upcoming'),
('Czechia', 'Mexico', 'A', '2026-06-24', '2026-06-25T03:00:00Z', 'upcoming'),
('South Africa', 'South Korea', 'A', '2026-06-24', '2026-06-25T03:00:00Z', 'upcoming');

-- Group B: Canada, Bosnia and Herzegovina, Qatar, Switzerland
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('Canada', 'Bosnia and Herzegovina', 'B', '2026-06-12', '2026-06-12T20:00:00Z', 'upcoming'),
('Qatar', 'Switzerland', 'B', '2026-06-13', '2026-06-13T23:00:00Z', 'upcoming'),
('Switzerland', 'Bosnia and Herzegovina', 'B', '2026-06-18', '2026-06-18T23:00:00Z', 'upcoming'),
('Canada', 'Qatar', 'B', '2026-06-18', '2026-06-19T02:00:00Z', 'upcoming'),
('Switzerland', 'Canada', 'B', '2026-06-24', '2026-06-24T23:00:00Z', 'upcoming'),
('Bosnia and Herzegovina', 'Qatar', 'B', '2026-06-24', '2026-06-24T23:00:00Z', 'upcoming');

-- Group C: Brazil, Morocco, Haiti, Scotland
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('Brazil', 'Morocco', 'C', '2026-06-13', '2026-06-13T23:00:00Z', 'upcoming'),
('Haiti', 'Scotland', 'C', '2026-06-13', '2026-06-14T02:00:00Z', 'upcoming'),
('Scotland', 'Morocco', 'C', '2026-06-19', '2026-06-19T23:00:00Z', 'upcoming'),
('Brazil', 'Haiti', 'C', '2026-06-19', '2026-06-20T02:00:00Z', 'upcoming'),
('Scotland', 'Brazil', 'C', '2026-06-24', '2026-06-24T23:00:00Z', 'upcoming'),
('Morocco', 'Haiti', 'C', '2026-06-24', '2026-06-24T23:00:00Z', 'upcoming');

-- Group D: USA, Paraguay, Australia, Türkiye
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('USA', 'Paraguay', 'D', '2026-06-12', '2026-06-13T05:00:00Z', 'upcoming'),
('Australia', 'Türkiye', 'D', '2026-06-13', '2026-06-14T08:00:00Z', 'upcoming'),
('USA', 'Australia', 'D', '2026-06-19', '2026-06-19T23:00:00Z', 'upcoming'),
('Türkiye', 'Paraguay', 'D', '2026-06-19', '2026-06-20T08:00:00Z', 'upcoming'),
('Türkiye', 'USA', 'D', '2026-06-25', '2026-06-26T06:00:00Z', 'upcoming'),
('Paraguay', 'Australia', 'D', '2026-06-25', '2026-06-26T06:00:00Z', 'upcoming');

-- Group E: Germany, Curaçao, Ivory Coast, Ecuador
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('Germany', 'Curaçao', 'E', '2026-06-14', '2026-06-14T19:00:00Z', 'upcoming'),
('Ivory Coast', 'Ecuador', 'E', '2026-06-14', '2026-06-15T00:00:00Z', 'upcoming'),
('Germany', 'Ivory Coast', 'E', '2026-06-20', '2026-06-20T21:00:00Z', 'upcoming'),
('Ecuador', 'Curaçao', 'E', '2026-06-20', '2026-06-21T04:00:00Z', 'upcoming'),
('Ecuador', 'Germany', 'E', '2026-06-25', '2026-06-25T21:00:00Z', 'upcoming'),
('Curaçao', 'Ivory Coast', 'E', '2026-06-25', '2026-06-25T21:00:00Z', 'upcoming');

-- Group F: Netherlands, Japan, Sweden, Tunisia
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('Netherlands', 'Japan', 'F', '2026-06-14', '2026-06-14T22:00:00Z', 'upcoming'),
('Sweden', 'Tunisia', 'F', '2026-06-14', '2026-06-15T04:00:00Z', 'upcoming'),
('Netherlands', 'Sweden', 'F', '2026-06-20', '2026-06-20T19:00:00Z', 'upcoming'),
('Tunisia', 'Japan', 'F', '2026-06-20', '2026-06-21T06:00:00Z', 'upcoming'),
('Japan', 'Sweden', 'F', '2026-06-25', '2026-06-26T01:00:00Z', 'upcoming'),
('Tunisia', 'Netherlands', 'F', '2026-06-25', '2026-06-26T01:00:00Z', 'upcoming');

-- Group G: Belgium, Egypt, Iran, New Zealand
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('Belgium', 'Egypt', 'G', '2026-06-15', '2026-06-15T23:00:00Z', 'upcoming'),
('Iran', 'New Zealand', 'G', '2026-06-15', '2026-06-16T05:00:00Z', 'upcoming'),
('Belgium', 'Iran', 'G', '2026-06-21', '2026-06-21T23:00:00Z', 'upcoming'),
('New Zealand', 'Egypt', 'G', '2026-06-21', '2026-06-22T05:00:00Z', 'upcoming'),
('Egypt', 'Iran', 'G', '2026-06-26', '2026-06-27T07:00:00Z', 'upcoming'),
('New Zealand', 'Belgium', 'G', '2026-06-26', '2026-06-27T07:00:00Z', 'upcoming');

-- Group H: Spain, Cape Verde, Saudi Arabia, Uruguay
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('Spain', 'Cape Verde', 'H', '2026-06-15', '2026-06-15T17:00:00Z', 'upcoming'),
('Saudi Arabia', 'Uruguay', 'H', '2026-06-15', '2026-06-15T23:00:00Z', 'upcoming'),
('Spain', 'Saudi Arabia', 'H', '2026-06-21', '2026-06-21T17:00:00Z', 'upcoming'),
('Uruguay', 'Cape Verde', 'H', '2026-06-21', '2026-06-21T23:00:00Z', 'upcoming'),
('Cape Verde', 'Saudi Arabia', 'H', '2026-06-26', '2026-06-27T02:00:00Z', 'upcoming'),
('Uruguay', 'Spain', 'H', '2026-06-26', '2026-06-27T02:00:00Z', 'upcoming');

-- Group I: France, Senegal, Iraq, Norway
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('France', 'Senegal', 'I', '2026-06-16', '2026-06-16T20:00:00Z', 'upcoming'),
('Iraq', 'Norway', 'I', '2026-06-16', '2026-06-16T23:00:00Z', 'upcoming'),
('France', 'Iraq', 'I', '2026-06-22', '2026-06-22T22:00:00Z', 'upcoming'),
('Norway', 'Senegal', 'I', '2026-06-22', '2026-06-23T01:00:00Z', 'upcoming'),
('Norway', 'France', 'I', '2026-06-26', '2026-06-26T20:00:00Z', 'upcoming'),
('Senegal', 'Iraq', 'I', '2026-06-26', '2026-06-26T20:00:00Z', 'upcoming');

-- Group J: Argentina, Algeria, Austria, Jordan
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('Argentina', 'Algeria', 'J', '2026-06-16', '2026-06-17T03:00:00Z', 'upcoming'),
('Austria', 'Jordan', 'J', '2026-06-16', '2026-06-17T08:00:00Z', 'upcoming'),
('Argentina', 'Austria', 'J', '2026-06-22', '2026-06-22T19:00:00Z', 'upcoming'),
('Jordan', 'Algeria', 'J', '2026-06-22', '2026-06-23T07:00:00Z', 'upcoming'),
('Algeria', 'Austria', 'J', '2026-06-27', '2026-06-28T04:00:00Z', 'upcoming'),
('Jordan', 'Argentina', 'J', '2026-06-27', '2026-06-28T04:00:00Z', 'upcoming');

-- Group K: Portugal, DR Congo, Uzbekistan, Colombia
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('Portugal', 'DR Congo', 'K', '2026-06-17', '2026-06-17T19:00:00Z', 'upcoming'),
('Uzbekistan', 'Colombia', 'K', '2026-06-17', '2026-06-18T04:00:00Z', 'upcoming'),
('Portugal', 'Uzbekistan', 'K', '2026-06-23', '2026-06-23T19:00:00Z', 'upcoming'),
('Colombia', 'DR Congo', 'K', '2026-06-23', '2026-06-24T04:00:00Z', 'upcoming'),
('Colombia', 'Portugal', 'K', '2026-06-27', '2026-06-27T23:30:00Z', 'upcoming'),
('DR Congo', 'Uzbekistan', 'K', '2026-06-27', '2026-06-27T23:30:00Z', 'upcoming');

-- Group L: England, Croatia, Ghana, Panama
INSERT INTO matches (home_team, away_team, group_name, match_date, kickoff_time, status) VALUES
('England', 'Croatia', 'L', '2026-06-17', '2026-06-17T22:00:00Z', 'upcoming'),
('Ghana', 'Panama', 'L', '2026-06-17', '2026-06-18T00:00:00Z', 'upcoming'),
('England', 'Ghana', 'L', '2026-06-23', '2026-06-23T21:00:00Z', 'upcoming'),
('Panama', 'Croatia', 'L', '2026-06-23', '2026-06-24T00:00:00Z', 'upcoming'),
('Panama', 'England', 'L', '2026-06-27', '2026-06-27T22:00:00Z', 'upcoming'),
('Croatia', 'Ghana', 'L', '2026-06-27', '2026-06-27T22:00:00Z', 'upcoming');
