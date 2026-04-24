"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createCamera,
  deleteCamera,
  fetchCameras,
  getStoredAdminToken,
  updateCamera,
  type BackendCamera,
  type SaveCameraInput,
} from "@/lib/backendApi";
import { getStatusCounts, getUniqueValues } from "@/lib/mockData";
import { Panel, PanelTitle, SelectField, SeverityPill } from "@/components/portal/UiPrimitives";
import Link from "next/link";

interface CameraFormState {
  cameraId: string;
  streamId: string;
  title: string;
  district: string;
  assembly: string;
  acNo: string;
  psNo: string;
  psAddress: string;
  category: "IN" | "OUT";
  status: BackendCamera["status"];
  streamUrl: string;
  streamProtocol: BackendCamera["streamProtocol"];
  is4G: boolean;
  enabled: boolean;
  lastSeen: string;
}

const statusOptions: BackendCamera["status"][] = ["online", "offline", "no-hit"];
const protocolOptions: BackendCamera["streamProtocol"][] = ["rtsp", "rtmp"];

export default function AdminCamerasPage() {
  const [cameras, setCameras] = useState<BackendCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [form, setForm] = useState<CameraFormState>(() => createEmptyForm("camera-001"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [adminToken] = useState(() => getStoredAdminToken());

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
        if (response.items.length > 0) {
          const first = response.items[0];
          setSelectedCameraId(first.cameraId);
          setForm(cameraToForm(first));
        }
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

  const statusCounts = useMemo(() => getStatusCounts(cameras), [cameras]);
  const districtOptions = useMemo(() => getUniqueValues(cameras, (camera) => camera.district).slice(1), [cameras]);

  const filteredCameras = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return cameras;
    }

    return cameras.filter((camera) => {
      const haystack = [
        camera.cameraId,
        camera.streamId,
        camera.title,
        camera.district,
        camera.assembly,
        camera.psAddress,
        camera.acNo,
        camera.psNo,
        camera.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [cameras, search]);

  const selectedCamera = useMemo(() => cameras.find((camera) => camera.cameraId === selectedCameraId), [cameras, selectedCameraId]);

  const handleSelectCamera = (camera: BackendCamera) => {
    setSelectedCameraId(camera.cameraId);
    setForm(cameraToForm(camera));
  };

  const handleNewCamera = () => {
    const nextCameraId = buildNextCameraId(cameras);
    setSelectedCameraId("");
    setForm(createEmptyForm(nextCameraId));
  };

  const handleSave = async () => {
    if (!adminToken) {
      setError("Admin token is missing. Please log in again to manage cameras.");
      return;
    }

    if (!form.cameraId.trim() || !form.streamId.trim() || !form.title.trim() || !form.streamUrl.trim()) {
      setError("Camera Id, Stream Id, Title, and Stream URL are required.");
      return;
    }

    const payload: SaveCameraInput = {
      cameraId: form.cameraId.trim(),
      streamId: form.streamId.trim(),
      title: form.title.trim(),
      district: form.district.trim(),
      assembly: form.assembly.trim(),
      acNo: Number(form.acNo),
      psNo: Number(form.psNo),
      psAddress: form.psAddress.trim(),
      category: form.category,
      status: form.status,
      streamUrl: form.streamUrl.trim(),
      streamProtocol: form.streamProtocol,
      is4G: form.is4G,
      enabled: form.enabled,
      lastSeen: form.lastSeen,
    };

    try {
      setSaving(true);
      setError("");

      const saved = selectedCameraId
        ? await updateCamera(selectedCameraId, payload, adminToken)
        : await createCamera(payload, adminToken);

      const response = await fetchCameras();
      setCameras(response.items);
      setSelectedCameraId(saved.item.cameraId);
      setForm(cameraToForm(saved.item));
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to save camera.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!adminToken) {
      setError("Admin token is missing. Please log in again to manage cameras.");
      return;
    }

    if (!selectedCameraId) {
      setError("Select a camera to delete.");
      return;
    }

    const confirmed = window.confirm(`Delete camera ${selectedCameraId}?`);
    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await deleteCamera(selectedCameraId, adminToken);
      const response = await fetchCameras();
      setCameras(response.items);

      if (response.items.length > 0) {
        setSelectedCameraId(response.items[0].cameraId);
        setForm(cameraToForm(response.items[0]));
      } else {
        setSelectedCameraId("");
        setForm(createEmptyForm(buildNextCameraId([])));
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to delete camera.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <PanelTitle title="Admin Cameras" subtitle="Create, edit, and remove live camera records from the backend" />
            <p className="mt-2 text-sm text-slate-400">
              Manage the real camera data that powers the portal views and live streams.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <StatChip label="Total" value={statusCounts.total} />
            <StatChip label="Online" value={statusCounts.online} tone="text-emerald-300" />
            <StatChip label="Offline" value={statusCounts.offline} tone="text-amber-300" />
            <StatChip label="No Hit" value={statusCounts.noHit} tone="text-slate-300" />
          </div>
        </div>
      </Panel>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {!adminToken ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Admin token not found. Sign in again to create, edit, or delete cameras.
          <Link href="/login" className="ml-2 font-semibold text-cyan-200 underline-offset-4 hover:underline">
            Go to login
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Camera Inventory</h2>
                <p className="text-sm text-slate-400">Select a camera to edit or start a new record.</p>
              </div>
              <button
                type="button"
                onClick={handleNewCamera}
                className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
              >
                New Camera
              </button>
            </div>
            <div className="mt-4">
              <TextField label="Search" value={search} onChange={setSearch} placeholder="Search camera, district, assembly" />
            </div>
          </div>

          <div className="max-h-[780px] overflow-y-auto p-2 sm:p-3">
            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-600 p-6 text-sm text-slate-400">
                Loading cameras from backend...
              </div>
            ) : filteredCameras.length > 0 ? (
              filteredCameras.map((camera) => {
                const isActive = camera.cameraId === selectedCameraId;
                return (
                  <button
                    key={camera.cameraId}
                    type="button"
                    onClick={() => handleSelectCamera(camera)}
                    className={`mb-2 w-full rounded-2xl border p-3 text-left transition ${
                      isActive
                        ? "border-cyan-500/60 bg-cyan-500/10"
                        : "border-white/10 bg-slate-900/45 hover:border-cyan-500/30 hover:bg-slate-900/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{camera.title}</p>
                        <p className="text-xs text-slate-400">{camera.cameraId} · {camera.streamId}</p>
                      </div>
                      <SeverityPill severity={camera.status === "online" ? "info" : camera.status === "offline" ? "warning" : "critical"} />
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-slate-400">
                      <span>{camera.district} · {camera.assembly}</span>
                      <span>AC {camera.acNo} / PS {camera.psNo}</span>
                      <span className="truncate">{camera.psAddress}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-600 p-6 text-sm text-slate-400">
                No cameras matched the current search.
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelTitle title={selectedCamera ? `Edit Camera: ${selectedCamera.cameraId}` : "Create Camera"} subtitle="All values are stored in the backend camera record" />

          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
            <TextField label="Camera Id" value={form.cameraId} onChange={(value) => setForm((current) => ({ ...current, cameraId: value }))} placeholder="camera-001" disabled={Boolean(selectedCameraId)} />
            <TextField label="Stream Id" value={form.streamId} onChange={(value) => setForm((current) => ({ ...current, streamId: value }))} placeholder="stream-001" />
            <TextField label="Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} placeholder="Booth CCTV - Ward 12" />
            <TextField label="District" value={form.district} onChange={(value) => setForm((current) => ({ ...current, district: value }))} placeholder={districtOptions[0] ?? "District"} />
            <TextField label="Assembly" value={form.assembly} onChange={(value) => setForm((current) => ({ ...current, assembly: value }))} placeholder="Assembly name" />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="AC No" type="number" value={form.acNo} onChange={(value) => setForm((current) => ({ ...current, acNo: value }))} placeholder="101" />
              <TextField label="PS No" type="number" value={form.psNo} onChange={(value) => setForm((current) => ({ ...current, psNo: value }))} placeholder="14" />
            </div>
            <TextField label="PS Address" value={form.psAddress} onChange={(value) => setForm((current) => ({ ...current, psAddress: value }))} placeholder="Polling station address" />
            <SelectField label="Category" value={form.category} options={["IN", "OUT"]} onChange={(category) => setForm((current) => ({ ...current, category: category as CameraFormState["category"] }))} />
            <TextField label="Stream URL" value={form.streamUrl} onChange={(value) => setForm((current) => ({ ...current, streamUrl: value }))} placeholder="rtsp://... or ws://..." />
            <SelectField label="Stream Protocol" value={form.streamProtocol} options={protocolOptions} onChange={(streamProtocol) => setForm((current) => ({ ...current, streamProtocol: streamProtocol as CameraFormState["streamProtocol"] }))} />
            <SelectField label="Status" value={form.status} options={statusOptions} onChange={(status) => setForm((current) => ({ ...current, status: status as CameraFormState["status"] }))} />
            <TextField label="Last Seen" type="datetime-local" value={form.lastSeen} onChange={(value) => setForm((current) => ({ ...current, lastSeen: value }))} />
          </div>

          <div className="grid gap-3 border-t border-white/10 px-4 py-4 sm:px-5 sm:grid-cols-2 xl:grid-cols-4">
            <ToggleField label="4G Camera" checked={form.is4G} onChange={(checked) => setForm((current) => ({ ...current, is4G: checked }))} />
            <ToggleField label="Enabled" checked={form.enabled} onChange={(checked) => setForm((current) => ({ ...current, enabled: checked }))} />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : selectedCameraId ? "Update Camera" : "Create Camera"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || !selectedCameraId}
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete Camera
            </button>
          </div>

          {selectedCamera ? (
            <div className="grid gap-3 border-t border-white/10 px-4 py-4 text-sm text-slate-300 sm:grid-cols-3 sm:px-5">
              <InfoBlock label="Stream URL" value={selectedCamera.streamUrl} />
              <InfoBlock label="Created" value={selectedCamera.createdAt ? new Date(selectedCamera.createdAt).toLocaleString() : "-"} />
              <InfoBlock label="Updated" value={selectedCamera.updatedAt ? new Date(selectedCamera.updatedAt).toLocaleString() : "-"} />
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function createEmptyForm(cameraId: string): CameraFormState {
  const now = new Date();
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return {
    cameraId,
    streamId: `${cameraId}-stream`,
    title: "",
    district: "",
    assembly: "",
    acNo: "",
    psNo: "",
    psAddress: "",
    category: "IN",
    status: "online",
    streamUrl: "",
    streamProtocol: "rtsp",
    is4G: false,
    enabled: true,
    lastSeen: iso,
  };
}

function cameraToForm(camera: BackendCamera): CameraFormState {
  return {
    cameraId: camera.cameraId,
    streamId: camera.streamId,
    title: camera.title,
    district: camera.district,
    assembly: camera.assembly,
    acNo: String(camera.acNo),
    psNo: String(camera.psNo),
    psAddress: camera.psAddress,
    category: camera.category,
    status: camera.status,
    streamUrl: camera.streamUrl,
    streamProtocol: camera.streamProtocol,
    is4G: camera.is4G,
    enabled: camera.enabled,
    lastSeen: camera.lastSeen ? camera.lastSeen.slice(0, 16) : createEmptyForm(camera.cameraId).lastSeen,
  };
}

function buildNextCameraId(cameras: BackendCamera[]) {
  const numericIds = cameras
    .map((camera) => {
      const match = camera.cameraId.match(/(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .filter((value) => Number.isFinite(value));

  const nextNumber = (numericIds.length ? Math.max(...numericIds) : cameras.length) + 1;
  return `camera-${String(nextNumber).padStart(3, "0")}`;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-slate-600 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-900/80"
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-600 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-cyan-400"
      />
    </label>
  );
}

function StatChip({ label, value, tone = "text-cyan-300" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/45 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-all text-xs text-slate-200">{value}</p>
    </div>
  );
}
