import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TEAM_NAME_MAP: Record<string, string> = {
  "Mexico": "Mexico",
  "South Africa": "South Africa",
  "Korea Republic": "South Korea",
  "Republic of Korea": "South Korea",
  "Czechia": "Czechia",
  "Czech Republic": "Czechia",
  "Canada": "Canada",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Qatar": "Qatar",
  "Switzerland": "Switzerland",
  "Brazil": "Brazil",
  "Morocco": "Morocco",
  "Haiti": "Haiti",
  "Scotland": "Scotland",
  "United States": "USA",
  "Paraguay": "Paraguay",
  "Australia": "Australia",
  "Turkey": "Türkiye",
  "Türkiye": "Türkiye",
  "Germany": "Germany",
  "Curacao": "Curaçao",
  "Côte d'Ivoire": "Ivory Coast",
  "Ivory Coast": "Ivory Coast",
  "Ecuador": "Ecuador",
  "Netherlands": "Netherlands",
  "Japan": "Japan",
  "Sweden": "Sweden",
  "Tunisia": "Tunisia",
  "Belgium": "Belgium",
  "Egypt": "Egypt",
  "Iran": "Iran",
  "New Zealand": "New Zealand",
  "Spain": "Spain",
  "Cape Verde": "Cape Verde",
  "Cabo Verde": "Cape Verde",
  "Saudi Arabia": "Saudi Arabia",
  "Uruguay": "Uruguay",
  "France": "France",
  "Senegal": "Senegal",
  "Iraq": "Iraq",
  "Norway": "Norway",
  "Argentina": "Argentina",
  "Algeria": "Algeria",
  "Austria": "Austria",
  "Jordan": "Jordan",
  "Portugal": "Portugal",
  "DR Congo": "DR Congo",
  "Democratic Republic of the Congo": "DR Congo",
  "Uzbekistan": "Uzbekistan",
  "Colombia": "Colombia",
  "England": "England",
  "Croatia": "Croatia",
  "Ghana": "Ghana",
  "Panama": "Panama",
};

function mapTeamName(apiName: string): string {
  return TEAM_NAME_MAP[apiName] || apiName;
}

function mapStatus(apiStatus: string): string {
  switch (apiStatus) {
    case "SCHEDULED":
    case "TIMED":
      return "upcoming";
    case "IN_PLAY":
    case "PAUSED":
      return "live";
    case "FINISHED":
    case "AWARDED":
      return "finished_90";
    default:
      return "upcoming";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const apiKey = Deno.env.get("FOOTBALL_DATA_API_KEY") ?? "";

    const response = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?season=2026",
      {
        headers: { "X-Auth-Token": apiKey },
      }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Football API request failed",
          status: response.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const data = await response.json();
    const apiMatches = data.matches || [];

    const { data: dbMatches } = await supabase.from("matches").select("*");

    if (!dbMatches) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch matches from database" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let matchesUpdated = 0;
    let matchesFinished = 0;
    let scoresCalculated = 0;

    for (const apiMatch of apiMatches) {
      if (!apiMatch.stage?.includes("GROUP")) continue;

      const homeTeam = mapTeamName(apiMatch.homeTeam?.name || "");
      const awayTeam = mapTeamName(apiMatch.awayTeam?.name || "");
      const newStatus = mapStatus(apiMatch.status);

      const dbMatch = dbMatches.find(
        (m: { home_team: string; away_team: string }) =>
          m.home_team === homeTeam && m.away_team === awayTeam
      );

      if (!dbMatch) continue;

      const wasLiveOrUpcoming =
        dbMatch.status === "live" || dbMatch.status === "upcoming";
      const isNowFinished = newStatus === "finished_90";

      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        home_score: apiMatch.score?.fullTime?.home ?? null,
        away_score: apiMatch.score?.fullTime?.away ?? null,
        home_score_ht: apiMatch.score?.halfTime?.home ?? null,
        away_score_ht: apiMatch.score?.halfTime?.away ?? null,
      };

      await supabase.from("matches").update(updatePayload).eq("id", dbMatch.id);

      matchesUpdated++;

      if (wasLiveOrUpcoming && isNowFinished) {
        matchesFinished++;

        const calcUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/calculate-scores`;
        const calcResponse = await fetch(calcUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            match_id: dbMatch.id,
            match_type: "group",
            status: "finished_90",
            home_score: apiMatch.score?.fullTime?.home,
            away_score: apiMatch.score?.fullTime?.away,
            home_score_ht: apiMatch.score?.halfTime?.home,
            away_score_ht: apiMatch.score?.halfTime?.away,
            et_home_score: null,
            et_away_score: null,
            et_home_score_ht: null,
            et_away_score_ht: null,
            pen_home_score: null,
            pen_away_score: null,
            admin_password: Deno.env.get("ADMIN_PASSWORD") ?? "",
          }),
        });

        if (calcResponse.ok) scoresCalculated++;
      }
    }

    await supabase.from("settings").upsert({
      key: "last_sync",
      value: {
        timestamp: new Date().toISOString(),
        matches_updated: matchesUpdated,
        matches_finished: matchesFinished,
        scores_calculated: scoresCalculated,
      },
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        matches_updated: matchesUpdated,
        matches_finished: matchesFinished,
        scores_calculated: scoresCalculated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
