"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ShareLink {
  id: string;
  token: string;
  name: string | null;
  expiresAt: string;
  createdAt: string;
  accessCount: number;
  videoCount: number;
  publicUrl: string;
  isExpired: boolean;
}

interface MediaFile {
  id: string;
  displayName: string;
  status: string;
}

export default function SharesPage() {
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [allFiles, setAllFiles] = useState<MediaFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shareName, setShareName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingShare, setDeletingShare] = useState<ShareLink | null>(null);
  const router = useRouter();

  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shares");
      if (res.ok) {
        const data = await res.json();
        setShares(data.shares);
      }
    } catch (err) {
      console.error("Error fetching shares:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const openCreate = async () => {
    setShowCreate(true);
    setSelectedIds(new Set());
    setShareName("");
    try {
      const res = await fetch("/api/admin/media?limit=100&status=READY");
      if (res.ok) {
        const data = await res.json();
        setAllFiles(data.files);
      }
    } catch {
      // Ignore
    }
  };

  const toggleFile = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (selectedIds.size === 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: shareName.trim() || null,
          mediaFileIds: Array.from(selectedIds),
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        fetchShares();
      } else {
        const data = await res.json();
        alert(data.error || "Грешка при създаване на линк.");
      }
    } catch {
      alert("Грешка при създаване на линк.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingShare) return;
    try {
      const res = await fetch(`/api/admin/shares/${deletingShare.id}`, { method: "DELETE" });
      if (res.ok) {
        setShares(shares.filter((s) => s.id !== deletingShare.id));
        setDeletingShare(null);
      }
    } catch {
      alert("Грешка при деактивиране.");
    }
  };

  const copyUrl = async (share: ShareLink) => {
    try {
      await navigator.clipboard.writeText(share.publicUrl);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      prompt("Копирайте линка:", share.publicUrl);
    }
  };

  return (
    <div className="container p-6 fade-in">
      <div className="flex-col flex items-center text-center mb-8">
        <h1 className="text-gold mb-2" style={{ fontSize: "2rem", fontWeight: "600" }}>
          Споделени линкове
        </h1>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <button className="btn btn-primary" onClick={openCreate}>
          Създай линк за споделяне
        </button>
        <button onClick={() => router.push("/admin/media")} className="btn btn-secondary">
          Назад
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-8">
          <div className="loading" />
        </div>
      ) : shares.length === 0 ? (
        <p className="text-muted" style={{ textAlign: "center" }}>
          Няма създадени линкове
        </p>
      ) : (
        <div className="grid grid-cols-1" style={{ gap: "12px" }}>
          {shares.map((share) => (
            <div key={share.id} className="card" style={{ padding: "16px" }}>
              <div className="flex justify-between items-center" style={{ flexWrap: "wrap", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3">
                    <strong>{share.name || "Без име"}</strong>
                    <span
                      className="badge"
                      style={{
                        background: share.isExpired ? "var(--error)" : "var(--success)",
                        color: "#000",
                        fontSize: "0.7rem",
                      }}
                    >
                      {share.isExpired ? "Изтекъл" : "Активен"}
                    </span>
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: "4px" }}>
                    {share.videoCount} видеа ·{" "}
                    Създаден: {new Date(share.createdAt).toLocaleDateString("bg-BG")} ·{" "}
                    Изтича: {new Date(share.expiresAt).toLocaleDateString("bg-BG")} ·{" "}
                    Достъпвания: {share.accessCount}
                  </div>
                </div>
                <div className="flex gap-3">
                  {!share.isExpired && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => copyUrl(share)}
                    >
                      {copiedId === share.id ? "Копирано!" : "Копирай линк"}
                    </button>
                  )}
                  <button
                    className="btn btn-error"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => setDeletingShare(share)}
                  >
                    Деактивирай
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create share modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => !creating && setShowCreate(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "550px", maxHeight: "80vh", overflowY: "auto" }}
          >
            <h3 style={{ marginBottom: "16px" }}>Създай линк за споделяне</h3>
            <p className="text-muted" style={{ marginBottom: "16px", fontSize: "0.85rem" }}>
              Линкът изтича след 7 дни
            </p>
            <input
              type="text"
              placeholder="Име на линка (незадължително)"
              value={shareName}
              onChange={(e) => setShareName(e.target.value)}
              style={{ marginBottom: "16px" }}
            />
            <p style={{ marginBottom: "8px", fontSize: "0.9rem" }}>
              Избери видеа за споделяне:
            </p>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                marginBottom: "24px",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
              }}
            >
              {allFiles.length === 0 ? (
                <p className="text-muted" style={{ padding: "16px", textAlign: "center" }}>
                  Няма готови видеа
                </p>
              ) : (
                allFiles.map((file) => (
                  <label
                    key={file.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-color)",
                      background: selectedIds.has(file.id)
                        ? "rgba(212, 175, 55, 0.08)"
                        : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(file.id)}
                      onChange={() => toggleFile(file.id)}
                      style={{ width: "auto", marginRight: "12px" }}
                    />
                    <span>{file.displayName}</span>
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-center gap-4">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)} disabled={creating}>
                Отказ
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={creating || selectedIds.size === 0}
              >
                {creating ? "Създаване..." : `Създай (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingShare && (
        <div className="modal-overlay" onClick={() => setDeletingShare(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "16px" }}>Потвърждение</h3>
            <p style={{ marginBottom: "24px" }}>
              Деактивиране на линк <strong>{deletingShare.name || "без име"}</strong>?
            </p>
            <p className="text-muted" style={{ marginBottom: "24px", fontSize: "0.85rem" }}>
              Линкът ще стане неактивен. Видеата няма да бъдат изтрити.
            </p>
            <div className="flex justify-center gap-4">
              <button className="btn btn-secondary" onClick={() => setDeletingShare(null)}>
                Отказ
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                Деактивирай
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
