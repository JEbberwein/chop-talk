import { NextResponse } from 'next/server';

const BRAVES_ID = 144;
const MLB_API = 'https://statsapi.mlb.com/api/v1';

function getTodayDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeGame(game, dayGameNumber = null, dayGameCount = 1) {
  const isHome = game.teams?.home?.team?.id === BRAVES_ID;
  const braves = isHome ? game.teams.home : game.teams.away;
  const opponent = isHome ? game.teams.away : game.teams.home;
  const abstractState = game.status?.abstractGameState;
  const linescore = game.linescore || {};

  return {
    gamePk: game.gamePk,
    officialDate: game.officialDate,
    seriesGameNumber: game.seriesGameNumber || null,
    gamesInSeries: game.gamesInSeries || null,
    seriesDescription: game.seriesDescription || null,
    dayGameNumber,
    dayGameCount,
    isDoubleheader: dayGameCount > 1,
    status: abstractState === 'Live' ? 'Live' : abstractState === 'Final' ? 'Final' : 'Preview',
    detailedState: game.status?.detailedState,
    isHome,
    opponentId: opponent.team?.id,
    opponentAbbr: opponent.team?.abbreviation || opponent.team?.name?.split(' ').pop(),
    opponentName: opponent.team?.name,
    bravesScore: braves.score ?? 0,
    opponentScore: opponent.score ?? 0,
    gameTime: game.gameDate,
    venue: game.venue?.name,
    inning: linescore.currentInningOrdinal || null,
    inningHalf: linescore.inningHalf || null,
    outs: linescore.outs ?? 0,
    bravesProbablePitcher: isHome
      ? game.teams?.home?.probablePitcher?.fullName
      : game.teams?.away?.probablePitcher?.fullName,
    opponentProbablePitcher: isHome
      ? game.teams?.away?.probablePitcher?.fullName
      : game.teams?.home?.probablePitcher?.fullName,
    broadcasts: {
      tv: (game.broadcasts || []).filter((item) => item.type === 'TV').map((item) => item.name).filter(Boolean),
      radio: (game.broadcasts || []).filter((item) => item.type === 'Radio').map((item) => item.name).filter(Boolean),
    },
  };
}

function getOpponent(game) {
  const isHome = game.teams?.home?.team?.id === BRAVES_ID;
  return isHome ? game.teams?.away : game.teams?.home;
}

function dedupeGames(games) {
  const byGamePk = new Map();

  games.forEach((game) => {
    const existing = byGamePk.get(game.gamePk);
    if (!existing || new Date(game.gameDate) > new Date(existing.gameDate)) {
      byGamePk.set(game.gamePk, game);
    }
  });

  return [...byGamePk.values()].sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
}

function groupSeries(games, opponentId) {
  const opponentGames = dedupeGames(games)
    .filter((game) => getOpponent(game)?.team?.id === opponentId);
  const groups = [];

  opponentGames.forEach((game) => {
    const isHome = game.teams?.home?.team?.id === BRAVES_ID;
    const previousGroup = groups.at(-1);
    const previousGame = previousGroup?.games.at(-1);
    const gapInDays = previousGame
      ? (new Date(game.gameDate) - new Date(previousGame.gameDate)) / 86400000
      : Infinity;

    if (previousGroup && previousGroup.isHome === isHome && gapInDays <= 4) {
      previousGroup.games.push(game);
    } else {
      groups.push({ isHome, games: [game] });
    }
  });

  return groups;
}

function getSeriesRecord(games) {
  return games.reduce((record, game) => {
    if (game.status?.abstractGameState !== 'Final') return record;
    const isHome = game.teams?.home?.team?.id === BRAVES_ID;
    const braves = isHome ? game.teams.home : game.teams.away;
    const opponent = isHome ? game.teams.away : game.teams.home;
    if ((braves.score ?? 0) > (opponent.score ?? 0)) record.bravesWins += 1;
    if ((opponent.score ?? 0) > (braves.score ?? 0)) record.opponentWins += 1;
    record.completed += 1;
    return record;
  }, { bravesWins: 0, opponentWins: 0, completed: 0 });
}

function getSeriesStatus(record, opponentName, totalGames, isComplete) {
  const { bravesWins, opponentWins } = record;

  if (isComplete) {
    if (bravesWins > opponentWins) return `Braves won ${bravesWins}-${opponentWins}`;
    if (opponentWins > bravesWins) return `${opponentName} won ${opponentWins}-${bravesWins}`;
    return `Split ${bravesWins}-${opponentWins}`;
  }

  if (bravesWins === 0 && opponentWins === 0) return `Series starts ${totalGames ? `with Game 1 of ${totalGames}` : 'next'}`;
  if (bravesWins === opponentWins) return `Series tied ${bravesWins}-${opponentWins}`;
  return bravesWins > opponentWins
    ? `Braves lead ${bravesWins}-${opponentWins}`
    : `${opponentName} leads ${opponentWins}-${bravesWins}`;
}

function getSeriesStakes(record, totalGames, isComplete) {
  if (isComplete) return 'Series complete';

  const { bravesWins, opponentWins, completed } = record;
  const remaining = Math.max(totalGames - completed, 0);
  if (bravesWins === 0 && opponentWins === 0) return 'A fresh series is about to begin';
  if (remaining === 1 && bravesWins === opponentWins) return 'Series on the line';
  if (opponentWins === 0 && bravesWins > 0 && remaining === 1) return 'Braves going for the sweep';
  if (bravesWins === 0 && opponentWins > 0 && remaining === 1) return 'Braves trying to avoid the sweep';
  if (bravesWins > opponentWins && bravesWins + 1 > totalGames / 2) return 'Braves can clinch the series';
  if (opponentWins > bravesWins && opponentWins + 1 > totalGames / 2) return 'Braves need a win to keep the series alive';
  return `${remaining} game${remaining === 1 ? '' : 's'} remaining`;
}

function serializeSeries(group, opponentName, isCurrent = false) {
  const normalizedGames = group.games.map((game) => normalizeGame(game));
  const record = getSeriesRecord(group.games);
  const scheduledTotal = Math.max(
    ...group.games.map((game) => game.gamesInSeries || 0),
    group.games.length
  );
  const isComplete = group.games.every((game) => game.status?.abstractGameState === 'Final')
    && record.completed >= scheduledTotal;

  return {
    opponentName,
    isHome: group.isHome,
    location: group.isHome ? 'Atlanta' : opponentName,
    startDate: group.games[0]?.gameDate,
    endDate: group.games.at(-1)?.gameDate,
    totalGames: scheduledTotal,
    remaining: Math.max(scheduledTotal - record.completed, 0),
    ...record,
    statusText: getSeriesStatus(record, opponentName, scheduledTotal, isComplete),
    stakesText: isCurrent ? getSeriesStakes(record, scheduledTotal, isComplete) : null,
    games: normalizedGames,
  };
}

async function getSeriesStoryline(focusGame, nearbyGames, today) {
  if (!focusGame) return null;

  const opponent = getOpponent(focusGame);
  const opponentId = opponent?.team?.id;
  const opponentName = opponent?.team?.name;
  if (!opponentId || !opponentName) return null;

  const currentGroup = groupSeries(nearbyGames, opponentId)
    .find((group) => group.games.some((game) => game.gamePk === focusGame.gamePk));
  const currentSeries = currentGroup
    ? serializeSeries(currentGroup, opponentName, true)
    : null;
  const currentYear = Number(today.slice(0, 4));
  const historyResponses = await Promise.all(
    [currentYear - 2, currentYear - 1, currentYear].map((season) => (
      fetch(
        `${MLB_API}/schedule?teamId=${BRAVES_ID}&sportId=1&startDate=${season}-01-01&endDate=${season}-12-31&hydrate=linescore`,
        { next: { revalidate: 3600 } }
      )
    ))
  );
  const historyPayloads = await Promise.all(
    historyResponses.filter((response) => response.ok).map((response) => response.json())
  );
  const historyGames = historyPayloads.flatMap((payload) => (
    payload.dates?.flatMap((date) => date.games || []) || []
  ));
  const currentGameIds = new Set(currentGroup?.games.map((game) => game.gamePk) || []);
  const history = groupSeries(historyGames, opponentId)
    .filter((group) => (
      group.games.every((game) => game.status?.abstractGameState === 'Final')
      && !group.games.some((game) => currentGameIds.has(game.gamePk))
    ))
    .sort((a, b) => new Date(b.games.at(-1).gameDate) - new Date(a.games.at(-1).gameDate))
    .slice(0, 3)
    .map((group) => serializeSeries(group, opponentName));
  const recentRecord = history.reduce((record, series) => {
    record.bravesWins += series.bravesWins;
    record.opponentWins += series.opponentWins;
    return record;
  }, { bravesWins: 0, opponentWins: 0 });

  return {
    opponentId,
    opponentName,
    current: currentSeries,
    history,
    recentRecord,
  };
}

function selectCurrentGame(games) {
  const sorted = [...games].sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
  return sorted.find((game) => game.status?.abstractGameState === 'Live')
    || sorted.find((game) => game.status?.abstractGameState !== 'Final')
    || sorted.at(-1)
    || null;
}

function getEligibleHitters(roster, boxscore, isHome) {
  const teamBox = boxscore?.teams?.[isHome ? 'home' : 'away'];
  const lineup = Object.values(teamBox?.players || {})
    .filter((player) => Number(player.battingOrder) > 0)
    .sort((a, b) => Number(a.battingOrder) - Number(b.battingOrder))
    .map((player) => ({
      id: player.person.id,
      name: player.person.fullName,
      position: player.position?.abbreviation || '',
      jerseyNumber: player.jerseyNumber || '',
    }));

  if (lineup.length > 0) return lineup;

  return (roster?.roster || [])
    .filter((player) => player.position?.code !== '1')
    .map((player) => ({
      id: player.person.id,
      name: player.person.fullName,
      position: player.position?.abbreviation || '',
      jerseyNumber: player.jerseyNumber || '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getActivePlayers(roster) {
  return (roster?.roster || [])
    .map((player) => ({
      id: player.person.id,
      name: player.person.fullName,
      position: player.position?.abbreviation || '',
      jerseyNumber: player.jerseyNumber || '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getHitterResults(boxscore, isHome) {
  const teamBox = boxscore?.teams?.[isHome ? 'home' : 'away'];
  return Object.values(teamBox?.players || {}).reduce((results, player) => {
    const batting = player.stats?.batting;
    if (batting && Number(player.battingOrder) > 0) {
      results[player.person.id] = {
        name: player.person.fullName,
        hits: batting.hits || 0,
        homeRuns: batting.homeRuns || 0,
        rbi: batting.rbi || 0,
      };
    }
    return results;
  }, {});
}

function normalizeStandings(data) {
  const nlEast = data.records?.find((record) => record.division?.id === 204);
  return (nlEast?.teamRecords || []).slice(0, 5).map((team) => ({
    id: team.team.id,
    name: team.team.name,
    wins: team.wins,
    losses: team.losses,
    winningPercentage: team.winningPercentage,
    gamesBack: team.gamesBack,
  }));
}

export async function GET() {
  try {
    const today = getTodayDate();
    const recentStart = addDays(today, -10);
    const scheduleUrl = `${MLB_API}/schedule?teamId=${BRAVES_ID}&sportId=1&startDate=${today}&endDate=${addDays(today, 21)}&hydrate=probablePitcher,linescore,broadcasts`;
    const rosterUrl = `${MLB_API}/teams/${BRAVES_ID}/roster?rosterType=active&season=${today.slice(0, 4)}`;
    const standingsUrl = `${MLB_API}/standings?leagueId=104&season=${today.slice(0, 4)}&standingsTypes=regularSeason`;
    const recentUrl = `${MLB_API}/schedule?teamId=${BRAVES_ID}&sportId=1&startDate=${recentStart}&endDate=${today}&hydrate=linescore`;
    const [scheduleRes, rosterRes, standingsRes, recentRes] = await Promise.all([
      fetch(scheduleUrl, { cache: 'no-store' }),
      fetch(rosterUrl, { next: { revalidate: 1800 } }),
      fetch(standingsUrl, { next: { revalidate: 60 } }),
      fetch(recentUrl, { cache: 'no-store' }),
    ]);

    if (!scheduleRes.ok || !rosterRes.ok || !standingsRes.ok || !recentRes.ok) {
      throw new Error('MLB data is temporarily unavailable.');
    }

    const [schedule, roster, standingsData, recentData] = await Promise.all([
      scheduleRes.json(),
      rosterRes.json(),
      standingsRes.json(),
      recentRes.json(),
    ]);
    const scheduledGames = dedupeGames(schedule.dates?.flatMap((date) => date.games || []) || [])
      .sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
    const todayGames = scheduledGames.filter((candidate) => {
      return new Date(candidate.gameDate).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) === today;
    });
    const game = selectCurrentGame(todayGames);
    const normalizedTodayGames = todayGames.map((candidate, index) => (
      normalizeGame(candidate, index + 1, todayGames.length)
    ));
    const nextGame = scheduledGames.find((candidate) => {
      return !todayGames.some((todayGame) => todayGame.gamePk === candidate.gamePk)
        && new Date(candidate.gameDate) > new Date();
    });
    const lastGame = (recentData.dates || [])
      .flatMap((date) => date.games || [])
      .filter((candidate) => (
        candidate.status?.abstractGameState === 'Final'
        && !todayGames.some((todayGame) => todayGame.gamePk === candidate.gamePk)
      ))
      .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate))[0];
    const nearbyGames = dedupeGames([
      ...(recentData.dates?.flatMap((date) => date.games || []) || []),
      ...scheduledGames,
    ]);
    const seriesStoryline = await getSeriesStoryline(game || nextGame, nearbyGames, today);
    const sharedData = {
      todayGames: normalizedTodayGames,
      nextGame: nextGame ? normalizeGame(nextGame) : null,
      lastGame: lastGame ? normalizeGame(lastGame) : null,
      seriesStoryline,
      standings: normalizeStandings(standingsData),
      activePlayers: getActivePlayers(roster),
      updatedAt: new Date().toISOString(),
    };

    if (!game) {
      return NextResponse.json({
        status: 'OFF_DAY',
        ...sharedData,
        eligibleHitters: getEligibleHitters(roster, null, false),
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    const selectedGameIndex = todayGames.findIndex((candidate) => candidate.gamePk === game.gamePk);
    const normalized = normalizeGame(game, selectedGameIndex + 1, todayGames.length);
    const boxscoreRes = await fetch(`${MLB_API}/game/${game.gamePk}/boxscore`, {
      cache: 'no-store',
    });
    const boxscore = boxscoreRes.ok ? await boxscoreRes.json() : null;

    return NextResponse.json({
      ...normalized,
      ...sharedData,
      eligibleHitters: getEligibleHitters(roster, boxscore, normalized.isHome),
      hitterResults: getHitterResults(boxscore, normalized.isHome),
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: 'ERROR', message: error.message || 'Game data is unavailable.' },
      { status: 500 }
    );
  }
}
