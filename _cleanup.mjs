import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cizpxewcjuysfdjxbmzo.supabase.co',
  'sb_secret_W3DvEmx5jTOC3unTbTRVZw_q8RZn6Uv'
);

const MATCHES = [
  // Group A
  { home_team:'Mexico', away_team:'South Africa', group_name:'A', match_date:'2026-06-11', kickoff_time:'2026-06-11T21:00:00Z', status:'upcoming' },
  { home_team:'South Korea', away_team:'Czechia', group_name:'A', match_date:'2026-06-11', kickoff_time:'2026-06-12T04:00:00Z', status:'upcoming' },
  { home_team:'Czechia', away_team:'South Africa', group_name:'A', match_date:'2026-06-18', kickoff_time:'2026-06-18T17:00:00Z', status:'upcoming' },
  { home_team:'Mexico', away_team:'South Korea', group_name:'A', match_date:'2026-06-18', kickoff_time:'2026-06-19T03:00:00Z', status:'upcoming' },
  { home_team:'Czechia', away_team:'Mexico', group_name:'A', match_date:'2026-06-24', kickoff_time:'2026-06-25T03:00:00Z', status:'upcoming' },
  { home_team:'South Africa', away_team:'South Korea', group_name:'A', match_date:'2026-06-24', kickoff_time:'2026-06-25T03:00:00Z', status:'upcoming' },
  // Group B
  { home_team:'Canada', away_team:'Bosnia and Herzegovina', group_name:'B', match_date:'2026-06-12', kickoff_time:'2026-06-12T20:00:00Z', status:'upcoming' },
  { home_team:'Qatar', away_team:'Switzerland', group_name:'B', match_date:'2026-06-13', kickoff_time:'2026-06-13T23:00:00Z', status:'upcoming' },
  { home_team:'Switzerland', away_team:'Bosnia and Herzegovina', group_name:'B', match_date:'2026-06-18', kickoff_time:'2026-06-18T23:00:00Z', status:'upcoming' },
  { home_team:'Canada', away_team:'Qatar', group_name:'B', match_date:'2026-06-18', kickoff_time:'2026-06-19T02:00:00Z', status:'upcoming' },
  { home_team:'Switzerland', away_team:'Canada', group_name:'B', match_date:'2026-06-24', kickoff_time:'2026-06-24T23:00:00Z', status:'upcoming' },
  { home_team:'Bosnia and Herzegovina', away_team:'Qatar', group_name:'B', match_date:'2026-06-24', kickoff_time:'2026-06-24T23:00:00Z', status:'upcoming' },
  // Group C
  { home_team:'Brazil', away_team:'Morocco', group_name:'C', match_date:'2026-06-13', kickoff_time:'2026-06-13T23:00:00Z', status:'upcoming' },
  { home_team:'Haiti', away_team:'Scotland', group_name:'C', match_date:'2026-06-13', kickoff_time:'2026-06-14T02:00:00Z', status:'upcoming' },
  { home_team:'Scotland', away_team:'Morocco', group_name:'C', match_date:'2026-06-19', kickoff_time:'2026-06-19T23:00:00Z', status:'upcoming' },
  { home_team:'Brazil', away_team:'Haiti', group_name:'C', match_date:'2026-06-19', kickoff_time:'2026-06-20T02:00:00Z', status:'upcoming' },
  { home_team:'Scotland', away_team:'Brazil', group_name:'C', match_date:'2026-06-24', kickoff_time:'2026-06-24T23:00:00Z', status:'upcoming' },
  { home_team:'Morocco', away_team:'Haiti', group_name:'C', match_date:'2026-06-24', kickoff_time:'2026-06-24T23:00:00Z', status:'upcoming' },
  // Group D
  { home_team:'USA', away_team:'Paraguay', group_name:'D', match_date:'2026-06-12', kickoff_time:'2026-06-13T05:00:00Z', status:'upcoming' },
  { home_team:'Australia', away_team:'Türkiye', group_name:'D', match_date:'2026-06-13', kickoff_time:'2026-06-14T08:00:00Z', status:'upcoming' },
  { home_team:'USA', away_team:'Australia', group_name:'D', match_date:'2026-06-19', kickoff_time:'2026-06-19T23:00:00Z', status:'upcoming' },
  { home_team:'Türkiye', away_team:'Paraguay', group_name:'D', match_date:'2026-06-19', kickoff_time:'2026-06-20T08:00:00Z', status:'upcoming' },
  { home_team:'Türkiye', away_team:'USA', group_name:'D', match_date:'2026-06-25', kickoff_time:'2026-06-26T06:00:00Z', status:'upcoming' },
  { home_team:'Paraguay', away_team:'Australia', group_name:'D', match_date:'2026-06-25', kickoff_time:'2026-06-26T06:00:00Z', status:'upcoming' },
  // Group E
  { home_team:'Germany', away_team:'Curaçao', group_name:'E', match_date:'2026-06-14', kickoff_time:'2026-06-14T19:00:00Z', status:'upcoming' },
  { home_team:'Ivory Coast', away_team:'Ecuador', group_name:'E', match_date:'2026-06-14', kickoff_time:'2026-06-15T00:00:00Z', status:'upcoming' },
  { home_team:'Germany', away_team:'Ivory Coast', group_name:'E', match_date:'2026-06-20', kickoff_time:'2026-06-20T21:00:00Z', status:'upcoming' },
  { home_team:'Ecuador', away_team:'Curaçao', group_name:'E', match_date:'2026-06-20', kickoff_time:'2026-06-21T04:00:00Z', status:'upcoming' },
  { home_team:'Ecuador', away_team:'Germany', group_name:'E', match_date:'2026-06-25', kickoff_time:'2026-06-25T21:00:00Z', status:'upcoming' },
  { home_team:'Curaçao', away_team:'Ivory Coast', group_name:'E', match_date:'2026-06-25', kickoff_time:'2026-06-25T21:00:00Z', status:'upcoming' },
  // Group F
  { home_team:'Netherlands', away_team:'Japan', group_name:'F', match_date:'2026-06-14', kickoff_time:'2026-06-14T22:00:00Z', status:'upcoming' },
  { home_team:'Sweden', away_team:'Tunisia', group_name:'F', match_date:'2026-06-14', kickoff_time:'2026-06-15T04:00:00Z', status:'upcoming' },
  { home_team:'Netherlands', away_team:'Sweden', group_name:'F', match_date:'2026-06-20', kickoff_time:'2026-06-20T19:00:00Z', status:'upcoming' },
  { home_team:'Tunisia', away_team:'Japan', group_name:'F', match_date:'2026-06-20', kickoff_time:'2026-06-21T06:00:00Z', status:'upcoming' },
  { home_team:'Japan', away_team:'Sweden', group_name:'F', match_date:'2026-06-25', kickoff_time:'2026-06-26T01:00:00Z', status:'upcoming' },
  { home_team:'Tunisia', away_team:'Netherlands', group_name:'F', match_date:'2026-06-25', kickoff_time:'2026-06-26T01:00:00Z', status:'upcoming' },
  // Group G
  { home_team:'Belgium', away_team:'Egypt', group_name:'G', match_date:'2026-06-15', kickoff_time:'2026-06-15T23:00:00Z', status:'upcoming' },
  { home_team:'Iran', away_team:'New Zealand', group_name:'G', match_date:'2026-06-15', kickoff_time:'2026-06-16T05:00:00Z', status:'upcoming' },
  { home_team:'Belgium', away_team:'Iran', group_name:'G', match_date:'2026-06-21', kickoff_time:'2026-06-21T23:00:00Z', status:'upcoming' },
  { home_team:'New Zealand', away_team:'Egypt', group_name:'G', match_date:'2026-06-21', kickoff_time:'2026-06-22T05:00:00Z', status:'upcoming' },
  { home_team:'Egypt', away_team:'Iran', group_name:'G', match_date:'2026-06-26', kickoff_time:'2026-06-27T07:00:00Z', status:'upcoming' },
  { home_team:'New Zealand', away_team:'Belgium', group_name:'G', match_date:'2026-06-26', kickoff_time:'2026-06-27T07:00:00Z', status:'upcoming' },
  // Group H
  { home_team:'Spain', away_team:'Cape Verde', group_name:'H', match_date:'2026-06-15', kickoff_time:'2026-06-15T17:00:00Z', status:'upcoming' },
  { home_team:'Saudi Arabia', away_team:'Uruguay', group_name:'H', match_date:'2026-06-15', kickoff_time:'2026-06-15T23:00:00Z', status:'upcoming' },
  { home_team:'Spain', away_team:'Saudi Arabia', group_name:'H', match_date:'2026-06-21', kickoff_time:'2026-06-21T17:00:00Z', status:'upcoming' },
  { home_team:'Uruguay', away_team:'Cape Verde', group_name:'H', match_date:'2026-06-21', kickoff_time:'2026-06-21T23:00:00Z', status:'upcoming' },
  { home_team:'Cape Verde', away_team:'Saudi Arabia', group_name:'H', match_date:'2026-06-26', kickoff_time:'2026-06-27T02:00:00Z', status:'upcoming' },
  { home_team:'Uruguay', away_team:'Spain', group_name:'H', match_date:'2026-06-26', kickoff_time:'2026-06-27T02:00:00Z', status:'upcoming' },
  // Group I
  { home_team:'France', away_team:'Senegal', group_name:'I', match_date:'2026-06-16', kickoff_time:'2026-06-16T20:00:00Z', status:'upcoming' },
  { home_team:'Iraq', away_team:'Norway', group_name:'I', match_date:'2026-06-16', kickoff_time:'2026-06-16T23:00:00Z', status:'upcoming' },
  { home_team:'France', away_team:'Iraq', group_name:'I', match_date:'2026-06-22', kickoff_time:'2026-06-22T22:00:00Z', status:'upcoming' },
  { home_team:'Norway', away_team:'Senegal', group_name:'I', match_date:'2026-06-22', kickoff_time:'2026-06-23T01:00:00Z', status:'upcoming' },
  { home_team:'Norway', away_team:'France', group_name:'I', match_date:'2026-06-26', kickoff_time:'2026-06-26T20:00:00Z', status:'upcoming' },
  { home_team:'Senegal', away_team:'Iraq', group_name:'I', match_date:'2026-06-26', kickoff_time:'2026-06-26T20:00:00Z', status:'upcoming' },
  // Group J
  { home_team:'Argentina', away_team:'Algeria', group_name:'J', match_date:'2026-06-16', kickoff_time:'2026-06-17T03:00:00Z', status:'upcoming' },
  { home_team:'Austria', away_team:'Jordan', group_name:'J', match_date:'2026-06-16', kickoff_time:'2026-06-17T08:00:00Z', status:'upcoming' },
  { home_team:'Argentina', away_team:'Austria', group_name:'J', match_date:'2026-06-22', kickoff_time:'2026-06-22T19:00:00Z', status:'upcoming' },
  { home_team:'Jordan', away_team:'Algeria', group_name:'J', match_date:'2026-06-22', kickoff_time:'2026-06-23T07:00:00Z', status:'upcoming' },
  { home_team:'Algeria', away_team:'Austria', group_name:'J', match_date:'2026-06-27', kickoff_time:'2026-06-28T04:00:00Z', status:'upcoming' },
  { home_team:'Jordan', away_team:'Argentina', group_name:'J', match_date:'2026-06-27', kickoff_time:'2026-06-28T04:00:00Z', status:'upcoming' },
  // Group K
  { home_team:'Portugal', away_team:'DR Congo', group_name:'K', match_date:'2026-06-17', kickoff_time:'2026-06-17T19:00:00Z', status:'upcoming' },
  { home_team:'Uzbekistan', away_team:'Colombia', group_name:'K', match_date:'2026-06-17', kickoff_time:'2026-06-18T04:00:00Z', status:'upcoming' },
  { home_team:'Portugal', away_team:'Uzbekistan', group_name:'K', match_date:'2026-06-23', kickoff_time:'2026-06-23T19:00:00Z', status:'upcoming' },
  { home_team:'Colombia', away_team:'DR Congo', group_name:'K', match_date:'2026-06-23', kickoff_time:'2026-06-24T04:00:00Z', status:'upcoming' },
  { home_team:'Colombia', away_team:'Portugal', group_name:'K', match_date:'2026-06-27', kickoff_time:'2026-06-27T23:30:00Z', status:'upcoming' },
  { home_team:'DR Congo', away_team:'Uzbekistan', group_name:'K', match_date:'2026-06-27', kickoff_time:'2026-06-27T23:30:00Z', status:'upcoming' },
  // Group L
  { home_team:'England', away_team:'Croatia', group_name:'L', match_date:'2026-06-17', kickoff_time:'2026-06-17T22:00:00Z', status:'upcoming' },
  { home_team:'Ghana', away_team:'Panama', group_name:'L', match_date:'2026-06-17', kickoff_time:'2026-06-18T00:00:00Z', status:'upcoming' },
  { home_team:'England', away_team:'Ghana', group_name:'L', match_date:'2026-06-23', kickoff_time:'2026-06-23T21:00:00Z', status:'upcoming' },
  { home_team:'Panama', away_team:'Croatia', group_name:'L', match_date:'2026-06-23', kickoff_time:'2026-06-24T00:00:00Z', status:'upcoming' },
  { home_team:'Panama', away_team:'England', group_name:'L', match_date:'2026-06-27', kickoff_time:'2026-06-27T22:00:00Z', status:'upcoming' },
  { home_team:'Croatia', away_team:'Ghana', group_name:'L', match_date:'2026-06-27', kickoff_time:'2026-06-27T22:00:00Z', status:'upcoming' },
];

async function run() {
  console.log('Step 1: Delete bracket_predictions...');
  const { error: e1 } = await supabase.from('bracket_predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e1) { console.error('  ERROR:', e1.message); process.exit(1); }
  console.log('  Done.');

  console.log('Step 2: Delete predictions...');
  const { error: e2 } = await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e2) { console.error('  ERROR:', e2.message); process.exit(1); }
  console.log('  Done.');

  console.log('Step 3: Delete all matches...');
  const { error: e3 } = await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e3) { console.error('  ERROR:', e3.message); process.exit(1); }
  console.log('  Done.');

  console.log('Step 4: Insert 72 correct matches...');
  const { data, error: e4 } = await supabase.from('matches').insert(MATCHES).select('id');
  if (e4) { console.error('  ERROR:', e4.message); process.exit(1); }
  console.log(`  Inserted ${data.length} matches.`);

  console.log('Step 5: Verify final count...');
  const { count, error: e5 } = await supabase.from('matches').select('*', { count: 'exact', head: true });
  if (e5) { console.error('  ERROR:', e5.message); process.exit(1); }
  console.log(`  Final match count: ${count}`);

  if (count === 72) {
    console.log('\nDone. Database is clean.');
  } else {
    console.error(`\nWARNING: Expected 72, got ${count}`);
  }
}

run();
