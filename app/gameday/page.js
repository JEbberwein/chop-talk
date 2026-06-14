'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const STATS_KEY = 'ct_prediction_stats';
const EMPTY_PICKS = { homeRuns: '', runs: '', playerId: '' };

function gameKey(gamePk) {
  return `ct_gameday_${gamePk}`;
}

function getRunBucket(runs) {
  if (runs <= 2) return '0-2';
  if (runs <= 4) return '3-4';
  return '5+';
}

function getHomeRunBucket(homeRuns) {
  if (homeRuns === 0) return '0';
  if (homeRuns === 1) return '1';
  return '2+';
}

function getBravesHomeRuns(game) {
  return Object.values(game?.hitterResults || {}).reduce(
    (total, player) => total + (player.homeRuns || 0),
    0
  );
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || '') || fallback;
  } catch {
    return fallback;
  }
}

function emptyStats() {
  return { points: 0, correct: 0, total: 0, games: 0, history: [] };
}

function formatGameTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isCompletePicks(picks) {
  return Boolean(picks?.homeRuns && picks?.runs && picks?.playerId);
}

function gradePicks(game, picks) {
  const hitter = game.hitterResults?.[picks.playerId];
  const bravesHomeRuns = getBravesHomeRuns(game);
  const results = {
    homeRuns: picks.homeRuns === getHomeRunBucket(bravesHomeRuns),
    runs: picks.runs === getRunBucket(game.bravesScore),
    player: Boolean(hitter && hitter.hits > 0),
  };

  return {
    results,
    points: Object.values(results).filter(Boolean).length,
    hitter,
    bravesHomeRuns,
  };
}

function getSelectedPlayer(game, picks) {
  return game?.eligibleHitters?.find(
    (player) => String(player.id) === String(picks.playerId)
  );
}

function GameHero({ game, mode }) {
  const bravesWon = game.status === 'Final' && game.bravesScore > game.opponentScore;
  const title = mode === 'final'
    ? bravesWon ? 'Braves win' : 'Final'
    : mode === 'live' ? `${game.inningHalf || ''} ${game.inning || ''}`.trim()
      : 'Make your picks';

  return (
    <header className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,#123663,#0b284d)] shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between bg-[#CE1141] px-5 py-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white">
          GameDay{game.isDoubleheader ? ` · Game ${game.dayGameNumber} of ${game.dayGameCount}` : ''}
        </p>
        <p className="text-xs font-black text-white">{mode === 'pregame' ? formatGameTime(game.gameTime) : title}</p>
      </div>
      <div className="p-5">
        {mode === 'pregame' ? (
          <>
            <p className="text-sm font-bold text-blue-200">Braves {game.isHome ? 'vs.' : 'at'}</p>
            <h1 className="mt-1 text-3xl font-black text-white">{game.opponentName}</h1>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#071b34]/70 p-3">
                <p className="text-xs font-bold text-blue-300">ATL starter</p>
                <p className="mt-1 text-sm font-black text-white">{game.bravesProbablePitcher || 'TBD'}</p>
              </div>
              <div className="rounded-2xl bg-[#071b34]/70 p-3">
                <p className="text-xs font-bold text-blue-300">{game.opponentAbbr} starter</p>
                <p className="mt-1 text-sm font-black text-white">{game.opponentProbablePitcher || 'TBD'}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
              {mode === 'live' ? game.detailedState : `${game.isHome ? 'at home vs.' : 'at'} ${game.opponentName}`}
            </p>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-black text-white">ATL</p>
                <p className="mt-1 text-5xl font-black text-white">{game.bravesScore}</p>
              </div>
              <div className="rounded-full border border-blue-700 bg-[#071b34] px-3 py-2 text-sm font-black text-blue-200">-</div>
              <div className="text-center">
                <p className="text-xl font-black text-white">{game.opponentAbbr}</p>
                <p className="mt-1 text-5xl font-black text-white">{game.opponentScore}</p>
              </div>
            </div>
            <p className="mt-4 text-center text-sm font-bold text-blue-200">
              {mode === 'live'
                ? `${game.inningHalf || ''} ${game.inning || ''} · ${game.outs} out${game.outs === 1 ? '' : 's'}`
                : bravesWon ? 'Chop on. The good guys got it done.' : 'That one is in the books.'}
            </p>
          </>
        )}
      </div>
    </header>
  );
}

function SeasonStats({ stats }) {
  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-2xl bg-[#102b50] p-3"><p className="text-2xl font-black text-white">{stats.points}</p><p className="text-[0.7rem] font-bold uppercase text-blue-300">Points</p></div>
      <div className="rounded-2xl bg-[#102b50] p-3"><p className="text-2xl font-black text-white">{stats.games}</p><p className="text-[0.7rem] font-bold uppercase text-blue-300">Games</p></div>
      <div className="rounded-2xl bg-[#102b50] p-3"><p className="text-2xl font-black text-white">{accuracy}%</p><p className="text-[0.7rem] font-bold uppercase text-blue-300">Accuracy</p></div>
    </div>
  );
}

function PickSummaryRow({ label, pick, actual, state }) {
  const colors = state === 'hit'
    ? 'border-emerald-600/70 bg-emerald-950/35'
    : state === 'track'
      ? 'border-amber-400/60 bg-amber-950/20'
    : state === 'miss'
      ? 'border-red-700/70 bg-red-950/30'
      : 'border-blue-800 bg-[#102b50]';
  const badge = state === 'hit' ? 'Secured' : state === 'track' ? 'On track' : state === 'miss' ? 'Miss' : 'In play';

  return (
    <div className={`rounded-2xl border p-4 ${colors}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-blue-300">{label}</p>
          <p className="mt-1 text-lg font-black text-white">{pick}</p>
          <p className="mt-1 text-sm text-blue-200">{actual}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${state === 'hit' ? 'bg-emerald-600 text-white' : state === 'track' ? 'bg-amber-300 text-[#071b34]' : state === 'miss' ? 'bg-red-700 text-white' : 'bg-blue-900 text-blue-100'}`}>{badge}</span>
      </div>
    </div>
  );
}

function PregameView({ game, picks, setPicks, saved, onSave }) {
  const selectedPlayer = getSelectedPlayer(game, picks);
  const complete = isCompletePicks(picks);

  return (
    <>
      <GameHero game={game} mode="pregame" />
      {saved && (
        <section className="rounded-[1.25rem] border border-emerald-700 bg-emerald-950/35 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Your card is in</p>
          <p className="mt-1 text-lg font-black text-white">You can update it until first pitch.</p>
        </section>
      )}

      <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Pick 1</p>
        <h2 className="mt-1 text-xl font-black text-white">How many Braves home runs?</h2>
        <p className="mt-1 text-sm text-blue-200">None, one, or a multi-homer game.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['0', '1', '2+'].map((value) => (
            <button key={value} onClick={() => setPicks((current) => ({ ...current, homeRuns: value }))} className={`min-h-14 rounded-2xl border px-3 font-black ${picks.homeRuns === value ? 'border-[#CE1141] bg-[#CE1141] text-white' : 'border-blue-700 bg-[#071b34] text-blue-100'}`}>{value}</button>
          ))}
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Pick 2</p>
        <h2 className="mt-1 text-xl font-black text-white">How many Braves runs?</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['0-2', '3-4', '5+'].map((value) => (
            <button key={value} onClick={() => setPicks((current) => ({ ...current, runs: value }))} className={`min-h-14 rounded-2xl border px-3 font-black ${picks.runs === value ? 'border-[#CE1141] bg-[#CE1141] text-white' : 'border-blue-700 bg-[#071b34] text-blue-100'}`}>{value}</button>
          ))}
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Pick 3</p>
        <h2 className="mt-1 text-xl font-black text-white">Pick to Click</h2>
        <p className="mt-1 text-sm text-blue-200">Choose a Brave to record at least one hit.</p>
        <select value={picks.playerId} onChange={(event) => setPicks((current) => ({ ...current, playerId: event.target.value }))} className="mt-4 min-h-14 w-full rounded-2xl border border-blue-700 bg-[#071b34] px-4 text-sm font-bold text-white outline-none">
          <option value="">Choose your hitter...</option>
          {(game.eligibleHitters || []).map((player) => <option key={player.id} value={player.id}>{player.name} {player.position ? `(${player.position})` : ''}</option>)}
        </select>
        {selectedPlayer && <p className="mt-3 text-sm font-bold text-blue-100">Your pick: {selectedPlayer.name}</p>}
      </section>

      <button onClick={onSave} disabled={!complete} className="min-h-14 w-full rounded-2xl bg-[#CE1141] px-5 py-4 text-base font-black text-white shadow-xl shadow-[#CE1141]/20 disabled:bg-blue-900 disabled:text-blue-400 disabled:shadow-none">
        {saved ? 'Update my picks' : 'Lock in my picks'}
      </button>
    </>
  );
}

function LiveView({ game, picks, saved }) {
  const selectedPlayer = getSelectedPlayer(game, picks);
  const hitter = game.hitterResults?.[picks.playerId];
  const currentHomers = getBravesHomeRuns(game);
  const homeRunState = (
    (picks.homeRuns === '0' && currentHomers > 0) ||
    (picks.homeRuns === '1' && currentHomers > 1)
  ) ? 'miss' : getHomeRunBucket(currentHomers) === picks.homeRuns ? 'track' : 'pending';
  const runState = (
    (picks.runs === '0-2' && game.bravesScore > 2) ||
    (picks.runs === '3-4' && game.bravesScore > 4)
  ) ? 'miss' : picks.runs === '5+' && game.bravesScore >= 5 ? 'hit' : getRunBucket(game.bravesScore) === picks.runs ? 'track' : 'pending';

  return (
    <>
      <GameHero game={game} mode="live" />
      {saved ? (
        <>
          <section className="rounded-[1.25rem] border border-blue-700 bg-[linear-gradient(135deg,#123663,#0b284d)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Your live card</p>
            <h2 className="mt-1 text-xl font-black text-white">Three reasons to keep watching</h2>
          </section>
          <PickSummaryRow label="Braves home runs" pick={`You picked ${picks.homeRuns}`} actual={`${currentHomers} so far`} state={homeRunState} />
          <PickSummaryRow label="Braves runs" pick={`You picked ${picks.runs}`} actual={`${game.bravesScore} so far`} state={runState} />
          <PickSummaryRow label="Pick to Click" pick={selectedPlayer?.name || 'Your hitter'} actual={`${hitter?.hits || 0} hit${hitter?.hits === 1 ? '' : 's'} so far`} state={hitter?.hits > 0 ? 'hit' : 'pending'} />
        </>
      ) : (
        <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Picks are closed</p>
          <h2 className="mt-2 text-2xl font-black text-white">You sat this one out</h2>
          <p className="mt-2 text-sm leading-6 text-blue-200">No problem. Follow the game here and come back before first pitch next time.</p>
        </section>
      )}
      <Link href={`/ask?q=${encodeURIComponent(`What should Braves fans watch for in the rest of the game against the ${game.opponentName}?`)}`} className="block rounded-2xl bg-[#CE1141] px-5 py-4 text-center text-sm font-black text-white">Ask for the live game read</Link>
    </>
  );
}

function FinalView({ game, picks, saved, graded, stats }) {
  const selectedPlayer = getSelectedPlayer(game, picks);
  const hitter = game.hitterResults?.[picks.playerId];

  return (
    <>
      <GameHero game={game} mode="final" />
      {saved && graded ? (
        <>
          <section className="overflow-hidden rounded-[1.25rem] border border-[#CE1141]/70 bg-[#102b50]">
            <div className="bg-[linear-gradient(135deg,#CE1141,#9d0d31)] p-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-100">Your GameDay result</p>
              <p className="mt-2 text-6xl font-black text-white">{graded.points}<span className="text-3xl text-red-100">/3</span></p>
              <p className="mt-2 text-sm font-bold text-red-100">{graded.points === 3 ? 'Perfect card. You called the game.' : graded.points === 2 ? 'Strong read. Two picks came home.' : graded.points === 1 ? 'One good call. We go again next game.' : 'Baseball is humbling. Next card starts fresh.'}</p>
            </div>
          </section>
          <PickSummaryRow label="Braves home runs" pick={`You picked ${picks.homeRuns}`} actual={`Final: ${graded.bravesHomeRuns}`} state={graded.results.homeRuns ? 'hit' : 'miss'} />
          <PickSummaryRow label="Braves runs" pick={`You picked ${picks.runs}`} actual={`Final: ${game.bravesScore} runs`} state={graded.results.runs ? 'hit' : 'miss'} />
          <PickSummaryRow label="Pick to Click" pick={selectedPlayer?.name || 'Your hitter'} actual={`${hitter?.hits || 0} hit${hitter?.hits === 1 ? '' : 's'}`} state={graded.results.player ? 'hit' : 'miss'} />
          <SeasonStats stats={stats} />
        </>
      ) : saved ? (
        <section className="rounded-[1.25rem] border border-blue-700 bg-[#102b50] p-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Final out recorded</p>
          <h2 className="mt-2 text-2xl font-black text-white">Calculating your card</h2>
          <p className="mt-2 text-sm leading-6 text-blue-200">Checking the final box score and adding your points.</p>
        </section>
      ) : (
        <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Game complete</p>
          <h2 className="mt-2 text-2xl font-black text-white">You sat this one out</h2>
          <p className="mt-2 text-sm leading-6 text-blue-200">There was no completed prediction card for this game. The next one opens before first pitch.</p>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link href={`/ask?q=${encodeURIComponent(`Give me the fan's recap of the Braves game against the ${game.opponentName}.`)}`} className="rounded-2xl bg-[#CE1141] px-4 py-3 text-center text-sm font-black text-white">Get the recap</Link>
        <Link href="/me" className="rounded-2xl border border-blue-700 px-4 py-3 text-center text-sm font-black text-blue-100">My record</Link>
      </div>

      {game.nextGame && (
        <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Next GameDay</p>
          <h2 className="mt-1 text-xl font-black text-white">Braves {game.nextGame.isHome ? 'vs.' : 'at'} {game.nextGame.opponentName}</h2>
          <p className="mt-1 text-sm text-blue-200">{formatGameTime(game.nextGame.gameTime)} ET</p>
        </section>
      )}
    </>
  );
}

export default function GameDay() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState(EMPTY_PICKS);
  const [saved, setSaved] = useState(false);
  const [graded, setGraded] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [now, setNow] = useState(0);

  const loadGame = useCallback(async () => {
    try {
      const response = await fetch('/api/game', { cache: 'no-store' });
      setGame(await response.json());
    } catch {
      setGame({ status: 'ERROR' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') loadGame();
    };
    const initialLoad = setTimeout(loadGame, 0);
    const interval = setInterval(loadGame, 15000);
    window.addEventListener('focus', loadGame);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
      window.removeEventListener('focus', loadGame);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [loadGame]);

  useEffect(() => {
    const initialClock = setTimeout(() => setNow(Date.now()), 0);
    const clock = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      clearTimeout(initialClock);
      clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    if (!game?.gamePk) return;
    const timer = setTimeout(() => {
      const current = readJson(gameKey(game.gamePk), null);
      const savedStats = readJson(STATS_KEY, emptyStats());
      const migratedPicks = current?.picks ? {
        homeRuns: current.picks.homeRuns || '',
        runs: current.picks.runs || '',
        playerId: current.picks.playerId || '',
      } : EMPTY_PICKS;
      const complete = isCompletePicks(migratedPicks);
      setStats(savedStats);
      setPicks(migratedPicks);
      setSaved(complete);
      setGraded(complete && current?.graded?.results?.homeRuns !== undefined ? current.graded : null);
    }, 0);
    return () => clearTimeout(timer);
  }, [game?.gamePk]);

  useEffect(() => {
    if (game?.status !== 'Final' || !game.gamePk || !saved || graded) return;

    const current = readJson(gameKey(game.gamePk), {});
    const lockedPicks = current.picks || picks;
    if (!isCompletePicks(lockedPicks)) return;

    const result = gradePicks(game, lockedPicks);
    const savedStats = readJson(STATS_KEY, emptyStats());
    const existingEntry = (savedStats.history || []).find((entry) => entry.gamePk === game.gamePk);
    const historyWithoutGame = (savedStats.history || []).filter((entry) => entry.gamePk !== game.gamePk);
    const alreadyCounted = Boolean(existingEntry);
    const previousPoints = existingEntry?.points || 0;
    const historyEntry = {
      gamePk: game.gamePk,
      date: game.gameTime,
      opponent: game.opponentName,
      points: result.points,
      score: `${game.bravesScore}-${game.opponentScore}`,
      picks: lockedPicks,
      results: result.results,
      playerName: getSelectedPlayer(game, lockedPicks)?.name,
    };
    const nextStats = {
      points: savedStats.points - previousPoints + result.points,
      correct: savedStats.correct - previousPoints + result.points,
      total: savedStats.total + (alreadyCounted ? 0 : 3),
      games: savedStats.games + (alreadyCounted ? 0 : 1),
      history: [historyEntry, ...historyWithoutGame].slice(0, 30),
    };

    localStorage.setItem(gameKey(game.gamePk), JSON.stringify({ ...current, picks: lockedPicks, graded: result }));
    localStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicks(lockedPicks);
    setGraded(result);
    setStats(nextStats);
  }, [game, graded, picks, saved]);

  const pregameOpen = useMemo(() => {
    return game?.status === 'Preview' && now < new Date(game.gameTime).getTime();
  }, [game, now]);

  const savePicks = () => {
    if (!game?.gamePk || !isCompletePicks(picks) || !pregameOpen) return;
    localStorage.setItem(gameKey(game.gamePk), JSON.stringify({
      gamePk: game.gamePk,
      gameTime: game.gameTime,
      opponent: game.opponentName,
      picks,
    }));
    setSaved(true);
  };

  if (loading) {
    return <div className="grid min-h-[calc(100dvh-6rem)] place-items-center bg-[#071b34] px-4"><p className="text-sm font-bold text-blue-200">Building today&apos;s GameDay...</p></div>;
  }

  if (!game || game.status === 'ERROR') {
    return (
      <div className="min-h-[calc(100dvh-6rem)] bg-[#071b34] px-4 py-8">
        <div className="mx-auto max-w-md rounded-[1.5rem] border border-blue-800 bg-[#102b50] p-6 text-center">
          <h1 className="text-2xl font-black text-white">GameDay is warming up</h1>
          <p className="mt-2 text-sm leading-6 text-blue-200">MLB game data is temporarily unavailable. Try again shortly.</p>
        </div>
      </div>
    );
  }

  if (game.status === 'OFF_DAY') {
    return (
      <div className="min-h-[calc(100dvh-6rem)] bg-[#071b34] px-4 py-6">
        <div className="mx-auto max-w-md space-y-4">
          <header className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,#123663,#0b284d)] p-6 shadow-2xl shadow-black/20">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">GameDay</p>
            <h1 className="mt-2 text-3xl font-black text-white">Off-day mode</h1>
            <p className="mt-2 text-sm leading-6 text-blue-100">No picks today. Reset, check the roster, and look ahead to the next first pitch.</p>
          </header>
          {game.nextGame && (
            <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Next up</p>
              <h2 className="mt-2 text-2xl font-black text-white">Braves {game.nextGame.isHome ? 'vs.' : 'at'} {game.nextGame.opponentName}</h2>
              <p className="mt-2 text-sm text-blue-200">{formatGameTime(game.nextGame.gameTime)} ET</p>
            </section>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/roster" className="rounded-2xl border border-blue-700 px-4 py-3 text-center text-sm font-black text-blue-100">Roster Watch</Link>
            <Link href="/ask?q=What%20is%20the%20biggest%20Braves%20storyline%20on%20this%20off-day%3F" className="rounded-2xl bg-[#CE1141] px-4 py-3 text-center text-sm font-black text-white">Team pulse</Link>
          </div>
          <SeasonStats stats={stats} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-6rem)] bg-[#071b34] px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        {pregameOpen ? (
          <PregameView game={game} picks={picks} setPicks={setPicks} saved={saved} onSave={savePicks} />
        ) : game.status === 'Live' ? (
          <LiveView game={game} picks={picks} saved={saved} />
        ) : game.status === 'Final' ? (
          <FinalView game={game} picks={picks} saved={saved} graded={graded} stats={stats} />
        ) : (
          <>
            <GameHero game={game} mode="live" />
            <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-6 text-center">
              <h2 className="text-2xl font-black text-white">Picks are locked</h2>
              <p className="mt-2 text-sm leading-6 text-blue-200">The game is about to begin. Your live tracker will appear as soon as MLB marks the game in progress.</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
