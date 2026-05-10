interface Match {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  status: string;
}

interface Prediction {
  match_id: string;
}

export function checkUpcomingLocks(
  matches: Match[],
  predictions: Record<string, Prediction>
): string[] {
  const now = Date.now();
  const messages: string[] = [];

  for (const match of matches) {
    if (match.status === 'finished') continue;

    const lockTime = new Date(match.kickoff_time).getTime() - 60 * 60 * 1000;
    const timeUntilLock = lockTime - now;

    if (timeUntilLock <= 0) continue;
    if (timeUntilLock > 3 * 60 * 60 * 1000) continue;
    if (predictions[match.id]) continue;

    const hours = Math.floor(timeUntilLock / (1000 * 60 * 60));
    const mins = Math.floor((timeUntilLock % (1000 * 60 * 60)) / (1000 * 60));
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    messages.push(
      `${match.home_team} vs ${match.away_team} locks in ${timeStr} — no prediction yet!`
    );
  }

  return messages;
}
