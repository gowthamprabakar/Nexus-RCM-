export const mockReconciliationData = {
    // 1. Bank Feeds (The "Reality" - Real Cash in Bank)
    bankDeposits: [
        {
            id: 'DEP-1001',
            date: '2024-02-17',
            amount: 12500.00,
            payer: 'UnitedHealthcare',
            method: 'EFT',
            status: 'Matched',
            traceNumber: 'TRC-998877',
            items: [
                { id: 'CHK-5501', amount: 5000.00, claimCount: 12 },
                { id: 'CHK-5502', amount: 7500.00, claimCount: 18 }
            ]
        },
        {
            id: 'DEP-1002',
            date: '2024-02-17',
            amount: 4250.50,
            payer: 'BCBS',
            method: 'EFT',
            status: 'Partial Match', // Variance scenario
            traceNumber: 'TRC-998878',
            items: [
                { id: 'CHK-5503', amount: 4250.50, claimCount: 8 }
            ],
            matchVariance: -50.00 // Underpaid vs System
        },
        {
            id: 'DEP-1003',
            date: '2024-02-16',
            amount: 15000.00,
            payer: 'Aetna',
            method: 'EFT',
            status: 'Unmatched', // Missing in system
            traceNumber: 'TRC-998879',
            items: [],
            flag: 'Recent Deposit'
        },
        {
            id: 'DEP-1004',
            date: '2024-02-15',
            amount: 320.00,
            payer: 'Patient Payment (Stripe)',
            method: 'Credit Card',
            status: 'Matched',
            traceNumber: 'STR-112233',
            items: [{ id: 'TXN-8899', amount: 320.00, claimCount: 1 }]
        },
        {
            id: 'DEP-1005',
            date: '2024-02-14',
            amount: 50000.00,
            payer: 'Medicare',
            method: 'EFT',
            status: 'Flagged', // Anomaly
            traceNumber: 'TRC-998880',
            description: 'Bulk Settlement',
            items: [],
            issue: 'Amounts do not align with any open batch'
        }
    ],

    // 2. System Postings (The "Expectation" - What was posted in RCM Pulse)
    postedPayments: [
        {
            id: 'PMT-8001',
            depositId: 'DEP-1001',
            date: '2024-02-17',
            amount: 12500.00,
            payer: 'UnitedHealthcare',
            postedBy: 'Auto-Poster Bot',
            claims: ['CLM-2024001', 'CLM-2024002', '...'],
            status: 'Posted'
        },
        {
            id: 'PMT-8002',
            depositId: 'DEP-1002',
            date: '2024-02-17',
            amount: 4300.50, // System expected more
            payer: 'BCBS',
            postedBy: 'Jane Doe',
            claims: ['CLM-2024005'],
            status: 'Posted',
            note: 'Manual difference'
        }
        // DEP-1003 is missing here (Unmatched)
    ],

    // 3. Forecasted Cash (The "Lookahead")
    forecast: {
        todayExpected: 45000,
        todayActual: 16750.50, // Sum of today's deposits
        variance: -28249.50,
        next7Days: [
            { date: '2024-02-18', amount: 52000, confidence: 'High' },
            { date: '2024-02-19', amount: 48000, confidence: 'Medium' },
            { date: '2024-02-20', amount: 55000, confidence: 'High' },
            { date: '2024-02-21', amount: 60000, confidence: 'High' },
            { date: '2024-02-22', amount: 40000, confidence: 'Low' },
            { date: '2024-02-23', amount: 45000, confidence: 'Medium' },
            { date: '2024-02-24', amount: 30000, confidence: 'High' }
        ]
    },

    // 4. Drill-Down Details (For "Bank vs Book" Analysis)
    depositDetails: {
        'DEP-1002': {
            checkImage: 'https://placeholder.com/check.png',
            bankMemo: 'ACH CREDIT BCBS SETTLEMENT 888291',
            remittanceData: {
                totalAllowed: 4250.50,
                adjustments: 250.00,
                providerLevelAdjustments: -50.00 // The logic for the variance
            }
        }
    },

    // KPI Metrics
    metrics: {
        unreconciledAmount: 15470.50, // Sum of gaps
        autoReconciliationRate: 92.5,
        avgDaysToClear: 1.2,
        suspenseAccountBalance: 5200.00
    }
};
