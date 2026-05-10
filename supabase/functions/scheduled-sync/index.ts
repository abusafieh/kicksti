import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // To enable scheduled sync in Supabase:
    // 1. Go to Supabase Dashboard > Edge Functions > scheduled-sync
    // 2. Set cron schedule: */5 * * * * (every 5 minutes during tournament)
    // football-data.org free tier allows 10 requests per minute
    // 5 minute intervals keep us safely within limits

    const syncUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-live-scores`;
    const response = await fetch(syncUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scheduled: true }),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
