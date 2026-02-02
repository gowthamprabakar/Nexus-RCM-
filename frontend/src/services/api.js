// Middleware Simulation Layer
// This file acts as the bridge between frontend components and the synthetic data.

import claimsData from '../data/synthetic/claims.json';
import ticketsData from '../data/synthetic/tickets.json';
import payersData from '../data/synthetic/payers.json';
import usersData from '../data/synthetic/users.json';
import auditLogsData from '../data/synthetic/audit_logs.json';

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
        list: () => withMiddleware("claims.list", async () => claimsData),
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
        list: () => withMiddleware("payers.list", async () => payersData)
    },

    // ------------------------------------------------------------------------
    // Users Endpoints
    // ------------------------------------------------------------------------
    users: {
        list: () => withMiddleware("users.list", async () => usersData)
    }
};
