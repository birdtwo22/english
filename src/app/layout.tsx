import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lexie — Vocabulary Tracker",
  description: "Personal English vocabulary learning app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        <Sidebar />
        <main className="ml-16 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
