"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, BookOpen, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/vocabulary", icon: BookOpen, label: "Vocabulary" },
  { href: "/quiz", icon: Brain, label: "Quiz" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-zinc-950 flex flex-col items-center py-6 gap-2 z-50">
      <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center mb-4">
        <span className="text-white font-bold text-sm">L</span>
      </div>

      {nav.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              active
                ? "bg-violet-600 text-white"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
            )}
          >
            <Icon size={18} />
          </Link>
        );
      })}
    </aside>
  );
}
