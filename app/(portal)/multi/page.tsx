"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { fetchCameras, type BackendCamera } from "@/lib/backendApi";
import { SearchField, SelectField } from "@/components/portal/UiPrimitives";

const StreamPlayer = dynamic(() => import("@/components/LiveStream"), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-video place-items-center rounded-2xl border border-white/10 bg-slate-950 text-xs text-slate-400">
      Loading...
    </div>
  ),
});

type LayoutOption = "2x2" | "3x3" | "4x4";

const camerasPerLayout: Record<LayoutOption, number> = {
  "2x2": 4,
  "3x3": 9,
  "4x4": 16,
};

const gridClassName: Record<LayoutOption, string> = {
  "2x2": "grid-cols-1 sm:grid-cols-2",
  "3x3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4x4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const slideOptions = [
  { label: "Off", value: 0 },
  { label: "10 s", value: 10000 },
  { label: "20 s", value: 20000 },
  { label: "30 s", value: 30000 },
  { label: "1 m", value: 60000 },
];

type FilterState = {
  district: string;
  assembly: string;
  category: string;
  query: string;
};

const initialFilters: FilterState = {
  district: "ALL",
  assembly: "ALL",
  category: "ALL",
  query: "",
};

export default function MultiPage() {
  const [cameras, setCameras] = useState<BackendCamera[]>([]);
  const [options, setOptions] = useState({ districts: [] as string[], assemblies: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [draftFilters, setDraftFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [layout, setLayout] = useState<LayoutOption>("3x3");
  const [slideInterval, setSlideInterval] = useState(0);
  const [page, setPage] = useState(1);
  const [modalCamera, setModalCamera] = useState<BackendCamera | null>(null);

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
      } catch (error_) {
        if (!cancelled) {
          setError(error_ instanceof Error ? error_.message : "Failed to load camera inventory.");
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

  function filterBackendCameras(cameras: BackendCamera[], filters: { district: string; assembly: string; category: string; query: string }) {
    const query = filters.query.trim().toLowerCase();

    return cameras.filter((camera) => {
      const districtPass = filters.district === "ALL" || camera.district === filters.district;
      const assemblyPass = filters.assembly === "ALL" || camera.assembly === filters.assembly;
      const categoryPass = filters.category === "ALL" || camera.category === filters.category;

      if (!query) {
        return districtPass && assemblyPass && categoryPass;
      }

      const queryPass =
        camera.streamId.toLowerCase().includes(query) ||
        String(camera.acNo).includes(query) ||
        String(camera.psNo).includes(query) ||
        camera.psAddress.toLowerCase().includes(query) ||
        camera.title.toLowerCase().includes(query);

      return districtPass && assemblyPass && categoryPass && queryPass;
    });
  }

  const filteredCameras = useMemo(() => filterBackendCameras(cameras, appliedFilters), [cameras, appliedFilters]);

  const pageSize = camerasPerLayout[layout];
  const totalPages = Math.max(1, Math.ceil(filteredCameras.length / pageSize));
  const normalizedPage = Math.min(page, totalPages);
  const start = (normalizedPage - 1) * pageSize;
  const currentSlice = filteredCameras.slice(start, start + pageSize);

  useEffect(() => {
    if (!slideInterval || totalPages <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setPage((current) => (current >= totalPages ? 1 : current + 1));
    }, slideInterval);

    return () => {
      window.clearInterval(timer);
    };
  }, [slideInterval, totalPages]);

  return (
    <div className="relative flex min-h-[calc(100vh-132px)] flex-col gap-4">
      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className={`grid flex-1 gap-2 sm:gap-3 ${gridClassName[layout]}`}>
        {loading ? (
          <LoadingGrid layout={layout} />
        ) : currentSlice.length > 0 ? (
          currentSlice.map((camera, index) => (
            <div key={camera.cameraId} className="overflow-hidden rounded-2xl border border-white/10 bg-[#142233]">
              <div className="border-b border-white/10 px-3 py-2 flex items-start justify-between">
                <div>
                  <p className="line-clamp-1 text-sm font-semibold text-white">{camera.streamId}</p>
                  <p className="line-clamp-1 text-xs text-slate-300">{camera.psAddress}</p>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalCamera(camera)}
                    title="Open preview"
                    className="rounded-md px-2 py-1 text-xs bg-slate-800/60 hover:bg-slate-700"
                  >
                    ⤢
                  </button>
                </div>
              </div>
              <StreamPlayer
                cameraId={camera.cameraId}
                title={`${camera.streamId} ${camera.title}`}
                showControls={false}
                isActive
                priority={index < 4}
                compact
              />
              <div className="border-t border-white/10 bg-[#0fbdaf] px-2 py-1 text-center text-xs font-semibold text-slate-950 truncate">
                {camera.streamId}
              </div>
            </div>
          ))
        ) : (
          <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-slate-600 bg-slate-900/35 text-sm text-slate-400 sm:col-span-2 lg:col-span-4">
            No streams available for selected filters.
          </div>
        )}
      </div>

      {modalCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-6xl rounded-2xl bg-[#081321] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{modalCamera.title}</h3>
                <p className="text-sm text-slate-400">{modalCamera.streamId} · {modalCamera.psAddress}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (document.fullscreenElement) {
                      try {
                        await document.exitFullscreen();
                      } catch {}
                    }
                    const url = `/single?camera=${encodeURIComponent(modalCamera.cameraId)}`;
                    window.open(url, "_blank");
                  }}
                  className="rounded-md px-3 py-1 text-sm bg-slate-800/60 hover:bg-slate-700"
                >
                  Open single view
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (document.fullscreenElement) {
                      try {
                        await document.exitFullscreen();
                      } catch {}
                    }
                    setModalCamera(null);
                  }}
                  className="rounded-md px-3 py-1 text-sm bg-rose-600/80 hover:bg-rose-500"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4">
              <StreamPlayer
                cameraId={modalCamera.cameraId}
                title={`${modalCamera.title} - ${modalCamera.streamId}`}
                showControls
                isActive
                activateWhenVisible={false}
                priority
              />
            </div>
          </div>
        </div>
      )}

      <section className="sticky bottom-0 rounded-2xl border border-white/10 bg-[#132335]/95 p-3 shadow-[0_-10px_24px_rgba(2,12,27,0.45)] backdrop-blur-xl">
        <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[80px_repeat(6,minmax(0,1fr))_120px_80px]">
          <button
            type="button"
            onClick={() => setPage((current) => (current <= 1 ? totalPages : current - 1))}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-600 bg-slate-800/80 text-lg text-white transition hover:border-cyan-400"
          >
            {"<"}
          </button>

          <SelectField label="Filter by District" value={draftFilters.district} options={districtOptions} onChange={(district) => setDraftFilters((current) => ({ ...current, district }))} />
          <SelectField label="Filter by Assembly" value={draftFilters.assembly} options={assemblyOptions} onChange={(assembly) => setDraftFilters((current) => ({ ...current, assembly }))} />
          <SelectField
            label="Filter by Category"
            value={draftFilters.category}
            options={["ALL", "IN", "OUT"]}
            onChange={(category) => setDraftFilters((current) => ({ ...current, category }))}
          />
          <SelectField
            label="Filter by Layout"
            value={layout}
            options={["2x2", "3x3", "4x4"]}
            onChange={(value) => {
              setLayout(value as LayoutOption);
              setPage(1);
            }}
          />
          <SelectField
            label="Auto Slide"
            value={String(slideInterval)}
            options={slideOptions.map((option) => ({ label: option.label, value: String(option.value) }))}
            onChange={(value) => {
              const parsed = Number(value);
              setSlideInterval(Number.isFinite(parsed) ? parsed : 0);
            }}
          />
          <SearchField
            label="Search"
            placeholder="AC/PS/CID"
            value={draftFilters.query}
            onChange={(query) => setDraftFilters((current) => ({ ...current, query }))}
          />

          <button
            type="button"
            onClick={() => {
              setAppliedFilters(draftFilters);
              setPage(1);
            }}
            className="h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-sm font-semibold text-white transition hover:from-teal-400 hover:to-cyan-400"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={() => setPage((current) => (current >= totalPages ? 1 : current + 1))}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-600 bg-slate-800/80 text-lg text-white transition hover:border-cyan-400"
          >
            {">"}
          </button>
        </div>

        <div className="mt-2 text-center text-xs text-slate-400">
          Page {normalizedPage} of {totalPages} | Showing {currentSlice.length} streams | Auto Slide {slideOptions.find((option) => option.value === slideInterval)?.label ?? "Off"}
        </div>
      </section>
    </div>
  );
}

function LoadingGrid({ layout }: { layout: LayoutOption }) {
  const count = camerasPerLayout[layout];

  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-[#142233]">
      <div className="h-12 border-b border-white/10 bg-slate-800/70" />
      <div className="aspect-video bg-slate-900/80" />
      <div className="h-8 bg-[#0fbdaf]/40" />
    </div>
  ));
}
