'use client';
import { useState, useEffect } from 'react';
const ALL_QUESTIONS = [
  { q: 'What year did the Braves win their most recent World Series?', opts: ['2019', '2021', '2022', '2023'], a: 1 },
  { q: 'Who is the Braves all-time home run leader?', opts: ['Chipper Jones', 'Dale Murphy', 'Hank Aaron', 'David Justice'], a: 2 },
  { q: 'What is the name of the Braves current home stadium?', opts: ['Turner Field', 'Fulton County Stadium', 'Truist Park', 'SunTrust Park'], a: 2 },
  { q: 'Which Brave won the 2021 World Series MVP?', opts: ['Freddie Freeman', 'Jorge Soler', 'Austin Riley', 'Eddie Rosario'], a: 1 },
  { q: 'What number did Hank Aaron wear?', opts: ['42', '44', '21', '35'], a: 1 },
  { q: 'What division do the Braves play in?', opts: ['NL West', 'NL Central', 'NL East', 'AL East'], a: 2 },
  { q: 'How many consecutive division titles did the Braves win from 2018 to 2023?', opts: ['4', '5', '6', '7'], a: 2 },
  { q: 'What city did the Braves move from before coming to Atlanta?', opts: ['Brooklyn', 'Milwaukee', 'Boston', 'Cincinnati'], a: 2 },
  { q: 'What year did Hank Aaron break Babe Ruths home run record?', opts: ['1972', '1973', '1974', '1975'], a: 2 },
  { q: 'Who is the current Atlanta Braves manager?', opts: ['Brian Snitker', 'Fredi Gonzalez', 'Walt Weiss', 'Bobby Cox'], a: 2 },
  { q: 'Which Braves player won the 2023 NL MVP?', opts: ['Matt Olson', 'Austin Riley', 'Ozzie Albies', 'Ronald Acuna Jr'], a: 3 },
  { q: 'What is the name of the Braves mascot?', opts: ['Tomahawk', 'Blooper', 'Chief Noc-A-Homa', 'Homer'], a: 1 },
  { q: 'How many World Series titles have the Braves won total?', opts: ['2', '3', '4', '5'], a: 1 },
  { q: 'What year did the Braves move to Truist Park?', opts: ['2015', '2016', '2017', '2018'], a: 2 },
  { q: 'Which Brave hit 51 home runs in the 2019 season?', opts: ['Freddie Freeman', 'Josh Donaldson', 'Ronald Acuna Jr', 'Matt Olson'], a: 2 },
  { q: 'What was the original name of Truist Park when it opened?', opts: ['Turner Field', 'SunTrust Park', 'BB&T Ballpark', 'Coca-Cola Field'], a: 1 },
  { q: 'Which Braves pitcher had a 20-win season in 2021?', opts: ['Max Fried', 'Charlie Morton', 'Ian Anderson', 'Drew Smyly'], a: 0 },
  { q: 'How many home runs did Hank Aaron hit in his career?', opts: ['714', '755', '762', '660'], a: 1 },
  { q: 'Who did the Braves beat in the 2021 World Series?', opts: ['Los Angeles Dodgers', 'Houston Astros', 'Tampa Bay Rays', 'Boston Red Sox'], a: 1 },
  { q: 'What number did Chipper Jones wear?', opts: ['5', '7', '10', '23'], a: 2 },
  { q: 'Which Brave won the 1995 World Series MVP?', opts: ['Tom Glavine', 'Greg Maddux', 'David Justice', 'John Smoltz'], a: 2 },
  { q: 'What year did the Braves win their first World Series in Atlanta?', opts: ['1991', '1992', '1995', '1999'], a: 2 },
  { q: 'Which Braves pitcher won the 1991 NL Cy Young Award?', opts: ['Greg Maddux', 'Steve Avery', 'Tom Glavine', 'John Smoltz'], a: 2 },
  { q: 'What position does Matt Olson play?', opts: ['Second Base', 'Third Base', 'First Base', 'Left Field'], a: 2 },
  { q: 'Which Brave stole 73 bases in the 2023 season?', opts: ['Ozzie Albies', 'Michael Harris II', 'Ronald Acuna Jr', 'Eddie Rosario'], a: 2 },
  { q: 'What is Ozzie Albies home country?', opts: ['Dominican Republic', 'Venezuela', 'Cuba', 'Curacao'], a: 3 },
  { q: 'Which Hall of Famer managed the Braves to multiple division titles in the 1990s?', opts: ['Davey Johnson', 'Bobby Cox', 'Dusty Baker', 'Felipe Alou'], a: 1 },
  { q: 'What year did Bobby Cox retire as Braves manager?', opts: ['2008', '2009', '2010', '2011'], a: 2 },
  { q: 'Which Brave hit a grand slam in Game 6 of the 2021 World Series?', opts: ['Jorge Soler', 'Eddie Rosario', 'Austin Riley', 'Freddie Freeman'], a: 0 },
  { q: 'What number did Dale Murphy wear?', opts: ['3', '7', '26', '33'], a: 1 },
  { q: 'How many times did Dale Murphy win the NL MVP?', opts: ['1', '2', '3', '4'], a: 1 },
  { q: 'What city were the Braves in before Milwaukee?', opts: ['New York', 'Boston', 'Cincinnati', 'Chicago'], a: 1 },
  { q: 'What year did John Smoltz win the NL Cy Young Award?', opts: ['1994', '1995', '1996', '1997'], a: 2 },
  { q: 'How many consecutive division titles did the Braves win starting in 1991?', opts: ['11', '13', '14', '15'], a: 1 },
  { q: 'What year did Chipper Jones retire?', opts: ['2010', '2011', '2012', '2013'], a: 2 },
  { q: 'Which Brave was inducted into the Hall of Fame in 2018?', opts: ['Tom Glavine', 'John Smoltz', 'Chipper Jones', 'Greg Maddux'], a: 2 },
  { q: 'What position did Chipper Jones primarily play?', opts: ['Second Base', 'Shortstop', 'Third Base', 'Left Field'], a: 2 },
  { q: 'How many Cy Young Awards did Greg Maddux win overall?', opts: ['2', '3', '4', '5'], a: 2 },
  { q: 'What year did Ronald Acuna Jr win NL Rookie of the Year?', opts: ['2017', '2018', '2019', '2020'], a: 1 },
  { q: 'Which Brave won the 2021 NLCS MVP?', opts: ['Austin Riley', 'Eddie Rosario', 'Jorge Soler', 'Freddie Freeman'], a: 1 },
  { q: 'What is the name of the Braves Triple-A affiliate?', opts: ['Richmond Braves', 'Gwinnett Stripers', 'Rome Braves', 'Mississippi Braves'], a: 1 },
  { q: 'Which Braves pitcher had Tommy John surgery and came back as a closer?', opts: ['Tom Glavine', 'Greg Maddux', 'John Smoltz', 'Steve Avery'], a: 2 },
  { q: 'What year did the Braves lose the World Series to the Twins in Game 7?', opts: ['1991', '1992', '1995', '1996'], a: 0 },
  { q: 'Who was the Braves primary catcher during the 1990s dynasty?', opts: ['Javy Lopez', 'Brian McCann', 'Damon Berryhill', 'Eddie Perez'], a: 0 },
  { q: 'What year was Turner Field opened?', opts: ['1994', '1995', '1996', '1997'], a: 2 },
  { q: 'Which Brave won the 1982 and 1983 NL MVP?', opts: ['Chris Chambliss', 'Dale Murphy', 'Bob Horner', 'Claudell Washington'], a: 1 },
  { q: 'How many All-Star selections did Hank Aaron receive?', opts: ['18', '20', '21', '25'], a: 3 },
  { q: 'Which Brave hit .353 to win the 1991 NL batting title?', opts: ['Terry Pendleton', 'Ron Gant', 'David Justice', 'Otis Nixon'], a: 0 },
  { q: 'What number is retired for Hank Aaron at Truist Park?', opts: ['41', '42', '44', '45'], a: 2 },
  { q: 'Which Brave won the 2024 NL batting title?', opts: ['Matt Olson', 'Austin Riley', 'Marcell Ozuna', 'Michael Harris II'], a: 2 },
  { q: 'Who did the Braves select first overall in the 2017 MLB Draft?', opts: ['Kyle Wright', 'Ian Anderson', 'Carter Stewart', 'Drew Waters'], a: 0 },
  { q: 'What year did Michael Harris II win NL Rookie of the Year?', opts: ['2021', '2022', '2023', '2024'], a: 1 },
  { q: 'Which Brave set the franchise record for home runs in a season with 51?', opts: ['Hank Aaron', 'Eddie Mathews', 'David Justice', 'Ronald Acuna Jr'], a: 3 },
  { q: 'How many no-hitters have the Braves thrown in their history?', opts: ['8', '10', '12', '14'], a: 1 },
  { q: 'What is the Braves all-time wins leader in the regular season?', opts: ['Greg Maddux', 'Tom Glavine', 'John Smoltz', 'Phil Niekro'], a: 3 },
  { q: 'Which Brave hit the first home run at Truist Park?', opts: ['Freddie Freeman', 'Nick Markakis', 'Matt Kemp', 'Tyler Flowers'], a: 1 },
  { q: 'What year did the Braves draft Chipper Jones first overall?', opts: ['1988', '1989', '1990', '1991'], a: 2 },
  { q: 'Which Brave wore number 3 and had it retired?', opts: ['Dale Murphy', 'Bob Horner', 'Terry Pendleton', 'Darrell Evans'], a: 0 },
  { q: 'Who threw the last pitch to win the 2021 World Series for Atlanta?', opts: ['Will Smith', 'Luke Jackson', 'AJ Minter', 'Tyler Matzek'], a: 0 },
  { q: 'What was Hank Aaron nickname?', opts: ['The Hammer', 'Hammerin Hank', 'Bad Henry', 'All of the above'], a: 3 },
];

function getTodayKey() {
  const d = new Date();
  const tz = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  return 'quiz_' + tz;
}

function getDailyQuestions() {
  const d = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const parts = d.split('-');
  const seed = parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);
  const shuffled = [...ALL_QUESTIONS].sort((a, b) => {
    const ia = ALL_QUESTIONS.indexOf(a);
    const ib = ALL_QUESTIONS.indexOf(b);
    const ha = (Math.sin(seed * 9301 + ia * 49297 + 233) * 1000000) % 1;
    const hb = (Math.sin(seed * 9301 + ib * 49297 + 233) * 1000000) % 1;
    return ha - hb;
  });
  return shuffled.slice(0, 5);
}

function getStats() {
  try {
    const s = localStorage.getItem('ct_quiz_stats');
    return s ? JSON.parse(s) : { streak: 0, bestStreak: 0, totalQuizzes: 0, totalCorrect: 0, totalQuestions: 0, lastDate: null, history: [] };
  } catch { return { streak: 0, bestStreak: 0, totalQuizzes: 0, totalCorrect: 0, totalQuestions: 0, lastDate: null, history: [] }; }
}

function saveStats(stats) {
  localStorage.setItem('ct_quiz_stats', JSON.stringify(stats));
  localStorage.setItem('ct_streak', stats.streak.toString());
}

export default function Quiz() {
  const [questions] = useState(getDailyQuestions);
  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [todayResult, setTodayResult] = useState(null);

  useEffect(() => {
    const s = getStats();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(s);
    const todayKey = getTodayKey();
    const todayData = localStorage.getItem(todayKey);
    if (todayData) {
      setAlreadyDone(true);
      setTodayResult(JSON.parse(todayData));
    }
  }, []);

  const pick = (i) => {
    if (sel !== null) return;
    setSel(i);
    const correct = i === questions[cur].a;
    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);
    setTimeout(() => {
      if (cur + 1 >= questions.length) {
        const finalScore = newScore;
        const s = getStats();
        const todayKey = getTodayKey();
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
        const newStreak = s.lastDate === yesterday ? s.streak + 1 : s.lastDate === today ? s.streak : 1;
        const newBest = Math.max(s.bestStreak, newStreak);
        const newStats = {
          streak: newStreak,
          bestStreak: newBest,
          totalQuizzes: s.totalQuizzes + 1,
          totalCorrect: s.totalCorrect + finalScore,
          totalQuestions: s.totalQuestions + 5,
          lastDate: today,
          history: [{ date: today, score: finalScore }, ...(s.history || [])].slice(0, 30),
        };
        saveStats(newStats);
        setStats(newStats);
        const result = { score: finalScore, date: today };
        localStorage.setItem(todayKey, JSON.stringify(result));
        setTodayResult(result);
        setDone(true);
      } else {
        setCur(c => c + 1);
        setSel(null);
      }
    }, 1000);
  };

  const pct = stats && stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;

  if (alreadyDone && todayResult && stats) {
    return (
      <div className="min-h-[calc(100dvh-6rem)] bg-[#0C2340] px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-white text-3xl font-black">Daily Quiz</h1>
          <div className="bg-[#13274F] rounded-2xl p-6 border border-blue-900">
            <p className="text-blue-400 text-xs uppercase tracking-widest mb-2">Today&apos;s Score</p>
            <p className="text-white text-6xl font-black">{todayResult.score}<span className="text-3xl text-blue-400">/5</span></p>
            <div className="flex justify-center gap-1 mt-3">
              {[0,1,2,3,4].map(i => <span key={i} className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-black " + (i < todayResult.score ? "bg-green-600 text-white" : "bg-red-800 text-white")}>{i < todayResult.score ? "+" : "-"}</span>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#13274F] rounded-2xl p-4 border border-blue-900">
              <p className="text-blue-400 text-xs uppercase tracking-widest mb-1">Streak</p>
              <p className="text-white text-3xl font-black">{stats.streak}</p>
              <p className="text-blue-400 text-xs">Best: {stats.bestStreak}</p>
            </div>
            <div className="bg-[#13274F] rounded-2xl p-4 border border-blue-900">
              <p className="text-blue-400 text-xs uppercase tracking-widest mb-1">Accuracy</p>
              <p className="text-white text-3xl font-black">{pct}%</p>
              <p className="text-blue-400 text-xs">{stats.totalCorrect}/{stats.totalQuestions} correct</p>
            </div>
          </div>
          <div className="bg-[#13274F] rounded-2xl p-4 border border-blue-900">
            <p className="text-blue-400 text-xs uppercase tracking-widest mb-3">Last 7 Days</p>
            <div className="flex justify-center gap-2">
              {(stats.history || []).slice(0, 7).map((h, i) => (
                <div key={i} className="text-center">
                  <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " + (h.score >= 4 ? "bg-green-600 text-white" : h.score >= 3 ? "bg-yellow-600 text-white" : "bg-red-800 text-white")}>{h.score}</div>
                  <p className="text-blue-500 text-xs mt-1">{new Date(h.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-blue-500 text-sm">Come back tomorrow for a new quiz!</p>
        </div>
      </div>
    );
  }

  if (done && stats) {
    return (
      <div className="min-h-[calc(100dvh-6rem)] bg-[#0C2340] px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-white text-3xl font-black">Quiz Complete!</h1>
          <div className="bg-[#13274F] rounded-2xl p-6 border border-blue-900">
            <p className="text-blue-400 text-xs uppercase tracking-widest mb-2">Today&apos;s Score</p>
            <p className="text-white text-6xl font-black">{score}<span className="text-3xl text-blue-400">/5</span></p>
            <div className="flex justify-center gap-1 mt-3">
              {[0,1,2,3,4].map(i => <span key={i} className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-black " + (i < score ? "bg-green-600 text-white" : "bg-red-800 text-white")}>{i < score ? "+" : "-"}</span>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#13274F] rounded-2xl p-4 border border-blue-900">
              <p className="text-blue-400 text-xs uppercase tracking-widest mb-1">Streak</p>
              <p className="text-white text-3xl font-black">{stats.streak}</p>
              <p className="text-blue-400 text-xs">Best: {stats.bestStreak}</p>
            </div>
            <div className="bg-[#13274F] rounded-2xl p-4 border border-blue-900">
              <p className="text-blue-400 text-xs uppercase tracking-widest mb-1">Accuracy</p>
              <p className="text-white text-3xl font-black">{pct}%</p>
              <p className="text-blue-400 text-xs">{stats.totalCorrect}/{stats.totalQuestions} correct</p>
            </div>
          </div>
          <div className="bg-[#13274F] rounded-2xl p-4 border border-blue-900">
            <p className="text-blue-400 text-xs uppercase tracking-widest mb-3">Last 7 Days</p>
            <div className="flex justify-center gap-2">
              {(stats.history || []).slice(0, 7).map((h, i) => (
                <div key={i} className="text-center">
                  <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " + (h.score >= 4 ? "bg-green-600 text-white" : h.score >= 3 ? "bg-yellow-600 text-white" : "bg-red-800 text-white")}>{h.score}</div>
                  <p className="text-blue-500 text-xs mt-1">{new Date(h.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-blue-500 text-sm">Come back tomorrow for a new quiz!</p>
        </div>
      </div>
    );
  }

  const q = questions[cur];
  return (
    <div className="min-h-[calc(100dvh-6rem)] bg-[#0C2340] px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-white text-3xl font-black">Daily Quiz</h1>
          <p className="text-blue-300 text-sm mt-1">Streak: {stats ? stats.streak : 0} days</p>
        </div>
        <div className="bg-[#13274F] rounded-2xl p-4 border border-blue-900">
          <div className="flex justify-between mb-2">
            {questions.map((_, i) => (
              <div key={i} className={"h-2 flex-1 mx-0.5 rounded-full " + (i < cur ? "bg-[#CE1141]" : i === cur ? "bg-blue-400" : "bg-blue-900")} />
            ))}
          </div>
          <p className="text-blue-400 text-xs text-right">Question {cur + 1} of 5</p>
        </div>
        <div className="bg-[#13274F] rounded-2xl p-6 border border-blue-900">
          <p className="text-white text-lg font-bold leading-snug">{q.q}</p>
        </div>
        <div className="space-y-3">
          {q.opts.map((opt, i) => {
            let style = "bg-[#13274F] border-blue-900 text-white";
            if (sel !== null) {
              if (i === q.a) style = "bg-green-700 border-green-600 text-white";
              else if (i === sel && sel !== q.a) style = "bg-red-800 border-red-700 text-white";
              else style = "bg-[#13274F] border-blue-900 text-blue-500";
            }
            return (
              <button key={i} onClick={() => pick(i)} className={"w-full text-left px-5 py-4 rounded-2xl border font-semibold transition-all " + style}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
