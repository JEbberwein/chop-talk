'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const BRAVES_ID = 144;
const STATS_KEY = 'ct_prediction_stats';

function comparableName(name = '') {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function emptyPredictionStats() {
  return { points: 0, correct: 0, total: 0, games: 0, history: [] };
}

function readPredictionStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || '') || emptyPredictionStats();
  } catch {
    return emptyPredictionStats();
  }
}

export default function MyBraves() {
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [favPlayer, setFavPlayer] = useState('');
  const [players, setPlayers] = useState([]);
  const [injuries, setInjuries] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [predictionStats, setPredictionStats] = useState(emptyPredictionStats);

  const fetchPlayerStats = useCallback(async (playerName) => {
    if (!playerName) return;
    setLoadingStats(true);
    setPlayerStats(null);

    try {
      const base = 'https://statsapi.mlb.com/api/v1';
      const [hittingRes, pitchingRes] = await Promise.all([
        fetch(`${base}/stats?stats=season&group=hitting&season=2026&teamId=${BRAVES_ID}&sportId=1&limit=50`),
        fetch(`${base}/stats?stats=season&group=pitching&season=2026&teamId=${BRAVES_ID}&sportId=1&limit=40`),
      ]);
      const [hittingData, pitchingData] = await Promise.all([hittingRes.json(), pitchingRes.json()]);
      const hitting = hittingData.stats?.[0]?.splits?.find(
        (entry) => comparableName(entry.player.fullName) === comparableName(playerName)
      );
      const pitching = pitchingData.stats?.[0]?.splits?.find(
        (entry) => comparableName(entry.player.fullName) === comparableName(playerName)
      );

      if (hitting) setPlayerStats({ type: 'hitting', stat: hitting.stat, name: hitting.player.fullName });
      else if (pitching) setPlayerStats({ type: 'pitching', stat: pitching.stat, name: pitching.player.fullName });
    } catch {
      setPlayerStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const savedName = localStorage.getItem('ct_name') || '';
      const savedPlayer = localStorage.getItem('ct_fav_player') || '';
      setName(savedName);
      setTempName(savedName);
      setEditingName(!savedName);
      setFavPlayer(savedPlayer);
      setPredictionStats(readPredictionStats());

      try {
        const [gameRes, injuryRes] = await Promise.all([fetch('/api/game'), fetch('/api/injuries')]);
        const [gameData, injuryData] = await Promise.all([gameRes.json(), injuryRes.json()]);
        const combined = [
          ...(gameData.activePlayers || []).map((player) => player.name),
          ...(injuryData.injuries || []).map((player) => player.name),
        ];
        setPlayers([...new Set(combined)].sort());
        setInjuries(injuryData.injuries || []);
      } catch {
        setPlayers(savedPlayer ? [savedPlayer] : []);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!favPlayer) return;
    const timer = setTimeout(() => fetchPlayerStats(favPlayer), 0);
    return () => clearTimeout(timer);
  }, [favPlayer, fetchPlayerStats]);

  const favoriteInjury = useMemo(
    () => injuries.find((player) => comparableName(player.name) === comparableName(favPlayer)),
    [favPlayer, injuries]
  );
  const accuracy = predictionStats.total
    ? Math.round((predictionStats.correct / predictionStats.total) * 100)
    : 0;

  const saveName = () => {
    const nextName = tempName.trim();
    if (!nextName) return;
    setName(nextName);
    localStorage.setItem('ct_name', nextName);
    setEditingName(false);
  };

  const selectPlayer = (event) => {
    const player = event.target.value;
    setFavPlayer(player);
    localStorage.setItem('ct_fav_player', player);
  };

  return (
    <div className="min-h-[calc(100dvh-6rem)] bg-[#071b34] px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,#123663,#0b284d)] p-6 shadow-2xl shadow-black/20">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">My Braves</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">{name ? `${name}'s fan dashboard` : 'Make Chop Talk yours'}</h1>
          <p className="mt-2 text-sm leading-6 text-blue-100">Your favorite Brave, GameDay record, and the updates you care about most.</p>
        </header>

        <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-5">
          {editingName ? (
            <>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Fan name</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={tempName}
                  onChange={(event) => setTempName(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && saveName()}
                  placeholder="What should we call you?"
                  className="min-h-12 min-w-0 flex-1 rounded-2xl border border-blue-700 bg-[#071b34] px-4 text-sm text-white outline-none placeholder:text-blue-400"
                />
                <button onClick={saveName} disabled={!tempName.trim()} className="rounded-2xl bg-[#CE1141] px-5 text-sm font-black text-white disabled:bg-blue-900">Save</button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Fan name</p><p className="mt-1 text-2xl font-black text-white">{name}</p></div>
              <button onClick={() => setEditingName(true)} className="rounded-full border border-blue-700 px-4 py-2 text-xs font-black text-blue-100">Edit</button>
            </div>
          )}
        </section>

        <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">GameDay record</p>
              <p className="mt-1 text-4xl font-black text-white">{predictionStats.points} <span className="text-base font-bold text-blue-300">points</span></p>
            </div>
            <Link href="/gameday" className="rounded-full bg-[#CE1141] px-4 py-2 text-xs font-black text-white">Make picks</Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-[#071b34] p-3"><p className="text-2xl font-black text-white">{predictionStats.games}</p><p className="text-[0.68rem] font-bold uppercase text-blue-400">Games</p></div>
            <div className="rounded-2xl bg-[#071b34] p-3"><p className="text-2xl font-black text-white">{accuracy}%</p><p className="text-[0.68rem] font-bold uppercase text-blue-400">Accuracy</p></div>
            <div className="rounded-2xl bg-[#071b34] p-3"><p className="text-2xl font-black text-white">{predictionStats.correct}</p><p className="text-[0.68rem] font-bold uppercase text-blue-400">Correct</p></div>
          </div>
        </section>

        <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Favorite Brave</p>
          <h2 className="mt-1 text-xl font-black text-white">Your player card</h2>
          <select value={favPlayer} onChange={selectPlayer} className="mt-4 min-h-12 w-full rounded-2xl border border-blue-700 bg-[#071b34] px-4 text-sm font-bold text-white outline-none">
            <option value="">Choose a player...</option>
            {players.map((player) => <option key={player} value={player}>{player}</option>)}
          </select>

          {favoriteInjury && (
            <div className="mt-4 rounded-2xl border border-[#CE1141]/60 bg-[#CE1141]/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-white">Currently on Roster Watch</p>
                <span className="rounded-full bg-[#CE1141] px-3 py-1 text-xs font-black text-white">{favoriteInjury.expectedReturn}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-blue-100">{favoriteInjury.injury}. {favoriteInjury.status}</p>
              <Link href="/roster" className="mt-3 inline-block text-xs font-black text-blue-200 underline underline-offset-4">View full update</Link>
            </div>
          )}

          {favPlayer && (
            <div className="mt-4 rounded-2xl bg-[#071b34] p-4">
              {loadingStats ? (
                <p className="text-center text-sm font-bold text-blue-300">Loading 2026 stats...</p>
              ) : playerStats ? (
                <>
                  <p className="mb-3 text-sm font-black text-white">{playerStats.name} · 2026</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {(playerStats.type === 'hitting'
                      ? [['AVG', playerStats.stat.avg || '.000'], ['HR', playerStats.stat.homeRuns || 0], ['RBI', playerStats.stat.rbi || 0], ['OPS', playerStats.stat.ops || '.000']]
                      : [['ERA', playerStats.stat.era || '-.--'], ['W-L', `${playerStats.stat.wins || 0}-${playerStats.stat.losses || 0}`], ['WHIP', playerStats.stat.whip || '-.--'], ['K', playerStats.stat.strikeOuts || 0]]
                    ).map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-[#102b50] p-2"><p className="text-lg font-black text-white">{value}</p><p className="text-[0.68rem] font-bold text-blue-400">{label}</p></div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-sm leading-6 text-blue-300">No current 2026 stat line is available for this player.</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Recent picks</p><h2 className="mt-1 text-xl font-black text-white">Your GameDay history</h2></div>
          </div>
          {predictionStats.history?.length ? (
            <div className="mt-4 space-y-2">
              {predictionStats.history.slice(0, 5).map((entry) => (
                <div key={entry.gamePk} className="flex items-center justify-between rounded-2xl bg-[#071b34] p-4">
                  <div><p className="text-sm font-black text-white">vs. {entry.opponent}</p><p className="mt-1 text-xs text-blue-400">{entry.score} · {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div>
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#CE1141] text-lg font-black text-white">{entry.points}/3</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-blue-700 bg-[#071b34] p-5 text-center">
              <p className="text-sm font-black text-white">Your first prediction card is waiting</p>
              <p className="mt-1 text-xs leading-5 text-blue-300">Make picks before first pitch and the result will appear here after the game.</p>
            </div>
          )}
        </section>

        <Link href="/roster" className="block rounded-[1.25rem] border border-blue-700 bg-[#102b50] p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Roster Watch</p>
          <p className="mt-1 text-lg font-black text-white">See every injury and expected return</p>
        </Link>
      </div>
    </div>
  );
}
