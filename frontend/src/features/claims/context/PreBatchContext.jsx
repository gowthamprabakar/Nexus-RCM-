import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';

const PreBatchContext = createContext();

const DEFAULT_METRICS = {
  totalClaims: 0,
  passRate: 0,
  autoFixRate: 0,
  batchReadiness: 0,
  avgCrsScore: 0,
  denialsPreventedValue: 0,
  statusBreakdown: { passed: 0, autoFixed: 0, reviewRequired: 0, blocked: 0 },
  errorCategories: [],
};

export function PreBatchProvider({ children }) {
  const [claims,    setClaims]    = useState([]);
  const [metrics,   setMetrics]   = useState(DEFAULT_METRICS);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);

  const [filters, setFilters] = useState({
    search:    '',
    status:    'all',
    payer:     'all',
    claimType: 'all',
  });

  // ── Fetch summary KPIs ──────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    const [summary, categories] = await Promise.all([
      api.crs.getSummary({ payerId: filters.payer, claimType: filters.claimType }),
      api.crs.getErrorCategories(),
    ]);
    if (summary) {
      setMetrics({ ...summary, errorCategories: categories });
    }
  }, [filters.payer, filters.claimType]);

  // ── Fetch claims queue ──────────────────────────────────────────────────
  const fetchQueue = useCallback(async (pg = 1) => {
    setLoading(true);
    const result = await api.crs.getQueue({
      page:      pg,
      size:      100,
      status:    filters.status !== 'all' ? filters.status : undefined,
      payerId:   filters.payer  !== 'all' ? filters.payer  : undefined,
      claimType: filters.claimType !== 'all' ? filters.claimType : undefined,
      search:    filters.search || undefined,
    });
    setClaims(result.items || []);
    setTotal(result.total || 0);
    setPage(pg);
    setLoading(false);
  }, [filters]);

  // Initial load
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchQueue(1);
  }, [fetchQueue]);

  // ── Client-side search filter (instant, no refetch) ────────────────────
  const filteredClaims = useMemo(() => {
    if (!filters.search) return claims;
    const s = filters.search.toLowerCase();
    return claims.filter(c =>
      c.patient.toLowerCase().includes(s) ||
      c.id.toLowerCase().includes(s)
    );
  }, [claims, filters.search]);

  // ── Action: optimistic auto-fix single claim ───────────────────────────
  const applyAutoFix = useCallback((claimId, issueId) => {
    setClaims(prev => prev.map(c => {
      if (c.id !== claimId) return c;
      const updatedIssues = c.issues.map(i =>
        i.id === issueId ? { ...i, applied: true } : i
      );
      const allResolved = updatedIssues.every(i => i.applied || i.autoFixAvailable);
      return { ...c, issues: updatedIssues, status: allResolved ? 'Auto-Fixed' : c.status, batchReady: allResolved };
    }));
    // Bump metrics optimistically
    setMetrics(prev => ({
      ...prev,
      statusBreakdown: {
        ...prev.statusBreakdown,
        reviewRequired: Math.max(0, prev.statusBreakdown.reviewRequired - 1),
        autoFixed: prev.statusBreakdown.autoFixed + 1,
      },
      batchReadiness: Math.min(100, prev.batchReadiness + 0.1),
    }));
  }, []);

  // ── Action: apply all high-confidence fixes ────────────────────────────
  const applyAllHighConfidenceFixes = useCallback(() => {
    let fixedCount = 0;
    setClaims(prev => prev.map(c => {
      const hasHighConf = c.issues.some(i => i.confidenceScore > 0.9 && i.autoFixAvailable && !i.applied);
      if (!hasHighConf) return c;
      fixedCount++;
      return {
        ...c,
        status:     'Auto-Fixed',
        batchReady: true,
        issues:     c.issues.map(i => i.confidenceScore > 0.9 ? { ...i, applied: true } : i),
      };
    }));
    if (fixedCount > 0) {
      setMetrics(prev => ({
        ...prev,
        statusBreakdown: {
          ...prev.statusBreakdown,
          reviewRequired: Math.max(0, prev.statusBreakdown.reviewRequired - fixedCount),
          autoFixed:      prev.statusBreakdown.autoFixed + fixedCount,
        },
        batchReadiness: Math.min(100, prev.batchReadiness + fixedCount * 0.1),
      }));
    }
  }, []);

  const value = {
    claims,
    filteredClaims,
    metrics,
    total,
    page,
    loading,
    filters,
    setFilters,
    fetchQueue,
    applyAutoFix,
    applyAllHighConfidenceFixes,
    // legacy compat
    selectedClaimId:    null,
    setSelectedClaimId: () => {},
    selectedClaim:      null,
  };

  return (
    <PreBatchContext.Provider value={value}>
      {children}
    </PreBatchContext.Provider>
  );
}

export function usePreBatch() {
  const context = useContext(PreBatchContext);
  if (!context) throw new Error('usePreBatch must be used within a PreBatchProvider');
  return context;
}
