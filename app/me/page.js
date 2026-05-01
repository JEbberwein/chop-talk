'use client';
import { useState, useCallback, useEffect } from 'react';

const BRAVES_ID = 144;

const PLAYERS = [
  'Ronald Acuna Jr.',
  'Matt Olson',
  'Austin Riley',
  'Ozzie Albies',
  'Michael Harris II',
  'Sean Murphy',
  'Chris Sale',
  'Spencer Strider',
  'Reynaldo Lopez',
  'AJ Smith-Shawver',
  'Jarred Kelenic',
  'Ramon Laureano',
];

function comparableName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function Me() {
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [streak, setStreak] = useState(0);
  const [favPlayer, setFavPlayer] = useState('');
  const [playerStats, setPlayerStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchPlayerStats = useCallback(async (playerName) => {
    setLoadingStats(true);
    setPlayerStats(null);

    try {
      const season = 2026;
      const base = 'https://statsapi.mlb.com/api/v1';
      const hittingRes = await fetch(base + '/stats?stats=season&group=hitting&season=' + season + '&teamId=' + BRAVES_ID + '&sportId=1&limit=40');
      const hittingData = await hittingRes.json();

      if (hittingData.stats && hittingData.stats[0] && hittingData.stats[0].splits) {
        const found = hittingData.stats[0].splits.find((p) => comparableName(p.player.fullName) === comparableName(playerName));
        if (found) {
          setPlayerStats({ type: 'hitting', stat: found.stat, name: found.player.fullName });
          setLoadingStats(false);
          return;
        }
      }

      const pitchingRes = await fetch(base + '/stats?stats=season&group=pitching&season=' + season + '&teamId=' + BRAVES_ID + '&sportId=1&limit=20');
      const pitchingData = await pitchingRes.json();

      if (pitchingData.stats && pitchingData.stats[0] && pitchingData.stats[0].splits) {
        const found = pitchingData.stats[0].splits.find((p) => comparableName(p.player.fullName) === comparableName(playerName));
        if (found) {
          setPlayerStats({ type: 'pitching', stat: found.stat, name: found.player.fullName });
          setLoadingStats(false);
          return;
        }
      }

      setPlayerStats(null);
    } catch {
      setPlayerStats(null);
    }

    setLoadingStats(false);
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem('ct_name') || '';
    const savedStreak = parseInt(localStorage.getItem('ct_streak') || '0');
    const savedPlayer = localStorage.getItem('ct_fav_player') || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(savedName);
    setStreak(savedStreak);
    setFavPlayer(savedPlayer);
    if (!savedName) setEditingName(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (favPlayer) fetchPlayerStats(favPlayer);
  }, [favPlayer, fetchPlayerStats]);

  const saveName = () => {
    const n = tempName.trim();
    if (!n) return;
    setName(n);
    localStorage.setItem('ct_name', n);
    setEditingName(false);
  };

  const selectPlayer = (p) => {
    setFavPlayer(p);
    localStorage.setItem('ct_fav_player', p);
  };

  return (
    <div className="min-h-[calc(100dvh-6rem)] bg-[#071b34] px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-[1.5rem] border border-white/10 bg-[#0b284d] p-5 shadow-2xl shadow-black/20">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Profile</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">{name ? `Hey, ${name}` : 'Make it yours'}</h1>
          <p className="mt-2 text-sm leading-6 text-blue-100">
            Save your fan name, choose a favorite Brave, and track the quiz streak that lives on this browser.
          </p>
        </header>

        <section className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-5 shadow-xl shadow-black/10">
          {editingName ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">First step</p>
              <h2 className="text-xl font-black text-white">What should we call you?</h2>
              <p className="mt-1 text-sm text-blue-200">This only saves on this browser for now.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  placeholder="Enter your name..."
                  aria-label="Fan name"
                  className="mt-4 min-h-11 flex-1 min-w-0 rounded-2xl border border-blue-800 bg-[#071b34] px-4 text-sm text-white outline-none placeholder:text-blue-300/70"
                  autoFocus
                />
                <button onClick={saveName} disabled={!tempName.trim()} className="mt-4 min-h-11 rounded-2xl bg-[#CE1141] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[#CE1141]/20 transition hover:bg-[#e01b50] active:scale-[0.98] disabled:bg-blue-900 disabled:text-blue-300 disabled:shadow-none">
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Fan name</p>
                <p className="text-2xl font-black text-white">{name}</p>
              </div>
              <button onClick={() => { setTempName(name); setEditingName(true); }} className="min-h-10 rounded-full border border-blue-700 px-4 py-2 text-xs font-bold text-blue-100 transition hover:border-blue-400 hover:bg-white/5 active:scale-[0.98]">
                Edit
              </button>
            </div>
          )}
        </section>

        <section className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-5 shadow-xl shadow-black/10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Quiz streak</p>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#CE1141] font-black text-white shadow-lg shadow-[#CE1141]/20">S</div>
            <div>
              <p className="text-4xl font-black text-white">{streak} <span className="text-lg font-normal text-blue-300">day{streak !== 1 ? 's' : ''}</span></p>
              <p className="mt-0.5 text-xs text-blue-300">{streak === 0 ? 'Take the quiz to start your streak.' : streak >= 7 ? 'You are on a roll. Keep it going.' : 'Keep coming back daily.'}</p>
            </div>
          </div>
          {streak === 0 && (
            <a href="/quiz" className="mt-5 block min-h-11 rounded-2xl bg-[#CE1141] px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-[#CE1141]/20 transition hover:bg-[#e01b50] active:scale-[0.98]">
              Start today&apos;s quiz
            </a>
          )}
        </section>

        <section className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-5 shadow-xl shadow-black/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Favorite Brave</p>
          <h2 className="text-xl font-black text-white">Personalize the player card</h2>
          <p className="mt-1 text-sm text-blue-200">Pick one player to keep a stat snapshot handy.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {PLAYERS.map((p) => (
              <button key={p} onClick={() => selectPlayer(p)} aria-pressed={favPlayer === p} className={`min-h-10 rounded-full border px-3 py-2 text-xs font-bold transition-all active:scale-[0.98] ${favPlayer === p ? 'border-[#CE1141] bg-[#CE1141] text-white shadow-lg shadow-[#CE1141]/20' : 'border-blue-700 bg-[#071b34] text-blue-100 hover:border-blue-400 hover:bg-[#0d2c53]'}`}>
                {p}
              </button>
            ))}
          </div>

          {!favPlayer && (
            <div className="rounded-2xl border border-dashed border-blue-700 bg-[#071b34] p-4 text-center">
              <p className="text-sm font-bold text-white">No favorite selected yet</p>
              <p className="mt-1 text-xs leading-5 text-blue-300">Choose a player above and this space becomes your quick stat card.</p>
            </div>
          )}

          {favPlayer && (
            <div className="rounded-2xl border border-blue-800 bg-[#071b34] p-4">
              {loadingStats ? (
                <p className="text-center text-sm text-blue-300" role="status">Loading stats...</p>
              ) : playerStats ? (
                <div>
                  <p className="mb-3 text-sm font-black text-white">{playerStats.name} - 2026 Stats</p>
                  {playerStats.type === 'hitting' ? (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        ['AVG', playerStats.stat.avg || '.000'],
                        ['HR', playerStats.stat.homeRuns || 0],
                        ['RBI', playerStats.stat.rbi || 0],
                        ['OPS', playerStats.stat.ops || '.000'],
                      ].map(([label, val]) => (
                        <div key={label} className="rounded-xl bg-[#102b50] p-2">
                          <p className="text-lg font-black text-white">{val}</p>
                          <p className="text-xs text-blue-300">{label}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        ['ERA', playerStats.stat.era || '-.--'],
                        ['W-L', (playerStats.stat.wins || 0) + '-' + (playerStats.stat.losses || 0)],
                        ['WHIP', playerStats.stat.whip || '-.--'],
                        ['K', playerStats.stat.strikeOuts || 0],
                      ].map(([label, val]) => (
                        <div key={label} className="rounded-xl bg-[#102b50] p-2">
                          <p className="text-lg font-black text-white">{val}</p>
                          <p className="text-xs text-blue-300">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-sm leading-6 text-blue-300">
                  No 2026 stat line found yet. This can happen before a player appears in a game or when roster data changes.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-5 shadow-xl shadow-black/10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">About</p>
          <p className="text-sm font-black text-white">Chop Talk</p>
          <p className="mt-1 text-xs leading-5 text-blue-300">Your Atlanta Braves companion for live scores, Q&A, daily trivia, and standings.</p>
          <p className="mt-3 text-xs text-blue-500">Version 1.0</p>
        </section>
      </div>
    </div>
  );
}
