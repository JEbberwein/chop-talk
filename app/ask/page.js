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
    <div className="min-h-[calc(100dvh-6rem)] bg-[#0C2340] flex flex-col">
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-white text-3xl font-black tracking-tight">Chop Talk</h1>
        <p className="text-blue-300 text-sm mt-1">Ask anything about the Braves</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 max-w-md mx-auto w-full space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-[#CE1141] text-white rounded-br-sm' : 'bg-[#13274F] text-white border border-blue-900 rounded-bl-sm'}`}>
              {m.content}
            </div>
          </div>
        ))}

        {messages.length === 1 && (
          <div className="pt-2">
            <p className="text-blue-400 text-xs uppercase tracking-widest mb-3">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} className="bg-[#13274F] border border-blue-800 text-blue-300 text-xs px-3 py-2 rounded-full hover:bg-blue-900 hover:text-white transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#13274F] border border-blue-900 rounded-2xl rounded-bl-sm px-4 py-3">
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

      <div className="px-4 pb-4 pt-2 max-w-md mx-auto w-full">
        <div className="flex gap-2 bg-[#13274F] border border-blue-900 rounded-2xl p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about the Braves..."
            className="flex-1 min-w-0 bg-transparent text-white placeholder-blue-600 text-sm px-2 outline-none"
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="bg-[#CE1141] text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-red-700 transition-colors">
            Send
          </button>
        </div>
      </div>
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
