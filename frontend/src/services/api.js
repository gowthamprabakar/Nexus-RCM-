// Middleware Simulation Layer
// This file acts as the bridge between frontend components and the synthetic data.

import claimsData from '../data/synthetic/claims.json';
import ticketsData from '../data/synthetic/tickets.json';
import payersData from '../data/synthetic/payers.json';
import usersData from '../data/synthetic/users.json';
import auditLogsData from '../data/synthetic/audit_logs.json';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Simulate network latency (random between 200ms and 800ms)
const simulateLatency = () => new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 600));

// Middleware Checks
const middleware = {
    checkauth: () => {
        // Simulate checking for a valid session token
        // In a real app, this would check localStorage or a cookie
        console.log("[Middleware] Verifying Session Token... OK");
        return true;
    },
    logging: (endpoint, params) => {
        console.log(`[Middleware] Request: ${endpoint}`, params || {});
    },
    errorHandling: async (fn) => {
        try {
            return await fn();
        } catch (error) {
            console.error("[Middleware] API Error Check:", error);
            throw error;
        }
    }
};

// Helper to wrap API calls with middleware
const withMiddleware = async (endpoint, fn, params) => {
    middleware.logging(endpoint, params);
    middleware.checkauth();
    await simulateLatency();
    return middleware.errorHandling(fn);
};

export const api = {
    // ------------------------------------------------------------------------
    // Dashboard & KPI Endpoints
    // ------------------------------------------------------------------------
    dashboard: {
        getKPIs: (period = "October 2023 Fiscal View") =>
            withMiddleware("dashboard.getKPIs", async () => {
                // Varied data based on period
                let multiplier = 1.0;
                if (period.includes("September")) multiplier = 0.85;
                if (period.includes("Q3")) multiplier = 2.4;

                // Aggregate data on the fly w/ multiplier simulation
                const totalClaims = Math.floor(claimsData.length * multiplier * 100);

                const deniedClaims = Math.floor(totalClaims * (0.05 + Math.random() * 0.02));
                const approvalRate = ((totalClaims - deniedClaims) / totalClaims * 100).toFixed(1);

                // Calculate collections
                const baseCollections = claimsData
                    .filter(c => c.status === 'Paid')
                    .reduce((sum, c) => sum + c.amount, 0);

                const scaledCollections = baseCollections * multiplier * 10;

                return {
                    claimsVolume: totalClaims.toLocaleString(),
                    approvalRate: approvalRate + '%',
                    denialRate: (deniedClaims / totalClaims * 100).toFixed(1) + '%',
                    netCollections: `$${(scaledCollections / 1000).toFixed(1)}k`
                };
            }, { period }),

        getRevenueTrend: (period = "October 2023 Fiscal View") =>
            withMiddleware("dashboard.getRevenueTrend", async () => {
                // Return different trend data based on selection
                if (period.includes("September")) {
                    return [
                        { month: 'Apr', actual: 1.9, predicted: 2.0 },
                        { month: 'May', actual: 2.2, predicted: 2.1 },
                        { month: 'Jun', actual: 2.5, predicted: 2.4 },
                        { month: 'Jul', actual: 2.9, predicted: 2.8 },
                        { month: 'Aug', actual: 3.1, predicted: 3.2 },
                        { month: 'Sep', actual: null, predicted: 3.5 }
                    ];
                } else if (period.includes("Q3")) {
                    return [
                        { month: 'Jul W1', actual: 0.8, predicted: 0.9 },
                        { month: 'Jul W2', actual: 0.9, predicted: 0.8 },
                        { month: 'Jul W3', actual: 1.1, predicted: 1.0 },
                        { month: 'Jul W4', actual: 1.5, predicted: 1.2 },
                        { month: 'Aug W1', actual: null, predicted: 1.4 }
                    ];
                }

                // Default October View
                return [
                    { month: 'May', actual: 2.1, predicted: 2.2 },
                    { month: 'Jun', actual: 2.4, predicted: 2.3 },
                    { month: 'Jul', actual: 2.8, predicted: 2.6 },
                    { month: 'Aug', actual: 3.2, predicted: 3.0 },
                    { month: 'Sep', actual: 3.5, predicted: 3.4 },
                    { month: 'Oct', actual: null, predicted: 3.8 } // Prediction only
                ];
            }, { period })
    },

    // ------------------------------------------------------------------------
    // Claims Endpoints
    // ------------------------------------------------------------------------
    claims: {
        list: async () => {
            try {
                // Remove frontend mock entirely, call real backend
                const response = await fetch(`${BASE_URL}/claims`, {
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();

                // For now, map backend schema to match frontend table expectations
                return data.items.map(c => ({
                    id: c.id,
                    patient: { name: `Patient ${c.patient_id}`, id: c.patient_id }, // Temporary mapping
                    payer: { name: c.payer_id, type: 'Commercial' },
                    amount: c.amount,
                    status: c.status,
                    risk_score: c.risk_score,
                    date: c.date_of_service,
                    issues: [], // Will add to schema later
                    assigned_to: 'Unassigned'
                }));
            } catch (error) {
                console.error("Failed to fetch real claims, falling back to mock...", error);
                return claimsData;
            }
        },
        getById: (id) => withMiddleware("claims.getById", async () => claimsData.find(c => c.id === id), { id }),
        getQueue: () => withMiddleware("claims.getQueue", async () => {
            // Return only denied or pending high-risk
            return claimsData.filter(c => c.status === 'Denied' || (c.status === 'Submitted' && c.risk_score > 70));
        })
    },

    // ------------------------------------------------------------------------
    // Ticketing (LIDA) Endpoints
    // ------------------------------------------------------------------------
    tickets: {
        listActive: () => withMiddleware("tickets.listActive", async () => ticketsData.filter(t => t.status !== 'Resolved')),
        getById: (id) => withMiddleware("tickets.getById", async () => ticketsData.find(t => t.id === id), { id }),
        create: (ticketPayload) => withMiddleware("tickets.create", async () => {
            const newTicket = {
                id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
                ...ticketPayload,
                status: 'Open',
                created_at: new Date().toISOString(),
                timeline: [{ id: 1, type: 'system', author: 'System', content: 'Ticket created via Dashboard', time: new Date().toISOString() }]
            };
            // In a real app, we'd push to the array. For now we just return the object to update local state.
            return newTicket;
        }, { ticketPayload })
    },

    // ------------------------------------------------------------------------
    // Payers Endpoints
    // ------------------------------------------------------------------------
    payers: {
        list: async () => {
            try {
                const response = await fetch(`${BASE_URL}/crs/payers`);
                if (!response.ok) throw new Error('payers fetch failed');
                return await response.json();
            } catch {
                return payersData;
            }
        }
    },

    // ------------------------------------------------------------------------
    // Users Endpoints
    // ------------------------------------------------------------------------
    users: {
        list: () => withMiddleware("users.list", async () => usersData)
    },

    // ------------------------------------------------------------------------
    // CRS (Claim Readiness Score) — Layer 1: Prevention
    // ------------------------------------------------------------------------
    crs: {
        getSummary: async ({ payerId, claimType } = {}) => {
            try {
                const params = new URLSearchParams();
                if (payerId && payerId !== 'all') params.append('payer_id', payerId);
                if (claimType && claimType !== 'all') params.append('claim_type', claimType);
                const qs = params.toString() ? `?${params}` : '';
                const res = await fetch(`${BASE_URL}/crs/summary${qs}`);
                if (!res.ok) throw new Error('crs summary failed');
                return await res.json();
            } catch (err) {
                console.error('CRS summary error:', err);
                return null;
            }
        },

        getErrorCategories: async () => {
            try {
                const res = await fetch(`${BASE_URL}/crs/error-categories`);
                if (!res.ok) throw new Error('error-categories failed');
                return await res.json();
            } catch (err) {
                console.error('CRS error-categories error:', err);
                return [];
            }
        },

        getQueue: async ({ page = 1, size = 50, status, payerId, claimType, search } = {}) => {
            try {
                const params = new URLSearchParams({ page, size });
                if (status   && status   !== 'all') params.append('status',     status);
                if (payerId  && payerId  !== 'all') params.append('payer_id',   payerId);
                if (claimType && claimType !== 'all') params.append('claim_type', claimType);
                if (search) params.append('search', search);
                const res = await fetch(`${BASE_URL}/crs/queue?${params}`);
                if (!res.ok) throw new Error('queue fetch failed');
                return await res.json();
            } catch (err) {
                console.error('CRS queue error:', err);
                return { total: 0, page, size, items: [] };
            }
        },

        getClaimDetail: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/crs/claim/${claimId}`);
                if (!res.ok) throw new Error(`claim detail ${claimId} failed`);
                return await res.json();
            } catch (err) {
                console.error('CRS claim detail error:', err);
                return null;
            }
        },
        getHighRisk: async ({ page = 1, size = 50 } = {}) => {
            try {
                const res = await fetch(`${BASE_URL}/crs/high-risk?page=${page}&size=${size}`);
                if (!res.ok) throw new Error('high-risk failed');
                return await res.json();
            } catch (err) {
                console.error('CRS high-risk error:', err);
                return { total: 0, page, size, items: [] };
            }
        },
    },

    // ------------------------------------------------------------------------
    // Denials — Layer 2: Detection (Sprint 2)
    // ------------------------------------------------------------------------
    denials: {
        list: async (params = { page: 1, size: 50 }) => {
            try {
                const p = new URLSearchParams();
                if (params.page)             p.append('page', params.page);
                if (params.size)             p.append('size', params.size);
                if (params.denial_category)  p.append('denial_category', params.denial_category);
                if (params.carc_code)        p.append('carc_code', params.carc_code);
                if (params.payer_id && params.payer_id !== 'all') p.append('payer_id', params.payer_id);
                if (params.search)           p.append('search', params.search);
                const res = await fetch(`${BASE_URL}/denials?${p}`);
                if (!res.ok) throw new Error('denials list failed');
                return await res.json();
            } catch (err) {
                console.error('Denials list error:', err);
                return { items: [], total: 0, page: 1, size: 50 };
            }
        },
        getSummary: async () => {
            try {
                const res = await fetch(`${BASE_URL}/denials/summary`);
                if (!res.ok) throw new Error('denials summary failed');
                return await res.json();
            } catch (err) {
                console.error('Denials summary error:', err);
                return {
                    total_denials: 0, denied_revenue_at_risk: 0,
                    successful_appeal_rate: 0, projected_recovery: 0,
                    ai_prevention_impact: 0, open_appeals: 0,
                    total_recovered: 0, top_categories: [],
                };
            }
        },
        getHeatmap: async () => {
            try {
                const res = await fetch(`${BASE_URL}/denials/heatmap`);
                if (!res.ok) throw new Error('denials heatmap failed');
                return await res.json();
            } catch (err) {
                console.error('Denials heatmap error:', err);
                return [];
            }
        },
    },

    // ------------------------------------------------------------------------
    // Appeals — Layer 2: Detection (Sprint 2)
    // ------------------------------------------------------------------------
    appeals: {
        list: async (params = { page: 1, size: 50 }) => {
            try {
                const p = new URLSearchParams({ page: params.page || 1, size: params.size || 50 });
                if (params.outcome) p.append('outcome', params.outcome);
                const res = await fetch(`${BASE_URL}/denials/appeals?${p}`);
                if (!res.ok) throw new Error('appeals list failed');
                return await res.json();
            } catch (err) {
                console.error('Appeals list error:', err);
                return [];
            }
        },
        create: async (payload) => {
            try {
                const res = await fetch(`${BASE_URL}/denials/appeals`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error('appeal create failed');
                return await res.json();
            } catch (err) {
                console.error('Appeal create error:', err);
                return null;
            }
        },
        updateOutcome: async (appeal_id, { outcome, recovered_amount, approved_by_user_id }) => {
            try {
                const res = await fetch(`${BASE_URL}/denials/appeals/${appeal_id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ outcome, recovered_amount, approved_by_user_id }),
                });
                if (!res.ok) throw new Error('appeal update failed');
                return await res.json();
            } catch (err) {
                console.error('Appeal update error:', err);
                return null;
            }
        },
        getLetter: async (appeal_id) => {
            try {
                const res = await fetch(`${BASE_URL}/denials/appeals/${appeal_id}/letter`);
                if (!res.ok) throw new Error('appeal letter failed');
                return await res.json();
            } catch (err) {
                console.error('Appeal letter error:', err);
                return null;
            }
        },
    },

    // ------------------------------------------------------------------------
    // Forecast & Bank Reconciliation
    // ------------------------------------------------------------------------
    forecast: {
        getSummary: async () => {
            try {
                const res = await fetch(`${BASE_URL}/forecast/summary`);
                if (!res.ok) throw new Error('forecast summary failed');
                return await res.json();
            } catch (err) {
                console.error('Forecast summary error:', err);
                return null;
            }
        },
        getWeekly: async (weeksAhead = 4) => {
            try {
                const res = await fetch(`${BASE_URL}/forecast/weekly?weeks_ahead=${weeksAhead}`);
                if (!res.ok) throw new Error('forecast weekly failed');
                return await res.json();
            } catch (err) {
                console.error('Forecast weekly error:', err);
                return null;
            }
        },
        get3Layer: async (weeks = 4) => {
            try {
                const res = await fetch(`${BASE_URL}/forecast/3-layer?weeks=${weeks}`);
                if (!res.ok) throw new Error('3-layer forecast failed');
                return await res.json();
            } catch (err) {
                console.error('3-layer forecast error:', err);
                return null;
            }
        },
        getReconciliationSummary: async (weeksBack = 12) => {
            try {
                const res = await fetch(`${BASE_URL}/forecast/reconciliation/summary?weeks_back=${weeksBack}`);
                if (!res.ok) throw new Error('recon summary failed');
                return await res.json();
            } catch (err) {
                console.error('Recon summary error:', err);
                return null;
            }
        },
        prophetWeekly: async (weeks = 13, payerId) => {
            try {
                const params = new URLSearchParams({ weeks });
                if (payerId) params.set('payer_id', payerId);
                const res = await fetch(`${BASE_URL}/forecast/prophet/weekly?${params}`);
                if (!res.ok) throw new Error('prophet weekly forecast failed');
                return await res.json();
            } catch (err) {
                console.error('Prophet weekly error:', err);
                return null;
            }
        },
        prophetDaily: async (days = 30, payerId) => {
            try {
                const params = new URLSearchParams({ days });
                if (payerId) params.set('payer_id', payerId);
                const res = await fetch(`${BASE_URL}/forecast/prophet/daily?${params}`);
                if (!res.ok) throw new Error('prophet daily forecast failed');
                return await res.json();
            } catch (err) {
                console.error('Prophet daily error:', err);
                return null;
            }
        },
        prophetAccuracy: async (payerId) => {
            try {
                const params = payerId ? `?payer_id=${payerId}` : '';
                const res = await fetch(`${BASE_URL}/forecast/prophet/accuracy${params}`);
                if (!res.ok) throw new Error('prophet accuracy failed');
                return await res.json();
            } catch (err) {
                console.error('Prophet accuracy error:', err);
                return null;
            }
        },
    },

    // ------------------------------------------------------------------------
    // Payments & ERA  (Sprint 3)
    // ------------------------------------------------------------------------
    payments: {
        getSummary: async () => {
            try {
                const res = await fetch(`${BASE_URL}/payments/summary`);
                if (!res.ok) throw new Error('payments summary failed');
                return await res.json();
            } catch (err) { console.error('Payments summary error:', err); return null; }
        },
        getERAList: async ({ page = 1, size = 50, payer_id } = {}) => {
            try {
                const params = new URLSearchParams({ page, size });
                if (payer_id && payer_id !== 'all') params.set('payer_id', payer_id);
                const res = await fetch(`${BASE_URL}/payments/era?${params}`);
                if (!res.ok) throw new Error('ERA list failed');
                return await res.json();
            } catch (err) { console.error('ERA list error:', err); return { items: [], total: 0 }; }
        },
        getERABatchList: async ({ page = 1, size = 50, payer_id } = {}) => {
            try {
                const params = new URLSearchParams({ page, size });
                if (payer_id && payer_id !== 'all') params.set('payer_id', payer_id);
                const res = await fetch(`${BASE_URL}/payments/era-list?${params}`);
                if (!res.ok) throw new Error('ERA batch list failed');
                return await res.json();
            } catch (err) { console.error('ERA batch list error:', err); return { items: [], total: 0 }; }
        },
        getERADetail: async (eraId) => {
            try {
                const res = await fetch(`${BASE_URL}/payments/era/${eraId}`);
                if (!res.ok) throw new Error('ERA detail failed');
                return await res.json();
            } catch (err) { console.error('ERA detail error:', err); return null; }
        },
        postPayment: async (data) => {
            try {
                const res = await fetch(`${BASE_URL}/payments/post`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok) throw new Error('Post payment failed');
                return await res.json();
            } catch (err) { console.error('Post payment error:', err); return null; }
        },
        getTriangulationSummary: async () => {
            try {
                const res = await fetch(`${BASE_URL}/payments/triangulation/summary`);
                if (!res.ok) throw new Error('triangulation summary failed');
                return await res.json();
            } catch (err) { console.error('Triangulation summary error:', err); return null; }
        },
        getTriangulationPayer: async (payerId) => {
            try {
                const res = await fetch(`${BASE_URL}/payments/triangulation/payer/${payerId}`);
                if (!res.ok) throw new Error('triangulation payer failed');
                return await res.json();
            } catch (err) { console.error('Triangulation payer error:', err); return null; }
        },
        getADTP: async () => {
            try {
                const res = await fetch(`${BASE_URL}/payments/adtp`);
                if (!res.ok) throw new Error('ADTP failed');
                return await res.json();
            } catch (err) { console.error('ADTP error:', err); return null; }
        },
        getADTPAnomalies: async () => {
            try {
                const res = await fetch(`${BASE_URL}/payments/adtp/anomalies`);
                if (!res.ok) throw new Error('ADTP anomalies failed');
                return await res.json();
            } catch (err) { console.error('ADTP anomalies error:', err); return []; }
        },
        getERABankMatch: async (filters = {}) => {
            try {
                const params = new URLSearchParams(filters).toString();
                const res = await fetch(`${BASE_URL}/payments/era-bank-match${params ? '?' + params : ''}`);
                if (!res.ok) throw new Error('ERA bank match failed');
                return await res.json();
            } catch (err) { console.error('ERA bank match error:', err); return { items: [], total: 0 }; }
        },
        getFloatAnalysis: async () => {
            try {
                const res = await fetch(`${BASE_URL}/payments/float-analysis`);
                if (!res.ok) throw new Error('float analysis failed');
                return await res.json();
            } catch (err) { console.error('Float analysis error:', err); return []; }
        },
        getPayerStats: async () => {
            try {
                const res = await fetch(`${BASE_URL}/payments/payer-stats`);
                if (!res.ok) throw new Error('payer stats failed');
                return await res.json();
            } catch (err) { console.error('Payer stats error:', err); return []; }
        },
        getSilentUnderpayments: async () => {
            try {
                const res = await fetch(`${BASE_URL}/payments/silent-underpayments`);
                if (!res.ok) throw new Error('silent underpayments failed');
                return await res.json();
            } catch (err) { console.error('Silent underpayments error:', err); return { items: [], total: 0, total_variance: 0 }; }
        },
    },

    // ------------------------------------------------------------------------
    // A/R Aging  (Sprint 3)
    // ------------------------------------------------------------------------
    ar: {
        getSummary: async () => {
            try {
                const res = await fetch(`${BASE_URL}/ar/summary`);
                if (!res.ok) throw new Error('AR summary failed');
                return await res.json();
            } catch (err) { console.error('AR summary error:', err); return null; }
        },
        getAging: async ({ page = 1, size = 50, bucket, payer_id } = {}) => {
            try {
                const params = new URLSearchParams({ page, size });
                if (bucket) params.set('bucket', bucket);
                if (payer_id && payer_id !== 'all') params.set('payer_id', payer_id);
                const res = await fetch(`${BASE_URL}/ar/aging?${params}`);
                if (!res.ok) throw new Error('AR aging failed');
                return await res.json();
            } catch (err) { console.error('AR aging error:', err); return { items: [], total: 0 }; }
        },
        getTrend: async () => {
            try {
                const res = await fetch(`${BASE_URL}/ar/trend`);
                if (!res.ok) throw new Error('AR trend failed');
                return await res.json();
            } catch (err) { console.error('AR trend error:', err); return { trend: [] }; }
        },
        getAgingRootCause: async () => {
            try {
                const res = await fetch(`${BASE_URL}/ar/aging-root-cause`);
                if (!res.ok) throw new Error('AR aging root cause failed');
                return await res.json();
            } catch (err) { console.error('AR aging root cause error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Collections Queue & Alerts  (Sprint 3)
    // ------------------------------------------------------------------------
    collections: {
        getSummary: async () => {
            try {
                const res = await fetch(`${BASE_URL}/collections/summary`);
                if (!res.ok) throw new Error('collections summary failed');
                return await res.json();
            } catch (err) { console.error('Collections summary error:', err); return null; }
        },
        getQueue: async ({ page = 1, size = 50, priority, status, payer_id } = {}) => {
            try {
                const params = new URLSearchParams({ page, size });
                if (priority) params.set('priority', priority);
                if (status)   params.set('status', status);
                if (payer_id && payer_id !== 'all') params.set('payer_id', payer_id);
                const res = await fetch(`${BASE_URL}/collections/queue?${params}`);
                if (!res.ok) throw new Error('collections queue failed');
                return await res.json();
            } catch (err) { console.error('Collections queue error:', err); return { items: [], total: 0 }; }
        },
        getAlerts: async ({ severity, limit = 50 } = {}) => {
            try {
                const params = new URLSearchParams({ limit });
                if (severity) params.set('severity', severity);
                const res = await fetch(`${BASE_URL}/collections/alerts?${params}`);
                if (!res.ok) throw new Error('collections alerts failed');
                return await res.json();
            } catch (err) { console.error('Collections alerts error:', err); return []; }
        },
        updateTask: async (taskId, data) => {
            try {
                const res = await fetch(`${BASE_URL}/collections/${taskId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok) throw new Error('Update task failed');
                return await res.json();
            } catch (err) { console.error('Update task error:', err); return null; }
        },
        getAccountDetail: async (accountId) => {
            try {
                const res = await fetch(`${BASE_URL}/collections/account/${accountId}`);
                if (!res.ok) throw new Error('Account detail failed');
                return await res.json();
            } catch (err) { console.error('Account detail error:', err); return null; }
        },
        getAccountTimeline: async (accountId) => {
            try {
                const res = await fetch(`${BASE_URL}/collections/account/${accountId}/timeline`);
                if (!res.ok) throw new Error('Account timeline failed');
                return await res.json();
            } catch (err) { console.error('Account timeline error:', err); return { events: [] }; }
        },
        getAccountDocuments: async (accountId) => {
            try {
                const res = await fetch(`${BASE_URL}/collections/account/${accountId}/documents`);
                if (!res.ok) throw new Error('Account documents failed');
                return await res.json();
            } catch (err) { console.error('Account documents error:', err); return { documents: [] }; }
        },
        getTemplates: async () => {
            try {
                const res = await fetch(`${BASE_URL}/collections/templates`);
                if (!res.ok) throw new Error('Templates failed');
                return await res.json();
            } catch (err) { console.error('Templates error:', err); return { call_templates: [], email_templates: [] }; }
        },
        getDispositionCodes: async () => {
            try {
                const res = await fetch(`${BASE_URL}/collections/disposition-codes`);
                if (!res.ok) throw new Error('Disposition codes failed');
                return await res.json();
            } catch (err) { console.error('Disposition codes error:', err); return []; }
        },
        getEscalationReasons: async () => {
            try {
                const res = await fetch(`${BASE_URL}/collections/escalation-reasons`);
                if (!res.ok) throw new Error('Escalation reasons failed');
                return await res.json();
            } catch (err) { console.error('Escalation reasons error:', err); return []; }
        },
        getTimeline: async () => {
            try {
                const res = await fetch(`${BASE_URL}/collections/timeline`);
                if (!res.ok) throw new Error('Collections timeline failed');
                return await res.json();
            } catch (err) { console.error('Collections timeline error:', err); return { events: [] }; }
        },
        getPropensity: async (accountId) => {
            try {
                const res = await fetch(`${BASE_URL}/collections/propensity/${accountId}`);
                if (!res.ok) throw new Error('Propensity failed');
                return await res.json();
            } catch (err) { console.error('Propensity error:', err); return null; }
        },
        getUserPerformance: async () => {
            try {
                const res = await fetch(`${BASE_URL}/collections/user-performance`);
                if (!res.ok) throw new Error('User performance failed');
                return await res.json();
            } catch (err) { console.error('User performance error:', err); return { users: [] }; }
        },
        getTeamMetrics: async () => {
            try {
                const res = await fetch(`${BASE_URL}/collections/team-metrics`);
                if (!res.ok) throw new Error('Team metrics failed');
                return await res.json();
            } catch (err) { console.error('Team metrics error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Reconciliation  (Sprint 3)
    // ------------------------------------------------------------------------
    reconciliation: {
        getSummary: async () => {
            try {
                const res = await fetch(`${BASE_URL}/reconciliation/summary`);
                if (!res.ok) throw new Error('recon summary failed');
                return await res.json();
            } catch (err) { console.error('Reconciliation summary error:', err); return null; }
        },
        getWeekly: async ({ weeksBack = 12, payer_id, status } = {}) => {
            try {
                const params = new URLSearchParams({ weeks_back: weeksBack });
                if (payer_id && payer_id !== 'all') params.set('payer_id', payer_id);
                if (status) params.set('status', status);
                const res = await fetch(`${BASE_URL}/reconciliation/weekly?${params}`);
                if (!res.ok) throw new Error('recon weekly failed');
                return await res.json();
            } catch (err) { console.error('Reconciliation weekly error:', err); return []; }
        },
        getERATrail: async ({ page = 1, size = 50, payer_id } = {}) => {
            try {
                const params = new URLSearchParams({ page, size });
                if (payer_id && payer_id !== 'all') params.set('payer_id', payer_id);
                const res = await fetch(`${BASE_URL}/reconciliation/era?${params}`);
                if (!res.ok) throw new Error('ERA trail failed');
                return await res.json();
            } catch (err) { console.error('ERA trail error:', err); return { items: [], total: 0 }; }
        },
        getTransactionDetail: async (transactionId) => {
            try {
                const res = await fetch(`${BASE_URL}/reconciliation/transaction/${transactionId}`);
                if (!res.ok) throw new Error('Transaction detail failed');
                return await res.json();
            } catch (err) { console.error('Transaction detail error:', err); return null; }
        },
        getPayerClaims: async (params) => {
            try {
                const res = await fetch(`${BASE_URL}/reconciliation/payer-claims-by-name?${new URLSearchParams(params)}`);
                if (!res.ok) throw new Error('Payer claims failed');
                return await res.json();
            } catch (err) { console.error('Payer claims error:', err); return { claims: [], total: 0, summary: {} }; }
        },
    },

    // ------------------------------------------------------------------------
    // AI Insights  (Sprint 4 — Ollama local LLM)
    // ------------------------------------------------------------------------
    ai: {
        health: async () => {
            try {
                const res = await fetch(`${BASE_URL}/ai/health`);
                if (!res.ok) throw new Error('AI health check failed');
                return await res.json();
            } catch (err) { console.error('AI health error:', err); return { status: 'degraded', ollama: false }; }
        },
        getInsights: async (page = 'denials') => {
            try {
                const res = await fetch(`${BASE_URL}/ai/insights?page=${page}`);
                if (!res.ok) throw new Error(`AI insights failed for ${page}`);
                return await res.json();
            } catch (err) { console.error(`AI insights error [${page}]:`, err); return { insights: [], count: 0 }; }
        },
        draftAppeal: async (claimData) => {
            try {
                const res = await fetch(`${BASE_URL}/ai/appeal-draft`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(claimData),
                });
                if (!res.ok) throw new Error('Appeal draft failed');
                return await res.json();
            } catch (err) { console.error('Appeal draft error:', err); return null; }
        },
        getCallScript: async (taskData) => {
            try {
                const res = await fetch(`${BASE_URL}/ai/call-script`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData),
                });
                if (!res.ok) throw new Error('Call script failed');
                return await res.json();
            } catch (err) { console.error('Call script error:', err); return null; }
        },
        explainAnomaly: async (metric, value, baseline) => {
            try {
                const params = new URLSearchParams({ metric, value, baseline });
                const res = await fetch(`${BASE_URL}/ai/anomaly-explain?${params}`);
                if (!res.ok) throw new Error('Anomaly explain failed');
                return await res.json();
            } catch (err) { console.error('Anomaly explain error:', err); return null; }
        },
        streamInsights: (context = 'denials', onToken, onDone) => {
            const es = new EventSource(`${BASE_URL}/ai/stream?context=${context}`);
            es.onmessage = (e) => {
                if (e.data === '[DONE]') { onDone?.(); es.close(); return; }
                if (e.data.startsWith('[ERROR]')) { console.error('Stream error:', e.data); es.close(); return; }
                onToken?.(e.data);
            };
            es.onerror = () => { console.error('SSE connection error'); es.close(); };
            return es;
        },
        /**
         * Stream a chat message to the AI via SSE.
         * Uses the /ai/stream endpoint with the user message as context.
         * onToken(text) is called per chunk; onDone() when finished.
         * Returns the EventSource so the caller can close it.
         */
        streamChat: (userMessage, onToken, onDone) => {
            const es = new EventSource(
                `${BASE_URL}/ai/stream?context=${encodeURIComponent(userMessage)}`
            );
            es.onmessage = (e) => {
                if (e.data === '[DONE]') { onDone?.(); es.close(); return; }
                if (e.data.startsWith('[ERROR]')) { console.error('Stream error:', e.data); es.close(); return; }
                onToken?.(e.data);
            };
            es.onerror = () => { console.error('SSE chat connection error'); es.close(); };
            return es;
        },
    },

    // ------------------------------------------------------------------------
    // Diagnostics  (Sprint 6 -- Diagnostic Engine)
    // ------------------------------------------------------------------------
    diagnostics: {
        getSummary: async () => {
            try {
                const res = await fetch(`${BASE_URL}/diagnostics/summary`);
                if (!res.ok) throw new Error('diagnostics summary failed');
                return await res.json();
            } catch (err) { console.error('Diagnostics summary error:', err); return null; }
        },
        getFindings: async (filters = {}) => {
            try {
                const params = new URLSearchParams(filters).toString();
                const res = await fetch(`${BASE_URL}/diagnostics/findings${params ? '?' + params : ''}`);
                if (!res.ok) throw new Error('diagnostics findings failed');
                return await res.json();
            } catch (err) { console.error('Diagnostics findings error:', err); return { total: 0, findings: [] }; }
        },
        getPayerDiagnostic: async (payerId) => {
            try {
                const res = await fetch(`${BASE_URL}/diagnostics/payer/${payerId}`);
                if (!res.ok) throw new Error('payer diagnostic failed');
                return await res.json();
            } catch (err) { console.error('Payer diagnostic error:', err); return null; }
        },
        getClaimDiagnostic: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/diagnostics/claim/${claimId}`);
                if (!res.ok) throw new Error('claim diagnostic failed');
                return await res.json();
            } catch (err) { console.error('Claim diagnostic error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Root Cause Intelligence  (Sprint 5)
    // ------------------------------------------------------------------------
    rootCause: {
        getClaimAnalysis: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/root-cause/claim/${claimId}`);
                if (!res.ok) throw new Error(`root cause claim ${claimId} failed`);
                return await res.json();
            } catch (err) { console.error('Root cause claim error:', err); return null; }
        },
        getSummary: async (filters = {}) => {
            try {
                const params = new URLSearchParams(filters).toString();
                const res = await fetch(`${BASE_URL}/root-cause/summary${params ? '?' + params : ''}`);
                if (!res.ok) throw new Error('root cause summary failed');
                return await res.json();
            } catch (err) { console.error('Root cause summary error:', err); return null; }
        },
        getTrending: async ({ weeksBack = 12, payerId } = {}) => {
            try {
                const params = new URLSearchParams({ weeks_back: weeksBack, ...(payerId && { payer_id: payerId }) }).toString();
                const res = await fetch(`${BASE_URL}/root-cause/trending?${params}`);
                if (!res.ok) throw new Error('root cause trending failed');
                return await res.json();
            } catch (err) { console.error('Root cause trending error:', err); return null; }
        },
        validateClaim: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/root-cause/validate/${claimId}`, { method: 'POST' });
                if (!res.ok) throw new Error(`root cause validate ${claimId} failed`);
                return await res.json();
            } catch (err) { console.error('Root cause validate error:', err); return null; }
        },
        validateBatch: async (limit = 10) => {
            try {
                const res = await fetch(`${BASE_URL}/root-cause/validate-batch?limit=${limit}`, { method: 'POST' });
                if (!res.ok) throw new Error('root cause validate-batch failed');
                return await res.json();
            } catch (err) { console.error('Root cause validate-batch error:', err); return null; }
        },
        getTree: async () => {
            try {
                const res = await fetch(`${BASE_URL}/root-cause/tree`);
                if (!res.ok) throw new Error('root cause tree failed');
                return await res.json();
            } catch (err) { console.error('Root cause tree error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Predictions  (Sprint 11)
    // ------------------------------------------------------------------------
    predictions: {
        getDenialProbability: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/denial-probability/${claimId}`);
                if (!res.ok) throw new Error(`denial probability failed for ${claimId}`);
                return await res.json();
            } catch (err) { console.error('Denial probability error:', err); return null; }
        },
        getAppealSuccess: async (denialId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/appeal-success/${denialId}`);
                if (!res.ok) throw new Error(`appeal success failed for ${denialId}`);
                return await res.json();
            } catch (err) { console.error('Appeal success error:', err); return null; }
        },
        trainModel: async (modelName) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/train/${modelName}`, { method: 'POST' });
                if (!res.ok) throw new Error(`train ${modelName} failed`);
                return await res.json();
            } catch (err) { console.error('Train model error:', err); return null; }
        },
        listModels: async () => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/models`);
                if (!res.ok) throw new Error('list models failed');
                return await res.json();
            } catch (err) { console.error('List models error:', err); return null; }
        },
        investigateDenial: async (denialId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/investigate/denial/${denialId}`);
                if (!res.ok) throw new Error(`investigate denial failed for ${denialId}`);
                return await res.json();
            } catch (err) { console.error('Investigate denial error:', err); return null; }
        },
        investigateClaim: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/investigate/claim/${claimId}`);
                if (!res.ok) throw new Error(`investigate claim failed for ${claimId}`);
                return await res.json();
            } catch (err) { console.error('Investigate claim error:', err); return null; }
        },
        runDenialPipeline: async (denialId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/pipeline/denial/${denialId}`, { method: 'POST' });
                if (!res.ok) throw new Error(`denial pipeline failed for ${denialId}`);
                return await res.json();
            } catch (err) { console.error('Denial pipeline error:', err); return null; }
        },
        runClaimPipeline: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/pipeline/claim/${claimId}`, { method: 'POST' });
                if (!res.ok) throw new Error(`claim pipeline failed for ${claimId}`);
                return await res.json();
            } catch (err) { console.error('Claim pipeline error:', err); return null; }
        },
        getOutcomeSummary: async (days = 90) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/outcomes/summary?days=${days}`);
                if (!res.ok) throw new Error('outcome summary failed');
                return await res.json();
            } catch (err) { console.error('Outcome summary error:', err); return null; }
        },
        getPredictionAccuracy: async (days = 90) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/outcomes/accuracy?days=${days}`);
                if (!res.ok) throw new Error('prediction accuracy failed');
                return await res.json();
            } catch (err) { console.error('Prediction accuracy error:', err); return null; }
        },
        getPaymentDelay: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/payment-delay/${claimId}`);
                if (!res.ok) throw new Error(`payment delay failed for ${claimId}`);
                return await res.json();
            } catch (err) { console.error('Payment delay error:', err); return null; }
        },
        getPayerAnomalies: async () => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/payer-anomalies`);
                if (!res.ok) throw new Error('payer anomalies failed');
                return await res.json();
            } catch (err) { console.error('Payer anomalies error:', err); return null; }
        },
        getPropensityToPay: async (patientId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/propensity-to-pay/${patientId}`);
                if (!res.ok) throw new Error(`propensity to pay failed for ${patientId}`);
                return await res.json();
            } catch (err) { console.error('Propensity to pay error:', err); return null; }
        },
        getWriteOffRisk: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/write-off-risk/${claimId}`);
                if (!res.ok) throw new Error(`write-off risk failed for ${claimId}`);
                return await res.json();
            } catch (err) { console.error('Write-off risk error:', err); return null; }
        },
        getProviderRisk: async (providerId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/provider-risk/${providerId}`);
                if (!res.ok) throw new Error(`provider risk failed for ${providerId}`);
                return await res.json();
            } catch (err) { console.error('Provider risk error:', err); return null; }
        },
        getCarcPrediction: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/carc-prediction/${claimId}`);
                if (!res.ok) throw new Error(`CARC prediction failed for ${claimId}`);
                return await res.json();
            } catch (err) { console.error('CARC prediction error:', err); return null; }
        },
        getClaimValue: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/composite/claim-value/${claimId}`);
                if (!res.ok) throw new Error(`claim value failed for ${claimId}`);
                return await res.json();
            } catch (err) { console.error('Claim value error:', err); return null; }
        },
        getPayerHealth: async (payerId) => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/composite/payer-health/${payerId}`);
                if (!res.ok) throw new Error(`payer health failed for ${payerId}`);
                return await res.json();
            } catch (err) { console.error('Payer health error:', err); return null; }
        },
        getOrgHealth: async () => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/composite/org-health`);
                if (!res.ok) throw new Error('org health failed');
                return await res.json();
            } catch (err) { console.error('Org health error:', err); return null; }
        },
        getModelGovernance: async () => {
            try {
                const res = await fetch(`${BASE_URL}/predictions/model-governance/status`);
                if (!res.ok) throw new Error('model governance failed');
                return await res.json();
            } catch (err) { console.error('Model governance error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Graph / Drill-down  (Sprint 7 -- Connection Layer)
    // ------------------------------------------------------------------------
    graph: {
        getRevenueToPayers: async (filters) => {
            try {
                const params = filters ? new URLSearchParams(filters).toString() : '';
                const res = await fetch(`${BASE_URL}/graph/revenue-to-payers${params ? '?' + params : ''}`);
                if (!res.ok) throw new Error('graph revenue-to-payers failed');
                return await res.json();
            } catch (err) { console.error('Graph revenue-to-payers error:', err); return null; }
        },
        getPayerCategories: async (payerId) => {
            try {
                const res = await fetch(`${BASE_URL}/graph/payer/${payerId}/categories`);
                if (!res.ok) throw new Error('graph payer categories failed');
                return await res.json();
            } catch (err) { console.error('Graph payer categories error:', err); return null; }
        },
        getCategoryRootCauses: async (payerId, category) => {
            try {
                const res = await fetch(`${BASE_URL}/graph/payer/${payerId}/category/${encodeURIComponent(category)}/root-causes`);
                if (!res.ok) throw new Error('graph category root causes failed');
                return await res.json();
            } catch (err) { console.error('Graph category root causes error:', err); return null; }
        },
        getClaims: async (filters = {}) => {
            try {
                const params = new URLSearchParams();
                if (filters.payer_id) params.set('payer_id', filters.payer_id);
                if (filters.root_cause) params.set('root_cause', filters.root_cause);
                if (filters.category) params.set('category', filters.category);
                if (filters.limit) params.set('limit', filters.limit);
                if (filters.offset) params.set('offset', filters.offset);
                const res = await fetch(`${BASE_URL}/graph/claims?${params}`);
                if (!res.ok) throw new Error('graph claims failed');
                return await res.json();
            } catch (err) { console.error('Graph claims error:', err); return { total: 0, claims: [] }; }
        },
        getClaimFullContext: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/graph/claim/${claimId}/full-context`);
                if (!res.ok) throw new Error('graph claim full context failed');
                return await res.json();
            } catch (err) { console.error('Graph claim context error:', err); return null; }
        },
        browseClaims: async (params = {}) => {
            try {
                const qs = new URLSearchParams();
                if (params.status) qs.set('status', params.status);
                if (params.payer_id) qs.set('payer_id', params.payer_id);
                if (params.page) qs.set('page', params.page);
                if (params.size) qs.set('size', params.size);
                if (params.sort) qs.set('sort', params.sort);
                const res = await fetch(`${BASE_URL}/graph/claims/browse?${qs}`);
                if (!res.ok) throw new Error('graph browse claims failed');
                return await res.json();
            } catch (err) { console.error('Graph browse claims error:', err); return { claims: [], total: 0 }; }
        },
    },

    // ------------------------------------------------------------------------
    // Automation Engine  (Sprint 7)
    // ------------------------------------------------------------------------
    automation: {
        getRules: async () => {
            try {
                const res = await fetch(`${BASE_URL}/automation/rules`);
                if (!res.ok) throw new Error('automation rules failed');
                return await res.json();
            } catch (err) { console.error('Automation rules error:', err); return null; }
        },
        toggleRule: async (ruleId, enabled) => {
            try {
                const res = await fetch(`${BASE_URL}/automation/rules/${ruleId}/toggle?enabled=${enabled}`, { method: 'POST' });
                if (!res.ok) throw new Error('automation toggle failed');
                return await res.json();
            } catch (err) { console.error('Automation toggle error:', err); return null; }
        },
        getPending: async () => {
            try {
                const res = await fetch(`${BASE_URL}/automation/pending`);
                if (!res.ok) throw new Error('automation pending failed');
                return await res.json();
            } catch (err) { console.error('Automation pending error:', err); return []; }
        },
        approveAction: async (actionId) => {
            try {
                const res = await fetch(`${BASE_URL}/automation/approve/${actionId}`, { method: 'POST' });
                if (!res.ok) throw new Error('automation approve failed');
                return await res.json();
            } catch (err) { console.error('Automation approve error:', err); return null; }
        },
        rejectAction: async (actionId) => {
            try {
                const res = await fetch(`${BASE_URL}/automation/reject/${actionId}`, { method: 'POST' });
                if (!res.ok) throw new Error('automation reject failed');
                return await res.json();
            } catch (err) { console.error('Automation reject error:', err); return null; }
        },
        getAudit: async (limit = 50) => {
            try {
                const res = await fetch(`${BASE_URL}/automation/audit?limit=${limit}`);
                if (!res.ok) throw new Error('automation audit failed');
                return await res.json();
            } catch (err) { console.error('Automation audit error:', err); return []; }
        },
        evaluate: async () => {
            try {
                const res = await fetch(`${BASE_URL}/automation/evaluate`, { method: 'POST' });
                if (!res.ok) throw new Error('automation evaluate failed');
                return await res.json();
            } catch (err) { console.error('Automation evaluate error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Simulation / MiroFish  (What-If Engine)
    // ------------------------------------------------------------------------
    simulation: {
        getScenarios: async () => {
            try {
                const res = await fetch(`${BASE_URL}/simulation/scenarios`);
                if (!res.ok) throw new Error('Scenarios fetch failed');
                return await res.json();
            } catch (err) { console.error('Simulation scenarios error:', err); return null; }
        },
        run: async (scenario) => {
            try {
                const res = await fetch(`${BASE_URL}/simulation/run`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scenario),
                });
                if (!res.ok) throw new Error('Simulation run failed');
                return await res.json();
            } catch (err) { console.error('Simulation run error:', err); return null; }
        },
        getStatus: async (id) => {
            try {
                const res = await fetch(`${BASE_URL}/simulation/${id}/status`);
                if (!res.ok) throw new Error('Status fetch failed');
                return await res.json();
            } catch (err) { console.error('Simulation status error:', err); return null; }
        },
        getResults: async (id) => {
            try {
                const res = await fetch(`${BASE_URL}/simulation/${id}/results`);
                if (!res.ok) throw new Error('Results fetch failed');
                return await res.json();
            } catch (err) { console.error('Simulation results error:', err); return null; }
        },
        getPayerAgents: async () => {
            try {
                const res = await fetch(`${BASE_URL}/simulation/payer-agents`);
                if (!res.ok) throw new Error('Payer agents fetch failed');
                return await res.json();
            } catch (err) { console.error('Payer agents error:', err); return null; }
        },
        getOntology: async () => {
            try {
                const res = await fetch(`${BASE_URL}/simulation/ontology`);
                if (!res.ok) throw new Error('Ontology fetch failed');
                return await res.json();
            } catch (err) { console.error('Ontology error:', err); return null; }
        },
        getLivePayerAgents: async () => {
            try {
                const res = await fetch(`${BASE_URL}/simulation/payer-agents/live`);
                if (!res.ok) throw new Error('Live payer agents fetch failed');
                return await res.json();
            } catch (err) { console.error('Live payer agents error:', err); return null; }
        },

        // === MiroFish RCM Agent Swarm ===
        getLatestResults: async () => {
            try {
                const res = await fetch('http://localhost:5001/api/simulation/rcm/latest');
                if (!res.ok) throw new Error('Latest results fetch failed');
                return await res.json();
            } catch (err) { console.error('MiroFish latest results error:', err); return null; }
        },
        getSchedulerStatus: async () => {
            try {
                const res = await fetch('http://localhost:5001/api/simulation/rcm/scheduler/status');
                if (!res.ok) throw new Error('Scheduler status fetch failed');
                return await res.json();
            } catch (err) { console.error('MiroFish scheduler error:', err); return null; }
        },
        runRCMSimulation: async (scenario) => {
            try {
                const res = await fetch('http://localhost:5001/api/simulation/rcm/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scenario }),
                });
                if (!res.ok) throw new Error('RCM simulation failed');
                return await res.json();
            } catch (err) { console.error('RCM simulation error:', err); return null; }
        },
        validateSuggestion: async (suggestion, type) => {
            try {
                const res = await fetch('http://localhost:5001/api/simulation/rcm/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ suggestion, type }),
                });
                if (!res.ok) throw new Error('Validation failed');
                return await res.json();
            } catch (err) { console.error('MiroFish validation error:', err); return null; }
        },
        getRCMAgents: async () => {
            try {
                const res = await fetch('http://localhost:5001/api/simulation/rcm/agents');
                if (!res.ok) throw new Error('RCM agents fetch failed');
                return await res.json();
            } catch (err) { console.error('RCM agents error:', err); return null; }
        },
        interviewAgent: async (agentId, question) => {
            try {
                const res = await fetch(`http://localhost:5001/api/simulation/rcm/interview/${agentId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question }),
                });
                if (!res.ok) throw new Error('Agent interview failed');
                return await res.json();
            } catch (err) { console.error('Agent interview error:', err); return null; }
        },
        runScenarioNow: async (scenarioId) => {
            try {
                const res = await fetch(`http://localhost:5001/api/simulation/rcm/run-now/${scenarioId}`, {
                    method: 'POST',
                });
                if (!res.ok) throw new Error('Run now failed');
                return await res.json();
            } catch (err) { console.error('Run scenario now error:', err); return null; }
        },
        getGraphStats: async () => {
            try {
                const res = await fetch('http://localhost:5001/api/graph/rcm-stats');
                if (!res.ok) throw new Error('Graph stats failed');
                return await res.json();
            } catch (err) { console.error('Graph stats error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Scheduler Status  (Sprint 12)
    // ------------------------------------------------------------------------
    scheduler: {
        getStatus: async () => {
            try {
                const res = await fetch(`${BASE_URL}/scheduler/status`);
                if (!res.ok) throw new Error('scheduler status failed');
                return await res.json();
            } catch (err) { console.error('Scheduler status error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Analytics  (Sprint 4 P1)
    // ------------------------------------------------------------------------
    analytics: {
        getPipeline: async () => {
            try {
                const res = await fetch(`${BASE_URL}/analytics/pipeline`);
                if (!res.ok) throw new Error('Pipeline fetch failed');
                return await res.json();
            } catch (err) { console.error('Pipeline error:', err); return null; }
        },
        getDenialMatrix: async () => {
            try {
                const res = await fetch(`${BASE_URL}/analytics/denial-matrix`);
                if (!res.ok) throw new Error('Denial matrix fetch failed');
                return await res.json();
            } catch (err) { console.error('Denial matrix error:', err); return null; }
        },
        getAppealWinRates: async () => {
            try {
                const res = await fetch(`${BASE_URL}/analytics/appeal-win-rate`);
                if (!res.ok) throw new Error('Appeal win rate fetch failed');
                return await res.json();
            } catch (err) { console.error('Appeal win rate error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Prevention Engine  (Sprint 8)
    // ------------------------------------------------------------------------
    prevention: {
        scan: async (limit = 100) => {
            try {
                const res = await fetch(`${BASE_URL}/prevention/scan?limit=${limit}`);
                if (!res.ok) throw new Error('Prevention scan failed');
                return await res.json();
            } catch (err) { console.error('Prevention scan error:', err); return null; }
        },
        getSummary: async () => {
            try {
                const res = await fetch(`${BASE_URL}/prevention/summary`);
                if (!res.ok) throw new Error('Prevention summary failed');
                return await res.json();
            } catch (err) { console.error('Prevention summary error:', err); return null; }
        },
        getAlerts: async (filters = {}) => {
            try {
                const p = new URLSearchParams();
                if (filters.prevention_type) p.append('prevention_type', filters.prevention_type);
                if (filters.severity) p.append('severity', filters.severity);
                if (filters.payer) p.append('payer', filters.payer);
                if (filters.page) p.append('page', filters.page);
                if (filters.size) p.append('size', filters.size);
                const res = await fetch(`${BASE_URL}/prevention/alerts?${p}`);
                if (!res.ok) throw new Error('Prevention alerts failed');
                return await res.json();
            } catch (err) { console.error('Prevention alerts error:', err); return null; }
        },
        dismiss: async (alertId) => {
            try {
                const res = await fetch(`${BASE_URL}/prevention/dismiss/${alertId}`, {
                    method: 'POST',
                });
                if (!res.ok) throw new Error('Prevention dismiss failed');
                return await res.json();
            } catch (err) { console.error('Prevention dismiss error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // LIDA — Microsoft LIDA Auto-Visualization + NL Query (Sprint 9)
    // ------------------------------------------------------------------------
    lida: {
        health: async () => {
            try {
                const res = await fetch(`${BASE_URL}/lida/health`);
                if (!res.ok) throw new Error('LIDA health check failed');
                return await res.json();
            } catch (err) { console.error('LIDA health error:', err); return { ready: false }; }
        },
        summarize: async (dataset = 'denials') => {
            try {
                const res = await fetch(`${BASE_URL}/lida/summarize?dataset=${dataset}`);
                if (!res.ok) throw new Error('LIDA summarize failed');
                return await res.json();
            } catch (err) { console.error('LIDA summarize error:', err); return null; }
        },
        goals: async (dataset = 'denials', n = 5) => {
            try {
                const res = await fetch(`${BASE_URL}/lida/goals?dataset=${dataset}&n=${n}`);
                if (!res.ok) throw new Error('LIDA goals failed');
                return await res.json();
            } catch (err) { console.error('LIDA goals error:', err); return null; }
        },
        visualize: async (dataset, question) => {
            try {
                const res = await fetch(`${BASE_URL}/lida/visualize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dataset, question }),
                });
                if (!res.ok) throw new Error('LIDA visualize failed');
                return await res.json();
            } catch (err) { console.error('LIDA visualize error:', err); return null; }
        },
        ask: async (question, dataset = 'auto') => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 90000);
                const res = await fetch(`${BASE_URL}/lida/ask`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question, dataset }),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (!res.ok) throw new Error('LIDA ask failed');
                return await res.json();
            } catch (err) { console.error('LIDA ask error:', err); return null; }
        },
        datasets: async () => {
            try {
                const res = await fetch(`${BASE_URL}/lida/datasets`);
                if (!res.ok) throw new Error('LIDA datasets failed');
                return await res.json();
            } catch (err) { console.error('LIDA datasets error:', err); return { datasets: [] }; }
        },
        chart: async (dataset = 'denials', question = 'Show distribution') => {
            try {
                const res = await fetch(`${BASE_URL}/lida/chart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dataset, question }),
                });
                if (!res.ok) throw new Error('LIDA chart failed');
                return await res.json();
            } catch (err) { console.error('LIDA chart error:', err); return null; }
        },
        sql: async (question) => {
            try {
                const res = await fetch(`${BASE_URL}/lida/sql`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question }),
                });
                if (!res.ok) throw new Error('LIDA sql failed');
                return await res.json();
            } catch (err) { console.error('LIDA sql error:', err); return null; }
        },
        report: async (type, payerId) => {
            try {
                const url = `${BASE_URL}/lida/report/${type}${payerId ? `?payer_id=${payerId}` : ''}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`LIDA report ${type} failed`);
                return await res.json();
            } catch (err) { console.error('LIDA report error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Simulation  (Sprint 19)
    // ------------------------------------------------------------------------
    simulation: {
        runScenario: async (params) => {
            try {
                const res = await fetch(`${BASE_URL}/simulation/scenario`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params),
                });
                if (!res.ok) throw new Error('simulation scenario failed');
                return await res.json();
            } catch (err) { console.error('Simulation scenario error:', err); return null; }
        },
        getScenarios: async () => {
            try {
                const res = await fetch(`${BASE_URL}/simulation/scenarios`);
                if (!res.ok) throw new Error('get scenarios failed');
                return await res.json();
            } catch (err) { console.error('Get scenarios error:', err); return null; }
        },
        getScenarioResults: async (id) => {
            try {
                const res = await fetch(`${BASE_URL}/simulation/results/${id}`);
                if (!res.ok) throw new Error(`scenario results failed for ${id}`);
                return await res.json();
            } catch (err) { console.error('Scenario results error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Coding  (Sprint 19)
    // ------------------------------------------------------------------------
    coding: {
        getAudit: async () => {
            try {
                const res = await fetch(`${BASE_URL}/coding/audit`);
                if (!res.ok) throw new Error('coding audit failed');
                return await res.json();
            } catch (err) { console.error('Coding audit error:', err); return null; }
        },
        getCompliance: async () => {
            try {
                const res = await fetch(`${BASE_URL}/coding/compliance`);
                if (!res.ok) throw new Error('coding compliance failed');
                return await res.json();
            } catch (err) { console.error('Coding compliance error:', err); return null; }
        },
        getSuggestions: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/coding/suggestions/${claimId}`);
                if (!res.ok) throw new Error(`coding suggestions failed for ${claimId}`);
                return await res.json();
            } catch (err) { console.error('Coding suggestions error:', err); return null; }
        },
        getProviderPatterns: async (providerId) => {
            try {
                const res = await fetch(`${BASE_URL}/coding/provider-patterns/${providerId}`);
                if (!res.ok) throw new Error(`provider patterns failed for ${providerId}`);
                return await res.json();
            } catch (err) { console.error('Provider patterns error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // EVV  (Sprint 19)
    // ------------------------------------------------------------------------
    evv: {
        getVisits: async () => {
            try {
                const res = await fetch(`${BASE_URL}/evv/visits`);
                if (!res.ok) throw new Error('evv visits failed');
                return await res.json();
            } catch (err) { console.error('EVV visits error:', err); return null; }
        },
        getFraudDetection: async () => {
            try {
                const res = await fetch(`${BASE_URL}/evv/fraud-detection`);
                if (!res.ok) throw new Error('evv fraud detection failed');
                return await res.json();
            } catch (err) { console.error('EVV fraud detection error:', err); return null; }
        },
        getStateMandates: async () => {
            try {
                const res = await fetch(`${BASE_URL}/evv/state-mandates`);
                if (!res.ok) throw new Error('evv state mandates failed');
                return await res.json();
            } catch (err) { console.error('EVV state mandates error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Patient Access  (Sprint 19)
    // ------------------------------------------------------------------------
    patientAccess: {
        getEligibility: async (patientId) => {
            try {
                const res = await fetch(`${BASE_URL}/patient-access/eligibility/${patientId}`);
                if (!res.ok) throw new Error(`eligibility failed for ${patientId}`);
                return await res.json();
            } catch (err) { console.error('Eligibility error:', err); return null; }
        },
        getPriorAuth: async (params = {}) => {
            try {
                const qs = new URLSearchParams(params).toString();
                const res = await fetch(`${BASE_URL}/patient-access/prior-auth${qs ? '?' + qs : ''}`);
                if (!res.ok) throw new Error('prior auth failed');
                return await res.json();
            } catch (err) { console.error('Prior auth error:', err); return null; }
        },
        getBenefits: async (patientId) => {
            try {
                const res = await fetch(`${BASE_URL}/patient-access/benefits/${patientId}`);
                if (!res.ok) throw new Error(`benefits failed for ${patientId}`);
                return await res.json();
            } catch (err) { console.error('Benefits error:', err); return null; }
        },
        getCostEstimate: async (claimId) => {
            try {
                const res = await fetch(`${BASE_URL}/patient-access/cost-estimate/${claimId}`);
                if (!res.ok) throw new Error(`cost estimate failed for ${claimId}`);
                return await res.json();
            } catch (err) { console.error('Cost estimate error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Admin  (Sprint 19)
    // ------------------------------------------------------------------------
    admin: {
        getSystemHealth: async () => {
            try {
                const res = await fetch(`${BASE_URL}/admin/system-health`);
                if (!res.ok) throw new Error('system health failed');
                return await res.json();
            } catch (err) { console.error('System health error:', err); return null; }
        },
        getEtlStatus: async () => {
            try {
                const res = await fetch(`${BASE_URL}/admin/etl-status`);
                if (!res.ok) throw new Error('etl status failed');
                return await res.json();
            } catch (err) { console.error('ETL status error:', err); return null; }
        },
        getUsers: async () => {
            try {
                const res = await fetch(`${BASE_URL}/admin/users`);
                if (!res.ok) throw new Error('get users failed');
                return await res.json();
            } catch (err) { console.error('Get users error:', err); return null; }
        },
    },

    // ------------------------------------------------------------------------
    // Compliance  (Sprint 19)
    // ------------------------------------------------------------------------
    compliance: {
        getOvercodingRisk: async () => {
            try {
                const res = await fetch(`${BASE_URL}/compliance/overcoding-risk`);
                if (!res.ok) throw new Error('overcoding risk failed');
                return await res.json();
            } catch (err) { console.error('Overcoding risk error:', err); return null; }
        },
        getFcaRisk: async () => {
            try {
                const res = await fetch(`${BASE_URL}/compliance/fca-risk`);
                if (!res.ok) throw new Error('fca risk failed');
                return await res.json();
            } catch (err) { console.error('FCA risk error:', err); return null; }
        },
        getAuditRisk: async () => {
            try {
                const res = await fetch(`${BASE_URL}/compliance/audit-risk`);
                if (!res.ok) throw new Error('audit risk failed');
                return await res.json();
            } catch (err) { console.error('Audit risk error:', err); return null; }
        },
        getSummary: async () => {
            try {
                const res = await fetch(`${BASE_URL}/compliance/summary`);
                if (!res.ok) throw new Error('compliance summary failed');
                return await res.json();
            } catch (err) { console.error('Compliance summary error:', err); return null; }
        },
    },
};
