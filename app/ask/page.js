'use client';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const SUGGESTIONS = [
  "Who's starting tonight?",
  "How is Acuna hitting this season?",
  "Who leads the team in home runs?",
  "Should I turn the game on?",
  "Compare Olson and Riley this season",
  "When did the Braves last win the World Series?",
];

function AskInner() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "What's up? Ask me anything about the Braves: stats, history, tonight's game, or who is hot right now.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const sentRef = useRef(false);

  const sendMessage = useCallback(async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput('');
    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply || 'Something went wrong.' }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "Couldn't connect right now. Try again." }]);
    }

    setLoading(false);
  }, [input, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !sentRef.current) {
      sentRef.current = true;
      sendMessage(q);
    }
  }, [searchParams, sendMessage]);

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
            Ask about tonight&apos;s matchup, player stats, injuries, history, or whether the game is worth turning on.
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
          <section className="rounded-[1.25rem] border border-blue-800/80 bg-[#102b50] p-4 shadow-xl shadow-black/10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Start with one tap</p>
            <p className="mt-1 text-sm text-blue-100">A few useful prompts for game day and roster questions.</p>
            <div className="mt-4 grid gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} className="min-h-11 rounded-2xl border border-blue-700 bg-[#071b34] px-4 py-2.5 text-left text-sm font-bold text-blue-100 transition hover:border-blue-400 hover:bg-[#0d2c53] active:scale-[0.99]">
                  {s}
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
          <button type="submit" disabled={loading || !input.trim()} className="min-h-11 rounded-2xl bg-[#CE1141] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[#CE1141]/20 transition hover:bg-[#e01b50] active:scale-[0.98] disabled:bg-blue-900 disabled:text-blue-300 disabled:shadow-none">
            Send
          </button>
        </div>
        <p className="mt-2 px-1 text-xs text-blue-300">Answers use live app context when available. For breaking news, ask directly.</p>
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
