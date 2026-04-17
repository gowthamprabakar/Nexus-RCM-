import { useState, useEffect } from 'react';
import { api } from '../services/api';

/**
 * usePreventSummary
 *
 * Loads the Prevent sidebar rollup from the backend
 * (`GET /api/v1/prevent/nav-summary`). Polls every 60s.
 *
 * Returns the raw payload (or null while loading / on failure).
 */
export function usePreventSummary() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const load = () =>
            api.prevent
                .getNavSummary()
                .then(setData)
                .catch(() => null);
        load();
        const interval = setInterval(load, 60000);
        return () => clearInterval(interval);
    }, []);

    return data;
}

export default usePreventSummary;
