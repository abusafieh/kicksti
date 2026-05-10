interface PredictionSnapshot {
  match_id: string;
  points_awarded: number;
  home_team?: string;
  away_team?: string;
}

export function checkNewPoints(
  previous: PredictionSnapshot[],
  current: PredictionSnapshot[]
): string[] {
  const messages: string[] = [];
  const prevMap = new Map(previous.map(p => [p.match_id, p.points_awarded]));

  for (const pred of current) {
    const prevPoints = prevMap.get(pred.match_id) ?? 0;
    if (pred.points_awarded > prevPoints && pred.points_awarded > 0) {
      const teamStr = pred.home_team && pred.away_team
        ? `${pred.home_team} vs ${pred.away_team} finished — `
        : '';
      messages.push(`${teamStr}you earned ${pred.points_awarded} points!`);
    }
  }

  return messages;
}
