'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: '/', label: 'Today', icon: 'baseball' },
  { href: '/gameday', label: 'GameDay', icon: 'target' },
  { href: '/ask', label: 'Ask', icon: 'chat' },
  { href: '/me', label: 'My Braves', icon: 'star' },
];

const icons = {
  baseball: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M21 12h-3M12 21v-3M3 12h3"/></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3z"/></svg>,
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
              className={`flex-1 flex min-h-16 flex-col items-center justify-center rounded-2xl px-1 pt-2.5 pb-3 transition-all active:scale-[0.97] ${active ? 'text-white' : 'text-blue-300 hover:bg-white/5 hover:text-white'}`}
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
