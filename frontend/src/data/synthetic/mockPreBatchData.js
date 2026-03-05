import users from './users.json';

export const mockPreBatchData = {
    // 1. Dashboard Metrics
    metrics: {
        totalClaims: 142,
        passRate: 78, // %
        autoFixRate: 45, // % eligible claims that were auto-fixed
        denialsPreventedValue: 125000,
        batchReadiness: 82, // %
        statusBreakdown: {
            passed: 98,
            autoFixed: 24,
            reviewRequired: 15,
            blocked: 5
        },
        errorCategories: [
            { id: 'coding', label: 'Coding Errors', count: 12, color: 'bg-red-500' },
            { id: 'eligibility', label: 'Eligibility', count: 8, color: 'bg-orange-500' },
            { id: 'auth', label: 'Authorization', count: 5, color: 'bg-amber-500' },
            { id: 'compliance', label: 'Compliance (NCCI)', count: 3, color: 'bg-blue-500' }
        ]
    },

    // 2. Validation Rules Schema
    rules: [
        { id: 'R-001', name: 'Modifier Conflict', category: 'Coding', severity: 'High', autoFixAvailable: true },
        { id: 'R-002', name: 'Missing Diagnosis', category: 'Clinical', severity: 'Critical', autoFixAvailable: true },
        { id: 'R-003', name: 'Inactive Coverage', category: 'Eligibility', severity: 'Critical', autoFixAvailable: false },
        { id: 'R-004', name: 'Authorization Required', category: 'Auth', severity: 'High', autoFixAvailable: false }
    ],

    // 3. Claims Queue
    claims: [
        {
            id: 'CLM-2024-001',
            patient: 'Sarah Jenkins',
            payer: 'Aetna Commercial',
            dos: '2024-10-12',
            amount: 450.00,
            status: 'Review Required', // Passed, Auto-Fixed, Review Required, Blocked
            severity: 'High',
            issues: [
                {
                    id: 'ISS-001',
                    ruleId: 'R-001',
                    type: 'Coding',
                    message: 'Incompatible Modifier -25 on 99213',
                    autoFixAvailable: true,
                    suggestedFix: 'Remove Modifier -25',
                    confidenceScore: 0.92
                }
            ],
            confidenceScore: 0.65,
            batchReady: false
        },
        {
            id: 'CLM-2024-002',
            patient: 'Michael Chen',
            payer: 'Medicare',
            dos: '2024-10-11',
            amount: 125.00,
            status: 'Auto-Fixed',
            severity: 'Medium',
            issues: [
                {
                    id: 'ISS-002',
                    ruleId: 'R-002',
                    type: 'Clinical',
                    message: 'Missing Z-code for preventative visit',
                    autoFixAvailable: true,
                    suggestedFix: 'Add Z00.00',
                    confidenceScore: 0.98,
                    applied: true
                }
            ],
            confidenceScore: 0.99,
            batchReady: true
        },
        {
            id: 'CLM-2024-003',
            patient: 'David Miller',
            payer: 'BCBS',
            dos: '2024-10-13',
            amount: 2500.00,
            status: 'Blocked',
            severity: 'Critical',
            issues: [
                {
                    id: 'ISS-003',
                    ruleId: 'R-003',
                    type: 'Eligibility',
                    message: 'Coverage Terminated on 2024-09-30',
                    autoFixAvailable: false,
                    suggestedFix: null,
                    confidenceScore: 1.0
                }
            ],
            confidenceScore: 0.0,
            batchReady: false
        },
        {
            id: 'CLM-2024-004',
            patient: 'Emma Wilson',
            payer: 'UHC',
            dos: '2024-10-14',
            amount: 150.00,
            status: 'Passed',
            severity: 'Low',
            issues: [],
            confidenceScore: 1.0,
            batchReady: true
        },
        // ... more suggested claims
        {
            id: 'CLM-2024-005',
            patient: 'James Rodriguez',
            payer: 'Cigna',
            dos: '2024-10-10',
            amount: 325.00,
            status: 'Review Required',
            severity: 'Medium',
            issues: [
                {
                    id: 'ISS-004',
                    ruleId: 'R-004',
                    type: 'Auth',
                    message: 'Missing Prior Auth Number',
                    autoFixAvailable: false,
                    suggestedFix: null,
                    confidenceScore: 0.8
                }
            ],
            confidenceScore: 0.45,
            batchReady: false
        }
    ]
};
