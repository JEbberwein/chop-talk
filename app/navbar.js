'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: '/', label: 'Today', icon: 'baseball' },
  { href: '/ask', label: 'Ask', icon: 'chat' },
  { href: '/quiz', label: 'Quiz', icon: 'brain' },
  { href: '/me', label: 'Me', icon: 'tomahawk' },
];

const icons = {
  baseball: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  brain: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M9.5 2a2.5 2.5 0 0 1 5 0v1a2.5 2.5 0 0 1 5 2.5V7a5 5 0 0 1-5 5H9.5A5 5 0 0 1 4.5 7V5.5A2.5 2.5 0 0 1 9.5 3V2z"/><path d="M4.5 12a5 5 0 0 0 5 5h5a5 5 0 0 0 5-5"/><path d="M12 17v5"/><path d="M9 22h6"/></svg>,
  tomahawk: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 21l9-9"/><path d="M12 12l4-4-1-4 4 1-4 4"/></svg>,
};

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#091f3d]/95 shadow-[0_-18px_45px_rgba(0,0,0,0.32)] backdrop-blur-xl" aria-label="Primary navigation">
      <div className="max-w-md mx-auto flex px-2">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 flex min-h-16 flex-col items-center justify-center rounded-2xl px-2 pt-2.5 pb-3 transition-all active:scale-[0.97] ${active ? 'text-white' : 'text-blue-300 hover:bg-white/5 hover:text-white'}`}
            >
              <span className={`grid h-8 w-10 place-items-center rounded-full transition-colors ${active ? 'bg-[#CE1141] text-white shadow-lg shadow-[#CE1141]/25' : 'text-blue-300'}`}>{icons[icon]}</span>
              <span className={`text-[0.7rem] mt-1 font-bold ${active ? 'text-white' : ''}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
