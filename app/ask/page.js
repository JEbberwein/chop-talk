'use client';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const ASK_DAILY_LIMIT = 20;

function formatGameDate(gameTime) {
  if (!gameTime) return '';
  return new Date(gameTime).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function getGameReference(game) {
  if (!game || game.status === 'OFF_DAY' || game.status === 'ERROR') return null;
  const date = formatGameDate(game.gameTime);
  return `${date}'s Braves game against the ${game.opponentName}`;
}

function getSuggestions(game) {
  if (!game || game.status === 'ERROR') {
    return [
      { label: 'TEAM PULSE', text: 'What is the biggest Braves storyline right now?' },
      { label: 'HOT BAT', text: 'Who is swinging the hottest bat for the Braves?' },
      { label: 'ROSTER WATCH', text: 'Which Braves injury update matters most right now?' },
      { label: 'NL EAST', text: 'Give me the Braves division-race picture in plain English.' },
    ];
  }

  if (game.status === 'OFF_DAY') {
    const opponent = game.nextGame?.opponentName;
    return [
      { label: 'NEXT UP', text: opponent ? `Set up the Braves' next game against the ${opponent}.` : 'When do the Braves play next, and what should I know?' },
      { label: 'TEAM PULSE', text: 'What is the biggest Braves storyline on this off-day?' },
      { label: 'WHO IS HOT', text: 'Which Braves hitters have been producing lately?' },
      { label: 'ROSTER WATCH', text: 'Who could be the next injured Brave to return?' },
    ];
  }

  const opponent = game.opponentName || 'today\'s opponent';
  const gameReference = getGameReference(game);

  if (game.status === 'Live') {
    return [
      { label: 'GAME READ', text: `What has shaped ${gameReference} so far?` },
      { label: 'WATCH NEXT', text: `What should a Braves fan watch for next in ${gameReference}?` },
      { label: 'BULLPEN', text: `Who is likely available from the Braves bullpen in ${gameReference}?` },
      { label: 'TURNING POINT', text: `What has been the biggest moment of ${gameReference} so far?` },
    ];
  }

  if (game.status === 'Final') {
    return [
      { label: 'THE RECAP', text: `Give me the fan's recap of ${gameReference}.` },
      { label: 'TURNING POINT', text: `What play changed ${gameReference}?` },
      { label: 'GAME BALL', text: `Who deserves the Braves game ball for ${gameReference}, and why?` },
      { label: 'WHAT IT MEANS', text: `What does the result of ${gameReference} mean for the Braves?` },
    ];
  }

  return [
    { label: '60-SECOND PREVIEW', text: `Give me the one-minute preview for ${gameReference}.` },
    { label: 'KEY MATCHUP', text: `What matchup could decide ${gameReference}?` },
    { label: 'BAT TO WATCH', text: `Which Braves hitter is most likely to make noise in ${gameReference}?` },
    { label: 'PITCHING PLAN', text: `How should the Braves attack the ${opponent} in ${gameReference}?` },
  ];
}

function getAskContext(game) {
  if (!game || game.status === 'ERROR') {
    return {
      title: 'What are Braves fans talking about?',
      subtitle: 'Tap a live storyline or ask your own question.',
    };
  }

  if (game.status === 'OFF_DAY') {
    const nextGameDate = formatGameDate(game.nextGame?.gameTime);
    return {
      eyebrow: nextGameDate ? `NEXT GAME · ${nextGameDate}` : 'OFF DAY',
      title: 'No game, still plenty to talk about',
      subtitle: 'Look ahead, check the roster, or catch up on the team.',
    };
  }

  const gameDate = formatGameDate(game.gameTime);
  const location = game.isHome ? `vs. ${game.opponentName}` : `at ${game.opponentName}`;

  if (game.status === 'Live') {
    return {
      eyebrow: `LIVE · ${gameDate} · ${location}`,
      title: `Braves ${game.bravesScore}, ${game.opponentAbbr} ${game.opponentScore}`,
      subtitle: `${game.inningHalf || ''} ${game.inning || ''} · Get the fan's read on the game as it unfolds.`,
    };
  }

  if (game.status === 'Final') {
    return {
      eyebrow: `FINAL · ${gameDate} · ${location}`,
      title: `Final: Braves ${game.bravesScore}, ${game.opponentAbbr} ${game.opponentScore}`,
      subtitle: `These prompts refer to the completed game on ${gameDate}.`,
    };
  }

  return {
    eyebrow: `UPCOMING · ${gameDate} · ${location}`,
    title: `Braves ${game.isHome ? 'vs.' : 'at'} ${game.opponentName}`,
    subtitle: `These prompts refer to the game scheduled for ${gameDate}.`,
  };
}

function getTodayKey() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function getAskUsage() {
  try {
    const today = getTodayKey();
    const saved = JSON.parse(localStorage.getItem('ct_ask_usage') || '{}');
    return saved.date === today && Number.isInteger(saved.count) ? saved.count : 0;
  } catch {
    return 0;
  }
}

function incrementAskUsage() {
  try {
    const today = getTodayKey();
    const nextCount = getAskUsage() + 1;
    localStorage.setItem('ct_ask_usage', JSON.stringify({ date: today, count: nextCount }));
    return nextCount;
  } catch {
    return 0;
  }
}

function AskInner() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "What's up? Ask me anything about the Braves: today's game, player stats, injuries, history, or who is hot right now.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(ASK_DAILY_LIMIT);
  const [game, setGame] = useState(null);
  const bottomRef = useRef(null);
  const sentRef = useRef(false);
  const suggestions = getSuggestions(game);
  const askContext = getAskContext(game);

  const sendMessage = useCallback(async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput('');

    const used = getAskUsage();
    if (used >= ASK_DAILY_LIMIT) {
      setRemaining(0);
      setMessages([
        ...messages,
        { role: 'user', content: userText },
        {
          role: 'assistant',
          content: "You've hit today's Chop Talk Ask limit. The game snapshot, standings, recap, and radio link still work, and Ask will reset tomorrow.",
        },
      ]);
      return;
    }

    const nextCount = incrementAskUsage();
    if (nextCount > 0) setRemaining(Math.max(ASK_DAILY_LIMIT - nextCount, 0));

    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          selectedGame: game && !['OFF_DAY', 'ERROR'].includes(game.status) ? {
            gamePk: game.gamePk,
            status: game.status,
            gameTime: game.gameTime,
            opponentName: game.opponentName,
            opponentAbbr: game.opponentAbbr,
            isHome: game.isHome,
            bravesScore: game.bravesScore,
            opponentScore: game.opponentScore,
          } : null,
        }),
      });
      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply || 'Something went wrong.' }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "Chop Talk is taking a quick timeout. Try again soon, or use the Today tab for game time, standings, radio, and recap links." }]);
    }

    setLoading(false);
  }, [game, input, messages]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(Math.max(ASK_DAILY_LIMIT - getAskUsage(), 0));
  }, []);

  useEffect(() => {
    const loadGame = async () => {
      try {
        const response = await fetch(`/api/game?ask=${Date.now()}`, { cache: 'no-store' });
        setGame(await response.json());
      } catch {
        setGame({ status: 'ERROR' });
      }
    };
    const timer = setTimeout(loadGame, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && game && !sentRef.current) {
      sentRef.current = true;
      sendMessage(q);
    }
  }, [game, searchParams, sendMessage]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col bg-[#071b34]">
      <header className="mx-auto w-full max-w-md px-4 pb-4 pt-6">
        <div className="rounded-[1.5rem] border border-white/10 bg-[#0b284d] p-5 shadow-2xl shadow-black/20">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Ask Chop Talk</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Braves answers, fast</h1>
          <p className="mt-2 text-sm leading-6 text-blue-100">
            Ask about today&apos;s matchup, player stats, injuries, history, and what Braves fans should know right now.
          </p>
        </div>
      </header>

      <div className="mx-auto min-h-0 w-full max-w-md flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-[1.1rem] px-4 py-3 text-sm leading-6 shadow-lg shadow-black/10 ${m.role === 'user' ? 'rounded-br-md bg-[#CE1141] text-white' : 'rounded-bl-md border border-blue-800/80 bg-[#102b50] text-white'}`}>
              {m.content}
            </div>
          </div>
        ))}

        {messages.length === 1 && (
          <section className="overflow-hidden rounded-[1.25rem] border border-blue-700/80 bg-[#102b50] shadow-xl shadow-black/10">
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,#123663,#0b284d)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
                {askContext.eyebrow || 'Talk about the Braves'}
              </p>
              <h2 className="mt-2 text-xl font-black leading-snug text-white">{askContext.title}</h2>
              <p className="mt-1 text-sm leading-6 text-blue-100">{askContext.subtitle}</p>
            </div>
            <div className="grid gap-2 p-3">
              {suggestions.map((suggestion) => (
                <button key={suggestion.text} onClick={() => sendMessage(suggestion.text)} disabled={loading || remaining <= 0} className="group flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-blue-800 bg-[#071b34] px-4 py-3 text-left transition hover:border-blue-400 hover:bg-[#0d2c53] active:scale-[0.99] disabled:border-blue-900 disabled:text-blue-500">
                  <span>
                    <span className="block text-[0.65rem] font-black uppercase tracking-[0.18em] text-[#EF476F]">{suggestion.label}</span>
                    <span className="mt-1 block text-sm font-bold leading-5 text-white">{suggestion.text}</span>
                  </span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-900 text-base font-black text-blue-100 transition group-hover:bg-[#CE1141] group-hover:text-white">&rarr;</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {loading && (
          <div className="flex justify-start" role="status" aria-label="Chop Talk is writing an answer">
            <div className="rounded-[1.1rem] rounded-bl-md border border-blue-800/80 bg-[#102b50] px-4 py-3 shadow-lg shadow-black/10">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="mx-auto w-full max-w-md px-4 pb-4 pt-2" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
        <div className="flex gap-2 rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-2 shadow-2xl shadow-black/20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about the Braves..."
            aria-label="Ask Chop Talk about the Braves"
            className="min-h-11 flex-1 min-w-0 rounded-2xl bg-[#071b34] px-4 text-sm text-white outline-none placeholder:text-blue-300/70"
          />
          <button type="submit" disabled={loading || !input.trim() || remaining <= 0} className="min-h-11 rounded-2xl bg-[#CE1141] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[#CE1141]/20 transition hover:bg-[#e01b50] active:scale-[0.98] disabled:bg-blue-900 disabled:text-blue-300 disabled:shadow-none">
            Send
          </button>
        </div>
        <p className="mt-2 px-1 text-xs text-blue-300">
          {remaining > 0 ? `${remaining} Ask message${remaining === 1 ? '' : 's'} left today. ` : 'Daily Ask limit reached. '}
          Answers use live app context when available.
        </p>
      </form>
    </div>
  );
}

export default function Ask() {
  return (
    <Suspense>
      <AskInner />
    </Suspense>
  );
}
