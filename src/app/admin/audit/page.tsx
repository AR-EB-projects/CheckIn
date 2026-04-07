"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  UPLOAD_STARTED: "Качване стартирано",
  UPLOAD_COMPLETED: "Качване завършено",
  UPLOAD_FAILED: "Качване неуспешно",
  FILE_UPDATED: "Файл обновен",
  FILE_DELETED: "Файл изтрит",
  FILE_DELETED_GC: "Файл изтрит (авто)",
  FOLDER_CREATED: "Папка създадена",
  FOLDER_RENAMED: "Папка преименувана",
  FOLDER_DELETED: "Папка изтрита",
  FOLDER_COPIED: "Папка копирана",
  FOLDER_ITEM_ADDED: "Видео добавено",
  FOLDER_ITEM_REMOVED: "Видео премахнато",
  FOLDER_ITEM_COPIED: "Видео копирано",
  SHARE_CREATED: "Линк създаден",
  SHARE_REVOKED: "Линк деактивиран",
  SHARE_ACCESSED: "Линк достъпен",
  SHARE_STREAM: "Видео стриймвано",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const router = useRouter();
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container p-6 fade-in">
      <div className="flex-col flex items-center text-center mb-8">
        <h1 className="text-gold mb-2" style={{ fontSize: "2rem", fontWeight: "600" }}>
          Одитен дневник
        </h1>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <button onClick={() => router.push("/admin/media")} className="btn btn-secondary">
          Назад
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: "auto", minWidth: "200px" }}
        >
          <option value="">Всички действия</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <span className="text-muted" style={{ lineHeight: "42px", fontSize: "0.85rem" }}>
          Общо: {total}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center mt-8">
          <div className="loading" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-muted" style={{ textAlign: "center" }}>
          Няма записи
        </p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid var(--border-color)",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "8px", color: "var(--text-muted)" }}>Дата</th>
                  <th style={{ padding: "8px", color: "var(--text-muted)" }}>Действие</th>
                  <th style={{ padding: "8px", color: "var(--text-muted)" }}>Тип</th>
                  <th style={{ padding: "8px", color: "var(--text-muted)" }}>Детайли</th>
                  <th style={{ padding: "8px", color: "var(--text-muted)" }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <td style={{ padding: "8px", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString("bg-BG", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "8px" }}>
                      {ACTION_LABELS[log.action] || log.action}
                    </td>
                    <td style={{ padding: "8px" }} className="text-muted">
                      {log.entityType}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      className="text-muted"
                      title={log.details || ""}
                    >
                      {formatDetails(log.details)}
                    </td>
                    <td style={{ padding: "8px" }} className="text-muted">
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-4">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ padding: "6px 14px", fontSize: "13px" }}
              >
                Назад
              </button>
              <span className="text-muted" style={{ lineHeight: "36px" }}>
                {page} / {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: "6px 14px", fontSize: "13px" }}
              >
                Напред
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatDetails(details: string | null): string {
  if (!details) return "—";
  try {
    const obj = JSON.parse(details);
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  } catch {
    return details;
  }
}
