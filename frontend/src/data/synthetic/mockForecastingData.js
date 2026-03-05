
export const mockForecastingData = {
    // 1. 30-Day Trend Data with Predictive Extension
    forecastTrend: [
        { date: '2023-10-01', forecasted: 4200, posted: 4150, bank_credits: 4100, variance: 50 },
        { date: '2023-10-02', forecasted: 4500, posted: 4300, bank_credits: 4280, variance: 200 },
        { date: '2023-10-03', forecasted: 4300, posted: 4200, bank_credits: 4190, variance: 100 },
        { date: '2023-10-04', forecasted: 4800, posted: 4750, bank_credits: 4700, variance: 50 },
        { date: '2023-10-05', forecasted: 5100, posted: 4500, bank_credits: 4400, variance: 600 }, // Anomaly
        { date: '2023-10-06', forecasted: 4900, posted: 4850, bank_credits: 4800, variance: 50 },
        { date: '2023-10-07', forecasted: 3200, posted: 3100, bank_credits: 3050, variance: 100 }, // Weekend
        { date: '2023-10-08', forecasted: 2800, posted: 2750, bank_credits: 2700, variance: 50 }, // Weekend
        { date: '2023-10-09', forecasted: 5200, posted: 5100, bank_credits: 5050, variance: 100 },
        { date: '2023-10-10', forecasted: 5400, posted: 5350, bank_credits: 5300, variance: 50 },
        { date: '2023-10-11', forecasted: 5300, posted: 5250, bank_credits: 5200, variance: 50 },
        { date: '2023-10-12', forecasted: 5500, posted: 5000, bank_credits: 4950, variance: 500 }, // Anomaly
        { date: '2023-10-13', forecasted: 5100, posted: 5050, bank_credits: 5000, variance: 50 },
        { date: '2023-10-14', forecasted: 3300, posted: 3200, bank_credits: 3150, variance: 100 },
        { date: '2023-10-15', forecasted: 2900, posted: 2850, bank_credits: 2800, variance: 50 },
        { date: '2023-10-16', forecasted: 5600, posted: 5550, bank_credits: 5500, variance: 50 },
        { date: '2023-10-17', forecasted: 5800, posted: 5750, bank_credits: 5700, variance: 50 },
        { date: '2023-10-18', forecasted: 5700, posted: 5650, bank_credits: 5600, variance: 50 },
        { date: '2023-10-19', forecasted: 5900, posted: 5400, bank_credits: 5350, variance: 500 },
        { date: '2023-10-20', forecasted: 5500, posted: 5450, bank_credits: 5400, variance: 50 },
        { date: '2023-10-21', forecasted: 3400, posted: 3300, bank_credits: 3250, variance: 100 },
        { date: '2023-10-22', forecasted: 3000, posted: 2950, bank_credits: 2900, variance: 50 },
        { date: '2023-10-23', forecasted: 6000, posted: 5950, bank_credits: 5900, variance: 50 },
        { date: '2023-10-24', forecasted: 6200, posted: 6150, bank_credits: 6100, variance: 50 },
        { date: '2023-10-25', forecasted: 6100, posted: 6050, bank_credits: 6000, variance: 50 },
        { date: '2023-10-26', forecasted: 6300, posted: 6250, bank_credits: 6200, variance: 50 }, // Today (Mock)
        // Future / Predictive
        { date: '2023-10-27', forecasted: 6400, predicted: 6350 },
        { date: '2023-10-28', forecasted: 3500, predicted: 3450 },
        { date: '2023-10-29', forecasted: 3100, predicted: 3050 },
        { date: '2023-10-30', forecasted: 6500, predicted: 6450 },
    ],

    // 2. AI Insights (Enhanced for Deep Dive)
    aiInsights: [
        {
            id: 'INS-2023-001',
            date: '2023-10-05',
            type: 'anomaly',
            severity: 'high',
            title: 'Significant Payor Delay',
            message: 'Detected a $600k variance due to delayed ERA posting from UnitedHealthcare. Historical patterns suggest resolution within 48 hours.',
            // Deep Dive Data
            root_cause_analysis: "The variance is driven by a synchronization delay between the clearinghouse (Availity) and the payer's EFT deposit notification system. The actual funds have been received by the bank, but the 835 ERA file is stuck in a 'Pending' state at the gateway.",
            confidence_score: 94,
            impact_value: "$600,000",
            prediction_window: "48 Hours",
            contributing_factors: [
                { factor: 'Payer Processing Lag (UHC)', impact: 65, trend: 'up' },
                { factor: 'Weekend Clearinghouse Batching', impact: 25, trend: 'flat' },
                { factor: 'Unmatched Bulk deposits', impact: 10, trend: 'down' }
            ],
            recommended_actions: [
                { action: 'Trigger Manual ERA Fetch', type: 'primary', icon: 'sync' },
                { action: 'Review Unposted Cash Bucket', type: 'secondary', icon: 'account_balance_wallet' },
                { action: 'Contact Payer Rep (Jane D.)', type: 'tertiary', icon: 'phone' }
            ],
            history_link: [
                { date: '2023-09-15', event: 'Similar delay resolved in 36h' },
                { date: '2023-08-10', event: 'Recurring pattern detected' }
            ],
            related_transactions: [
                { id: 'TXN-984210', date: '2023-10-22', amount: 14240.00, predicted_date: '2023-10-20', variance: '+2 Days', status: 'Pending' },
                { id: 'TXN-984212', date: '2023-10-22', amount: 5600.50, predicted_date: '2023-10-20', variance: '+2 Days', status: 'Pending' },
                { id: 'TXN-984218', date: '2023-10-22', amount: 3200.00, predicted_date: '2023-10-20', variance: '+2 Days', status: 'Pending' },
                { id: 'TXN-984225', date: '2023-10-23', amount: 1100.00, predicted_date: '2023-10-21', variance: '+2 Days', status: 'Ack Received' },
                { id: 'TXN-984231', date: '2023-10-23', amount: 9450.00, predicted_date: '2023-10-21', variance: '+2 Days', status: 'Pending' }
            ]
        },
        {
            id: 'INS-2023-002',
            date: '2023-10-12',
            type: 'alert',
            severity: 'medium',
            title: 'Coding Denial Spike',
            message: '5% drop in posted reimbursement correlated with new NCCI edit updates. 15 claims triggered Code 16.',
            root_cause_analysis: "New NCCI edits implemented on Oct 1st are causing a spike in Code 16 (Claim/Service lacks information) denials for CPT 99213/99214 when billed with modifier 25.",
            confidence_score: 88,
            impact_value: "-$125,000",
            prediction_window: "Next 7 Days",
            contributing_factors: [
                { factor: 'NCCI Edit Update (Q4)', impact: 80, trend: 'up' },
                { factor: 'Documentation Gaps', impact: 20, trend: 'flat' }
            ],
            recommended_actions: [
                { action: 'Update Scrubbing Rules', type: 'primary', icon: 'tune' },
                { action: 'Educate Coding Team', type: 'secondary', icon: 'group' }
            ],
            history_link: [],
            related_transactions: []
        },
        {
            id: 'INS-2023-003',
            date: '2023-10-26',
            type: 'prediction',
            severity: 'info',
            title: 'Month-End Surge',
            message: 'AI predicts a 15% increase in bank credits over the next 3 days based on end-of-month payer cycles.',
            confidence_score: 75,
            impact_value: "+$450,000",
            root_cause_analysis: "End-of-month processing cycles for major payers (BCBS, Aetna) typically result in higher deposit volumes.",
            related_transactions: []
        }
    ],

    // 3. Transactions for Drill-Through (Enhanced with Lifecycle)
    transactions: [
        {
            id: 'TXN-984210',
            date: '2023-10-22',
            payer: 'Medicare Part B',
            amount: 14240.00,
            status_gap: 'EHR Only',
            variance_reason: 'Clearinghouse Delay',
            status: 'Pending',
            provider: 'Dr. Sarah Smith',
            patient: 'John Doe (DOB: 01/15/1980)',
            lifecycle_events: [
                { date: '2023-10-22 08:30 AM', source: 'EHR', event: 'Claim Generated', status: 'Success', detail: 'Batch #4021 created.' },
                { date: '2023-10-22 09:15 AM', source: 'Clearinghouse', event: 'Received', status: 'Success', detail: 'Accepted for processing.' },
                { date: '2023-10-23 10:00 AM', source: 'Payer', event: 'Ack Pending', status: 'Delayed', detail: 'No 277CA response received > 24hrs.' }
            ]
        },
        {
            id: 'TXN-984215',
            date: '2023-10-21',
            payer: 'Aetna PPO',
            amount: 8950.00,
            status_gap: 'Bank Only',
            variance_reason: 'Unposted Payment',
            status: 'Unreconciled',
            provider: 'Dr. Michael Jones',
            patient: 'Emily Blunt (DOB: 05/20/1992)',
            lifecycle_events: [
                { date: '2023-10-21 02:00 PM', source: 'Bank', event: 'Deposit Received', status: 'Success', detail: 'Wire Transfer #998877.' },
                { date: '2023-10-21 02:05 PM', source: 'RCM Pulse', event: 'Auto-Match Attempt', status: 'Failed', detail: 'No matching Claim ID found in open AR.' }
            ]
        },
        // ... (Include other transactions with similar detail if needed, keeping it concise for now)
    ],

    // 4. Scenarios for Forecasting
    scenarios: {
        baseline: [ /* Uses the default forecastTrend data */],
        optimistic: [
            { date: '2023-10-27', predicted: 6800 },
            { date: '2023-10-28', predicted: 4000 },
            { date: '2023-10-29', predicted: 3500 },
            { date: '2023-10-30', predicted: 7200 },
        ],
        pessimistic: [
            { date: '2023-10-27', predicted: 5800 },
            { date: '2023-10-28', predicted: 3000 },
            { date: '2023-10-29', predicted: 2500 },
            { date: '2023-10-30', predicted: 6000 },
        ]
    }
};
