const fs = require('fs');

const navbar = `'use client';
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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#13274F] border-t border-blue-900 z-50">
      <div className="max-w-md mx-auto flex">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={\`flex-1 flex flex-col items-center justify-center py-3 transition-colors \${active ? 'text-white' : 'text-blue-500 hover:text-blue-300'}\`}>
              <span className={active ? 'text-white' : 'text-blue-500'}>{icons[icon]}</span>
              <span className={\`text-xs mt-1 font-bold \${active ? 'text-[#CE1141]' : ''}\`}>{label}</span>
              {active && <span className="w-1 h-1 bg-[#CE1141] rounded-full mt-0.5"/>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
`;

const layout = `import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = { title: "Chop Talk", description: "Your Atlanta Braves companion" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={\`\${geistSans.variable} \${geistMono.variable} bg-[#0C2340] min-h-screen flex flex-col text-base\`}>
        <main className="flex-1 pb-20">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  );
}
`;

fs.writeFileSync('app/navbar.js', navbar, 'utf8');
fs.writeFileSync('app/layout.js', layout, 'utf8');
console.log('Done!');
