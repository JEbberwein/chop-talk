import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = { title: "Chop Talk", description: "Your Atlanta Braves companion" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#0C2340] min-h-screen flex flex-col text-base`}>
        <main className="flex-1 pb-20">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  );
}
