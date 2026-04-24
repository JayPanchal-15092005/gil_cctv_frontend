"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAllAlerts, type BackendAlert } from "@/lib/backendApi";
import { filterAlerts, formatDateTime, getUniqueValues, paginateItems } from "@/lib/mockData";
import {
  Pagination,
  Panel,
  PanelTitle,
  SearchField,
  SelectField,
  SeverityPill,
} from "@/components/portal/UiPrimitives";

const pageSize = 12;

export default function LogsPage() {
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const filteredRecords = useMemo(() => filterAlerts(alerts, filters), [alerts, filters]);
  const paginated = useMemo(() => paginateItems(filteredRecords, page, pageSize), [filteredRecords, page]);

  return (
    <div className="space-y-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SelectField
            label="District"
            value={filters.district}
            options={districtOptions}
            onChange={(district) => {
              setPage(1);
              setFilters((current) => ({ ...current, district }));
            }}
          />
          <SelectField
            label="Assembly"
            value={filters.assembly}
            options={assemblyOptions}
            onChange={(assembly) => {
              setPage(1);
              setFilters((current) => ({ ...current, assembly }));
            }}
          />
          <SelectField
            label="Category"
            value={filters.category}
            options={["ALL", "IN", "OUT"]}
            onChange={(category) => {
              setPage(1);
              setFilters((current) => ({ ...current, category }));
            }}
          />
          <SelectField
            label="Severity"
            value={filters.severity}
            options={["ALL", "info", "warning", "critical"]}
            onChange={(severity) => {
              setPage(1);
              setFilters((current) => ({ ...current, severity }));
            }}
          />
          <SearchField
            label="Search"
            placeholder="Stream id, AC, PS, address"
            value={filters.query}
            onChange={(query) => {
              setPage(1);
              setFilters((current) => ({ ...current, query }));
            }}
          />
        </div>
      </Panel>

      <Panel>
        <PanelTitle title="Logs" subtitle={loading ? "Loading real alert feed" : `Showing ${filteredRecords.length} records`} />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Stream Id</th>
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium">Assembly</th>
                <th className="px-4 py-3 font-medium">AC/PS</th>
                <th className="px-4 py-3 font-medium">Alert</th>
                <th className="px-4 py-3 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    Loading alerts from backend...
                  </td>
                </tr>
              ) : paginated.slice.length > 0 ? (
                paginated.slice.map((record) => (
                  <tr key={record.id} className="border-b border-white/5 hover:bg-slate-900/40">
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(record.timestamp)}</td>
                    <td className="px-4 py-3 font-semibold text-cyan-200">{record.streamId}</td>
                    <td className="px-4 py-3">{record.district}</td>
                    <td className="px-4 py-3">{record.assembly}</td>
                    <td className="px-4 py-3">
                      {record.acNo} / {record.psNo}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-200">{record.alertType}</td>
                    <td className="px-4 py-3">
                      <SeverityPill severity={record.severity} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    No log records found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {error ? <div className="px-4 py-3 text-sm text-rose-200">{error}</div> : null}
        <Pagination page={paginated.page} totalPages={paginated.totalPages} onChange={setPage} />
      </Panel>
    </div>
  );
}
