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
    <div className="min-h-[calc(100dvh-6rem)] bg-[#0C2340] px-4 py-8">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <h1 className="text-white text-3xl font-black tracking-tight">My Profile</h1>
          <p className="text-blue-300 text-sm mt-1">Your Braves companion</p>
        </div>

        <div className="bg-[#13274F] rounded-2xl p-5 border border-blue-900">
          {editingName ? (
            <div>
              <p className="text-blue-400 text-xs uppercase tracking-widest mb-3">What should we call you?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  placeholder="Enter your name..."
                  className="flex-1 min-w-0 bg-[#0C2340] text-white placeholder-blue-600 text-sm px-3 py-2 rounded-xl border border-blue-800 outline-none"
                  autoFocus
                />
                <button onClick={saveName} className="bg-[#CE1141] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition-colors">
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-blue-400 text-xs uppercase tracking-widest mb-1">Fan</p>
                <p className="text-white text-2xl font-black">{name}</p>
              </div>
              <button onClick={() => { setTempName(name); setEditingName(true); }} className="text-blue-400 text-xs border border-blue-800 px-3 py-1 rounded-lg hover:text-white transition-colors">
                Edit
              </button>
            </div>
          )}
        </div>

        <div className="bg-[#13274F] rounded-2xl p-5 border border-blue-900">
          <p className="text-blue-400 text-xs uppercase tracking-widest mb-3">Quiz Streak</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#CE1141] flex items-center justify-center text-white font-black">S</div>
            <div>
              <p className="text-white text-4xl font-black">{streak} <span className="text-blue-400 text-lg font-normal">day{streak !== 1 ? 's' : ''}</span></p>
              <p className="text-blue-400 text-xs mt-0.5">{streak === 0 ? 'Take the quiz to start your streak.' : streak >= 7 ? 'You are on a roll. Keep it going.' : 'Keep coming back daily.'}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#13274F] rounded-2xl p-5 border border-blue-900">
          <p className="text-blue-400 text-xs uppercase tracking-widest mb-3">Favorite Brave</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {PLAYERS.map((p) => (
              <button key={p} onClick={() => selectPlayer(p)} className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${favPlayer === p ? 'bg-[#CE1141] border-[#CE1141] text-white' : 'bg-[#0C2340] border-blue-800 text-blue-300 hover:text-white'}`}>
                {p}
              </button>
            ))}
          </div>

          {favPlayer && (
            <div className="bg-[#0C2340] rounded-xl p-4 border border-blue-900">
              {loadingStats ? (
                <p className="text-blue-400 text-sm text-center">Loading stats...</p>
              ) : playerStats ? (
                <div>
                  <p className="text-white font-bold text-sm mb-3">{playerStats.name} - 2026 Stats</p>
                  {playerStats.type === 'hitting' ? (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        ['AVG', playerStats.stat.avg || '.000'],
                        ['HR', playerStats.stat.homeRuns || 0],
                        ['RBI', playerStats.stat.rbi || 0],
                        ['OPS', playerStats.stat.ops || '.000'],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <p className="text-white font-black text-lg">{val}</p>
                          <p className="text-blue-400 text-xs">{label}</p>
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
                        <div key={label}>
                          <p className="text-white font-black text-lg">{val}</p>
                          <p className="text-blue-400 text-xs">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-blue-400 text-sm text-center">
                  No 2026 stat line found yet. This can happen before a player appears in a game or when roster data changes.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#13274F] rounded-2xl p-5 border border-blue-900">
          <p className="text-blue-400 text-xs uppercase tracking-widest mb-3">About</p>
          <p className="text-white font-bold text-sm">Chop Talk</p>
          <p className="text-blue-400 text-xs mt-1">Your Atlanta Braves companion for live scores, Q&A, daily trivia, and standings.</p>
          <p className="text-blue-600 text-xs mt-3">Version 1.0</p>
        </div>
      </div>
    </div>
  );
}
