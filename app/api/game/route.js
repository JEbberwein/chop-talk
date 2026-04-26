import { NextResponse } from 'next/server';

const BRAVES_ID = 144;

function getTodayDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function getNextGameInfo(dates) {
  const today = getTodayDate();
  for (const date of dates) {
    if (date.date > today && date.games?.length > 0) {
      const g = date.games[0];
      return `${date.date} vs ${g.teams?.home?.team?.id === BRAVES_ID ? g.teams?.away?.team?.name : g.teams?.home?.team?.name}`;
    }
  }
  return null;
}

export async function GET() {
  try {
    const today = getTodayDate();
    const url = `https://statsapi.mlb.com/api/v1/schedule?teamId=${BRAVES_ID}&sportId=1&startDate=${today}&endDate=${today}&hydrate=probablePitcher,linescore,boxscore`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    const data = await res.json();

    if (!data.dates || data.dates.length === 0) {
      const scheduleRes = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?teamId=${BRAVES_ID}&sportId=1&startDate=${today}&endDate=2025-10-01`,
        { next: { revalidate: 3600 } }
      );
      const scheduleData = await scheduleRes.json();
      const nextGame = getNextGameInfo(scheduleData.dates || []);
      return NextResponse.json({ status: 'OFF_DAY', nextGame });
    }

    const game = data.dates[0].games[0];
    const status = game.status?.abstractGameState;
    const isHome = game.teams?.home?.team?.id === BRAVES_ID;
    const braves = isHome ? game.teams.home : game.teams.away;
    const opponent = isHome ? game.teams.away : game.teams.home;
    const linescore = game.linescore || {};
    const defense = linescore.defense || {};
    const offense = linescore.offense || {};

    const result = {
      status: status === 'Live' ? 'Live' : status === 'Final' ? 'Final' : 'Preview',
      detailedState: game.status?.detailedState,
      isHome,
      opponentAbbr: opponent.team?.abbreviation || opponent.team?.name,
      opponentName: opponent.team?.name,
      braves_score: braves.score ?? null,
      opponent_score: opponent.score ?? null,
      gameTime: game.gameDate,
      venue: game.venue?.name,
      inning: linescore.currentInning,
      inningHalf: linescore.inningHalf === 'Top' ? '▲' : '▼',
      outs: linescore.outs ?? 0,
      currentPitcher: defense.pitcher?.fullName || null,
      currentBatter: offense.batter?.fullName || null,
      lastPlay: game.linescore?.note || null,
      bravesProbablePitcher: isHome
        ? game.teams?.home?.probablePitcher?.fullName
        : game.teams?.away?.probablePitcher?.fullName,
      opponentProbablePitcher: isHome
        ? game.teams?.away?.probablePitcher?.fullName
        : game.teams?.home?.probablePitcher?.fullName,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: 'ERROR', message: err.message });
  }
}