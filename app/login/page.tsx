"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin, setStoredAdminToken } from "@/lib/backendApi";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return username.trim().length > 0 && password.trim().length > 0 && !isSubmitting;
  }, [username, password, isSubmitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      setIsSubmitting(true);

      const backendLogin = await loginAdmin(username, password);

      if (!backendLogin.ok || !backendLogin.token) {
        setErrorMessage(backendLogin.message ?? "Unable to sign in.");
        return;
      }

      setStoredAdminToken(backendLogin.token);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "Unable to sign in.");
        return;
      }

      router.push("/home");
      router.refresh();
    } catch {
      setErrorMessage("Network issue while signing in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#081321] px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.25),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(51,65,85,0.8),transparent_35%),linear-gradient(160deg,#081321_20%,#0f1b2b_65%,#142b38_100%)]" />
      <div className="pointer-events-none absolute -left-28 top-10 h-96 w-96 rounded-full border border-white/10 bg-teal-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full border border-teal-200/10 bg-cyan-400/10 blur-3xl" />

      <section className="relative mx-auto flex min-h-[80vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/45 shadow-[0_30px_80px_rgba(2,12,27,0.65)] backdrop-blur-xl lg:flex-row">
        <div className="relative flex flex-1 flex-col justify-between gap-14 border-b border-white/10 px-7 py-8 sm:px-10 lg:border-b-0 lg:border-r">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(74,222,128,0.8)]" />
              Live Election Monitoring Network
            </div>
            <h1 className="mt-7 max-w-xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Smart CCTV Command Portal for Real-Time Polling Station Supervision
            </h1>
            <p className="mt-4 max-w-lg text-sm text-slate-300 sm:text-base">
              Monitor every booth stream in a unified admin console with instant alerts, multi-view walls, and status tracking.
            </p>
          </div>

          <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <p className="text-2xl font-semibold text-cyan-300">612+</p>
              <p className="mt-1">Connected Streams</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <p className="text-2xl font-semibold text-emerald-300">24x7</p>
              <p className="mt-1">Health Monitoring</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <p className="text-2xl font-semibold text-amber-300">Low</p>
              <p className="mt-1">Latency Playback</p>
            </div>
          </div>
        </div>

        <div className="relative flex w-full flex-1 items-center justify-center px-5 py-8 sm:px-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(2,12,27,0.7)] backdrop-blur-sm sm:p-8"
          >
            <h2 className="text-2xl font-semibold text-white">Admin Login</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use the configured credentials to enter the portal.
            </p>

            <label className="mt-6 block text-sm font-medium text-slate-300" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/35"
              placeholder="Enter username"
              autoComplete="username"
            />

            <label className="mt-4 block text-sm font-medium text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/35"
              placeholder="Enter password"
              autoComplete="current-password"
            />

            {errorMessage ? (
              <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3 text-base font-semibold text-white shadow-[0_14px_30px_rgba(8,145,178,0.35)] transition hover:from-teal-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in to Dashboard"}
            </button>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/40 p-3 text-xs text-slate-400">
              Default credentials: admin / admin123
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
