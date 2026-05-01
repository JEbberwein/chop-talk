'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BRAVES_ID = 144;
const QUICK_QUESTIONS = [
  "Who is pitching tonight?",
  "Where can I watch the game?",
  "How is the bullpen performing?",
  "Latest Braves news?",
];

export default function Today() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
        const season = 2026;
        const base = 'https://statsapi.mlb.com/api/v1';
        const [gameRes, standRes] = await Promise.all([
          fetch(base + '/schedule?teamId=' + BRAVES_ID + '&sportId=1&startDate=' + today + '&endDate=' + today + '&hydrate=probablePitcher,linescore,broadcasts'),
          fetch(base + '/standings?leagueId=104&season=' + season + '&standingsTypes=regularSeason'),
        ]);
        const [gameData, standData] = await Promise.all([gameRes.json(), standRes.json()]);
        if (gameData.dates && gameData.dates.length > 0) {
          setGame(gameData.dates[0].games[0]);
        } else {
          setGame(null);
        }
        if (standData.records) {
          const nlEast = standData.records.find(r => r.division && r.division.id === 204);
          setStandings(nlEast ? nlEast.teamRecords.slice(0, 5) : null);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const askAbout = (question) => {
    router.push('/ask?q=' + encodeURIComponent(question));
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true }) + ' ET';
  };

  const getBroadcast = (g) => {
    if (!g || !g.broadcasts) return null;
    const tv = g.broadcasts.find(b => b.type === 'TV' || b.name);
    return tv ? tv.name : null;
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

  const isHome = game && game.teams && game.teams.home && game.teams.home.team && game.teams.home.team.id === BRAVES_ID;
  const braves = game ? (isHome ? game.teams.home : game.teams.away) : null;
  const opponent = game ? (isHome ? game.teams.away : game.teams.home) : null;
  const status = game ? game.status.abstractGameState : null;
  const inning = game && game.linescore ? game.linescore.currentInningOrdinal : null;
  const inningHalf = game && game.linescore ? game.linescore.inningHalf : null;
  const bravesP = game ? (isHome ? game.teams.home.probablePitcher : game.teams.away.probablePitcher) : null;
  const oppP = game ? (isHome ? game.teams.away.probablePitcher : game.teams.home.probablePitcher) : null;
  const broadcast = getBroadcast(game);

  return (
    <div className="min-h-[calc(100dvh-6rem)] bg-[#071b34] px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-[1.5rem] border border-white/10 bg-[#0b284d] p-5 shadow-2xl shadow-black/20">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Atlanta Braves companion</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Chop Talk</h1>
          <p className="mt-2 text-sm leading-6 text-blue-100">
            Live game context, fast Braves answers, standings, and a daily quiz in one pocket-friendly place.
          </p>
          <button
            onClick={() => askAbout(game ? "What should I know about today's Braves game?" : "When is the next Braves game?")}
            className="mt-5 min-h-12 w-full rounded-2xl bg-[#CE1141] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#CE1141]/25 transition hover:bg-[#e01b50] active:scale-[0.99]"
          >
            Ask about the Braves
          </button>
          <p className="mt-3 text-center text-xs text-blue-300">
            {new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Today</p>
            <h2 className="text-lg font-black text-white">Game snapshot</h2>
          </div>
          <button
            onClick={() => askAbout("Give me the Braves game preview in plain English.")}
            className="rounded-full border border-blue-700 px-3 py-2 text-xs font-bold text-blue-100 transition hover:border-blue-400 hover:bg-white/5 active:scale-[0.98]"
          >
            Preview
          </button>
        </div>

        {!game ? (
          <div className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-5 text-center shadow-xl shadow-black/10">
            <p className="text-xl font-black text-white">No game today</p>
            <p className="mt-2 text-sm leading-6 text-blue-200">Enjoy the off day. You can still ask about the next matchup, standings, roster news, or recent trends.</p>
            <button onClick={() => askAbout('When is the next Braves game?')} className="mt-5 min-h-11 rounded-2xl bg-[#CE1141] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#e01b50] active:scale-[0.98]">
              When is the next game?
            </button>
          </div>
        ) : (
          <section className="overflow-hidden rounded-[1.25rem] border border-blue-700/80 bg-[#102b50] shadow-xl shadow-black/15" aria-label="Today's Braves game">
            <div className="flex items-center justify-between gap-3 bg-[#CE1141] px-4 py-3">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                {status === 'Live' ? (inningHalf + ' ' + inning) : status === 'Final' ? 'Final' : formatTime(game.gameDate)}
              </span>
              {broadcast && <span className="truncate text-right text-xs font-bold text-white">TV: {broadcast}</span>}
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
                    <div className="rounded-2xl bg-[#071b34] p-3"><p className="text-sm font-black text-white">{bravesP ? bravesP.fullName : 'TBD'}</p><p className="mt-1 text-xs text-blue-300">ATL</p></div>
                    <div className="rounded-2xl bg-[#071b34] p-3"><p className="text-sm font-black text-white">{oppP ? oppP.fullName : 'TBD'}</p><p className="mt-1 text-xs text-blue-300">{opponent.team.abbreviation}</p></div>
                  </div>
                </div>
              )}
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs font-medium text-blue-200">{opponent.team.name} · {isHome ? 'Truist Park' : 'Away'}</p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-4 shadow-xl shadow-black/10">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Ask next</p>
              <h2 className="mt-1 text-lg font-black text-white">Get a quick answer</h2>
            </div>
          </div>
          <div className="grid gap-2">
            {QUICK_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => askAbout(q)} className="min-h-11 rounded-2xl border border-blue-700 bg-[#071b34] px-4 py-2.5 text-left text-sm font-bold text-blue-100 transition hover:border-blue-400 hover:bg-[#0d2c53] active:scale-[0.99]">
                {q}
              </button>
            ))}
          </div>
        </section>

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
                <div key={i} className={"flex items-center rounded-2xl px-3 py-2.5 " + (t.team.id === BRAVES_ID ? "bg-[#CE1141] text-white font-black shadow-lg shadow-[#CE1141]/15" : "bg-[#071b34] text-blue-100")}>
                  <span className="text-xs w-6">{i + 1}</span>
                  <span className="flex-1 text-sm">{t.team.name}</span>
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
