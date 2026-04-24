"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchDashboardSummary, fetchHourlyStats, type DashboardSummaryResponse, type HourlyStatsResponse } from "@/lib/backendApi";
import { Panel, PanelTitle } from "@/components/portal/UiPrimitives";
import { toPercent } from "@/lib/mockData";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [hourly, setHourly] = useState<HourlyStatsResponse["items"]>([]);
  const [slotIndex, setSlotIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadHomeData = async () => {
      try {
        setLoading(true);
        setError("");

        const [summaryResponse, hourlyResponse] = await Promise.all([
          fetchDashboardSummary(),
          fetchHourlyStats(),
        ]);

        if (cancelled) {
          return;
        }

        setSummary(summaryResponse);
        setHourly(hourlyResponse.items);
        setSlotIndex(Math.max(hourlyResponse.items.length - 1, 0));
      } catch (error_) {
        if (!cancelled) {
          setError(error_ instanceof Error ? error_.message : "Failed to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = summary?.counts ?? { total: 0, online: 0, offline: 0, noHit: 0 };
  const districtSummary = summary?.districtSummary ?? [];
  const selectedSlot = hourly[slotIndex] ?? hourly[hourly.length - 1];
  const peakValue = useMemo(() => Math.max(...hourly.map((slot) => slot.total), 1), [hourly]);

  const onlineDeg = counts.total ? (counts.online / counts.total) * 360 : 0;
  const offlineDeg = counts.total ? (counts.offline / counts.total) * 360 : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total" value={loading ? "..." : `${counts.total}`} percent="100%" theme="from-cyan-500/25 to-cyan-300/5" />
        <MetricCard label="Online" value={loading ? "..." : `${counts.online}`} percent={`${toPercent(counts.online, counts.total)}%`} theme="from-emerald-500/25 to-emerald-300/5" />
        <MetricCard label="Offline" value={loading ? "..." : `${counts.offline}`} percent={`${toPercent(counts.offline, counts.total)}%`} theme="from-amber-500/25 to-amber-300/5" />
        <MetricCard label="No Hit" value={loading ? "..." : `${counts.noHit}`} percent={`${toPercent(counts.noHit, counts.total)}%`} theme="from-slate-500/25 to-slate-300/5" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)]">
        <Panel>
          <PanelTitle title="Hourly Statistics" subtitle="Live camera availability window" />

          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-900/55 p-3 text-xs text-slate-300 sm:grid-cols-4">
              <div>
                <p className="text-slate-400">Window</p>
                <p className="mt-1 text-sm font-semibold text-white">{selectedSlot?.label ?? "Loading..."}</p>
              </div>
              <div>
                <p className="text-slate-400">Total</p>
                <p className="mt-1 text-sm font-semibold text-cyan-200">{selectedSlot?.total ?? 0}</p>
              </div>
              <div>
                <p className="text-slate-400">Online</p>
                <p className="mt-1 text-sm font-semibold text-emerald-200">{selectedSlot?.online ?? 0}</p>
              </div>
              <div>
                <p className="text-slate-400">Offline + No Hit</p>
                <p className="mt-1 text-sm font-semibold text-amber-200">
                  {(selectedSlot?.offline ?? 0) + (selectedSlot?.noHit ?? 0)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {hourly.map((slot, index) => {
                const isActive = index === slotIndex;
                const onlineHeight = `${Math.max((slot.online / peakValue) * 100, 6)}%`;
                const offlineHeight = `${Math.max((slot.offline / peakValue) * 100, 2)}%`;
                const noHitHeight = `${Math.max((slot.noHit / peakValue) * 100, 2)}%`;

                return (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => setSlotIndex(index)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      isActive
                        ? "border-cyan-400/80 bg-cyan-500/10"
                        : "border-white/10 bg-slate-900/45 hover:border-cyan-400/50"
                    }`}
                  >
                    <p className="text-xs text-slate-300">{slot.label}</p>
                    <div className="mt-3 flex h-24 items-end gap-2 rounded-lg border border-white/10 bg-slate-900/70 px-2 py-2">
                      <div className="w-2.5 rounded-sm bg-cyan-400" style={{ height: `${Math.max((slot.total / peakValue) * 100, 8)}%` }} />
                      <div className="w-2.5 rounded-sm bg-emerald-400" style={{ height: onlineHeight }} />
                      <div className="w-2.5 rounded-sm bg-amber-400" style={{ height: offlineHeight }} />
                      <div className="w-2.5 rounded-sm bg-slate-300" style={{ height: noHitHeight }} />
                      <div className="ml-auto text-right">
                        <p className="text-[11px] text-slate-400">Online</p>
                        <p className="text-sm font-semibold text-white">{slot.online}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(hourly.length - 1, 0)}
              value={slotIndex}
              onChange={(event) => setSlotIndex(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
            />
          </div>
        </Panel>

        <Panel>
          <PanelTitle title="All" subtitle="Status distribution" />
          <div className="flex flex-col items-center gap-6 p-5">
            <div
              className="relative grid h-52 w-52 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#22d3ee 0deg ${onlineDeg}deg, #10b981 ${onlineDeg}deg ${onlineDeg + offlineDeg}deg, #f59e0b ${onlineDeg + offlineDeg}deg 360deg)`,
              }}
            >
              <div className="grid h-24 w-24 place-items-center rounded-full bg-[#132235] text-center shadow-inner shadow-black/60">
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-xl font-semibold text-white">{counts.total}</p>
              </div>
            </div>

            <div className="w-full space-y-2 text-sm">
              <LegendRow color="bg-cyan-400" label="Total" value={counts.total} />
              <LegendRow color="bg-emerald-400" label="Online" value={counts.online} />
              <LegendRow color="bg-amber-400" label="Offline" value={counts.offline} />
              <LegendRow color="bg-slate-300" label="No Hit" value={counts.noHit} />
            </div>
          </div>
        </Panel>
      </section>

      <Panel>
        <PanelTitle title="District" subtitle="Deployment summary" />

        <div className="overflow-x-auto p-4 sm:p-5">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-3 py-3 font-medium">District</th>
                <th className="px-3 py-3 font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Online</th>
                <th className="px-3 py-3 font-medium">Offline</th>
                <th className="px-3 py-3 font-medium">No Hit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">
                    Loading real backend summary...
                  </td>
                </tr>
              ) : districtSummary.length > 0 ? (
                districtSummary.map((district) => (
                  <tr key={district.district} className="border-b border-white/5">
                    <td className="px-3 py-3 font-semibold text-white">{district.district}</td>
                    <td className="px-3 py-3">{district.total}</td>
                    <td className="px-3 py-3 text-emerald-200">{district.online}</td>
                    <td className="px-3 py-3 text-amber-200">{district.offline}</td>
                    <td className="px-3 py-3 text-slate-200">{district.noHit}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">
                    No district summary available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function MetricCard({
  label,
  value,
  percent,
  theme,
}: {
  label: string;
  value: string;
  percent: string;
  theme: string;
}) {
  return (
    <article className={`rounded-2xl border border-white/10 bg-gradient-to-br ${theme} p-4 shadow-[0_12px_32px_rgba(3,7,18,0.35)]`}>
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{percent}</p>
      <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{label}</p>
    </article>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span>{label}</span>
      </div>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
