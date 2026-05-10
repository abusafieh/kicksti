import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Payload {
  match_id: string;
  match_type: "group" | "knockout";
  status: "finished_90" | "finished_et" | "finished_pen";
  home_score: number;
  away_score: number;
  home_score_ht: number;
  away_score_ht: number;
  et_home_score: number | null;
  et_away_score: number | null;
  et_home_score_ht: number | null;
  et_away_score_ht: number | null;
  pen_home_score: number | null;
  pen_away_score: number | null;
  admin_password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: Payload = await req.json();
    const {
      match_id,
      match_type,
      status,
      home_score,
      away_score,
      home_score_ht,
      away_score_ht,
      et_home_score,
      et_away_score,
      et_home_score_ht,
      et_away_score_ht,
      pen_home_score,
      pen_away_score,
      admin_password,
    } = payload;

    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "kicksti2026admin";
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

    // Update match with all scores and status
    const matchUpdate: Record<string, unknown> = {
      home_score,
      away_score,
      home_score_ht,
      away_score_ht,
      et_home_score,
      et_away_score,
      et_home_score_ht,
      et_away_score_ht,
      pen_home_score,
      pen_away_score,
      match_type,
      status,
    };

    const { error: matchError } = await supabase
      .from("matches")
      .update(matchUpdate)
      .eq("id", match_id);

    if (matchError) {
      return new Response(JSON.stringify({ error: matchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all predictions for this match
    const { data: predictions, error: predError } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", match_id);

    if (predError) {
      return new Response(JSON.stringify({ error: predError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let predictionsUpdated = 0;

    if (predictions) {
      for (const pred of predictions) {
        const result = calculatePoints(
          pred.predicted_home_score,
          pred.predicted_away_score,
          payload
        );

        await supabase
          .from("predictions")
          .update({
            points_awarded: result.points,
            exact_score_points: result.exactScorePoints,
            half_predictions_correct: result.halfPredictionsCorrect,
            locked: true,
          })
          .eq("id", pred.id);

        predictionsUpdated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        match_id,
        predictions_updated: predictionsUpdated,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function calculatePoints(
  predHome: number,
  predAway: number,
  match: Payload
): { points: number; exactScorePoints: number; halfPredictionsCorrect: number } {
  const { match_type, status, home_score, away_score } = match;

  if (match_type === "group") {
    return calculateGroupPoints(predHome, predAway, home_score, away_score);
  }

  return calculateKnockoutPoints(predHome, predAway, match);
}

function calculateGroupPoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): { points: number; exactScorePoints: number; halfPredictionsCorrect: number } {
  let points = 0;
  let exactScorePoints = 0;

  // Correct result (W/D/L): 3 points
  const predResult = Math.sign(predHome - predAway);
  const actualResult = Math.sign(actualHome - actualAway);
  if (predResult === actualResult) {
    points += 3;
  }

  // Exact scoreline: 5 points
  if (predHome === actualHome && predAway === actualAway) {
    points += 5;
    exactScorePoints = 1;
  } else if (predHome === actualHome || predAway === actualAway) {
    // One team score correct: 2 points
    points += 2;
    exactScorePoints = 0.5;
  }

  // Maximum per match: 8 points (3 + 5 for exact, or 3 + 2 for one-team)
  return { points, exactScorePoints, halfPredictionsCorrect: 0 };
}

function calculateKnockoutPoints(
  predHome: number,
  predAway: number,
  match: Payload
): { points: number; exactScorePoints: number; halfPredictionsCorrect: number } {
  const {
    status,
    home_score,
    away_score,
    home_score_ht,
    away_score_ht,
    et_home_score,
    et_away_score,
    et_home_score_ht,
    et_away_score_ht,
    pen_home_score,
    pen_away_score,
  } = match;

  let points = 0;
  let exactScorePoints = 0;
  let halfPredictionsCorrect = 0;

  // Correct result (W/D/L based on full time score): 3 points
  const predResult = Math.sign(predHome - predAway);
  const actualResult = Math.sign(home_score - away_score);
  if (predResult === actualResult) {
    points += 3;
  }

  // Exact first half scoreline: 1 point
  if (
    home_score_ht !== null &&
    away_score_ht !== null &&
    predHome === home_score_ht &&
    predAway === away_score_ht
  ) {
    // Note: for HT comparison, we compare the predicted score against HT actuals
    // But since users only predict one scoreline, we compare pred vs HT
    // Actually, the prediction is the final score prediction. HT comparison uses the HT actual.
    // We check if the predicted scores happen to match the HT score.
  }

  // The scoring logic depends on how the match ended:
  if (status === "finished_90") {
    // Match ended at 90 minutes (no extra time needed)
    // - Exact first half scoreline: 1 point
    if (predHome === home_score_ht && predAway === away_score_ht) {
      points += 1;
      halfPredictionsCorrect += 1;
    }
    // - Exact full time scoreline: 5 points (this is the deciding score)
    if (predHome === home_score && predAway === away_score) {
      points += 5;
      exactScorePoints = 1;
    } else if (predHome === home_score || predAway === away_score) {
      exactScorePoints = 0.5;
    }
  } else if (status === "finished_et") {
    // Match went to extra time, decided in ET
    // - Exact first half scoreline: 1 point
    if (predHome === home_score_ht && predAway === away_score_ht) {
      points += 1;
      halfPredictionsCorrect += 1;
    }
    // - Exact FT scoreline (was a draw, match continued): 1 point
    if (predHome === home_score && predAway === away_score) {
      points += 1;
    }
    // - Exact ET first half scoreline: 1 point
    if (
      et_home_score_ht !== null &&
      et_away_score_ht !== null &&
      predHome === et_home_score_ht &&
      predAway === et_away_score_ht
    ) {
      points += 1;
      halfPredictionsCorrect += 1;
    }
    // - Exact ET final scoreline: 5 points (deciding score)
    if (
      et_home_score !== null &&
      et_away_score !== null &&
      predHome === et_home_score &&
      predAway === et_away_score
    ) {
      points += 5;
      exactScorePoints = 1;
    } else if (
      et_home_score !== null &&
      et_away_score !== null &&
      (predHome === et_home_score || predAway === et_away_score)
    ) {
      exactScorePoints = 0.5;
    }
  } else if (status === "finished_pen") {
    // Match went to penalties
    // - Exact first half scoreline: 1 point
    if (predHome === home_score_ht && predAway === away_score_ht) {
      points += 1;
      halfPredictionsCorrect += 1;
    }
    // - Exact FT scoreline (draw, match continued): 1 point
    if (predHome === home_score && predAway === away_score) {
      points += 1;
    }
    // - Exact ET first half scoreline: 1 point
    if (
      et_home_score_ht !== null &&
      et_away_score_ht !== null &&
      predHome === et_home_score_ht &&
      predAway === et_away_score_ht
    ) {
      points += 1;
      halfPredictionsCorrect += 1;
    }
    // - Exact ET full time scoreline (draw, match continued): 1 point
    if (
      et_home_score !== null &&
      et_away_score !== null &&
      predHome === et_home_score &&
      predAway === et_away_score
    ) {
      points += 1;
    }
    // - Correct penalty shootout score and winner: 5 points (deciding score)
    if (
      pen_home_score !== null &&
      pen_away_score !== null &&
      predHome === pen_home_score &&
      predAway === pen_away_score
    ) {
      points += 5;
      exactScorePoints = 1;
    } else if (
      pen_home_score !== null &&
      pen_away_score !== null &&
      (predHome === pen_home_score || predAway === pen_away_score)
    ) {
      exactScorePoints = 0.5;
    }
  }

  return { points, exactScorePoints, halfPredictionsCorrect };
}
