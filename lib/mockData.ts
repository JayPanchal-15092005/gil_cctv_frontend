export type CameraStatus = "online" | "offline" | "no-hit";
export type CameraCategory = "IN" | "OUT";
export type AlertSeverity = "info" | "warning" | "critical";

export interface CameraDevice {
  cameraId: string;
  streamId: string;
  title: string;
  district: string;
  assembly: string;
  acNo: number;
  psNo: number;
  psAddress: string;
  category: CameraCategory;
  status: CameraStatus;
  lastSeen: string;
}

export interface AlertRecord {
  id: string;
  timestamp: string;
  district: string;
  assembly: string;
  acNo: number;
  psNo: number;
  psAddress: string;
  category: CameraCategory;
  streamId: string;
  alertType: string;
  severity: AlertSeverity;
}

export interface CameraFilters {
  district?: string;
  assembly?: string;
  category?: string;
  status?: string;
  query?: string;
}

const referenceTime = new Date("2026-04-23T13:30:00.000Z").getTime();

const boothBase = [
  { district: "ANAND", assembly: "UMRETH", acNo: 111 },
  { district: "ANAND", assembly: "ANAND", acNo: 112 },
  { district: "ANAND", assembly: "PETLAD", acNo: 113 },
  { district: "KHEDA", assembly: "NADIAD", acNo: 115 },
  { district: "VADODARA", assembly: "SAVLI", acNo: 136 },
] as const;

const villages = [
  "ARDI",
  "VANSOL",
  "DHULETA",
  "ZALABORDI",
  "OD",
  "BHADRAN",
  "SANPAD",
  "SUNDALPURA",
  "MORAD",
  "NAR",
  "KHAMBHOLAJ",
  "JALUNDH",
  "PIPLOI",
  "VAGHASI",
  "BORSAD",
] as const;

const alertMessages = [
  "Everything is Fine",
  "PS details not Visible",
  "Person found with mobile",
  "No polling staff visible",
  "Polling material not visible",
] as const;

function getBoothMeta(index: number) {
  if (index <= 30) {
    return boothBase[0];
  }

  return boothBase[index % boothBase.length];
}

function streamIdFromIndex(index: number) {
  return `HF4G${String(9247 + index).padStart(6, "0")}`;
}

function statusForIndex(index: number): CameraStatus {
  if (index % 17 === 0) {
    return "no-hit";
  }

  if (index % 11 === 0 || index % 13 === 0) {
    return "offline";
  }

  return "online";
}

export const cameraDevices: CameraDevice[] = Array.from({ length: 46 }, (_, i) => {
  const index = i + 1;
  const booth = getBoothMeta(index);
  const village = villages[index % villages.length];
  const psNo = index;
  const category: CameraCategory = index % 2 === 0 ? "OUT" : "IN";

  return {
    cameraId: `camera${index}`,
    streamId: streamIdFromIndex(index),
    title: `${village}-${(index % 6) + 1}-PRIMARY SCHOOL`,
    district: booth.district,
    assembly: booth.assembly,
    acNo: booth.acNo,
    psNo,
    psAddress: `${village}-${(index % 6) + 1}-PRIMARY SCHOOL, ROOM NO.${(index % 4) + 1}, ${(index % 2 === 0 ? "MAHADEV MANDIR" : "MIDDLE PART")}`,
    category,
    status: statusForIndex(index),
    lastSeen: new Date(referenceTime - index * 480000).toISOString(),
  };
});

export const alertRecords: AlertRecord[] = Array.from({ length: 1111 }, (_, i) => {
  const camera = cameraDevices[i % cameraDevices.length];
  const severity: AlertSeverity = i % 17 === 0 ? "critical" : i % 9 === 0 ? "warning" : "info";
  const alertType =
    severity === "critical"
      ? alertMessages[2]
      : severity === "warning"
        ? alertMessages[1]
        : alertMessages[0];

  return {
    id: `ALT-${String(i + 1).padStart(5, "0")}`,
    timestamp: new Date(referenceTime - i * 240000).toISOString(),
    district: camera.district,
    assembly: camera.assembly,
    acNo: camera.acNo,
    psNo: camera.psNo,
    psAddress: camera.psAddress,
    category: camera.category,
    streamId: camera.streamId,
    alertType,
    severity,
  };
});

export const hourlyStatistics = [
  { label: "9AM - 10AM", total: 612, online: 604, offline: 6, noHit: 2 },
  { label: "10AM - 11AM", total: 612, online: 606, offline: 4, noHit: 2 },
  { label: "11AM - 12PM", total: 612, online: 608, offline: 3, noHit: 1 },
  { label: "12PM - 1PM", total: 612, online: 610, offline: 1, noHit: 1 },
  { label: "1PM - 2PM", total: 612, online: 612, offline: 0, noHit: 0 },
  { label: "2PM - 3PM", total: 612, online: 612, offline: 0, noHit: 0 },
];

function isAll(value?: string) {
  return !value || value === "ALL";
}

export function filterCameras(cameras: CameraDevice[], filters: CameraFilters) {
  const query = filters.query?.trim().toLowerCase() ?? "";

  return cameras.filter((camera) => {
    const districtPass = isAll(filters.district) || camera.district === filters.district;
    const assemblyPass = isAll(filters.assembly) || camera.assembly === filters.assembly;
    const categoryPass = isAll(filters.category) || camera.category === filters.category;
    const statusPass = isAll(filters.status) || camera.status === filters.status;

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

export function filterAlerts(records: AlertRecord[], filters: CameraFilters & { severity?: string }) {
  const query = filters.query?.trim().toLowerCase() ?? "";

  return records.filter((record) => {
    const districtPass = isAll(filters.district) || record.district === filters.district;
    const assemblyPass = isAll(filters.assembly) || record.assembly === filters.assembly;
    const categoryPass = isAll(filters.category) || record.category === filters.category;
    const severityPass = isAll(filters.severity) || record.severity === filters.severity;

    if (!query) {
      return districtPass && assemblyPass && categoryPass && severityPass;
    }

    const queryPass =
      record.streamId.toLowerCase().includes(query) ||
      String(record.acNo).includes(query) ||
      String(record.psNo).includes(query) ||
      record.psAddress.toLowerCase().includes(query) ||
      record.alertType.toLowerCase().includes(query);

    return districtPass && assemblyPass && categoryPass && severityPass && queryPass;
  });
}

export function getStatusCounts(cameras: CameraDevice[]) {
  const total = cameras.length;
  const online = cameras.filter((camera) => camera.status === "online").length;
  const offline = cameras.filter((camera) => camera.status === "offline").length;
  const noHit = cameras.filter((camera) => camera.status === "no-hit").length;

  return { total, online, offline, noHit };
}

export function getDistrictSummary(cameras: CameraDevice[]) {
  const districtMap = new Map<string, ReturnType<typeof getStatusCounts>>();

  for (const camera of cameras) {
    if (!districtMap.has(camera.district)) {
      districtMap.set(camera.district, { total: 0, online: 0, offline: 0, noHit: 0 });
    }

    const district = districtMap.get(camera.district);
    if (!district) {
      continue;
    }

    district.total += 1;
    if (camera.status === "online") district.online += 1;
    if (camera.status === "offline") district.offline += 1;
    if (camera.status === "no-hit") district.noHit += 1;
  }

  return Array.from(districtMap.entries()).map(([district, summary]) => ({ district, ...summary }));
}

export function getUniqueValues<T>(items: T[], valueSelector: (item: T) => string) {
  return ["ALL", ...Array.from(new Set(items.map(valueSelector)))];
}

export function toPercent(value: number, total: number) {
  if (!total) {
    return "0.00";
  }

  return ((value / total) * 100).toFixed(2);
}

export function formatDateTime(isoString: string) {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
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
