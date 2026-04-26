'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BRAVES_ID = 144;

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
    <div className="min-h-screen bg-[#0C2340] flex items-center justify-center">
      <div className="flex gap-1">
        <span className="w-3 h-3 bg-[#CE1141] rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
        <span className="w-3 h-3 bg-[#CE1141] rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
        <span className="w-3 h-3 bg-[#CE1141] rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
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
    <div className="min-h-screen bg-[#0C2340] px-4 py-10">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <h1 className="text-white text-3xl font-black tracking-tight">⚾ Chop Talk</h1>
          <p className="text-blue-300 text-sm mt-1">{new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {!game ? (
          <div className="bg-[#13274F] rounded-2xl p-6 border border-blue-900 text-center">
            <p className="text-4xl mb-3">??</p>
            <p className="text-white font-bold text-lg">No game today</p>
            <p className="text-blue-400 text-sm mt-1">Enjoy the off day � the Braves will be back soon.</p>
            <button onClick={() => askAbout('When is the next Braves game?')} className="mt-4 bg-[#CE1141] text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-red-700 transition-colors">
              When is the next game? ?
            </button>
          </div>
        ) : (
          <div className="bg-[#13274F] rounded-2xl border border-blue-900 overflow-hidden">
            <div className="bg-[#CE1141] px-4 py-2 flex justify-between items-center">
              <span className="text-white text-xs font-bold uppercase tracking-widest">
                {status === 'Live' ? (inningHalf + ' ' + inning) : status === 'Final' ? 'Final' : formatTime(game.gameDate)}
              </span>
              {broadcast && <span className="text-white text-xs font-semibold">TV: {broadcast}</span>}
              {status === 'Live' && <span className="flex items-center gap-1 text-white text-xs font-bold"><span className="w-2 h-2 bg-white rounded-full animate-pulse"/> LIVE</span>}
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-white font-black text-lg">ATL</p>
                  <p className="text-blue-300 text-xs">{isHome ? 'Home' : 'Away'}</p>
                  {(status === 'Live' || status === 'Final') && <p className="text-white text-5xl font-black mt-2">{braves.score ?? 0}</p>}
                </div>
                <div className="text-center px-4">
                  <p className="text-blue-400 text-2xl font-black">{status === 'Preview' ? 'VS' : '-'}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-white font-black text-lg">{opponent.team.abbreviation || opponent.team.name.split(' ').pop()}</p>
                  <p className="text-blue-300 text-xs">{isHome ? 'Away' : 'Home'}</p>
                  {(status === 'Live' || status === 'Final') && <p className="text-white text-5xl font-black mt-2">{opponent.score ?? 0}</p>}
                </div>
              </div>
              {status === 'Preview' && (bravesP || oppP) && (
                <div className="mt-4 pt-4 border-t border-blue-900">
                  <p className="text-blue-400 text-xs uppercase tracking-widest mb-2 text-center">Probable Pitchers</p>
                  <div className="flex justify-between text-center">
                    <div className="flex-1"><p className="text-white text-sm font-bold">{bravesP ? bravesP.fullName : 'TBD'}</p><p className="text-blue-400 text-xs">ATL</p></div>
                    <div className="flex-1"><p className="text-white text-sm font-bold">{oppP ? oppP.fullName : 'TBD'}</p><p className="text-blue-400 text-xs">{opponent.team.abbreviation}</p></div>
                  </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-blue-900">
                <p className="text-blue-400 text-xs">{opponent.team.name} � {isHome ? 'Truist Park' : 'Away'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#13274F] rounded-2xl p-4 border border-blue-900">
          <p className="text-blue-400 text-xs uppercase tracking-widest mb-3">Ask Chop Talk</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Who is pitching tonight?",
              "Where can I watch the game?",
              "Who leads the team in home runs?",
              "How is the bullpen performing?",
              "What is the Braves record?",
              "Latest Braves news?"
            ].map((q, i) => (
              <button key={i} onClick={() => askAbout(q)} className="bg-[#0C2340] border border-blue-800 text-blue-300 text-xs px-3 py-2 rounded-full hover:bg-blue-900 hover:text-white transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>

        {standings && (
          <div className="bg-[#13274F] rounded-2xl p-4 border border-blue-900">
            <p className="text-blue-400 text-xs uppercase tracking-widest mb-3">NL East Standings</p>
            <div className="space-y-2">
              {standings.map((t, i) => (
                <div key={i} className={"flex items-center justify-between py-1 " + (t.team.id === BRAVES_ID ? "text-white font-bold" : "text-blue-300")}>
                  <span className="text-xs w-5">{i + 1}</span>
                  <span className="flex-1 text-sm">{t.team.name}</span>
                  <span className="text-xs w-12 text-right">{t.wins}-{t.losses}</span>
                  <span className="text-xs w-10 text-right text-blue-400">{i === 0 ? "�" : (t.gamesBack === "0" ? "�" : t.gamesBack + " GB")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
