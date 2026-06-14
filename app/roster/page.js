'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RosterWatch() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/injuries');
        setData(await response.json());
      } catch {
        setData({ injuries: [] });
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[calc(100dvh-6rem)] bg-[#071b34] px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,#123663,#0b284d)] p-6 shadow-2xl shadow-black/20">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Roster Watch</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Who&apos;s out. Who&apos;s close.</h1>
          <p className="mt-2 text-sm leading-6 text-blue-100">Current Braves injuries, rehab progress, and expected return windows from MLB&apos;s official team tracker.</p>
        </header>

        {loading && (
          <div className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-6 text-center">
            <p className="text-sm font-bold text-blue-200">Checking the latest roster updates...</p>
          </div>
        )}

        {!loading && data?.injuries?.length === 0 && (
          <div className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-6 text-center">
            <h2 className="text-xl font-black text-white">Updates are temporarily unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-blue-200">You can still open the official Braves injury tracker below.</p>
          </div>
        )}

        {(data?.injuries || []).map((player, index) => (
          <article key={`${player.name}-${index}`} className="overflow-hidden rounded-[1.25rem] border border-blue-800 bg-[#102b50] shadow-xl shadow-black/10">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">{player.position || 'Braves'}</p>
                <h2 className="mt-1 text-xl font-black text-white">{player.name}</h2>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-black ${player.expectedReturn === 'TBD' ? 'bg-blue-950 text-blue-200' : 'bg-[#CE1141] text-white'}`}>
                {player.expectedReturn}
              </span>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#071b34] p-3">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-blue-400">Injury</p>
                  <p className="mt-1 text-sm font-bold text-white">{player.injury || 'Not listed'}</p>
                </div>
                <div className="rounded-2xl bg-[#071b34] p-3">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-blue-400">IL date</p>
                  <p className="mt-1 text-sm font-bold text-white">{player.ilDate || 'Not listed'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Latest status</p>
                <p className="mt-2 text-sm leading-6 text-blue-100">{player.status || 'No additional update is available.'}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-blue-400">{player.lastUpdated ? `Updated ${player.lastUpdated}` : 'Official MLB update'}</p>
                <a href={player.link} target="_blank" rel="noreferrer" className="rounded-full border border-blue-700 px-3 py-2 text-xs font-black text-blue-100">
                  Source
                </a>
              </div>
            </div>
          </article>
        ))}

        <section className="rounded-[1.25rem] border border-blue-800 bg-[#102b50] p-5">
          <p className="text-sm leading-6 text-blue-200">Return dates are estimates and can move as players progress through treatment and rehab assignments.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/ask?q=Summarize%20the%20Braves%20injury%20situation%20and%20how%20it%20affects%20the%20team" className="rounded-2xl bg-[#CE1141] px-4 py-3 text-center text-sm font-black text-white">
              Ask Chop Talk
            </Link>
            <a href={data?.sourceUrl || 'https://www.mlb.com/braves/news/braves-injuries-and-roster-moves'} target="_blank" rel="noreferrer" className="rounded-2xl border border-blue-700 px-4 py-3 text-center text-sm font-black text-blue-100">
              Official tracker
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
