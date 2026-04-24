"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchCameras, type BackendCamera } from "@/lib/backendApi";

function getStatusCounts(cameras: BackendCamera[]) {
  const total = cameras.length;
  const online = cameras.filter((c) => c.status === "online").length;
  const offline = cameras.filter((c) => c.status === "offline").length;
  const noHit = cameras.filter((c) => c.status === "no-hit").length;

  return { total, online, offline, noHit };
}

function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(page, 1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const normalizedPage = Math.min(safePage, totalPages);
  const start = (normalizedPage - 1) * pageSize;

  return {
    page: normalizedPage,
    totalPages,
    slice: items.slice(start, start + pageSize),
  };
}
import {
  Pagination,
  Panel,
  PanelTitle,
  SearchField,
  SelectField,
  StatusPill,
} from "@/components/portal/UiPrimitives";

const StreamPlayer = dynamic(() => import("@/components/LiveStream"), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-video place-items-center rounded-2xl border border-white/10 bg-slate-950 text-sm text-slate-400">
      Loading stream...
    </div>
  ),
});

const pageSize = 6;

type FilterState = {
  district: string;
  assembly: string;
  category: string;
  status: string;
  query: string;
};

const initialFilters: FilterState = {
  district: "ALL",
  assembly: "ALL",
  category: "ALL",
  status: "ALL",
  query: "",
};

function filterBackendCameras(cameras: BackendCamera[], filters: FilterState) {
  const query = filters.query.trim().toLowerCase();

  return cameras.filter((camera) => {
    const districtPass = filters.district === "ALL" || camera.district === filters.district;
    const assemblyPass = filters.assembly === "ALL" || camera.assembly === filters.assembly;
    const categoryPass = filters.category === "ALL" || camera.category === filters.category;
    const statusPass = filters.status === "ALL" || camera.status === filters.status;

    if (!query) {
      return districtPass && assemblyPass && categoryPass && statusPass;
    }

    const queryPass =
      camera.streamId.toLowerCase().includes(query) ||
      String(camera.acNo).includes(query) ||
      String(camera.psNo).includes(query) ||
      camera.psAddress.toLowerCase().includes(query) ||
      camera.title.toLowerCase().includes(query);

    return districtPass && assemblyPass && categoryPass && statusPass && queryPass;
  });
}

export default function SinglePage() {
  const searchParams = useSearchParams();
  const [cameras, setCameras] = useState<BackendCamera[]>([]);
  const [options, setOptions] = useState({ districts: [] as string[], assemblies: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [draftFilters, setDraftFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [page, setPage] = useState(1);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCameras = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetchCameras();
        if (cancelled) {
          return;
        }

        setCameras(response.items);
        setOptions({
          districts: response.options.districts,
          assemblies: response.options.assemblies,
        });
        // if a camera query param is provided, select it after load
        try {
          const camParam = searchParams?.get?.("camera");
          if (camParam) setSelectedCameraId(camParam);
        } catch {}
      } catch (error_) {
        if (!cancelled) {
          setError(error_ instanceof Error ? error_.message : "Failed to load cameras.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCameras();

    return () => {
      cancelled = true;
    };
  }, []);

  const districtOptions = ["ALL", ...options.districts];
  const assemblyOptions = ["ALL", ...options.assemblies];

  const filteredCameras = useMemo(() => {
    return filterBackendCameras(cameras, appliedFilters);
  }, [cameras, appliedFilters]);

  const statusCounts = useMemo(() => getStatusCounts(filteredCameras), [filteredCameras]);
  const paginated = useMemo(() => paginateItems(filteredCameras, page, pageSize), [filteredCameras, page]);
  const selectedCamera = filteredCameras.find((camera) => camera.cameraId === selectedCameraId) ?? filteredCameras[0];

  return (
    <div className="space-y-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SelectField
            label="Filter by District"
            value={draftFilters.district}
            options={districtOptions}
            onChange={(district) => setDraftFilters((current) => ({ ...current, district }))}
          />
          <SelectField
            label="Filter by Assembly"
            value={draftFilters.assembly}
            options={assemblyOptions}
            onChange={(assembly) => setDraftFilters((current) => ({ ...current, assembly }))}
          />
          <SelectField
            label="Filter by Category"
            value={draftFilters.category}
            options={["ALL", "IN", "OUT"]}
            onChange={(category) => setDraftFilters((current) => ({ ...current, category }))}
          />
          <SelectField
            label="Filter by Status"
            value={draftFilters.status}
            options={["ALL", "online", "offline", "no-hit"]}
            onChange={(status) => setDraftFilters((current) => ({ ...current, status }))}
          />
          <SearchField
            label="AC No / PS No / CID"
            placeholder="Search by AC, PS or stream id"
            value={draftFilters.query}
            onChange={(query) => setDraftFilters((current) => ({ ...current, query }))}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAppliedFilters(draftFilters);
              setPage(1);
            }}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(8,145,178,0.28)] transition hover:from-teal-400 hover:to-cyan-400"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftFilters(initialFilters);
              setAppliedFilters(initialFilters);
              setPage(1);
            }}
            className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm text-slate-300 transition hover:border-cyan-400"
          >
            Reset
          </button>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(330px,1fr)_minmax(0,2fr)]">
        <Panel>
          <div className="grid grid-cols-4 gap-2 border-b border-white/10 px-4 py-3 text-sm sm:px-5">
            <QuickStat title="Total" value={statusCounts.total} tone="text-cyan-300" />
            <QuickStat title="Online" value={statusCounts.online} tone="text-emerald-300" />
            <QuickStat title="Offline" value={statusCounts.offline} tone="text-amber-300" />
            <QuickStat title="No Hit" value={statusCounts.noHit} tone="text-slate-300" />
          </div>

          <div className="max-h-[560px] space-y-3 overflow-y-auto px-3 py-3 sm:px-4">
            {loading ? (
              <LoadingList />
            ) : filteredCameras.length > 0 ? (
              paginated.slice.map((camera) => {
                const active = camera.cameraId === selectedCamera?.cameraId;

                return (
                  <button
                    key={camera.cameraId}
                    type="button"
                    onClick={() => setSelectedCameraId(camera.cameraId)}
                    className={`w-full rounded-2xl border bg-[#172536] text-left transition ${
                      active ? "border-cyan-400/80 shadow-[0_12px_28px_rgba(8,145,178,0.22)]" : "border-white/10 hover:border-cyan-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
                      <div>
                        <p className="text-lg font-semibold text-white">{camera.streamId}</p>
                        <p className="mt-0.5 line-clamp-1 text-sm text-slate-300">{camera.title}</p>
                      </div>
                      <StatusPill status={camera.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 px-4 py-3 text-sm">
                      <DataPoint label="AC No" value={String(camera.acNo)} />
                      <DataPoint label="PS No" value={String(camera.psNo)} />
                      <DataPoint label="District" value={camera.district} />
                      <DataPoint label="Assembly" value={camera.assembly} />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-600 p-6 text-center text-sm text-slate-400">
                No cameras match current filters.
              </div>
            )}

            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>

          <Pagination
            page={paginated.page}
            totalPages={paginated.totalPages}
            onChange={(nextPage) => setPage(nextPage)}
          />
        </Panel>

        <Panel className="overflow-hidden">
          <PanelTitle title={selectedCamera ? `${selectedCamera.title} — ${selectedCamera.streamId} Live` : "No Camera Selected"} />

          {loading ? (
            <div className="grid min-h-[640px] place-items-center p-6 text-sm text-slate-400">
              Loading real camera inventory...
            </div>
          ) : selectedCamera ? (
            <div className="space-y-3 p-3 sm:p-4">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <StreamPlayer
                  cameraId={selectedCamera.cameraId}
                  title={`${selectedCamera.title} - ${selectedCamera.streamId}`}
                  showControls
                  isActive
                  activateWhenVisible={false}
                  priority
                />
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/45 p-4 text-sm text-slate-300 sm:grid-cols-2">
                <MetaLine label="District" value={selectedCamera.district} />
                <MetaLine label="Assembly" value={selectedCamera.assembly} />
                <MetaLine label="AC No" value={String(selectedCamera.acNo)} />
                <MetaLine label="PS No" value={String(selectedCamera.psNo)} />
                <MetaLine label="Category" value={selectedCamera.category} />
                <MetaLine label="Status" value={selectedCamera.status} />
                <MetaLine label="Stream Id" value={selectedCamera.streamId} />
                <MetaLine label="Stream Protocol" value={selectedCamera.streamProtocol.toUpperCase()} />
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">PS Address</p>
                  <p className="mt-1 text-slate-100">{selectedCamera.psAddress}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Stream URL</p>
                  <p className="mt-1 break-all text-slate-100">{selectedCamera.streamUrl}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[640px] place-items-center p-6 text-sm text-slate-400">
              Select a camera to start monitoring.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function QuickStat({ title, value, tone }: { title: string; value: number; tone: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-white">{value}</p>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-slate-100">{value}</p>
    </div>
  );
}

function LoadingList() {
  return Array.from({ length: 5 }).map((_, index) => (
    <div key={index} className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/45 p-4">
      <div className="h-4 w-1/2 rounded bg-slate-700" />
      <div className="mt-3 h-3 w-3/4 rounded bg-slate-700" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="h-3 rounded bg-slate-700" />
        <div className="h-3 rounded bg-slate-700" />
        <div className="h-3 rounded bg-slate-700" />
        <div className="h-3 rounded bg-slate-700" />
      </div>
    </div>
  ));
}
