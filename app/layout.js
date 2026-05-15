import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Chop Talk",
  description: "Your Atlanta Braves companion",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Chop Talk",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} bg-[#071b34] min-h-dvh flex flex-col text-base`}>
        <main className="flex-1 pb-24 sm:pb-28">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  );
}
