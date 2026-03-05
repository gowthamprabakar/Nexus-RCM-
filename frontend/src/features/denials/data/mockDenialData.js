export const mockDenialData = {
    // 1. Executive Monitoring - Differential Dials
    differentialDials: [
        {
            id: 'dial-1',
            category: 'Authorization',
            value: 8.4,
            benchmark: 4.5,
            trend: 'up', // 'up' means rising (bad for denial rate)
            status: 'critical',
            description: 'Prior Auth & Pre-cert',
            history: [6.2, 6.8, 7.5, 8.4]
        },
        {
            id: 'dial-2',
            category: 'Eligibility',
            value: 3.2,
            benchmark: 3.0,
            trend: 'down',
            status: 'good',
            description: 'Coverage Active/Terminated',
            history: [4.1, 3.8, 3.5, 3.2]
        },
        {
            id: 'dial-3',
            category: 'Coding',
            value: 5.8,
            benchmark: 2.5,
            trend: 'up',
            status: 'warning',
            description: 'Bundling & Medical Necessity',
            history: [4.2, 4.5, 5.1, 5.8]
        },
        {
            id: 'dial-4',
            category: 'COB',
            value: 2.1,
            benchmark: 2.0,
            trend: 'flat',
            status: 'good',
            description: 'Coordination of Benefits',
            history: [2.1, 2.0, 2.1, 2.1]
        },
        {
            id: 'dial-5',
            category: 'EVV',
            value: 6.5,
            benchmark: 1.0,
            trend: 'up',
            status: 'critical',
            description: 'Electronic Visit Verification',
            history: [2.5, 3.8, 5.2, 6.5]
        }
    ],

    // 2. Denial Trends (12 Months)
    denialTrends: [
        { month: 'Jan', overall: 4.2, uhc: 3.8, bcbs: 4.5, aetna: 3.2, industry: 4.0 },
        { month: 'Feb', overall: 4.5, uhc: 4.1, bcbs: 4.8, aetna: 3.5, industry: 4.0 },
        { month: 'Mar', overall: 4.3, uhc: 3.9, bcbs: 4.6, aetna: 3.3, industry: 4.0 },
        { month: 'Apr', overall: 4.8, uhc: 4.5, bcbs: 5.2, aetna: 3.8, industry: 4.1 },
        { month: 'May', overall: 5.1, uhc: 4.8, bcbs: 5.5, aetna: 4.1, industry: 4.1 },
        { month: 'Jun', overall: 5.4, uhc: 5.2, bcbs: 5.9, aetna: 4.4, industry: 4.2 },
        { month: 'Jul', overall: 5.2, uhc: 5.0, bcbs: 5.7, aetna: 4.2, industry: 4.2 },
        { month: 'Aug', overall: 5.0, uhc: 4.7, bcbs: 5.5, aetna: 4.0, industry: 4.2 },
        { month: 'Sep', overall: 5.3, uhc: 5.1, bcbs: 5.8, aetna: 4.3, industry: 4.3 },
        { month: 'Oct', overall: 5.6, uhc: 5.4, bcbs: 6.2, aetna: 4.6, industry: 4.3 },
        { month: 'Nov', overall: 5.8, uhc: 5.6, bcbs: 6.5, aetna: 4.8, industry: 4.3 },
        { month: 'Dec', overall: 5.5, uhc: 5.3, bcbs: 6.1, aetna: 4.5, industry: 4.3 }
    ],

    // 3. AI Intelligence - High Risk Claims (Universal Drill-Down Supported)
    highRiskClaims: Array.from({ length: 50 }, (_, i) => {
        const payers = ['UnitedHealthcare', 'Blue Cross Blue Shield', 'Aetna', 'Cigna', 'Medicare'];
        const categories = ['Authorization', 'Eligibility', 'Coding', 'COB', 'EVV'];

        // Randomly assign a primary category for this claim
        const category = categories[Math.floor(Math.random() * categories.length)];

        const facilities = ['Main Hospital', 'Downtown Clinic', 'Surgery Center', 'Home Health Div'];
        const riskBase = Math.floor(Math.random() * 60) + 40; // 40-100 base

        // Generate Line Items based on Category
        let lineItems = [];
        let topFactor = '';
        let factors = [];
        let automatedAction = '';

        switch (category) {
            case 'Authorization':
                topFactor = 'Missing Prior Authorization';
                factors = [
                    { name: 'Missing Prior Authorization', impact: 'High', weight: 50 },
                    { name: 'Service exceeds approved units', impact: 'Medium', weight: 30 }
                ];
                automatedAction = 'Initiate Retro-Auth';
                lineItems = [
                    { code: '99214', description: 'Office Visit, Level 4', amount: 180, risk: 'Low', issue: null },
                    { code: '73721', description: 'MRI Lower Extremity', amount: 850, risk: 'High', issue: 'No Auth on File' }
                ];
                break;
            case 'Coding':
                topFactor = 'Incorrect Modifier';
                factors = [
                    { name: 'Missing Modifier 25', impact: 'High', weight: 45 },
                    { name: 'CCI Edit - Bundling', impact: 'Medium', weight: 25 }
                ];
                automatedAction = 'Apply Modifier 25';
                lineItems = [
                    { code: '99213', description: 'Office Visit, Level 3', amount: 120, risk: 'High', issue: 'Missing Mod 25' },
                    { code: '20610', description: 'Arthrocentesis, Major', amount: 150, risk: 'Low', issue: null }
                ];
                break;
            case 'EVV':
                topFactor = 'GPS Location Mismatch';
                factors = [
                    { name: 'GPS Mismatch (>500ft)', impact: 'High', weight: 60 },
                    { name: 'Manual Entry', impact: 'Medium', weight: 20 }
                ];
                automatedAction = 'Geolocation Override';
                lineItems = [
                    { code: 'T1019', description: 'Personal Care Services', amount: 120, risk: 'High', issue: 'GPS: 0.5mi variance' }
                ];
                break;
            case 'Eligibility':
                topFactor = 'Coverage Terminated';
                factors = [
                    { name: 'Coverage Inactive on DOS', impact: 'High', weight: 80 }
                ];
                automatedAction = 'Verify & Update Coverage';
                lineItems = [
                    { code: '99203', description: 'Office Visit, New', amount: 200, risk: 'High', issue: 'Patient Inactive' }
                ];
                break;
            default: // COB
                topFactor = 'Primary Payer Mismatch';
                factors = [{ name: 'Other Insurance Found', impact: 'High', weight: 50 }];
                automatedAction = 'Re-order Payers';
                lineItems = [
                    { code: '99213', description: 'Office Visit', amount: 120, risk: 'Medium', issue: 'Bill Secondary?' }
                ];
        }

        return {
            id: `CLM-${2024000 + i}`,
            patient: `Patient ${i + 1}`,
            mrn: `MRN-${1000 + i}`,
            payer: payers[Math.floor(Math.random() * payers.length)],
            facility: facilities[Math.floor(Math.random() * facilities.length)],
            serviceDate: `2024-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
            amount: lineItems.reduce((sum, item) => sum + item.amount, 0),
            riskScore: riskBase,
            category: category,
            topFactor: topFactor,
            factors: factors,
            lineItems: lineItems,
            automatedAction: automatedAction,
            status: 'Predicted',
            preventable: true
        };
    }).sort((a, b) => b.riskScore - a.riskScore),

    // 4. Automation Scenarios (The "Brain" of the prevention system)
    automationScenarios: {
        'Authorization': {
            actionName: 'Initiate Retro-Auth',
            description: 'AI will generate a retro-authorization request form attached with clinical notes.',
            timeSaved: '45 mins',
            probabilitySuccess: '85%'
        },
        'Coding': {
            actionName: 'Apply Modifier 25',
            description: 'AI detected separate E&M service. Modifier 25 will be appended to the E&M code.',
            timeSaved: '15 mins',
            probabilitySuccess: '98%'
        },
        'EVV': {
            actionName: 'Geolocation Override',
            description: 'Route to supervisor for "Force Match" approval based on patient history.',
            timeSaved: '30 mins',
            probabilitySuccess: '70%'
        },
        'Eligibility': {
            actionName: 'Verify & Update Coverage',
            description: 'RPA bot checks all major payer portals for active coverage on DOS.',
            timeSaved: '20 mins',
            probabilitySuccess: '95%'
        },
        'COB': {
            actionName: 'Re-order Payers',
            description: 'Update coordination of benefits sequence based on real-time eligibility check.',
            timeSaved: '25 mins',
            probabilitySuccess: '90%'
        }
    },
    // 5. Automation Queues & Stats
    evvStats: {
        activeRetries: 142,
        successRate24h: 94.5,
        revenueRecovered: 125000,
        avgRetryCount: 1.8
    },
    evvQueue: Array.from({ length: 15 }, (_, i) => ({
        id: `EVV-${8000 + i}`,
        claimId: `CLM-${2024000 + i}`,
        serviceDate: `2024-02-${String(Math.floor(Math.random() * 15) + 1).padStart(2, '0')}`,
        patient: `Patient ${i + 100}`,
        failureReason: ['GPS Mismatch', 'Missing Checkout', 'Caregiver Signature', 'Visit Duration Variance'][Math.floor(Math.random() * 4)],
        retryCount: Math.floor(Math.random() * 4) + 1,
        maxRetries: 5,
        nextRetryAt: new Date(Date.now() + Math.random() * 10000000).toLocaleString(),
        status: ['Pending', 'Retrying', 'Failed', 'Success'][Math.floor(Math.random() * 3)], // Mostly active states
        automationEnabled: true
    })),

    cobStats: {
        conflictsDetected: 85,
        autoResolved: 62,
        pendingReview: 18,
        estDenialsPrevented: 45000
    },
    cobConflicts: Array.from({ length: 12 }, (_, i) => ({
        id: `COB-${9000 + i}`,
        claimId: `CLM-${2025000 + i}`,
        patient: `Patient ${i + 200}`,
        currentOrder: 'Medicare → BCBS',
        suggestedOrder: 'BCBS → Medicare',
        confidenceScore: Math.floor(Math.random() * 15) + 85, // 85-99
        conflictType: ['Primary Payer Mismatch', 'Missing Secondary', 'Duplicate Coverage'][Math.floor(Math.random() * 3)],
        autoFixEligible: true,
        status: 'Pending Review'
    }))
};
