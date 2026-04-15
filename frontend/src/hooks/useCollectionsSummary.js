import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { fmtCurrency } from '../lib/formatters';

/**
 * useCollectionsSummary
 *
 * Loads the high-level Collections Hub summary from the backend
 * (`GET /api/v1/collections/summary`) and exposes the raw payload along
 * with derived helpers used by the sidebar badge and any header KPIs.
 *
 * Returns:
 *   - summary           Raw payload (or null while loading / on failure).
 *   - loading           true until the first fetch resolves.
 *   - error             Error instance from the most recent fetch (or null).
 *   - totalCollectible  Numeric value of `total_collectible` if present.
 *   - badgeText         Compact dollar string ("$2.4M") or "—" when absent.
 *   - reload            Manually re-fetch the summary.
 */
export function useCollectionsSummary({ pollMs } = {}) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            const res = await api.collections.getSummary();
            if (res) {
                setSummary(res);
                setError(null);
            } else {
                setError(new Error('Empty response from collections summary'));
            }
        } catch (err) {
            console.error('useCollectionsSummary load error:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        if (pollMs && pollMs > 0) {
            const id = setInterval(load, pollMs);
            return () => clearInterval(id);
        }
        return undefined;
    }, [load, pollMs]);

    const totalCollectible =
        summary?.total_collectible ??
        summary?.projected_30d_cash ??
        summary?.collectible_balance ??
        null;

    const badgeText =
        typeof totalCollectible === 'number' && !Number.isNaN(totalCollectible)
            ? fmtCurrency(totalCollectible)
            : '—';

    return {
        summary,
        loading,
        error,
        totalCollectible,
        badgeText,
        reload: load,
    };
}

export default useCollectionsSummary;
