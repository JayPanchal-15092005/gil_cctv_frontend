"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAllAlerts, fetchCameras, type BackendAlert, type BackendCamera } from "@/lib/backendApi";
import { getStatusCounts, getUniqueValues } from "@/lib/mockData";
import { Panel, PanelTitle, SelectField } from "@/components/portal/UiPrimitives";

interface AssemblySummary {
  assembly: string;
  total: number;
  online: number;
  offline: number;
  noHit: number;
}

export default function StatisticsPage() {
  const [cameras, setCameras] = useState<BackendCamera[]>([]);
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [district, setDistrict] = useState("ALL");

  useEffect(() => {
    let cancelled = false;

    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError("");

        const [cameraResponse, alertItems] = await Promise.all([
          fetchCameras(),
          fetchAllAlerts({ pageSize: 500 }),
        ]);

        if (cancelled) {
          return;
        }

        setCameras(cameraResponse.items);
        setAlerts(alertItems);
      } catch (error_) {
        if (!cancelled) {
          setError(error_ instanceof Error ? error_.message : "Failed to load statistics.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadStatistics();

    return () => {
      cancelled = true;
    };
  }, []);

  const districtOptions = useMemo(() => ["ALL", ...getUniqueValues(cameras, (camera) => camera.district).slice(1)], [cameras]);

  const scopedCameras = useMemo(() => {
    if (district === "ALL") {
      return cameras;
    }

    return cameras.filter((camera) => camera.district === district);
  }, [cameras, district]);

  const counts = useMemo(() => getStatusCounts(scopedCameras), [scopedCameras]);

  const assemblyRows = useMemo<AssemblySummary[]>(() => {
    const map = new Map<string, AssemblySummary>();

    for (const camera of scopedCameras) {
      if (!map.has(camera.assembly)) {
        map.set(camera.assembly, {
          assembly: camera.assembly,
          total: 0,
          online: 0,
          offline: 0,
          noHit: 0,
        });
      }

      const row = map.get(camera.assembly);
      if (!row) {
        continue;
      }

      row.total += 1;
      if (camera.status === "online") row.online += 1;
      if (camera.status === "offline") row.offline += 1;
      if (camera.status === "no-hit") row.noHit += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [scopedCameras]);

  const alertSummary = useMemo(() => {
    return {
      info: alerts.filter((record) => record.severity === "info").length,
      warning: alerts.filter((record) => record.severity === "warning").length,
      critical: alerts.filter((record) => record.severity === "critical").length,
    };
  }, [alerts]);

  const maxTotal = Math.max(1, ...assemblyRows.map((row) => row.total));

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <SelectField label="District" value={district} options={districtOptions} onChange={setDistrict} />
          <div className="grid gap-3 sm:grid-cols-4">
            <StatTile label="Total" value={counts.total} tone="text-cyan-300" loading={loading} />
            <StatTile label="Online" value={counts.online} tone="text-emerald-300" loading={loading} />
            <StatTile label="Offline" value={counts.offline} tone="text-amber-300" loading={loading} />
            <StatTile label="No Hit" value={counts.noHit} tone="text-slate-300" loading={loading} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Panel>
          <PanelTitle title="Assembly Performance" subtitle="Online coverage by assembly" />

          <div className="space-y-3 p-4 sm:p-5">
            {loading ? (
              <div className="rounded-xl border border-white/10 bg-slate-900/45 p-6 text-sm text-slate-400">
                Loading camera inventory and alert feed...
              </div>
            ) : assemblyRows.length > 0 ? (
              assemblyRows.map((row) => {
                const width = `${Math.max((row.total / maxTotal) * 100, 6)}%`;
                const onlinePct = row.total ? Math.round((row.online / row.total) * 100) : 0;

                return (
                  <div key={row.assembly} className="rounded-xl border border-white/10 bg-slate-900/45 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-semibold text-white">{row.assembly}</p>
                      <p className="text-slate-300">
                        {row.online}/{row.total} online ({onlinePct}%)
                      </p>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width }} />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-400">
                      <span>Online: {row.online}</span>
                      <span>Offline: {row.offline}</span>
                      <span>No Hit: {row.noHit}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-600 p-6 text-center text-sm text-slate-400">
                No assembly data available for the selected district.
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelTitle title="Alert Intensity" subtitle="Overall severity distribution" />
          <div className="space-y-3 p-4 sm:p-5">
            <AlertCard label="Info" value={alertSummary.info} tone="from-cyan-500/30 to-cyan-500/5" loading={loading} />
            <AlertCard label="Warning" value={alertSummary.warning} tone="from-amber-500/30 to-amber-500/5" loading={loading} />
            <AlertCard label="Critical" value={alertSummary.critical} tone="from-rose-500/35 to-rose-500/5" loading={loading} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StatTile({ label, value, tone, loading }: { label: string; value: number; tone: string; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{loading ? "..." : value}</p>
    </div>
  );
}

function AlertCard({ label, value, tone, loading }: { label: string; value: number; tone: string; loading: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-r ${tone} p-4`}>
      <p className="text-sm text-slate-200">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{loading ? "..." : value}</p>
    </div>
  );
}
