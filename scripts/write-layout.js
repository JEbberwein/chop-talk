const fs = require('fs');
const content = `'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const nav = [
    { href: '/', label: 'Today', icon: '?' },
    { href: '/ask', label: 'Ask', icon: '??' },
    { href: '/quiz', label: 'Quiz', icon: '??' },
    { href: '/me', label: 'Me', icon: '??' },
  ];
  return (
    <html lang="en">
      <body className={\`\${geistSans.variable} \${geistMono.variable} bg-[#0C2340] min-h-screen flex flex-col\`}>
        <main className="flex-1 pb-20">
          {children}
        </main>
        <nav className="fixed bottom-0 left-0 right-0 bg-[#13274F] border-t border-blue-900 z-50">
          <div className="max-w-md mx-auto flex">
            {nav.map(({ href, label, icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} className={\`flex-1 flex flex-col items-center justify-center py-3 transition-colors \${active ? 'text-white' : 'text-blue-500 hover:text-blue-300'}\`}>
                  <span className="text-xl">{icon}</span>
                  <span className={\`text-xs mt-1 font-semibold \${active ? 'text-[#CE1141]' : ''}\`}>{label}</span>
                  {active && <span className="w-1 h-1 bg-[#CE1141] rounded-full mt-0.5"/>}
                </Link>
              );
            })}
          </div>
        </nav>
      </body>
    </html>
  );
}
`;
fs.writeFileSync('app/layout.js', content, 'utf8');
console.log('Layout written!');
