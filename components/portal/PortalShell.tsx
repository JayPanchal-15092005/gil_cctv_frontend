"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearStoredAdminToken } from "@/lib/backendApi";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: <HomeIcon /> },
  { href: "/single", label: "Single", icon: <SingleIcon /> },
  { href: "/multi", label: "Multi", icon: <GridIcon /> },
  { href: "/face-detection", label: "Face Detection", icon: <FaceIcon /> },
  { href: "/logs", label: "Logs", icon: <LogsIcon /> },
  { href: "/statistics", label: "Statistics", icon: <ChartIcon /> },
  { href: "/alert-report", label: "Alert Report", icon: <AlertIcon /> },
  { href: "/admin-cameras", label: "Admin Cameras", icon: <AdminIcon /> },
];

export default function PortalShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const pageTitle = useMemo(() => {
    const current = navItems.find((item) => pathname?.startsWith(item.href));
    return current?.label ?? "Dashboard";
  }, [pathname]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      clearStoredAdminToken();
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="portal-root min-h-screen bg-[#081321] text-slate-100">
      <div className="relative flex min-h-screen">
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          onClick={() => setIsSidebarOpen(false)}
          className={`fixed inset-0 z-20 bg-slate-950/70 transition md:hidden ${
            isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/10 bg-[#172536] px-3 py-4 shadow-2xl transition md:static md:translate-x-0 md:shadow-none ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center gap-3 px-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-cyan-300/30 bg-slate-900/70 text-xs font-semibold text-cyan-200">
              GIL
            </div>
            <div>
              <p className="text-sm font-semibold">Election Portal</p>
              <p className="text-xs text-slate-400">Command Center</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-[0_8px_24px_rgba(6,182,212,0.28)]"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <span className={`h-5 w-5 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-white">Ceo</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-600 bg-slate-800/90 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-white"
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-[72px] items-center gap-4 border-b border-white/10 bg-[#122133]/85 px-4 backdrop-blur-xl sm:px-6">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((current) => !current)}
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-slate-800/80 text-slate-200 transition hover:border-cyan-400 md:hidden"
            >
              <MenuIcon />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-white sm:text-xl">
                {process.env.NEXT_PUBLIC_PORTAL_TITLE ?? "Election Monitoring Portal"}
              </h1>
              <p className="text-xs text-slate-400">{pageTitle} monitoring panel</p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-slate-800/80 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-100"
              >
                <SettingsIcon />
              </button>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5">
                <span className="text-sm font-medium">Ceo</span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-500/20 text-cyan-200">E</span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function SingleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l5-3.5-5-3.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function LogsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <path d="M8 4h8l4 4v12H4V4h4Z" />
      <path d="M12 4v4h4" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <path d="M4 19h16" />
      <rect x="6" y="11" width="3" height="6" rx="1" />
      <rect x="11" y="8" width="3" height="9" rx="1" />
      <rect x="16" y="5" width="3" height="12" rx="1" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <path d="M12 5a4 4 0 0 1 4 4v2.5l1.8 3.2a1 1 0 0 1-.88 1.5H7.08a1 1 0 0 1-.88-1.5L8 11.5V9a4 4 0 0 1 4-4Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <path d="M4 19a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" />
      <circle cx="12" cy="8" r="3" />
      <path d="M17 6h4M19 4v4" />
    </svg>
  );
}

function FaceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
      <path d="M9 14a3 3 0 0 0 6 0" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M10.3 3.2a1 1 0 0 1 1.4 0l.8.8a1 1 0 0 0 1 .24l1.1-.32a1 1 0 0 1 1.2.75l.25 1.12a1 1 0 0 0 .74.74l1.12.25a1 1 0 0 1 .75 1.2l-.31 1.11a1 1 0 0 0 .23 1l.8.8a1 1 0 0 1 0 1.4l-.8.8a1 1 0 0 0-.24 1l.32 1.1a1 1 0 0 1-.75 1.2l-1.12.25a1 1 0 0 0-.74.74l-.25 1.12a1 1 0 0 1-1.2.75l-1.11-.31a1 1 0 0 0-1 .23l-.8.8a1 1 0 0 1-1.4 0l-.8-.8a1 1 0 0 0-1-.24l-1.1.32a1 1 0 0 1-1.2-.75l-.25-1.12a1 1 0 0 0-.74-.74l-1.12-.25a1 1 0 0 1-.75-1.2l.31-1.11a1 1 0 0 0-.23-1l-.8-.8a1 1 0 0 1 0-1.4l.8-.8a1 1 0 0 0 .24-1l-.32-1.1a1 1 0 0 1 .75-1.2l1.12-.25a1 1 0 0 0 .74-.74l.25-1.12a1 1 0 0 1 1.2-.75l1.11.31a1 1 0 0 0 1-.23l.8-.8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
