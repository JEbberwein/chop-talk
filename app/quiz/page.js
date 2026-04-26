'use client';
import { useState, useEffect } from 'react';
const Q=[{q:'What year did the Braves win their most recent World Series?',opts:['2019','2021','2022','2023'],a:1},{q:'Who is the Braves all-time home run leader?',opts:['Chipper Jones','Dale Murphy','Hank Aaron','David Justice'],a:2},{q:'What is the Braves current home stadium?',opts:['Turner Field','Fulton County Stadium','Truist Park','SunTrust Park'],a:2},{q:'Which Brave won the 2021 World Series MVP?',opts:['Freddie Freeman','Jorge Soler','Austin Riley','Eddie Rosario'],a:1},{q:'What number did Hank Aaron wear?',opts:['42','44','21','35'],a:1}];
export default function Quiz(){
const [cur,setCur]=useState(0);
const [sel,setSel]=useState(null);
const [score,setScore]=useState(0);
const [done,setDone]=useState(false);
const [streak,setStreak]=useState(0);
useEffect(()=>{const s=localStorage.getItem('ct_streak');if(s)setStreak(parseInt(s));},[]);
const pick=(i)=>{if(sel!==null)return;setSel(i);if(i===Q[cur].a)setScore(s=>s+1);setTimeout(()=>{if(cur+1>=Q.length){setDone(true);const ns=streak+1;setStreak(ns);localStorage.setItem('ct_streak',ns);}else{setCur(c=>c+1);setSel(null);}},1000);};
if(done)return(<div className='min-h-screen bg-[#0C2340] flex flex-col items-center justify-center px-4'><div className='max-w-md w-full text-center space-y-6'><div className='text-6xl'>??</div><h1 className='text-white text-3xl font-black'>Quiz Complete!</h1><div className='bg-[#13274F] rounded-2xl p-6 border border-blue-900'><p className='text-blue-300 text-xs uppercase tracking-widest mb-2'>Score</p><p className='text-white text-6xl font-black'>{score}<span className='text-3xl text-blue-400'>/5</span></p><p className='text-blue-300 mt-4'>🔥 Streak: <span className='text-white font-bold'>{streak} days</span></p></div><p className='text-blue-500 text-sm'>Come back tomorrow for a new quiz!</p></div></div>);
const q=Q[cur];
return(<div className='min-h-screen bg-[#0C2340] px-4 py-10'><div className='max-w-md mx-auto space-y-6'><div className='text-center'><h1 className='text-white text-3xl font-black'>🧠 Daily Quiz</h1><p className='text-blue-300 text-sm mt-1'>🔥 Streak: {streak} days</p></div><div className='bg-[#13274F] rounded-2xl p-6 border border-blue-900'><p className='text-white text-lg font-bold'>{q.q}</p></div><div className='space-y-3'>{q.opts.map((opt,i)=>{let s='bg-[#13274F] border-blue-900 text-white';if(sel!==null){if(i===q.a)s='bg-green-700 border-green-600 text-white';else if(i===sel)s='bg-red-800 border-red-700 text-white';else s='bg-[#13274F] border-blue-900 text-blue-500';}return <button key={i} onClick={()=>pick(i)} className={'w-full text-left px-5 py-4 rounded-2xl border font-semibold '+s}>{opt}</button>;})}</div></div></div>);}

