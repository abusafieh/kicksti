import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_PASSWORD = "kicksti2026admin";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { match_id, home_score, away_score, admin_password } = await req.json();

    if (admin_password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update match score and status
    const { error: matchError } = await supabase
      .from("matches")
      .update({
        home_score,
        away_score,
        status: "finished",
      })
      .eq("id", match_id);

    if (matchError) {
      return new Response(JSON.stringify({ error: matchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate points for all predictions on this match
    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", match_id);

    if (predictions) {
      for (const pred of predictions) {
        const points = calculatePoints(
          pred.predicted_home_score,
          pred.predicted_away_score,
          home_score,
          away_score
        );

        await supabase
          .from("predictions")
          .update({ points_awarded: points, locked: true })
          .eq("id", pred.id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  let points = 0;

  // Correct result (W/D/L)
  const predResult = Math.sign(predHome - predAway);
  const actualResult = Math.sign(actualHome - actualAway);
  if (predResult === actualResult) {
    points += 3;
  }

  // Exact scoreline
  if (predHome === actualHome && predAway === actualAway) {
    points += 5;
  }

  // One team score correct
  if (predHome === actualHome && predAway !== actualAway) {
    points += 2;
  } else if (predAway === actualAway && predHome !== actualHome) {
    points += 2;
  }

  return points;
}
