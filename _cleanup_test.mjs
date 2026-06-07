import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cizpxewcjuysfdjxbmzo.supabase.co',
  'sb_secret_W3DvEmx5jTOC3unTbTRVZw_q8RZn6Uv'
);

async function run() {
  // Verify connection
  const { count, error: countErr } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true });
  if (countErr) { console.error('Count error:', countErr.message); process.exit(1); }
  console.log(`Current match count: ${count}`);
}

run();
