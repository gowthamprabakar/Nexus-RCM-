import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { EmptyState, ErrorBanner, Skeleton } from '../../../components/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) => {
  const v = Number(n) || 0;
  if (v < 0) return '-$' + Math.abs(v).toLocaleString();
  return '$' + v.toLocaleString();
};

const fmtBytes = (b) => {
  const n = Number(b) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const ACCEPTED_TYPES = ['.csv', '.txt', '.835'];
const isAcceptable = (file) => {
  const name = (file?.name || '').toLowerCase();
  return ACCEPTED_TYPES.some((ext) => name.endsWith(ext));
};

const SEVERITY_STYLES = {
  critical: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low: 'bg-th-surface-overlay text-th-muted border-th-border',
};
const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };

const STATUS_COLUMNS = ['Queued', 'Processing', 'Auto-Posted', 'Exceptions', 'In-Review'];
const STATUS_STYLES = {
  Queued: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Processing: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'Auto-Posted': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Exceptions: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  'In-Review': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'Pending Approval': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  Paid: 'bg-emerald-500/10 text-emerald-400',
  Denied: 'bg-rose-500/10 text-rose-400',
  Adjusted: 'bg-amber-500/10 text-amber-400',
};

const normalizeStatus = (raw) => {
  const s = (raw || '').toString().toLowerCase().trim();
  if (s === 'auto-posted' || s === 'autoposted' || s === 'auto_posted' || s === 'posted') return 'Auto-Posted';
  if (s === 'exceptions' || s === 'exception' || s === 'failed') return 'Exceptions';
  if (s === 'processing' || s === 'in_progress' || s === 'in-progress') return 'Processing';
  if (s === 'in-review' || s === 'in_review' || s === 'review') return 'In-Review';
  if (s === 'pending approval' || s === 'pending_approval') return 'Pending Approval';
  if (s === 'queued' || s === 'pending' || s === 'new') return 'Queued';
  return raw || 'Queued';
};

const AIBadge = ({ level }) => {
  const config = {
    Descriptive: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Diagnostic: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Predictive: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Prescriptive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${config[level]}`}>
      {level}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// File Upload Widget
// ─────────────────────────────────────────────────────────────────────────────

function FileUploadWidget({ onUploadComplete, onPostAll }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState([]); // [{id, file, progress, status, result, expanded}]
  const [posting, setPosting] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback(async (files) => {
    const accepted = Array.from(files).filter(isAcceptable);
    const rejected = Array.from(files).filter((f) => !isAcceptable(f));

    if (rejected.length > 0) {
      const rejectedItems = rejected.map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        progress: 0,
        status: 'rejected',
        result: { errors: [{ message: `Unsupported file type. Accepted: ${ACCEPTED_TYPES.join(', ')}` }] },
        expanded: true,
      }));
      setUploads((prev) => [...prev, ...rejectedItems]);
    }

    for (const file of accepted) {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploads((prev) => [...prev, { id, file, progress: 0, status: 'uploading', result: null, expanded: false }]);

      const result = await api.payments.era.importFile(file, (pct) => {
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: pct } : u)));
      });

      const failed = result?.ok === false || (result?.error_rows > 0 && (result?.valid_rows || 0) === 0);
      setUploads((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, progress: 100, status: failed ? 'failed' : 'complete', result, expanded: !!(result?.errors?.length) }
            : u,
        ),
      );

      if (!failed && typeof onUploadComplete === 'function') {
        onUploadComplete(result);
      }
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const totalStagedIds = useMemo(() => {
    return uploads
      .filter((u) => u.status === 'complete')
      .flatMap((u) => u.result?.staged_ids || []);
  }, [uploads]);

  const totalValid = uploads.reduce((s, u) => s + (u.result?.valid_rows || 0), 0);
  const totalErrors = uploads.reduce((s, u) => s + (u.result?.error_rows || 0), 0);

  const handlePostAll = async () => {
    if (!totalStagedIds.length || posting) return;
    setPosting(true);
    try {
      await onPostAll?.({ staged_ids: totalStagedIds });
    } finally {
      setPosting(false);
    }
  };

  const removeUpload = (id) => setUploads((prev) => prev.filter((u) => u.id !== id));
  const clearAll = () => setUploads([]);

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        className={`rounded-xl border-2 border-dashed transition-all p-6 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-th-border bg-white dark:bg-card-dark hover:border-primary/50 hover:bg-th-surface-overlay/30'
        }`}
        aria-label="Drop ERA files here or click to browse"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,.txt,.835"
          className="sr-only"
          onChange={(e) => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ''; } }}
        />
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${dragActive ? 'bg-primary/20' : 'bg-th-surface-overlay'}`}>
            <span className={`material-symbols-outlined text-2xl ${dragActive ? 'text-primary' : 'text-th-secondary'}`}>cloud_upload</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-th-heading">
              {dragActive ? 'Release to upload' : 'Drag & drop ERA / 835 files here, or click to browse'}
            </p>
            <p className="text-xs text-th-muted mt-0.5">
              Accepted formats: {ACCEPTED_TYPES.join(', ')} · Multiple files supported
            </p>
          </div>
          {uploads.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              className="px-3 py-1.5 rounded-lg bg-th-surface-overlay text-th-muted text-xs font-bold hover:text-th-heading transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden">
          <div className="px-4 py-3 border-b border-th-border flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-th-heading font-bold">Staging</span>
              {totalValid > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {totalValid} valid rows
                </span>
              )}
              {totalErrors > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {totalErrors} errors
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handlePostAll}
              disabled={!totalStagedIds.length || posting}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {posting ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Posting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Post All Valid ({totalStagedIds.length})
                </>
              )}
            </button>
          </div>

          <div className="divide-y divide-th-border/50">
            {uploads.map((u) => (
              <div key={u.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-lg ${
                    u.status === 'complete' ? 'text-emerald-400' :
                    u.status === 'failed' || u.status === 'rejected' ? 'text-rose-400' : 'text-blue-400'
                  }`}>
                    {u.status === 'complete' ? 'check_circle' :
                     u.status === 'failed' || u.status === 'rejected' ? 'error' : 'description'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-th-heading truncate">{u.file?.name}</p>
                      <span className="text-xs text-th-muted shrink-0">{fmtBytes(u.file?.size)}</span>
                    </div>
                    {u.status === 'uploading' && (
                      <div className="mt-1.5 h-1.5 rounded-full bg-th-surface-overlay overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-200" style={{ width: `${u.progress}%` }} />
                      </div>
                    )}
                    {(u.status === 'complete' || u.status === 'failed') && u.result && (
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        {u.result.total_rows != null && (
                          <span className="text-th-muted">Parsed {u.result.total_rows} rows</span>
                        )}
                        {u.result.valid_rows > 0 && (
                          <span className="text-emerald-400 font-bold">· {u.result.valid_rows} valid</span>
                        )}
                        {u.result.error_rows > 0 && (
                          <button
                            type="button"
                            onClick={() => setUploads((p) => p.map((x) => x.id === u.id ? { ...x, expanded: !x.expanded } : x))}
                            className="text-amber-400 font-bold hover:underline focus:outline-none"
                          >
                            · {u.result.error_rows} errors {u.expanded ? '▾' : '▸'}
                          </button>
                        )}
                      </div>
                    )}
                    {u.status === 'rejected' && u.result?.errors?.[0] && (
                      <p className="text-[11px] text-rose-400 mt-0.5">{u.result.errors[0].message}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeUpload(u.id)}
                    className="text-th-muted hover:text-th-heading p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Remove"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>

                {u.expanded && u.result?.errors?.length > 0 && (
                  <div className="mt-2 ml-8 p-2 rounded bg-rose-500/5 border border-rose-500/20 max-h-40 overflow-y-auto">
                    <ul className="space-y-0.5 text-[11px] text-rose-300">
                      {u.result.errors.slice(0, 50).map((err, i) => (
                        <li key={i} className="font-mono">
                          {err.row != null && <span className="text-th-muted mr-2">row {err.row}:</span>}
                          {err.message || err.error || JSON.stringify(err)}
                        </li>
                      ))}
                      {u.result.errors.length > 50 && (
                        <li className="text-th-muted italic">...and {u.result.errors.length - 50} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-Post Modal
// ─────────────────────────────────────────────────────────────────────────────

function AutoPostModal({ open, onClose, onSubmit, payers }) {
  const [minConfidence, setMinConfidence] = useState(90);
  const [payerId, setPayerId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  if (!open) return null;

  const downloadErrorCsv = (errors) => {
    if (!errors?.length) return;
    const headers = Object.keys(errors[0] || { message: '' });
    const lines = [headers.join(',')];
    for (const e of errors) {
      lines.push(headers.map((h) => JSON.stringify(e[h] ?? '')).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `era-auto-post-errors-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    const payload = {
      min_confidence: minConfidence,
      ...(payerId ? { payer_id: payerId } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    };
    const res = await onSubmit?.(payload);
    setResult(res || { posted_count: 0, skipped_count: 0, errors: [] });
    setSubmitting(false);
  };

  const close = () => {
    if (submitting) return;
    setResult(null);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={close}>
      <div
        className="w-full max-w-lg rounded-xl bg-white dark:bg-card-dark border border-th-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-th-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bolt</span>
            <h3 className="text-base font-bold text-th-heading">Batch Auto-Post</h3>
          </div>
          <button onClick={close} className="text-th-muted hover:text-th-heading focus:outline-none" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {!result ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="flex justify-between text-xs font-bold uppercase tracking-wider text-th-muted mb-2">
                <span>Min Confidence Threshold</span>
                <span className="text-primary tabular-nums">{minConfidence}%</span>
              </label>
              <input
                type="range"
                min={50}
                max={100}
                step={1}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-th-muted mt-1">
                <span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-th-muted mb-1.5">Payer (optional)</label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-th-border bg-th-surface-overlay text-th-heading text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All payers</option>
                {(payers || []).map((p) => (
                  <option key={p.id || p.payer_id || p.name} value={p.id || p.payer_id || ''}>
                    {p.name || p.payer_name || p.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-th-muted mb-1.5">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-th-border bg-th-surface-overlay text-th-heading text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-th-muted mb-1.5">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-th-border bg-th-surface-overlay text-th-heading text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={close}
                className="flex-1 h-10 rounded-lg border border-th-border text-th-primary text-sm font-bold hover:bg-th-surface-overlay transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Posting...
                  </>
                ) : (
                  'Run Auto-Post'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                <p className="text-2xl font-black text-emerald-400 tabular-nums">{result.posted_count || 0}</p>
                <p className="text-[10px] font-bold uppercase text-emerald-400/80 mt-1">Posted</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                <p className="text-2xl font-black text-amber-400 tabular-nums">{result.skipped_count || 0}</p>
                <p className="text-[10px] font-bold uppercase text-amber-400/80 mt-1">Skipped</p>
              </div>
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3">
                <p className="text-2xl font-black text-rose-400 tabular-nums">{result.errors?.length || 0}</p>
                <p className="text-[10px] font-bold uppercase text-rose-400/80 mt-1">Errors</p>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div>
                <button
                  onClick={() => downloadErrorCsv(result.errors)}
                  className="w-full h-9 rounded-lg border border-th-border text-th-primary text-xs font-bold hover:bg-th-surface-overlay transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export errors as CSV
                </button>
              </div>
            )}

            <button
              onClick={close}
              className="w-full h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual Match Modal
// ─────────────────────────────────────────────────────────────────────────────

function ManualMatchModal({ open, eraId, onClose, onSelect }) {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !eraId) return;
    let cancelled = false;
    setLoading(true);
    setSelectedId(null);
    setNotes('');
    api.payments.era.getMatchCandidates(eraId).then((res) => {
      if (cancelled) return;
      setCandidates(res?.items || res?.candidates || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open, eraId]);

  if (!open) return null;

  const submit = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    await onSelect?.({ target_claim_id: selectedId, notes: notes || undefined });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[85vh] rounded-xl bg-white dark:bg-card-dark border border-th-border shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-th-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-th-heading">Manual Claim Match</h3>
            <p className="text-xs text-th-muted mt-0.5">ERA <span className="font-mono text-primary">{eraId}</span></p>
          </div>
          <button onClick={onClose} className="text-th-muted hover:text-th-heading focus:outline-none" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : candidates.length === 0 ? (
            <EmptyState
              icon="search_off"
              title="No match candidates"
              description="The matching engine could not find any plausible claims for this remittance."
            />
          ) : (
            candidates.map((c) => {
              const id = c.claim_id || c.id;
              const conf = Number(c.confidence ?? c.confidence_score ?? 0);
              const isSelected = selectedId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedId(id)}
                  className={`w-full text-left rounded-lg border p-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-th-border bg-th-surface-overlay/30 hover:bg-th-surface-overlay/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-primary font-bold">{id}</span>
                        <span className="text-sm font-bold text-th-heading">{c.patient_name || '—'}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-th-muted">
                        <span>DOS: {c.date_of_service || c.dos || '—'}</span>
                        <span>Billed: <span className="text-th-heading tabular-nums">{fmt(c.billed)}</span></span>
                        <span>Allowed: <span className="text-th-heading tabular-nums">{fmt(c.allowed)}</span></span>
                      </div>
                      {(c.match_reasons?.length || c.reasons?.length) ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {(c.match_reasons || c.reasons).slice(0, 4).map((r, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-th-surface-overlay text-th-muted border border-th-border">
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-black tabular-nums ${conf >= 90 ? 'text-emerald-400' : conf >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {Math.round(conf)}%
                      </p>
                      <p className="text-[10px] uppercase font-bold text-th-muted">confidence</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-th-border p-4 space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Resolution notes (optional)"
            className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-surface-overlay text-th-heading text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-th-border text-th-primary text-sm font-bold hover:bg-th-surface-overlay transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!selectedId || submitting}
              className="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Submitting...
                </>
              ) : (
                'Match Selected Claim'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast (lightweight inline notifier)
// ─────────────────────────────────────────────────────────────────────────────

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  const styles = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    error: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    info: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border px-4 py-3 shadow-lg ${styles[type]}`} role="status" aria-live="polite">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-base mt-0.5">
          {type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
        </span>
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="text-current opacity-70 hover:opacity-100 focus:outline-none">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kanban Card
// ─────────────────────────────────────────────────────────────────────────────

function KanbanCard({ era, fmt, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, era)}
      className="rounded-lg bg-white dark:bg-card-dark border border-th-border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-primary font-bold truncate">{era.id}</span>
        <span className="text-[10px] text-th-muted shrink-0">{era.date}</span>
      </div>
      <p className="text-sm font-bold text-th-heading mt-1 truncate">{era.payer}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-400 tabular-nums">{fmt(era.amount || 0)}</span>
        <span className="text-[10px] text-th-muted">{era.lineCount || era.line_count || 0} lines</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function ERAProcessing() {
  const navigate = useNavigate();
  const [expandedERA, setExpandedERA] = useState(null);
  const [activeView, setActiveView] = useState('queue');
  const [queueLayout, setQueueLayout] = useState('table'); // 'table' | 'kanban'
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [eraFiles, setEraFiles] = useState([]);
  const [summary, setSummary] = useState(null);
  const [underpayments, setUnderpayments] = useState([]);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [revenueLeakageFindings, setRevenueLeakageFindings] = useState(null);
  const [carcMap, setCarcMap] = useState({});
  const [rarcMap, setRarcMap] = useState({});
  const [triangulation, setTriangulation] = useState(null);
  const [unmatchedDrawerOpen, setUnmatchedDrawerOpen] = useState(false);
  const [unmatchedItems, setUnmatchedItems] = useState(null);
  const [unmatchedLoading, setUnmatchedLoading] = useState(false);
  const [autoPostOpen, setAutoPostOpen] = useState(false);
  const [matchModal, setMatchModal] = useState({ open: false, eraId: null });
  const [resolvingId, setResolvingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [draggingId, setDraggingId] = useState(null);

  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);

  const reload = useCallback(() => setRefreshTick((x) => x + 1), []);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setLoadError(null);
      try {
        const [eraResult, summaryResult, underpayResult, triResult] = await Promise.all([
          api.payments.getERABatchList({ size: 50 }),
          api.payments.getSummary(),
          api.payments.getSilentUnderpayments(),
          api.payments.getTriangulationSummary(),
        ]);
        if (cancelled) return;
        setEraFiles(eraResult?.items || []);
        setSummary(summaryResult);
        setUnderpayments(underpayResult?.items || []);
        setTriangulation(triResult);
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || 'Unable to load ERA data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();

    // Diagnostics — non-blocking
    api.diagnostics?.getFindings?.({ category: 'REVENUE_LEAKAGE' })
      .catch(() => null)
      .then((data) => { if (data && !cancelled) setRevenueLeakageFindings(data); });

    // CARC / RARC reference tables — graceful empty if 404
    Promise.all([
      api.payments.getCarcCodes().catch(() => ({ items: [] })),
      api.payments.getRarcCodes().catch(() => ({ items: [] })),
    ]).then(([carc, rarc]) => {
      if (cancelled) return;
      const mapFrom = (resp) => {
        const list = resp?.items || resp?.codes || resp || [];
        const out = {};
        (Array.isArray(list) ? list : []).forEach((c) => {
          const code = c.code || c.id || c.carc_code || c.rarc_code;
          if (code) out[String(code).toUpperCase()] = c.description || c.label || c.text || '';
        });
        return out;
      };
      setCarcMap(mapFrom(carc));
      setRarcMap(mapFrom(rarc));
    });

    return () => { cancelled = true; };
  }, [refreshTick]);

  // ─── Expand row → fetch line detail ───────────────────────────────────────
  useEffect(() => {
    if (!expandedERA) { setExpandedDetail(null); return; }
    let cancelled = false;
    async function fetchDetail() {
      const batch = eraFiles.find((e) => e.id === expandedERA);
      if (!batch) return;
      const result = await api.payments.getERAList({ page: 1, size: 20, payer_id: batch.payer_id });
      if (!cancelled && result?.items) {
        const lines = result.items.map((item) => {
          // Resolve CARC/RARC codes from API response (fallback to derived if not present)
          const carc = item.carc_code || item.adj_type ||
            (item.co_amount > 0 ? 'CO-45' : item.pr_amount > 0 ? 'PR-1' : '');
          const rarc = item.rarc_code || item.rarc || (item.oa_amount > 0 ? 'N362' : '');
          return {
            claimId: item.claim_id || item.era_id,
            cpt: item.cpt_code || item.payment_method || 'ERA',
            billed: item.billed_amount || item.allowed_amount || 0,
            allowed: item.allowed_amount || 0,
            paid: item.payment_amount || 0,
            adj: (item.co_amount || 0) + (item.pr_amount || 0) + (item.oa_amount || 0),
            carc,
            rarc,
            patResp: item.pr_amount || item.patient_responsibility || 0,
            status: item.payment_amount > 0 ? 'Paid' : 'Denied',
          };
        });
        setExpandedDetail({ lines });
      }
    }
    fetchDetail();
    return () => { cancelled = true; };
  }, [expandedERA, eraFiles]);

  const carcLabel = (code) => {
    if (!code) return '';
    const upper = String(code).toUpperCase();
    return carcMap[upper] || carcMap[upper.replace(/^CO-?/, '')] || carcMap[upper.replace(/^PR-?/, '')] || '';
  };
  const rarcLabel = (code) => {
    if (!code) return '';
    return rarcMap[String(code).toUpperCase()] || '';
  };

  // ─── Derived KPIs ─────────────────────────────────────────────────────────
  const filesInQueue = eraFiles.length;
  const totalPending = summary?.total_posted || eraFiles.reduce((s, e) => s + (e.amount || 0), 0);
  const totalLines = summary?.total_era_count || eraFiles.reduce((s, e) => s + (e.lineCount || e.line_count || 0), 0);
  const autoMatchRate = eraFiles.length > 0
    ? (eraFiles.reduce((s, e) => s + (e.autoMatchRate || e.auto_match_rate || 0), 0) / eraFiles.length).toFixed(1)
    : (summary?.avg_payment_rate || 0);
  const exceptionsCount = eraFiles.filter((e) => normalizeStatus(e.status) === 'Exceptions').length;
  const underpaymentTotal = underpayments.reduce((s, u) => s + Math.abs(u.totalImpact || u.total_impact || u.variance || 0), 0);

  // Sort underpayments by severity desc
  const sortedUnderpayments = useMemo(() => {
    return [...underpayments].sort((a, b) => {
      const sa = SEVERITY_RANK[(a.severity || 'low').toLowerCase()] || 0;
      const sb = SEVERITY_RANK[(b.severity || 'low').toLowerCase()] || 0;
      if (sb !== sa) return sb - sa;
      return Math.abs(b.totalImpact || b.total_impact || 0) - Math.abs(a.totalImpact || a.total_impact || 0);
    });
  }, [underpayments]);

  // Build payer list for auto-post modal (from triangulation breakdown)
  const payerOptions = useMemo(() => {
    const src = triangulation?.payer_breakdown || triangulation?.payers || [];
    return src.map((p) => ({
      id: p.payer_id || p.id,
      name: p.payer_name || p.payer || p.name,
    })).filter((p) => p.id && p.name);
  }, [triangulation]);

  // ─── Triangulation / bank cross-check counts ──────────────────────────────
  const triByStatus = triangulation?.by_status || [];
  const unmatchedCount = useMemo(() => {
    const row = triByStatus.find((s) => (s.status || '').toLowerCase() === 'unmatched');
    return row?.count || 0;
  }, [triByStatus]);
  const matchedCount = useMemo(() => {
    const row = triByStatus.find((s) => (s.status || '').toLowerCase() === 'matched');
    return row?.count || 0;
  }, [triByStatus]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleUploadComplete = useCallback((res) => {
    showToast(`Imported ${res.filename || 'file'}: ${res.valid_rows || 0} valid rows`, 'success');
  }, [showToast]);

  const handlePostAllStaged = useCallback(async ({ staged_ids } = {}) => {
    const res = await api.payments.era.batchAutoPost({ staged_ids });
    if (res?.posted_count > 0) {
      showToast(`Posted ${res.posted_count} ERA(s). ${res.skipped_count || 0} skipped.`, 'success');
      reload();
    } else {
      showToast(res?.errors?.[0]?.message || 'No ERAs were posted', 'error');
    }
    return res;
  }, [reload, showToast]);

  const handleAutoPostSubmit = useCallback(async (payload) => {
    const res = await api.payments.era.batchAutoPost(payload);
    if (res?.posted_count > 0) {
      showToast(`Auto-posted ${res.posted_count} ERA(s)`, 'success');
      reload();
    } else if (res?.errors?.length) {
      showToast(res.errors[0].message || 'Auto-post completed with errors', 'error');
    } else {
      showToast('No ERAs matched the criteria', 'info');
    }
    return res;
  }, [reload, showToast]);

  const resolveException = useCallback(async (eraId, action, extra = {}) => {
    setResolvingId(eraId);
    const res = await api.payments.era.resolveException(eraId, { action, ...extra });
    setResolvingId(null);
    if (res?.ok === false) {
      showToast(res.error || `Failed to ${action} exception`, 'error');
      return res;
    }
    showToast(`Exception ${action === 'accept' ? 'accepted' : action === 'escalate' ? 'escalated' : action === 'manual_match' ? 'matched manually' : 'resolved'}`, 'success');
    reload();
    return res;
  }, [reload, showToast]);

  const openManualMatch = useCallback((eraId) => {
    setMatchModal({ open: true, eraId });
  }, []);

  const submitManualMatch = useCallback(async ({ target_claim_id, notes }) => {
    const eraId = matchModal.eraId;
    const res = await resolveException(eraId, 'manual_match', { target_claim_id, notes });
    if (res?.ok !== false) {
      setMatchModal({ open: false, eraId: null });
    }
  }, [matchModal.eraId, resolveException]);

  const openUnmatchedDrawer = useCallback(async () => {
    setUnmatchedDrawerOpen(true);
    if (unmatchedItems != null) return;
    setUnmatchedLoading(true);
    const res = await api.payments.getUnmatchedEras(50);
    setUnmatchedItems(res?.items || []);
    setUnmatchedLoading(false);
  }, [unmatchedItems]);

  // ─── Drag and drop handlers (Kanban) ──────────────────────────────────────
  const onCardDragStart = (e, era) => {
    setDraggingId(era.id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', era.id); } catch (_) {}
  };
  const onColumnDrop = async (status) => {
    const eraId = draggingId;
    setDraggingId(null);
    if (!eraId) return;
    const item = eraFiles.find((e) => e.id === eraId);
    if (!item || normalizeStatus(item.status) === status) return;
    setEraFiles((prev) => prev.map((e) => (e.id === eraId ? { ...e, status } : e)));
    const res = await api.payments.era.updateStatus(eraId, status);
    if (res?.ok === false) {
      showToast('Status update failed', 'error');
      reload();
    } else {
      showToast(`Moved ${eraId} → ${status}`, 'success');
    }
  };

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-th-surface-overlay/30 dark:bg-background-dark font-sans h-full">
        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto bg-th-surface-overlay/30 dark:bg-background-dark font-sans h-full">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">

        {loadError && (
          <ErrorBanner title="Failed to load ERA data" message={loadError} onRetry={reload} />
        )}

        {/* Header */}
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">ERA Processing Engine</span>
            </div>
            <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight">ERA / 835 Processing</h1>
            <p className="text-th-muted text-sm max-w-2xl">Import, validate, auto-match, and post electronic remittance advice with AI-assisted exception handling.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setAutoPostOpen(true)}
              className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 shadow-lg shadow-primary/20 hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="material-symbols-outlined text-lg">bolt</span>
              Auto-Post
            </button>
          </div>
        </div>

        {/* File Upload Widget */}
        <FileUploadWidget onUploadComplete={handleUploadComplete} onPostAll={handlePostAllStaged} />

        {/* Bank Cross-Check Strip */}
        {triangulation && (
          <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark p-4 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-400 text-lg">account_balance</span>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-th-muted">Bank Cross-Check</p>
                <p className="text-sm text-th-heading font-medium">
                  <span className="text-emerald-400 font-bold">{matchedCount}</span> matched ·{' '}
                  <button
                    onClick={openUnmatchedDrawer}
                    className="text-rose-400 font-bold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    type="button"
                  >
                    {unmatchedCount} unmatched
                  </button>{' '}
                  ERAs vs bank deposits
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/analytics/payments/era-bank-recon')}
              className="text-xs font-bold text-primary hover:underline focus:outline-none"
            >
              Open full reconciliation →
            </button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Files in Queue', value: String(filesInQueue), icon: 'inbox', sub: `${totalLines} lines`, accent: 'border-l-blue-500' },
            { label: 'Total Pending Amount', value: fmt(totalPending), icon: 'attach_money', sub: `${totalLines} lines`, accent: 'border-l-emerald-500' },
            { label: 'Auto-Match Rate', value: `${autoMatchRate}%`, icon: 'auto_fix_high', sub: summary ? 'From payment summary' : 'Calculated', accent: 'border-l-purple-500' },
            { label: 'Exceptions Pending', value: String(exceptionsCount), icon: 'report_problem', sub: `${fmt(underpaymentTotal)} at risk`, accent: 'border-l-amber-500' },
          ].map((kpi) => (
            <div key={kpi.label} className={`flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border border-th-border shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-l-[3px] ${kpi.accent}`}>
              <div className="flex justify-between items-start">
                <p className="text-th-muted text-xs font-bold uppercase tracking-wider">{kpi.label}</p>
                <span className="material-symbols-outlined text-th-secondary text-sm">{kpi.icon}</span>
              </div>
              <p className="text-th-heading text-2xl font-bold tabular-nums">{kpi.value}</p>
              <p className="text-th-muted text-xs tabular-nums">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Underpayment Alert */}
        {underpayments.length > 0 && (
          <div className="bg-gradient-to-r from-red-900/20 to-transparent border border-red-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400 text-lg">warning</span>
              <div>
                <span className="text-th-heading text-sm font-bold">{underpayments.length} underpaid claims detected</span>
                <span className="text-red-400 font-black ml-2">— {fmt(underpaymentTotal)} variance</span>
              </div>
            </div>
            <button
              onClick={() => setActiveView('underpayments')}
              className="px-4 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Review Underpayments
            </button>
          </div>
        )}

        {/* Revenue leakage diagnostics */}
        {revenueLeakageFindings && (revenueLeakageFindings.items?.length > 0 || revenueLeakageFindings.total > 0) && (() => {
          const findings = revenueLeakageFindings.items || revenueLeakageFindings.findings || [];
          const findingCount = revenueLeakageFindings.total || findings.length;
          return (
            <div className="bg-gradient-to-r from-purple-900/15 to-transparent border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-purple-400 text-lg">troubleshoot</span>
                  <span className="text-th-heading text-sm font-bold">{findingCount} Revenue Leakage Finding{findingCount !== 1 ? 's' : ''}</span>
                  <AIBadge level="Diagnostic" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {findings.slice(0, 3).map((f, i) => (
                  <div key={i} className="p-3 bg-white/5 dark:bg-th-surface-overlay/50 rounded-lg border border-th-border">
                    <p className="text-xs font-bold text-th-heading mb-1">{f.title || f.finding || f.description || 'Revenue leakage detected'}</p>
                    <p className="text-[10px] text-th-muted leading-snug">{f.detail || f.recommendation || f.summary || 'Review payment patterns for contract compliance'}</p>
                    {(f.impact || f.amount) && (
                      <p className="text-xs font-bold text-red-400 mt-1 tabular-nums">{fmt(f.impact || f.amount || 0)} impact</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-th-surface-overlay rounded-lg w-fit">
          {['queue', 'exceptions', 'underpayments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveView(tab)}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeView === tab
                  ? 'bg-white dark:bg-card-dark text-th-heading shadow-sm'
                  : 'text-th-muted hover:text-th-primary dark:hover:text-th-heading'
              }`}
            >
              {tab === 'queue' ? 'ERA Queue' : tab === 'exceptions' ? 'Exception Queue' : 'Underpayment Detection'}
            </button>
          ))}
        </div>

        {/* ERA QUEUE */}
        {activeView === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <AIBadge level="Descriptive" />
                <AIBadge level="Prescriptive" />
                <span className="text-th-muted text-xs">Remittance detail with auto-post matching</span>
              </div>
              <div className="flex gap-1 p-1 bg-th-surface-overlay rounded-lg">
                {['table', 'kanban'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setQueueLayout(mode)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      queueLayout === mode ? 'bg-white dark:bg-card-dark text-th-heading shadow-sm' : 'text-th-muted hover:text-th-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm align-middle mr-1">
                      {mode === 'table' ? 'table_rows' : 'view_kanban'}
                    </span>
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {eraFiles.length === 0 ? (
              <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark">
                <EmptyState
                  icon="inbox"
                  title="No ERA Files"
                  description="Upload an 835 / ERA file above to begin processing."
                />
              </div>
            ) : queueLayout === 'kanban' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {STATUS_COLUMNS.map((col) => {
                  const items = eraFiles.filter((e) => normalizeStatus(e.status) === col);
                  return (
                    <div
                      key={col}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={() => onColumnDrop(col)}
                      className="rounded-xl bg-th-surface-overlay/30 border border-th-border p-3 min-h-[200px]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_STYLES[col] || 'bg-th-surface-overlay text-th-muted border-th-border'}`}>
                          {col}
                        </span>
                        <span className="text-xs font-bold text-th-muted tabular-nums">{items.length}</span>
                      </div>
                      <div className="space-y-2">
                        {items.length === 0 ? (
                          <p className="text-xs text-th-muted italic px-2 py-4 text-center">Drop here</p>
                        ) : (
                          items.map((era) => (
                            <KanbanCard key={era.id} era={era} fmt={fmt} onDragStart={onCardDragStart} />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-th-border">
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted w-8"></th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted">File ID</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted">Payer</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted">Date</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Amount</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Lines</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-center">Paid / Denied / Adj</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Auto-Match</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eraFiles.map((era) => {
                        const stat = normalizeStatus(era.status);
                        return (
                          <React.Fragment key={era.id}>
                            <tr
                              className="border-b border-th-border-subtle hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay/50 cursor-pointer"
                              onClick={() => setExpandedERA(expandedERA === era.id ? null : era.id)}
                            >
                              <td className="px-4 py-3">
                                <span className="material-symbols-outlined text-sm text-th-secondary transition-transform" style={{ transform: expandedERA === era.id ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                  chevron_right
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-primary">{era.id}</td>
                              <td className="px-4 py-3 text-sm text-th-heading font-medium">{era.payer}</td>
                              <td className="px-4 py-3 text-sm text-th-muted">{era.date}</td>
                              <td className="px-4 py-3 text-sm text-th-heading font-bold text-right tabular-nums">{fmt(era.amount || 0)}</td>
                              <td className="px-4 py-3 text-sm text-th-muted text-right tabular-nums">{era.lineCount || era.line_count || 0}</td>
                              <td className="px-4 py-3 text-sm text-center tabular-nums">
                                <span className="text-emerald-400">{era.paidLines || era.paid_lines || 0}</span>
                                <span className="text-th-muted mx-1">/</span>
                                <span className="text-red-400">{era.deniedLines || era.denied_lines || 0}</span>
                                <span className="text-th-muted mx-1">/</span>
                                <span className="text-amber-400">{era.adjustedLines || era.adjusted_lines || 0}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                {(era.autoMatchRate || era.auto_match_rate) ? (
                                  <span className={`font-bold tabular-nums ${(era.autoMatchRate || era.auto_match_rate) >= 90 ? 'text-emerald-400' : (era.autoMatchRate || era.auto_match_rate) >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {era.autoMatchRate || era.auto_match_rate}%
                                  </span>
                                ) : (
                                  <span className="text-th-muted">--</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${STATUS_STYLES[stat] || 'bg-th-surface-overlay text-th-muted border-th-border'}`}>{stat}</span>
                              </td>
                            </tr>

                            {expandedERA === era.id && expandedDetail?.lines?.length > 0 && (
                              <tr>
                                <td colSpan={9} className="px-0 py-0">
                                  <div className="bg-th-surface-overlay/30 border-b border-th-border">
                                    <div className="px-6 py-3 flex items-center gap-3 border-b border-th-border/30">
                                      <span className="text-xs font-bold uppercase tracking-wider text-th-muted">Line Detail</span>
                                      <AIBadge level="Diagnostic" />
                                    </div>
                                    <table className="w-full text-left">
                                      <thead>
                                        <tr className="border-b border-th-border/30">
                                          <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted">Claim ID</th>
                                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted">CPT</th>
                                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Billed</th>
                                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Allowed</th>
                                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Paid</th>
                                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Adj</th>
                                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted">CARC</th>
                                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted">RARC</th>
                                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted text-right">Pat Resp</th>
                                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-th-muted">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {expandedDetail.lines.map((line, idx) => (
                                          <tr key={line.claimId || idx} className="border-b border-th-border-subtle/20 hover:bg-white dark:hover:bg-th-surface-overlay/50">
                                            <td className="px-6 py-2 text-xs font-mono text-primary">{line.claimId}</td>
                                            <td className="px-3 py-2 text-xs font-mono text-th-primary">{line.cpt}</td>
                                            <td className="px-3 py-2 text-xs text-th-primary text-right tabular-nums">{fmt(line.billed)}</td>
                                            <td className="px-3 py-2 text-xs text-th-primary text-right tabular-nums">{fmt(line.allowed)}</td>
                                            <td className="px-3 py-2 text-xs font-bold text-right text-emerald-500 tabular-nums">{fmt(line.paid)}</td>
                                            <td className="px-3 py-2 text-xs text-red-400 text-right tabular-nums">{fmt(line.adj)}</td>
                                            <td className="px-3 py-2 text-xs font-mono text-th-muted" title={carcLabel(line.carc) || undefined}>
                                              {line.carc || '--'}
                                            </td>
                                            <td className="px-3 py-2 text-xs font-mono text-th-muted" title={rarcLabel(line.rarc) || undefined}>
                                              {line.rarc || '--'}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-th-primary text-right tabular-nums">{line.patResp ? fmt(line.patResp) : '--'}</td>
                                            <td className="px-3 py-2">
                                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLES[line.status] || 'bg-th-surface-overlay text-th-muted'}`}>{line.status}</span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXCEPTION QUEUE */}
        {activeView === 'exceptions' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AIBadge level="Prescriptive" />
              <span className="text-th-muted text-xs">AI-suggested resolutions for unmatched payments</span>
            </div>

            {eraFiles.filter((e) => normalizeStatus(e.status) === 'Exceptions').length === 0 ? (
              <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark">
                <EmptyState
                  icon="check_circle"
                  title="No Exceptions"
                  description="All payments have been successfully matched to claims."
                />
              </div>
            ) : (
              <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
                <div className="p-4 border-b border-th-border">
                  <h3 className="text-lg font-bold text-th-heading">Exception Queue</h3>
                  <p className="text-xs text-th-muted mt-1">Payments that could not be automatically matched to claims</p>
                </div>
                <div className="divide-y divide-th-border/40">
                  {eraFiles.filter((e) => normalizeStatus(e.status) === 'Exceptions').map((exc) => {
                    const isResolving = resolvingId === exc.id;
                    return (
                      <div key={exc.id} className="p-4 hover:bg-th-surface-overlay/30">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-[200px] space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-sm font-mono text-primary font-bold">{exc.id}</span>
                              <span className="text-xs text-th-muted">{exc.payer}</span>
                              <span className="text-sm font-bold text-th-heading tabular-nums">{fmt(exc.amount || 0)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                              <span className="text-sm text-red-400">{exc.exception_reason || 'Unmatched payment requires manual review'}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              disabled={isResolving}
                              onClick={() => resolveException(exc.id, 'accept')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                              {isResolving ? '...' : 'Accept'}
                            </button>
                            <button
                              disabled={isResolving}
                              onClick={() => openManualMatch(exc.id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              Manual
                            </button>
                            <button
                              disabled={isResolving}
                              onClick={() => resolveException(exc.id, 'escalate')}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                              Escalate
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* UNDERPAYMENT DETECTION */}
        {activeView === 'underpayments' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AIBadge level="Predictive" />
              <AIBadge level="Diagnostic" />
              <span className="text-th-muted text-xs">Underpayment detection vs contracted fee schedule (sorted by severity)</span>
            </div>

            {sortedUnderpayments.length === 0 ? (
              <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark">
                <EmptyState
                  icon="check_circle"
                  title="No Underpayments Detected"
                  description="All payments are within contracted rates."
                />
              </div>
            ) : (
              <div className="rounded-xl border border-th-border bg-white dark:bg-card-dark overflow-hidden shadow-sm">
                <div className="p-4 border-b border-th-border flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-th-heading">Underpayment Analysis</h3>
                    <p className="text-xs text-th-muted mt-1">Claims paid below contracted rates in the last 30 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-400 tabular-nums">{fmt(-underpaymentTotal)}</p>
                    <p className="text-xs text-th-muted">Total underpayment impact</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-th-border">
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted">Severity</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted">Payer</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted">CPT</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Contracted</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Paid</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Diff/Claim</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Claims</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted text-right">Total Impact</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-th-muted"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUnderpayments.map((u, i) => {
                        const sev = (u.severity || 'low').toLowerCase();
                        const claimId = u.claim_id || u.claimId;
                        return (
                          <tr key={i} className="border-b border-th-border-subtle hover:bg-th-surface-overlay/30">
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${SEVERITY_STYLES[sev] || SEVERITY_STYLES.low}`}>
                                {sev}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-th-heading font-medium">{u.payer || u.payer_name}</td>
                            <td className="px-4 py-3 text-sm font-mono text-th-primary">{u.cpt || u.cpt_code}</td>
                            <td className="px-4 py-3 text-sm text-th-primary text-right tabular-nums">{fmt(u.contracted || u.contracted_rate || 0)}</td>
                            <td className="px-4 py-3 text-sm text-th-primary text-right tabular-nums">{fmt(u.paid || u.avg_paid || 0)}</td>
                            <td className="px-4 py-3 text-sm font-bold text-red-400 text-right tabular-nums">{fmt(u.diff || u.variance || 0)}</td>
                            <td className="px-4 py-3 text-sm text-th-muted text-right tabular-nums">{u.claims || u.claim_count || 0}</td>
                            <td className="px-4 py-3 text-sm font-bold text-red-400 text-right tabular-nums">{fmt(u.totalImpact || u.total_impact || 0)}</td>
                            <td className="px-4 py-3">
                              {claimId && (
                                <button
                                  onClick={() => navigate(`/work/claims/${claimId}`)}
                                  className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                  Investigate
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-Post Modal */}
      <AutoPostModal
        open={autoPostOpen}
        onClose={() => setAutoPostOpen(false)}
        onSubmit={handleAutoPostSubmit}
        payers={payerOptions}
      />

      {/* Manual Match Modal */}
      <ManualMatchModal
        open={matchModal.open}
        eraId={matchModal.eraId}
        onClose={() => setMatchModal({ open: false, eraId: null })}
        onSelect={submitManualMatch}
      />

      {/* Unmatched ERAs Drawer */}
      {unmatchedDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setUnmatchedDrawerOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-card-dark border-l border-th-border shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-th-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-th-heading">Unmatched ERAs</h3>
                <p className="text-xs text-th-muted mt-0.5">ERAs received but not yet matched to a bank deposit</p>
              </div>
              <button onClick={() => setUnmatchedDrawerOpen(false)} className="text-th-muted hover:text-th-heading focus:outline-none">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {unmatchedLoading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : unmatchedItems?.length ? (
                unmatchedItems.map((era, i) => (
                  <div key={era.id || era.era_id || i} className="rounded-lg border border-th-border bg-th-surface-overlay/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-primary font-bold">{era.id || era.era_id}</span>
                      <span className="text-sm font-bold text-emerald-400 tabular-nums">{fmt(era.amount || era.payment_amount || 0)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-th-muted">
                      <span>{era.payer || era.payer_name}</span>
                      <span>{era.date || era.received_date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon="check_circle"
                  title="No unmatched ERAs"
                  description="All received ERAs have been matched to bank deposits."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
