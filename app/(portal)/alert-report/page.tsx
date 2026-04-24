"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAllAlerts, type BackendAlert } from "@/lib/backendApi";
import { filterAlerts, formatDateTime, getUniqueValues, paginateItems } from "@/lib/mockData";
import {
  Pagination,
  Panel,
  SearchField,
  SelectField,
  SeverityPill,
} from "@/components/portal/UiPrimitives";

export default function AlertReportPage() {
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    district: "ALL",
    assembly: "ALL",
    category: "ALL",
    severity: "ALL",
    query: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadAlerts = async () => {
      try {
        setLoading(true);
        setError("");
        const items = await fetchAllAlerts({ pageSize: 500 });

        if (!cancelled) {
          setAlerts(items);
        }
      } catch (error_) {
        if (!cancelled) {
          setError(error_ instanceof Error ? error_.message : "Failed to load alerts.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  const districtOptions = useMemo(() => ["ALL", ...getUniqueValues(alerts, (alert) => alert.district).slice(1)], [alerts]);
  const assemblyOptions = useMemo(() => ["ALL", ...getUniqueValues(alerts, (alert) => alert.assembly).slice(1)], [alerts]);

  const filtered = useMemo(() => filterAlerts(alerts, filters), [alerts, filters]);
  const paginated = useMemo(() => paginateItems(filtered, page, rowsPerPage), [filtered, page, rowsPerPage]);

  return (
    <div className="space-y-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_1.3fr_auto]">
          <SelectField
            label="Filter by District"
            value={filters.district}
            options={districtOptions}
            onChange={(district) => {
              setPage(1);
              setFilters((current) => ({ ...current, district }));
            }}
          />
          <SelectField
            label="Filter by Assembly"
            value={filters.assembly}
            options={assemblyOptions}
            onChange={(assembly) => {
              setPage(1);
              setFilters((current) => ({ ...current, assembly }));
            }}
          />
          <SelectField
            label="Filter by Category"
            value={filters.category}
            options={["ALL", "IN", "OUT"]}
            onChange={(category) => {
              setPage(1);
              setFilters((current) => ({ ...current, category }));
            }}
          />
          <SelectField
            label="Filter by Alerts"
            value={filters.severity}
            options={["ALL", "info", "warning", "critical"]}
            onChange={(severity) => {
              setPage(1);
              setFilters((current) => ({ ...current, severity }));
            }}
          />
          <SearchField
            label="AC No / PS No / CID"
            placeholder="Search alerts"
            value={filters.query}
            onChange={(query) => {
              setPage(1);
              setFilters((current) => ({ ...current, query }));
            }}
          />
          <button
            type="button"
            onClick={() => {
              setFilters({
                district: "ALL",
                assembly: "ALL",
                category: "ALL",
                severity: "ALL",
                query: "",
              });
              setPage(1);
            }}
            className="h-11 self-end rounded-xl border border-slate-600 px-5 text-sm text-slate-200 transition hover:border-cyan-400"
          >
            Reset
          </button>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/30 text-slate-300">
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium">Assembly</th>
                <th className="px-4 py-3 font-medium">AC No</th>
                <th className="px-4 py-3 font-medium">PS No</th>
                <th className="px-4 py-3 font-medium">PS Address</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Stream Id</th>
                <th className="px-4 py-3 font-medium">Alert Type</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">
                    Loading alert report from backend...
                  </td>
                </tr>
              ) : paginated.slice.length > 0 ? (
                paginated.slice.map((record) => (
                  <tr key={record.id} className="border-b border-white/5 hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-semibold text-white">{record.district}</td>
                    <td className="px-4 py-3">{record.assembly}</td>
                    <td className="px-4 py-3">{record.acNo}</td>
                    <td className="px-4 py-3">{record.psNo}</td>
                    <td className="max-w-xl truncate px-4 py-3 text-slate-200">{record.psAddress}</td>
                    <td className="px-4 py-3">{record.category}</td>
                    <td className="px-4 py-3 text-cyan-200">{record.streamId}</td>
                    <td className="px-4 py-3">{record.alertType}</td>
                    <td className="px-4 py-3">
                      <SeverityPill severity={record.severity} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(record.timestamp)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">
                    No alerts found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {error ? <div className="px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Rows per page:
            <select
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-sm"
            >
              {[25, 50, 100, 200].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <p className="text-sm text-slate-400">
            {Math.min((paginated.page - 1) * rowsPerPage + 1, filtered.length)}-{Math.min(paginated.page * rowsPerPage, filtered.length)} of {filtered.length}
          </p>

          <Pagination page={paginated.page} totalPages={paginated.totalPages} onChange={setPage} />
        </div>
      </Panel>
    </div>
  );
}
