'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BRAVES_ID = 144;
const FAN_LISTEN_URL = 'https://680thefan.com/listen-live/';
const ALL_STAR_VOTE_URL = 'https://www.mlb.com/vote';
const QUICK_QUESTION_POOL = [
  "Who is pitching today?",
  "What is the biggest matchup today?",
  "How is the bullpen performing?",
  "Latest Braves news?",
  "Who is hot at the plate?",
  "What should I watch for in today's game?",
  "How do the Braves match up today?",
  "Give me a one-minute game preview.",
  "What is the Braves record?",
  "Who leads the team in home runs?",
  "How did the Braves do yesterday?",
  "Any injury updates I should know?",
];

function getTodayKey() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function getFreshQuestions(count = 4) {
  const today = getTodayKey();
  const seed = today.split('-').reduce((sum, part) => sum + Number(part), 0);
  return [...QUICK_QUESTION_POOL]
    .sort((a, b) => {
      const ia = QUICK_QUESTION_POOL.indexOf(a);
      const ib = QUICK_QUESTION_POOL.indexOf(b);
      return Math.sin(seed * 17 + ia * 13) - Math.sin(seed * 17 + ib * 13);
    })
    .slice(0, count);
}

function getUsedQuestionState() {
  try {
    const today = getTodayKey();
    const saved = JSON.parse(localStorage.getItem('ct_used_home_questions') || '{}');
    return saved.date === today && Array.isArray(saved.questions) ? saved.questions : [];
  } catch {
    return [];
  }
}

function saveUsedQuestion(question) {
  try {
    const today = getTodayKey();
    const used = getUsedQuestionState();
    const next = [...new Set([...used, question])];
    localStorage.setItem('ct_used_home_questions', JSON.stringify({ date: today, questions: next }));
  } catch {}
}

function getAvailableQuestions(count = 4) {
  const used = typeof window === 'undefined' ? [] : getUsedQuestionState();
  const fresh = getFreshQuestions(QUICK_QUESTION_POOL.length);
  const unused = fresh.filter(q => !used.includes(q));
  return (unused.length >= count ? unused : fresh).slice(0, count);
}

function formatSeriesRange(startDate, endDate) {
  if (!startDate) return '';
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);
  const startParts = start.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
  });
  const endParts = end.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const sameDay = start.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    === end.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  return sameDay ? endParts : `${startParts}–${endParts}`;
}

function getSeriesGameResult(seriesGame) {
  if (seriesGame.status === 'Final') {
    const result = seriesGame.bravesScore > seriesGame.opponentScore ? 'W' : 'L';
    return `${result} ${seriesGame.bravesScore}-${seriesGame.opponentScore}`;
  }
  if (seriesGame.status === 'Live') {
    return `${seriesGame.inningHalf || ''} ${seriesGame.inning || ''}`.trim() || 'Live';
  }
  return new Date(seriesGame.gameTime).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Today() {
  const [game, setGame] = useState(null);
  const [lastGame, setLastGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState(null);
  const [quickQuestions, setQuickQuestions] = useState([]);
  const [injuries, setInjuries] = useState([]);
  const [fanName, setFanName] = useState('');
  const [hasGameDayPicks, setHasGameDayPicks] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/game?fresh=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Game snapshot failed');
        const data = await response.json();
        setGame(data);
        setStandings(data.standings || null);
        setLastGame(data.lastGame || null);
        setUpdatedAt(new Date(data.updatedAt || Date.now()));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    const initialLoad = setTimeout(fetchData, 0);
    const interval = setInterval(fetchData, 15000);
    window.addEventListener('focus', fetchData);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
      window.removeEventListener('focus', fetchData);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuickQuestions(getAvailableQuestions());
  }, []);

  useEffect(() => {
    const loadPersonalContext = async () => {
      setFanName(localStorage.getItem('ct_name') || '');
      try {
        const response = await fetch('/api/injuries');
        const data = await response.json();
        setInjuries(data.injuries || []);
      } catch {
        setInjuries([]);
      }
    };
    const timer = setTimeout(loadPersonalContext, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!game?.gamePk) return;

    const refreshPicks = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(`ct_gameday_${game.gamePk}`) || 'null');
        setHasGameDayPicks(Boolean(
          saved?.picks?.homeRuns &&
          saved?.picks?.runs &&
          saved?.picks?.playerId
        ));
      } catch {
        setHasGameDayPicks(false);
      }
    };

    const initialRefresh = setTimeout(refreshPicks, 0);
    window.addEventListener('focus', refreshPicks);
    window.addEventListener('storage', refreshPicks);
    return () => {
      clearTimeout(initialRefresh);
      window.removeEventListener('focus', refreshPicks);
      window.removeEventListener('storage', refreshPicks);
    };
  }, [game?.gamePk]);

  const askAbout = (question) => {
    if (QUICK_QUESTION_POOL.includes(question)) {
      saveUsedQuestion(question);
      setQuickQuestions(getAvailableQuestions());
    }
    router.push('/ask?q=' + encodeURIComponent(question));
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true }) + ' ET';
  };

  const getBroadcastInfo = (g) => {
    if (!g || !g.broadcasts) return { tv: null, radio: null, hasFan: false };
    const tv = g.broadcasts.tv || [];
    const radio = g.broadcasts.radio || [];
    const hasFan = radio.some(name => /680|93\.7|the fan/i.test(name));
    return {
      tv: tv.length ? tv.join(', ') : null,
      radio: radio.length ? radio.join(', ') : null,
      hasFan,
    };
  };

  const formatGameDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) return (
    <div className="min-h-[calc(100dvh-6rem)] bg-[#071b34] px-4 py-8">
      <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center text-center">
        <div className="mb-5 flex gap-1.5" role="status" aria-label="Loading today's Braves snapshot">
          <span className="h-3 w-3 animate-bounce rounded-full bg-[#CE1141]" style={{animationDelay:'0ms'}}/>
          <span className="h-3 w-3 animate-bounce rounded-full bg-[#CE1141]" style={{animationDelay:'150ms'}}/>
          <span className="h-3 w-3 animate-bounce rounded-full bg-[#CE1141]" style={{animationDelay:'300ms'}}/>
        </div>
        <p className="text-sm font-semibold text-white">Loading your Braves snapshot</p>
        <p className="mt-1 text-xs text-blue-200">Game, standings, and quick questions are coming up.</p>
      </div>
    </div>
  );

  const hasGame = game && game.status !== 'OFF_DAY' && game.status !== 'ERROR';
  const todayGames = game?.todayGames || [];
  const isDoubleheader = todayGames.length > 1;
  const otherTodayGames = hasGame
    ? todayGames.filter((todayGame) => todayGame.gamePk !== game.gamePk)
    : [];
  const isHome = hasGame ? game.isHome : false;
  const braves = hasGame ? { score: game.bravesScore } : null;
  const opponent = hasGame ? {
    score: game.opponentScore,
    team: { name: game.opponentName, abbreviation: game.opponentAbbr },
  } : null;
  const status = hasGame ? game.status : null;
  const inning = hasGame ? game.inning : null;
  const inningHalf = hasGame ? game.inningHalf : null;
  const bravesP = hasGame ? game.bravesProbablePitcher : null;
  const oppP = hasGame ? game.opponentProbablePitcher : null;
  const broadcast = getBroadcastInfo(game);
  const lastBraves = lastGame ? { score: lastGame.bravesScore } : null;
  const lastOpponent = lastGame ? { score: lastGame.opponentScore, team: { name: lastGame.opponentName } } : null;
  const lastGameLink = lastGame ? 'https://www.mlb.com/gameday/' + lastGame.gamePk : null;
  const showPreviousGame = Boolean(
    lastGame && (!hasGame || (status === 'Preview' && !isDoubleheader))
  );
  const seriesStoryline = game?.seriesStoryline || null;
  const currentSeries = seriesStoryline?.current || null;
  const gameAction = status === 'Live'
    ? { label: 'Live read', question: `What should Braves fans know about the live game against the ${game.opponentName}?` }
    : status === 'Final'
      ? { label: 'Recap', question: `Give me the fan's recap of the Braves game against the ${game.opponentName}.` }
      : status === 'Preview'
        ? { label: 'Preview', question: `Give me the Braves game preview against the ${game.opponentName} in plain English.` }
        : { label: 'Next up', question: 'When is the next Braves game, and what should I know?' };

  return (
    <div className="min-h-[calc(100dvh-6rem)] bg-[#071b34] px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,#123663,#0b284d)] p-5 shadow-2xl shadow-black/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Chop Talk</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white">{fanName ? `Hey, ${fanName}` : 'Braves today'}</h1>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                {hasGame
                  ? isDoubleheader
                    ? `Doubleheader against ${opponent?.team?.name || 'today\'s opponent'}. We will keep both games straight.`
                    : `${isHome ? 'Home' : 'Away'} against ${opponent?.team?.name || 'today\'s opponent'}. Here is what matters.`
                  : 'No game today. Here is what matters around Braves Country.'}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-[#071b34]/70 px-3 py-2 text-center">
              <p className="text-xs font-black text-white">{new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' })}</p>
              <p className="text-[0.65rem] font-bold uppercase tracking-wide text-blue-300">{new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short' })}</p>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Today</p>
            <h2 className="text-lg font-black text-white">
              {isDoubleheader ? `Game ${game.dayGameNumber} of ${game.dayGameCount}` : 'Game snapshot'}
            </h2>
            {updatedAt && (
              <p className="mt-0.5 text-[0.7rem] font-semibold text-blue-300">
                Updated {updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button
            onClick={() => askAbout(gameAction.question)}
            className="rounded-full border border-blue-700 px-3 py-2 text-xs font-bold text-blue-100 transition hover:border-blue-400 hover:bg-white/5 active:scale-[0.98]"
          >
            {gameAction.label}
          </button>
        </div>

        {!hasGame ? (
          <div className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-5 text-center shadow-xl shadow-black/10">
            <p className="text-xl font-black text-white">No game today</p>
            <p className="mt-2 text-sm leading-6 text-blue-200">Enjoy the off day. You can still ask about the next matchup, standings, roster news, or recent trends.</p>
            {game?.nextGame && (
              <div className="mt-5 rounded-2xl bg-[#071b34] p-4 text-left">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">Next game</p>
                <p className="mt-1 text-lg font-black text-white">
                  Braves {game.nextGame.isHome ? 'vs.' : 'at'} {game.nextGame.opponentName}
                </p>
                <p className="mt-1 text-sm text-blue-200">
                  {formatGameDate(game.nextGame.gameTime)} · {formatTime(game.nextGame.gameTime)}
                </p>
              </div>
            )}
            <button onClick={() => askAbout('What should I know about the next Braves game?')} className="mt-4 min-h-11 rounded-2xl bg-[#CE1141] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#e01b50] active:scale-[0.98]">
              Preview next game
            </button>
          </div>
        ) : (
          <section className="overflow-hidden rounded-[1.25rem] border border-blue-700/80 bg-[#102b50] shadow-xl shadow-black/15" aria-label="Today's Braves game">
            <div className="flex items-center justify-between gap-3 bg-[#CE1141] px-4 py-3">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                {status === 'Live' ? (inningHalf + ' ' + inning) : status === 'Final' ? 'Final' : formatTime(game.gameTime)}
              </span>
              {broadcast.tv && <span className="truncate text-right text-xs font-bold text-white">TV: {broadcast.tv}</span>}
              {!broadcast.tv && broadcast.radio && <span className="truncate text-right text-xs font-bold text-white">Listen: {broadcast.radio}</span>}
              {status === 'Live' && <span className="flex items-center gap-1 text-xs font-black text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white"/> LIVE</span>}
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">ATL</p>
                  <p className="mt-1 text-xs font-semibold text-blue-200">{isHome ? 'Home' : 'Away'}</p>
                  {(status === 'Live' || status === 'Final') && <p className="mt-2 text-5xl font-black text-white">{braves.score ?? 0}</p>}
                </div>
                <div className="rounded-full border border-blue-700 bg-[#071b34] px-3 py-2 text-center">
                  <p className="text-sm font-black text-blue-200">{status === 'Preview' ? 'VS' : '-'}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{opponent.team.abbreviation || opponent.team.name.split(' ').pop()}</p>
                  <p className="mt-1 text-xs font-semibold text-blue-200">{isHome ? 'Away' : 'Home'}</p>
                  {(status === 'Live' || status === 'Final') && <p className="mt-2 text-5xl font-black text-white">{opponent.score ?? 0}</p>}
                </div>
              </div>
              {status === 'Preview' && (bravesP || oppP) && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Probable pitchers</p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-2xl bg-[#071b34] p-3"><p className="text-sm font-black text-white">{bravesP || 'TBD'}</p><p className="mt-1 text-xs text-blue-300">ATL</p></div>
                    <div className="rounded-2xl bg-[#071b34] p-3"><p className="text-sm font-black text-white">{oppP || 'TBD'}</p><p className="mt-1 text-xs text-blue-300">{opponent.team.abbreviation}</p></div>
                  </div>
                </div>
              )}
              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium text-blue-200">{opponent.team.name} · {isHome ? 'Truist Park' : 'Away'}</p>
                  <a
                    href={FAN_LISTEN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-blue-700 px-3 py-2 text-xs font-bold text-blue-100 transition hover:border-blue-400 hover:bg-white/5 active:scale-[0.98]"
                    aria-label="Listen live on 680 The Fan"
                  >
                    Listen live
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {otherTodayGames.length > 0 && (
          <section className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-4 shadow-xl shadow-black/10" aria-label="Doubleheader tracker">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Doubleheader tracker</p>
            <div className="mt-3 space-y-2">
              {otherTodayGames.map((otherGame) => (
                <div key={otherGame.gamePk} className="flex items-center justify-between gap-4 rounded-2xl bg-[#071b34] p-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                      Game {otherGame.dayGameNumber}
                    </p>
                    <p className="mt-1 text-sm font-black text-white">
                      Braves {otherGame.isHome ? 'vs.' : 'at'} {otherGame.opponentName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">
                      {otherGame.status === 'Final'
                        ? `ATL ${otherGame.bravesScore}-${otherGame.opponentScore} ${otherGame.opponentAbbr}`
                        : otherGame.status === 'Live'
                          ? `${otherGame.inningHalf || ''} ${otherGame.inning || ''}`.trim()
                          : formatTime(otherGame.gameTime)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-blue-300">{otherGame.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentSeries && (
          <section className="overflow-hidden rounded-[1.25rem] border border-blue-700/80 bg-[#102b50] shadow-xl shadow-black/10" aria-label="Series storyline">
            <div className="bg-[linear-gradient(135deg,#163f72,#0d2c53)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Series storyline</p>
                  <h2 className="mt-1 text-2xl font-black text-white">{currentSeries.statusText}</h2>
                  <p className="mt-1 text-sm font-bold text-blue-100">{currentSeries.stakesText}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#CE1141] px-3 py-1.5 text-xs font-black text-white">
                  {currentSeries.isHome ? 'At Truist' : 'On the road'}
                </span>
              </div>

              <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(currentSeries.games.length, 4)}, minmax(0, 1fr))` }}>
                {currentSeries.games.map((seriesGame, index) => (
                  <div
                    key={seriesGame.gamePk}
                    className={`rounded-2xl border p-3 text-center ${
                      seriesGame.gamePk === game?.gamePk
                        ? 'border-[#CE1141] bg-[#CE1141]/20'
                        : 'border-blue-700 bg-[#071b34]/80'
                    }`}
                  >
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-blue-300">
                      Game {seriesGame.seriesGameNumber || index + 1}
                    </p>
                    <p className="mt-1 text-sm font-black text-white">{getSeriesGameResult(seriesGame)}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => askAbout(`What is the story of the current Braves series against the ${seriesStoryline.opponentName}?`)}
                className="mt-4 min-h-11 w-full rounded-2xl border border-blue-600 bg-[#071b34] px-4 py-2.5 text-sm font-black text-blue-100 transition hover:border-blue-400 hover:bg-[#0b284d] active:scale-[0.99]"
              >
                Give me the series read
              </button>
            </div>

            {seriesStoryline.history.length > 0 && (
              <details className="group border-t border-white/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">Recent series history</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      Last {seriesStoryline.history.length}: ATL {seriesStoryline.recentRecord.bravesWins}-{seriesStoryline.recentRecord.opponentWins}
                    </p>
                  </div>
                  <span className="text-xl font-black text-blue-300 transition group-open:rotate-45">+</span>
                </summary>
                <div className="space-y-3 border-t border-white/10 px-5 py-4">
                  {seriesStoryline.history.map((series) => (
                    <div key={`${series.startDate}-${series.location}`} className="rounded-2xl bg-[#071b34] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-blue-300">
                            {formatSeriesRange(series.startDate, series.endDate)} · {series.isHome ? 'Atlanta' : `at ${seriesStoryline.opponentName}`}
                          </p>
                          <p className="mt-1 text-sm font-black text-white">{series.statusText}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {series.games.map((seriesGame, index) => (
                          <span key={seriesGame.gamePk} className="rounded-full border border-blue-800 px-2.5 py-1 text-xs font-bold text-blue-200">
                            G{seriesGame.seriesGameNumber || index + 1}: {getSeriesGameResult(seriesGame)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>
        )}

        <Link href="/gameday" className="block overflow-hidden rounded-[1.25rem] border border-[#CE1141]/70 bg-[linear-gradient(135deg,#CE1141,#9d0d31)] p-5 shadow-xl shadow-[#CE1141]/15 transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-100">GameDay picks</p>
              <h2 className="mt-1 text-xl font-black text-white">
                {hasGameDayPicks
                  ? status === 'Preview'
                    ? 'Your picks are in'
                    : status === 'Live'
                      ? 'Your picks are locked'
                      : status === 'Final'
                        ? 'Your results are ready'
                        : 'Your picks are saved'
                  : hasGame && status === 'Preview'
                    ? 'Call your shot before first pitch'
                    : hasGame && status === 'Live'
                      ? 'Follow GameDay live'
                      : hasGame && status === 'Final'
                        ? 'See the final GameDay result'
                        : 'Next prediction card'}
              </h2>
              <p className="mt-1 text-sm text-red-100">
                {hasGameDayPicks
                  ? status === 'Preview'
                    ? 'Review or update them any time before first pitch.'
                    : status === 'Live'
                      ? 'Follow all three picks as the game unfolds.'
                      : status === 'Final'
                        ? 'See what hit, what missed, and the points you earned.'
                        : 'Open your GameDay card.'
                  : hasGame
                    ? 'Braves homers, Braves runs, and your Pick to Click.'
                    : 'Opens on the next Braves game day.'}
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xl font-black text-[#CE1141]">&rarr;</span>
          </div>
        </Link>

        <a
          href={ALL_STAR_VOTE_URL}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-[1.25rem] border border-amber-300/40 bg-[linear-gradient(135deg,#163f72,#0d2c53)] p-5 shadow-xl shadow-black/10 transition active:scale-[0.99]"
          aria-label="Open the official MLB All-Star ballot"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">MLB All-Star Ballot</p>
              <h2 className="mt-1 text-xl font-black text-white">Send Braves to the All-Star Game</h2>
              <p className="mt-1 text-sm leading-6 text-blue-100">Cast your official MLB ballot and back your Braves.</p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-300 text-lg font-black text-[#071b34]">&rarr;</span>
          </div>
        </a>

        {showPreviousGame && lastBraves && lastOpponent && (
          <section className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-4 shadow-xl shadow-black/10" aria-label="Last game recap">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  {hasGame ? 'Previous game' : 'Most recent game'}
                </p>
                <h2 className="mt-1 text-lg font-black text-white">
                  Braves {lastBraves.score ?? 0}, {lastOpponent.team.name} {lastOpponent.score ?? 0}
                </h2>
                <p className="mt-1 text-sm text-blue-200">{formatGameDate(lastGame.gameTime)} · Official MLB Gameday</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a
                href={lastGameLink}
                target="_blank"
                rel="noreferrer"
                className="min-h-11 rounded-2xl bg-[#CE1141] px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-[#CE1141]/20 transition hover:bg-[#e01b50] active:scale-[0.98]"
              >
                Watch highlights
              </a>
              <button
                onClick={() => askAbout('Give me a quick recap of the Braves last game.')}
                className="min-h-11 rounded-2xl border border-blue-700 bg-[#071b34] px-4 py-3 text-sm font-black text-blue-100 transition hover:border-blue-400 hover:bg-[#0d2c53] active:scale-[0.98]"
              >
                Recap
              </button>
            </div>
          </section>
        )}

        <section className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-4 shadow-xl shadow-black/10">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Ask next</p>
              <h2 className="mt-1 text-xl font-black leading-snug text-white">Keeping you in the know about all things Braves</h2>
              <p className="mt-1 text-sm text-blue-200">Timely Braves prompts for game day, news, and team trends.</p>
            </div>
          </div>
          <div className="grid gap-2">
            {quickQuestions.map((q, i) => (
              <button key={i} onClick={() => askAbout(q)} className="min-h-11 rounded-2xl border border-blue-700 bg-[#071b34] px-4 py-2.5 text-left text-sm font-bold text-blue-100 transition hover:border-blue-400 hover:bg-[#0d2c53] active:scale-[0.99]">
                {q}
              </button>
            ))}
          </div>
          <button
            onClick={() => askAbout(hasGame ? "What should I know about today's Braves game?" : "When is the next Braves game?")}
            className="mt-3 min-h-12 w-full rounded-2xl bg-[#CE1141] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#CE1141]/20 transition hover:bg-[#e01b50] active:scale-[0.99]"
          >
            Ask your own question
          </button>
        </section>

        <Link href="/roster" className="block rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-4 shadow-xl shadow-black/10 transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Roster Watch</p>
              <h2 className="mt-1 text-lg font-black text-white">{injuries.length ? `${injuries.length} current injury updates` : 'Injuries and return timelines'}</h2>
              <p className="mt-1 text-sm text-blue-200">
                {injuries.length
                  ? `${injuries.slice(0, 2).map((player) => player.name).join(' · ')}${injuries.length > 2 ? ` · +${injuries.length - 2} more` : ''}`
                  : 'See who is out, who is rehabbing, and who may be back soon.'}
              </p>
            </div>
            <span className="text-2xl font-black text-blue-300">&rarr;</span>
          </div>
        </Link>

        {standings && (
          <section className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-4 shadow-xl shadow-black/10" aria-label="NL East standings">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">NL East standings</p>
            <div className="mb-2 flex px-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
              <span className="w-6"></span>
              <span className="flex-1">Team</span>
              <span className="w-16 text-center">W-L</span>
              <span className="w-16 text-center">PCT</span>
              <span className="w-12 text-center">GB</span>
            </div>
            <div className="space-y-2">
              {standings.map((t, i) => (
                <div key={t.id} className={"flex items-center rounded-2xl px-3 py-2.5 " + (t.id === BRAVES_ID ? "bg-[#CE1141] text-white font-black shadow-lg shadow-[#CE1141]/15" : "bg-[#071b34] text-blue-100")}>
                  <span className="text-xs w-6">{i + 1}</span>
                  <span className="flex-1 text-sm">{t.name}</span>
                  <span className="text-xs w-16 text-center">{t.wins}-{t.losses}</span>
                  <span className="text-xs w-16 text-center">{t.winningPercentage || '---'}</span>
                  <span className="text-xs w-12 text-center text-blue-400">{i === 0 ? "--" : (t.gamesBack === "0" ? "--" : t.gamesBack)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
