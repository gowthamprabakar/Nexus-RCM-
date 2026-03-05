// Enhanced mock data for AR Dashboard

// KPI Metrics
const kpis = {
    totalARBalance: {
        current: 12450200,
        previous: 12100000,
        change: 2.4,
        trend: 'up'
    },
    avgDaysOutstanding: {
        current: 42,
        previous: 40.7,
        change: 3.1,
        target: 35,
        trend: 'up'
    },
    projected30DCash: {
        current: 4200000,
        confidence: 94,
        status: 'on-track'
    },
    aiRiskFlagged: {
        count: 184,
        potentialLoss: 640000,
        severity: 'high'
    }
};

// 12-month AR Trend Data
const arTrend = [
    { month: 'Jan', balance: 11200000, collected: 3800000, outstanding: 7400000 },
    { month: 'Feb', balance: 11450000, collected: 3950000, outstanding: 7500000 },
    { month: 'Mar', balance: 11800000, collected: 4100000, outstanding: 7700000 },
    { month: 'Apr', balance: 11950000, collected: 4050000, outstanding: 7900000 },
    { month: 'May', balance: 12100000, collected: 4200000, outstanding: 7900000 },
    { month: 'Jun', balance: 12250000, collected: 4300000, outstanding: 7950000 },
    { month: 'Jul', balance: 12350000, collected: 4250000, outstanding: 8100000 },
    { month: 'Aug', balance: 12200000, collected: 4400000, outstanding: 7800000 },
    { month: 'Sep', balance: 12400000, collected: 4350000, outstanding: 8050000 },
    { month: 'Oct', balance: 12300000, collected: 4500000, outstanding: 7800000 },
    { month: 'Nov', balance: 12100000, collected: 4600000, outstanding: 7500000 },
    { month: 'Dec', balance: 12450200, collected: 4550000, outstanding: 7900200 }
];

// Aging Buckets with detailed data
const agingBuckets = [
    {
        bucket: '0-30d',
        balance: 6200000,
        claimCount: 520,
        collectability: 98,
        color: '#10b981',
        claims: [
            { id: 'CLM-10001', patient: 'John Doe', payer: 'Medicare', balance: 12500, dos: '2024-01-15', status: 'In Process' },
            { id: 'CLM-10002', patient: 'Jane Smith', payer: 'Aetna', balance: 8900, dos: '2024-01-18', status: 'Pending' },
            { id: 'CLM-10003', patient: 'Bob Johnson', payer: 'BCBS', balance: 15200, dos: '2024-01-20', status: 'Follow-up' },
            { id: 'CLM-10004', patient: 'Alice Brown', payer: 'United Health', balance: 6750, dos: '2024-01-22', status: 'Pending' },
            { id: 'CLM-10005', patient: 'Charlie Wilson', payer: 'Medicare', balance: 11300, dos: '2024-01-25', status: 'In Process' }
        ]
    },
    {
        bucket: '31-60d',
        balance: 3100000,
        claimCount: 280,
        collectability: 85,
        color: '#f59e0b',
        claims: []
    },
    {
        bucket: '61-90d',
        balance: 1900000,
        claimCount: 165,
        collectability: 60,
        color: '#f97316',
        claims: []
    },
    {
        bucket: '90+d',
        balance: 1250200,
        claimCount: 95,
        collectability: 32,
        color: '#ef4444',
        claims: []
    }
];

// Collection Velocity by Payer
const collectionVelocity = [
    { payer: 'Medicare', days: 24, avgBalance: 850000, performance: 'excellent', color: '#10b981' },
    { payer: 'Aetna', days: 32, avgBalance: 620000, performance: 'good', color: '#10b981' },
    { payer: 'BCBS', days: 48, avgBalance: 540000, performance: 'fair', color: '#f59e0b' },
    { payer: 'United Health', days: 54, avgBalance: 480000, performance: 'poor', color: '#f97316' },
    { payer: 'Cigna', days: 61, avgBalance: 390000, performance: 'critical', color: '#ef4444' },
    { payer: 'Humana', days: 38, avgBalance: 320000, performance: 'good', color: '#10b981' },
    { payer: 'Tricare', days: 28, avgBalance: 280000, performance: 'excellent', color: '#10b981' }
];

// Payer Treemap Data
const payerTreemap = [
    { name: 'Medicare Advantage', value: 3800000, percentage: 30.5, color: '#135bec' },
    { name: 'BCBS Texas', value: 1400000, percentage: 11.2, color: '#64748b' },
    { name: 'Aetna National', value: 1200000, percentage: 9.6, color: '#64748b' },
    { name: 'Cigna', value: 920000, percentage: 7.4, color: '#64748b' },
    { name: 'United Health', value: 840000, percentage: 6.7, color: '#64748b' },
    { name: 'Humana', value: 720000, percentage: 5.8, color: '#64748b' },
    { name: 'Others', value: 3570200, percentage: 28.8, color: '#e2e8f0' }
];

// AI Insights
const aiInsights = [
    {
        id: 1,
        title: 'High-Risk Claims Concentration',
        description: 'BCBS Texas has 34% of claims in 90+ day bucket, suggesting systematic issue.',
        impact: 'high',
        confidence: 92,
        recommendation: 'Schedule escalation call with BCBS rep to address processing delays',
        potentialRecovery: 480000,
        category: 'payer-relationship'
    },
    {
        id: 2,
        title: 'Authorization Pattern Detected',
        description: 'United Health claims with missing auth codes have 78% denial rate.',
        impact: 'high',
        confidence: 88,
        recommendation: 'Implement pre-submission auth verification workflow',
        potentialRecovery: 320000,
        category: 'process-improvement'
    },
    {
        id: 3,
        title: 'Seasonal Collection Opportunity',
        description: 'Q1 historically shows 15% faster Medicare collections.',
        impact: 'medium',
        confidence: 85,
        recommendation: 'Prioritize Medicare follow-ups in next 30 days',
        potentialRecovery: 180000,
        category: 'timing'
    },
    {
        id: 4,
        title: 'Coding Accuracy Improvement',
        description: '12% of denials are due to incorrect modifier usage on surgical claims.',
        impact: 'medium',
        confidence: 91,
        recommendation: 'Provide targeted training to coding team on modifier 59 usage',
        potentialRecovery: 145000,
        category: 'training'
    }
];

// High-Risk Worklist
const highRiskClaims = [
    {
        id: 'CLM-90284',
        payer: 'Medicare',
        payerCode: 'MC',
        balance: 42350,
        aging: 94,
        agingBucket: '90+',
        riskScore: 92,
        riskLevel: 'critical',
        nextAction: 'Submit Clinical Appeal',
        dos: '2023-10-15',
        patient: 'John Smith',
        cpt: '99285'
    },
    {
        id: 'CLM-88122',
        payer: 'BCBS TX',
        payerCode: 'BC',
        balance: 18120.50,
        aging: 72,
        agingBucket: '61-90',
        riskScore: 74,
        riskLevel: 'high',
        nextAction: 'Verify Authorization',
        dos: '2023-11-02',
        patient: 'Sarah Johnson',
        cpt: '27447'
    },
    {
        id: 'CLM-91203',
        payer: 'United Health',
        payerCode: 'UN',
        balance: 12400,
        aging: 45,
        agingBucket: '31-60',
        riskScore: 48,
        riskLevel: 'medium',
        nextAction: 'Payer Status Call',
        dos: '2023-12-05',
        patient: 'Michael Brown',
        cpt: '43239'
    },
    {
        id: 'CLM-90041',
        payer: 'Medicare',
        payerCode: 'MC',
        balance: 8900,
        aging: 112,
        agingBucket: '90+',
        riskScore: 88,
        riskLevel: 'critical',
        nextAction: 'Legal Demand Letter',
        dos: '2023-09-28',
        patient: 'Emily Davis',
        cpt: '99223'
    }
];

// Denial Reasons Breakdown
const denialReasons = [
    { reason: 'Missing Authorization', count: 145, amount: 425000, percentage: 28 },
    { reason: 'Coding Error', count: 112, amount: 320000, percentage: 22 },
    { reason: 'Timely Filing', count: 98, amount: 285000, percentage: 19 },
    { reason: 'Medical Necessity', count: 87, amount: 245000, percentage: 17 },
    { reason: 'Duplicate Claim', count: 56, amount: 180000, percentage: 11 },
    { reason: 'Other', count: 24, amount: 65000, percentage: 3 }
];

// Payment Method Distribution
const paymentDistribution = [
    { method: 'Commercial Insurance', amount: 4200000, percentage: 42, color: '#3b82f6' },
    { method: 'Medicare', amount: 3100000, percentage: 31, color: '#10b981' },
    { method: 'Medicaid', amount: 1500000, percentage: 15, color: '#f59e0b' },
    { method: 'Patient Pay', amount: 800000, percentage: 8, color: '#8b5cf6' },
    { method: 'Other', amount: 400000, percentage: 4, color: '#64748b' }
];

// Top CPT Codes by Revenue
const topCPTCodes = [
    { code: '99285', description: 'Emergency Dept Visit', revenue: 1250000, volume: 850, avgReimbursement: 1470 },
    { code: '27447', description: 'Total Knee Replacement', revenue: 980000, volume: 45, avgReimbursement: 21778 },
    { code: '99214', description: 'Office Visit Established', revenue: 875000, volume: 1250, avgReimbursement: 700 },
    { code: '43239', description: 'Upper GI Endoscopy', revenue: 720000, volume: 320, avgReimbursement: 2250 },
    { code: '93000', description: 'Electrocardiogram', revenue: 580000, volume: 2900, avgReimbursement: 200 },
    { code: '70450', description: 'CT Head/Brain', revenue: 520000, volume: 280, avgReimbursement: 1857 }
];

// Account Details Mock Data
const accountDetails = {
    accountId: 'ACC-90284',
    claimId: 'CLM-90284',
    patient: {
        name: 'John Smith',
        mrn: 'MRN-882',
        dob: '1965-03-15',
        age: 58,
        phone: '(555) 123-4567',
        email: 'john.smith@email.com',
        address: '123 Main St, Austin, TX 78701',
        ssn: '***-**-4567'
    },
    balance: {
        total: 42350,
        insurance: 38150,
        patient: 4200,
        aging: {
            '0-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 42350
        }
    },
    payer: {
        name: 'Medicare',
        id: 'MC001',
        phone: '1-800-MEDICARE',
        fax: '1-800-XXX-XXXX',
        claimAddress: 'P.O. Box 6500, Medicare Claims, Austin, TX 78714',
        contactPerson: 'Claims Department',
        policyNumber: 'MC-882-2024-001'
    },
    riskScore: 92,
    propensityScore: 68,
    daysInAR: 94,
    lastContactDate: '2024-01-10',
    nextFollowUpDate: '2024-01-20',
    assignedTo: 'Sarah Johnson',
    status: 'In Collections',
    claims: [
        {
            claimId: 'CLM-90284',
            dos: '2023-10-15',
            provider: 'Dr. Emily Chen',
            cpt: '99285',
            description: 'Emergency Department Visit - High Complexity',
            chargedAmount: 42350,
            allowedAmount: 38150,
            paidAmount: 0,
            balance: 42350,
            status: 'Denied',
            denialReason: 'Medical Necessity',
            denialCode: 'CO-50'
        }
    ],
    aiInsights: [
        {
            type: 'recommendation',
            priority: 'high',
            message: 'Submit clinical appeal with supporting documentation. Historical success rate: 78%',
            confidence: 92
        },
        {
            type: 'timing',
            priority: 'medium',
            message: 'Best time to contact Medicare: Tuesdays 9-11 AM CST',
            confidence: 85
        }
    ]
};

// Activity Timeline Mock Data
const activityTimeline = [
    {
        id: 'ACT-001',
        accountId: 'ACC-90284',
        timestamp: '2024-01-15T14:30:00Z',
        type: 'call',
        action: 'Outbound Call',
        outcome: 'Left Voicemail',
        user: 'Sarah Johnson',
        notes: 'Called Medicare claims line. Left detailed voicemail requesting status update on denied claim CLM-90284.',
        duration: '2m 15s'
    },
    {
        id: 'ACT-002',
        accountId: 'ACC-90284',
        timestamp: '2024-01-12T10:15:00Z',
        type: 'email',
        action: 'Email Sent',
        outcome: 'Sent',
        user: 'Sarah Johnson',
        notes: 'Sent appeal request email with clinical documentation attached.',
        attachments: ['clinical_notes.pdf', 'lab_results.pdf']
    },
    {
        id: 'ACT-003',
        accountId: 'ACC-90284',
        timestamp: '2024-01-10T09:00:00Z',
        type: 'status_change',
        action: 'Status Updated',
        outcome: 'Updated',
        user: 'System',
        notes: 'Status changed from "Pending Review" to "In Collections"',
        oldStatus: 'Pending Review',
        newStatus: 'In Collections'
    },
    {
        id: 'ACT-004',
        accountId: 'ACC-90284',
        timestamp: '2024-01-08T16:45:00Z',
        type: 'call',
        action: 'Inbound Call',
        outcome: 'Spoke with Rep',
        user: 'Sarah Johnson',
        notes: 'Spoke with Medicare rep (ID: MC-4521). Confirmed denial reason: Medical Necessity. Rep advised to submit clinical appeal with supporting documentation within 30 days.',
        duration: '8m 42s'
    },
    {
        id: 'ACT-005',
        accountId: 'ACC-90284',
        timestamp: '2024-01-05T11:20:00Z',
        type: 'note',
        action: 'Note Added',
        outcome: 'Added',
        user: 'Michael Brown',
        notes: 'Reviewed claim details. Denial appears to be due to incomplete documentation. Recommend gathering all clinical notes and lab results before appeal.'
    }
];

// Documents Mock Data
const documents = [
    {
        id: 'DOC-001',
        accountId: 'ACC-90284',
        name: 'EOB_CLM-90284.pdf',
        type: 'EOB',
        uploadedBy: 'System',
        uploadedAt: '2023-11-15T08:00:00Z',
        size: '245 KB',
        url: '#'
    },
    {
        id: 'DOC-002',
        accountId: 'ACC-90284',
        name: 'Clinical_Notes_10-15-2023.pdf',
        type: 'Clinical Documentation',
        uploadedBy: 'Sarah Johnson',
        uploadedAt: '2024-01-12T10:00:00Z',
        size: '1.2 MB',
        url: '#'
    },
    {
        id: 'DOC-003',
        accountId: 'ACC-90284',
        name: 'Lab_Results_10-15-2023.pdf',
        type: 'Lab Results',
        uploadedBy: 'Sarah Johnson',
        uploadedAt: '2024-01-12T10:05:00Z',
        size: '856 KB',
        url: '#'
    },
    {
        id: 'DOC-004',
        accountId: 'ACC-90284',
        name: 'Appeal_Letter_Draft.docx',
        type: 'Correspondence',
        uploadedBy: 'Sarah Johnson',
        uploadedAt: '2024-01-14T14:30:00Z',
        size: '42 KB',
        url: '#'
    }
];

// Alerts & Follow-up Queue Mock Data
const alerts = [
    {
        id: 'ALT-001',
        type: 'overdue_followup',
        priority: 'high',
        accountId: 'ACC-90284',
        claimId: 'CLM-90284',
        patient: 'John Smith',
        mrn: 'MRN-882',
        message: 'Follow-up call scheduled 3 days ago not completed',
        daysOverdue: 3,
        assignedTo: 'Sarah Johnson',
        createdAt: '2024-01-10T09:00:00Z',
        dueDate: '2024-01-17T17:00:00Z',
        balance: 42350,
        resolved: false
    },
    {
        id: 'ALT-002',
        type: 'sla_breach',
        priority: 'critical',
        accountId: 'ACC-88122',
        claimId: 'CLM-88122',
        patient: 'Sarah Johnson',
        mrn: 'MRN-104',
        message: 'Account in 90+ bucket exceeds SLA threshold (30 days)',
        daysOverdue: 18,
        assignedTo: 'Michael Brown',
        createdAt: '2024-01-05T08:00:00Z',
        dueDate: '2024-01-15T17:00:00Z',
        balance: 18120.50,
        resolved: false
    },
    {
        id: 'ALT-003',
        type: 'high_risk',
        priority: 'high',
        accountId: 'ACC-91203',
        claimId: 'CLM-91203',
        patient: 'Michael Brown',
        mrn: 'MRN-923',
        message: 'AI risk score increased from 45 to 78 - immediate attention required',
        daysOverdue: 0,
        assignedTo: 'Sarah Johnson',
        createdAt: '2024-01-16T12:00:00Z',
        dueDate: '2024-01-18T17:00:00Z',
        balance: 12400,
        resolved: false
    },
    {
        id: 'ALT-004',
        type: 'payment_promise',
        priority: 'medium',
        accountId: 'ACC-90041',
        claimId: 'CLM-90041',
        patient: 'Emily Davis',
        mrn: 'MRN-211',
        message: 'Payment promise of $2,500 due today',
        daysOverdue: 0,
        assignedTo: 'Michael Brown',
        createdAt: '2024-01-18T08:00:00Z',
        dueDate: '2024-01-18T17:00:00Z',
        balance: 8900,
        resolved: false,
        promiseAmount: 2500
    },
    {
        id: 'ALT-005',
        type: 'ai_triggered',
        priority: 'medium',
        accountId: 'ACC-10234',
        claimId: 'CLM-10234',
        patient: 'Robert Wilson',
        mrn: 'MRN-445',
        message: 'Payer pattern detected: BCBS typically pays similar claims within 45 days',
        daysOverdue: 0,
        assignedTo: 'Sarah Johnson',
        createdAt: '2024-01-17T10:30:00Z',
        dueDate: '2024-01-22T17:00:00Z',
        balance: 15600,
        resolved: false
    },
    {
        id: 'ALT-006',
        type: 'overdue_followup',
        priority: 'high',
        accountId: 'ACC-10567',
        claimId: 'CLM-10567',
        patient: 'Linda Martinez',
        mrn: 'MRN-789',
        message: 'No contact attempt in 14 days - account aging rapidly',
        daysOverdue: 7,
        assignedTo: 'Michael Brown',
        createdAt: '2024-01-04T09:00:00Z',
        dueDate: '2024-01-11T17:00:00Z',
        balance: 9850,
        resolved: false
    }
];

// ============================================
// PHASE 2: Intelligence & Analytics Mock Data
// ============================================

// Collections Strategy Recommendations
const strategyRecommendations = {
    accountId: 'ACC-90284',
    claimId: 'CLM-90284',
    recommendedAction: 'clinical_appeal',
    actionLabel: 'Submit Clinical Appeal',
    successProbability: 78,
    confidenceInterval: [72, 84],
    expectedRecovery: 29800,
    currentBalance: 42350,
    estimatedDays: 45,
    priority: 'high',

    similarAccounts: [
        {
            accountId: 'ACC-88291',
            payer: 'Medicare',
            denialReason: 'Medical Necessity',
            actionTaken: 'Clinical Appeal',
            outcome: 'Approved',
            recoveryAmount: 38500,
            daysToResolution: 42,
            successRate: 85
        },
        {
            accountId: 'ACC-77654',
            payer: 'Medicare',
            denialReason: 'Medical Necessity',
            actionTaken: 'Clinical Appeal',
            outcome: 'Approved',
            recoveryAmount: 31200,
            daysToResolution: 38,
            successRate: 82
        },
        {
            accountId: 'ACC-65432',
            payer: 'Medicare',
            denialReason: 'Medical Necessity',
            actionTaken: 'Clinical Appeal',
            outcome: 'Partial Approval',
            recoveryAmount: 22100,
            daysToResolution: 51,
            successRate: 65
        }
    ],

    payerIntelligence: {
        payerName: 'Medicare',
        responseRate: 0.82,
        avgResponseTime: 21, // days
        bestTimeToContact: {
            day: 'Tuesday',
            time: '10:00 AM - 12:00 PM EST'
        },
        preferredMethod: 'Phone',
        phoneNumber: '1-800-MEDICARE',
        commonDenialReasons: [
            { reason: 'Medical Necessity', frequency: 42, resolutionRate: 78 },
            { reason: 'Coding Error', frequency: 28, resolutionRate: 91 },
            { reason: 'Missing Documentation', frequency: 18, resolutionRate: 85 }
        ],
        paymentPatterns: {
            avgDaysToPayment: 28,
            onTimePaymentRate: 0.76,
            partialPaymentRate: 0.15
        }
    },

    actionPlan: [
        {
            step: 1,
            action: 'Gather Clinical Documentation',
            description: 'Collect physician notes, lab results, and treatment records',
            required: true,
            estimatedTime: '2 hours',
            documents: ['Physician Notes', 'Lab Results', 'Treatment Plan']
        },
        {
            step: 2,
            action: 'Review Medical Necessity Criteria',
            description: 'Verify procedure meets Medicare LCD/NCD guidelines',
            required: true,
            estimatedTime: '1 hour',
            documents: ['LCD Guidelines', 'NCD Policy']
        },
        {
            step: 3,
            action: 'Draft Appeal Letter',
            description: 'Use template MED-APPEAL-001 with clinical justification',
            required: true,
            estimatedTime: '1.5 hours',
            templateId: 'MED-APPEAL-001'
        },
        {
            step: 4,
            action: 'Submit via Payer Portal',
            description: 'Upload appeal package to Medicare portal',
            required: true,
            estimatedTime: '30 minutes',
            deadline: '30 days from denial date'
        },
        {
            step: 5,
            action: 'Follow-up Call',
            description: 'Contact Medicare at 14 days if no response',
            required: false,
            estimatedTime: '15 minutes',
            trigger: 'No response after 14 days'
        }
    ],

    riskFactors: [
        {
            factor: 'Account Aging',
            status: 'critical',
            impact: 'high',
            description: '94 days in A/R - approaching write-off threshold',
            recommendation: 'Expedite appeal submission'
        },
        {
            factor: 'Documentation Completeness',
            status: 'good',
            impact: 'low',
            description: 'All required clinical notes available',
            recommendation: 'No action needed'
        },
        {
            factor: 'Payer Responsiveness',
            status: 'moderate',
            impact: 'medium',
            description: 'Medicare response rate 82% - above average',
            recommendation: 'Follow standard timeline'
        },
        {
            factor: 'Historical Success Rate',
            status: 'good',
            impact: 'low',
            description: '78% success rate for similar appeals',
            recommendation: 'High confidence in approval'
        }
    ],

    templates: [
        {
            id: 'MED-APPEAL-001',
            name: 'Medicare Medical Necessity Appeal',
            category: 'Clinical Appeal',
            successRate: 81,
            usageCount: 247
        },
        {
            id: 'MED-APPEAL-002',
            name: 'Medicare Coding Correction',
            category: 'Technical Appeal',
            successRate: 93,
            usageCount: 189
        }
    ]
};

// Expected Recovery Insights
const recoveryInsights = {
    forecast: {
        '30d': {
            amount: 4200000,
            confidence: 94,
            variance: 2.3,
            lowEstimate: 4050000,
            highEstimate: 4350000,
            accountsExpected: 342
        },
        '60d': {
            amount: 7800000,
            confidence: 87,
            variance: 5.1,
            lowEstimate: 7400000,
            highEstimate: 8200000,
            accountsExpected: 628
        },
        '90d': {
            amount: 10500000,
            confidence: 78,
            variance: 8.7,
            lowEstimate: 9800000,
            highEstimate: 11200000,
            accountsExpected: 891
        }
    },

    forecastTrend: [
        { day: 1, amount: 145000, confidence: 98 },
        { day: 7, amount: 980000, confidence: 96 },
        { day: 14, amount: 1850000, confidence: 95 },
        { day: 21, amount: 2920000, confidence: 94 },
        { day: 30, amount: 4200000, confidence: 94 },
        { day: 45, amount: 6100000, confidence: 90 },
        { day: 60, amount: 7800000, confidence: 87 },
        { day: 75, amount: 9200000, confidence: 82 },
        { day: 90, amount: 10500000, confidence: 78 }
    ],

    scenarios: [
        {
            id: 'baseline',
            name: 'Baseline (Current Effort)',
            effortLevel: 'medium',
            resourceAllocation: 100,
            settlementRate: 0,
            forecast30d: 4200000,
            forecast60d: 7800000,
            forecast90d: 10500000,
            costs: 180000,
            netRecovery: 10320000,
            roi: 5733
        },
        {
            id: 'aggressive',
            name: 'Aggressive Collection',
            effortLevel: 'high',
            resourceAllocation: 150,
            settlementRate: 10,
            forecast30d: 5100000,
            forecast60d: 9200000,
            forecast90d: 11800000,
            costs: 270000,
            netRecovery: 11530000,
            roi: 4270
        },
        {
            id: 'conservative',
            name: 'Conservative Approach',
            effortLevel: 'low',
            resourceAllocation: 75,
            settlementRate: 5,
            forecast30d: 3400000,
            forecast60d: 6500000,
            forecast90d: 8900000,
            costs: 135000,
            netRecovery: 8765000,
            roi: 6493
        }
    ],

    segmentAnalysis: {
        byAgingBucket: [
            { bucket: '0-30d', balance: 6200000, recoveryProb: 0.92, expectedRecovery: 5704000 },
            { bucket: '31-60d', balance: 3100000, recoveryProb: 0.78, expectedRecovery: 2418000 },
            { bucket: '61-90d', balance: 1800000, recoveryProb: 0.58, expectedRecovery: 1044000 },
            { bucket: '90+d', balance: 1350200, recoveryProb: 0.32, expectedRecovery: 432064 }
        ],
        byPayer: [
            { payer: 'Medicare', balance: 4200000, recoveryProb: 0.85, expectedRecovery: 3570000 },
            { payer: 'Blue Cross', balance: 2800000, recoveryProb: 0.82, expectedRecovery: 2296000 },
            { payer: 'UnitedHealth', balance: 2100000, recoveryProb: 0.74, expectedRecovery: 1554000 },
            { payer: 'Aetna', balance: 1600000, recoveryProb: 0.79, expectedRecovery: 1264000 },
            { payer: 'Cigna', balance: 1200000, recoveryProb: 0.76, expectedRecovery: 912000 },
            { payer: 'Other', balance: 550200, recoveryProb: 0.68, expectedRecovery: 374136 }
        ],
        byBalanceRange: [
            { range: '$0-$1K', count: 892, balance: 445000, recoveryProb: 0.68, expectedRecovery: 302600 },
            { range: '$1K-$5K', count: 421, balance: 1260000, recoveryProb: 0.75, expectedRecovery: 945000 },
            { range: '$5K-$10K', count: 156, balance: 1170000, recoveryProb: 0.81, expectedRecovery: 947700 },
            { range: '$10K-$25K', count: 89, balance: 1580000, recoveryProb: 0.84, expectedRecovery: 1327200 },
            { range: '$25K+', count: 47, balance: 7995200, recoveryProb: 0.79, expectedRecovery: 6316308 }
        ]
    },

    roiMetrics: {
        totalInvestment: 180000,
        expectedRecovery: 10500000,
        netRecovery: 10320000,
        roi: 5733, // percentage
        breakEvenDays: 8,
        costPerAccount: 112.50,
        revenuePerAccount: 6562.50,
        efficiencyRatio: 58.33
    },

    topAccounts: [
        {
            accountId: 'ACC-90284',
            patient: 'John Smith',
            balance: 42350,
            recoveryProb: 0.68,
            expectedRecovery: 28798,
            effortScore: 7.2,
            roi: 256
        },
        {
            accountId: 'ACC-88122',
            patient: 'Sarah Johnson',
            balance: 18120,
            recoveryProb: 0.89,
            expectedRecovery: 16127,
            effortScore: 3.1,
            roi: 520
        },
        {
            accountId: 'ACC-77654',
            patient: 'Michael Davis',
            balance: 31200,
            recoveryProb: 0.75,
            expectedRecovery: 23400,
            effortScore: 5.8,
            roi: 403
        },
        {
            accountId: 'ACC-65432',
            patient: 'Emily Wilson',
            balance: 52800,
            recoveryProb: 0.62,
            expectedRecovery: 32736,
            effortScore: 8.9,
            roi: 368
        },
        {
            accountId: 'ACC-54321',
            patient: 'David Brown',
            balance: 28900,
            recoveryProb: 0.81,
            expectedRecovery: 23409,
            effortScore: 4.5,
            roi: 520
        }
    ]
};

// Propensity Score Details
const propensityDetails = {
    accountId: 'ACC-90284',
    claimId: 'CLM-90284',
    currentScore: 68,
    scoreLabel: 'Moderate Recovery Probability',
    confidence: 92,
    modelVersion: 'v2.3.1',
    calculatedAt: '2024-01-18T08:30:00Z',

    scoreHistory: [
        { date: '2023-12-15', score: 82, event: 'Initial Claim Submission' },
        { date: '2023-12-28', score: 78, event: 'Payer Initial Review' },
        { date: '2024-01-05', score: 72, event: 'Denial Received' },
        { date: '2024-01-12', score: 69, event: 'Account Aging Increased' },
        { date: '2024-01-18', score: 68, event: 'Current Score' }
    ],

    featureImportance: [
        {
            feature: 'Days in A/R',
            displayName: 'Account Age',
            value: 94,
            unit: 'days',
            impact: -15,
            importance: 0.28,
            description: 'Number of days since claim submission',
            benchmark: 42,
            status: 'critical'
        },
        {
            feature: 'Payer Response Rate',
            displayName: 'Payer Reliability',
            value: 0.82,
            unit: 'rate',
            impact: +8,
            importance: 0.22,
            description: 'Historical payer payment reliability',
            benchmark: 0.75,
            status: 'good'
        },
        {
            feature: 'Claim Amount',
            displayName: 'Balance Amount',
            value: 42350,
            unit: 'dollars',
            impact: +5,
            importance: 0.18,
            description: 'Total outstanding balance',
            benchmark: 25000,
            status: 'moderate'
        },
        {
            feature: 'Documentation Score',
            displayName: 'Documentation Quality',
            value: 0.91,
            unit: 'score',
            impact: +12,
            importance: 0.15,
            description: 'Completeness of clinical documentation',
            benchmark: 0.80,
            status: 'good'
        },
        {
            feature: 'Denial Type',
            displayName: 'Denial Category',
            value: 'Medical Necessity',
            unit: 'category',
            impact: -8,
            importance: 0.12,
            description: 'Type of denial received',
            benchmark: 'N/A',
            status: 'moderate'
        },
        {
            feature: 'Patient Payment History',
            displayName: 'Patient Reliability',
            value: 0.65,
            unit: 'rate',
            impact: -3,
            importance: 0.08,
            description: 'Historical patient payment behavior',
            benchmark: 0.70,
            status: 'moderate'
        },
        {
            feature: 'Prior Appeals Success',
            displayName: 'Appeal History',
            value: 0.78,
            unit: 'rate',
            impact: +9,
            importance: 0.07,
            description: 'Success rate of previous appeals',
            benchmark: 0.65,
            status: 'good'
        },
        {
            feature: 'Account Touches',
            displayName: 'Collection Attempts',
            value: 7,
            unit: 'count',
            impact: +4,
            importance: 0.05,
            description: 'Number of collection attempts made',
            benchmark: 5,
            status: 'good'
        }
    ],

    whatIfScenarios: [
        {
            scenario: 'Reduce Days in A/R to 60',
            changes: [{ feature: 'Days in A/R', from: 94, to: 60 }],
            newScore: 78,
            scoreDelta: +10,
            feasibility: 'high',
            recommendation: 'Expedite appeal submission'
        },
        {
            scenario: 'Improve Documentation Score to 0.95',
            changes: [{ feature: 'Documentation Score', from: 0.91, to: 0.95 }],
            newScore: 70,
            scoreDelta: +2,
            feasibility: 'medium',
            recommendation: 'Add supplemental clinical notes'
        },
        {
            scenario: 'Increase Collection Attempts to 10',
            changes: [{ feature: 'Account Touches', from: 7, to: 10 }],
            newScore: 71,
            scoreDelta: +3,
            feasibility: 'high',
            recommendation: 'Schedule follow-up calls'
        }
    ],

    modelMetrics: {
        overallAccuracy: 0.87,
        precision: 0.84,
        recall: 0.89,
        f1Score: 0.86,
        auc: 0.91,
        calibrationScore: 0.88,

        performanceByScoreRange: [
            { range: '0-20', accuracy: 0.94, precision: 0.92, recall: 0.96, sampleSize: 234 },
            { range: '21-40', accuracy: 0.89, precision: 0.87, recall: 0.91, sampleSize: 412 },
            { range: '41-60', accuracy: 0.86, precision: 0.83, recall: 0.89, sampleSize: 567 },
            { range: '61-80', accuracy: 0.84, precision: 0.81, recall: 0.87, sampleSize: 489 },
            { range: '81-100', accuracy: 0.91, precision: 0.89, recall: 0.93, sampleSize: 298 }
        ],

        historicalPredictions: [
            { month: 'Oct', predicted: 4100000, actual: 4050000, accuracy: 0.99 },
            { month: 'Nov', predicted: 4300000, actual: 4450000, accuracy: 0.97 },
            { month: 'Dec', predicted: 4200000, actual: 4180000, accuracy: 0.99 },
            { month: 'Jan', predicted: 4500000, actual: 4520000, accuracy: 0.99 }
        ]
    },

    auditTrail: [
        {
            timestamp: '2024-01-18T08:30:00Z',
            event: 'Score Calculated',
            modelVersion: 'v2.3.1',
            score: 68,
            user: 'system',
            details: 'Scheduled daily recalculation'
        },
        {
            timestamp: '2024-01-17T08:30:00Z',
            event: 'Score Calculated',
            modelVersion: 'v2.3.1',
            score: 69,
            user: 'system',
            details: 'Scheduled daily recalculation'
        },
        {
            timestamp: '2024-01-12T14:22:00Z',
            event: 'Feature Updated',
            feature: 'Days in A/R',
            oldValue: 87,
            newValue: 94,
            user: 'system',
            details: 'Automatic aging update'
        }
    ]
};

// Phase 3 Data: Action Templates
const actionTemplates = {
    email: [
        {
            id: 'initial_reminder',
            name: 'Initial Payment Reminder',
            subject: 'Payment Reminder: Outstanding Balance at {{facilityName}}',
            body: 'Dear {{patientName}},\n\nThis is a reminder that you have an outstanding balance of {{balance}} for services rendered on {{serviceDate}}.\n\nPlease visit our secure payment portal at {{paymentPortalUrl}} to resolve this matter.\n\nThank you,\n{{facilityName}} Billing Department'
        },
        {
            id: 'urgent_notice',
            name: 'Urgent: Past Due Notice',
            subject: 'URGENT: Past Due Account Notice - {{accountId}}',
            body: 'Dear {{patientName}},\n\nYour account is now significantly past due. The current balance is {{balance}}.\n\nTo avoid further collection activity, please make a payment immediately at {{paymentPortalUrl}} or call us at {{phone}} to discuss payment arrangements.\n\nSincerely,\nCollections Team'
        },
        {
            id: 'settlement_offer',
            name: 'Settlement Offer',
            subject: 'Settlement Offer for Your Account',
            body: 'Dear {{patientName}},\n\nWe would like to offer you a one-time settlement opportunity to resolve your account.\n\nIf you pay $X within 10 days, we will consider your account paid in full.\n\nPlease contact us immediately to take advantage of this offer.\n\nSincerely,\nCollections Manager'
        },
        {
            id: 'final_notice',
            name: 'Final Notice Before Agency',
            subject: 'FINAL NOTICE: Account Referral Pending',
            body: 'Dear {{patientName}},\n\nThis is your final notice before your account is referred to an external collection agency. This action may affect your credit score.\n\nPlease remit the full balance of {{balance}} immediately.\n\nRegards,\n{{facilityName}} Collections'
        }
    ],
    letter: [
        {
            id: 'validation_notice',
            name: 'Debt Validation Notice',
            content: 'Pursuant to the FDCPA, this letter serves as validation of your debt...'
        }
    ]
};

const dispositionCodes = [
    { code: 'PTP', label: 'Promise to Pay', category: 'positive', requiresFollowUp: true },
    { code: 'LM', label: 'Left Voicemail', category: 'neutral', requiresFollowUp: true },
    { code: 'CB', label: 'Call Back Requested', category: 'neutral', requiresFollowUp: true },
    { code: 'WN', label: 'Wrong Number', category: 'negative', requiresFollowUp: false },
    { code: 'D', label: 'Deceased', category: 'negative', requiresFollowUp: false },
    { code: 'DIS', label: 'Dispute', category: 'negative', requiresFollowUp: true },
    { code: 'NI', label: 'Not Interested', category: 'negative', requiresFollowUp: true },
    { code: 'PAY', label: 'Payment Taken', category: 'positive', requiresFollowUp: false },
    { code: 'INS', label: 'Insurance Info Update', category: 'positive', requiresFollowUp: true },
    { code: 'HU', label: 'Hung Up', category: 'negative', requiresFollowUp: true },
    { code: 'NA', label: 'No Answer', category: 'neutral', requiresFollowUp: true },
    { code: 'BZ', label: 'Busy Signal', category: 'neutral', requiresFollowUp: true },
    { code: 'OOT', label: 'Out of Town', category: 'neutral', requiresFollowUp: true },
    { code: 'BKY', label: 'Bankruptcy', category: 'negative', requiresFollowUp: false },
    { code: 'ATTY', label: 'Representation by Attorney', category: 'negative', requiresFollowUp: false }
];

const escalationReasons = [
    { id: 'dispute_coding', label: 'Coding Dispute', severity: 'medium' },
    { id: 'dispute_service', label: 'Service Quality Dispute', severity: 'medium' },
    { id: 'financial_hardship', label: 'Financial Hardship Assessment', severity: 'low' },
    { id: 'legal_threat', label: 'Legal Threat/Attorney Rep', severity: 'critical' },
    { id: 'compliance_issue', label: 'Compliance/Regulatory Issue', severity: 'high' },
    { id: 'vip_patient', label: 'VIP/Sensitive Account', severity: 'high' },
    { id: 'insurance_error', label: 'Complex Insurance Error', severity: 'medium' },
    { id: 'language_barrier', label: 'Language/Communication Barrier', severity: 'low' }
];

const userPerformanceMetrics = [
    {
        userId: 'u1',
        name: 'Sarah Jenkins',
        role: 'Senior Collector',
        avatar: 'SJ',
        metrics: {
            totalRevenue: 450000,
            resolutionRate: 0.78,
            avgResolutionDays: 14.5,
            contactsPerDay: 45,
            callsPerDay: 32,
            rightPartyContactRate: 0.45,
            promiseToPayRate: 0.35,
            keptPromiseRate: 0.82,
            revenuePerAccount: 1250,
            accountsAssigned: 150,
            accountsResolved: 117,
            contactAttemptRate: 0.98,
            successRateByAction: { call: 0.30, email: 0.15, letter: 0.05 },
            weeklyTrend: [
                { week: 'W1', revenue: 105000, target: 100000 },
                { week: 'W2', revenue: 115000, target: 100000 },
                { week: 'W3', revenue: 98000, target: 100000 },
                { week: 'W4', revenue: 132000, target: 100000 }
            ]
        }
    },
    {
        userId: 'u2',
        name: 'Mike Ross',
        role: 'Collector',
        avatar: 'MR',
        metrics: {
            totalRevenue: 320000,
            resolutionRate: 0.65,
            avgResolutionDays: 18.2,
            contactsPerDay: 52,
            callsPerDay: 40,
            rightPartyContactRate: 0.38,
            promiseToPayRate: 0.28,
            keptPromiseRate: 0.75,
            revenuePerAccount: 980,
            accountsAssigned: 160,
            accountsResolved: 104,
            contactAttemptRate: 0.95,
            successRateByAction: { call: 0.25, email: 0.12, letter: 0.04 },
            weeklyTrend: [
                { week: 'W1', revenue: 80000, target: 85000 },
                { week: 'W2', revenue: 75000, target: 85000 },
                { week: 'W3', revenue: 90000, target: 85000 },
                { week: 'W4', revenue: 75000, target: 85000 }
            ]
        }
    },
    {
        userId: 'u3',
        name: 'Elena Rodriguez',
        role: 'Collector',
        avatar: 'ER',
        metrics: {
            totalRevenue: 380000,
            resolutionRate: 0.72,
            avgResolutionDays: 16.0,
            contactsPerDay: 48,
            callsPerDay: 35,
            rightPartyContactRate: 0.42,
            promiseToPayRate: 0.32,
            keptPromiseRate: 0.79,
            revenuePerAccount: 1100,
            accountsAssigned: 145,
            accountsResolved: 104,
            contactAttemptRate: 0.97,
            successRateByAction: { call: 0.28, email: 0.14, letter: 0.05 },
            weeklyTrend: [
                { week: 'W1', revenue: 95000, target: 90000 },
                { week: 'W2', revenue: 92000, target: 90000 },
                { week: 'W3', revenue: 98000, target: 90000 },
                { week: 'W4', revenue: 95000, target: 90000 }
            ]
        }
    },
    {
        userId: 'u4',
        name: 'David Kim',
        role: 'Junior Collector',
        avatar: 'DK',
        metrics: {
            totalRevenue: 280000,
            resolutionRate: 0.60,
            avgResolutionDays: 20.5,
            contactsPerDay: 55,
            callsPerDay: 45,
            rightPartyContactRate: 0.35,
            promiseToPayRate: 0.25,
            keptPromiseRate: 0.70,
            revenuePerAccount: 900,
            accountsAssigned: 170,
            accountsResolved: 102,
            contactAttemptRate: 0.94,
            successRateByAction: { call: 0.22, email: 0.10, letter: 0.03 },
            weeklyTrend: [
                { week: 'W1', revenue: 65000, target: 75000 },
                { week: 'W2', revenue: 72000, target: 75000 },
                { week: 'W3', revenue: 68000, target: 75000 },
                { week: 'W4', revenue: 75000, target: 75000 }
            ]
        }
    },
    {
        userId: 'u5',
        name: 'Rachel Zane',
        role: 'Legal Liaison',
        avatar: 'RZ',
        metrics: {
            totalRevenue: 520000,
            resolutionRate: 0.85,
            avgResolutionDays: 25.0, // Legal takes longer
            contactsPerDay: 25,
            callsPerDay: 15,
            rightPartyContactRate: 0.65,
            promiseToPayRate: 0.45,
            keptPromiseRate: 0.90,
            revenuePerAccount: 2500,
            accountsAssigned: 80,
            accountsResolved: 68,
            contactAttemptRate: 1.00,
            successRateByAction: { call: 0.40, email: 0.30, letter: 0.15 },
            weeklyTrend: [
                { week: 'W1', revenue: 120000, target: 125000 },
                { week: 'W2', revenue: 150000, target: 125000 },
                { week: 'W3', revenue: 110000, target: 125000 },
                { week: 'W4', revenue: 140000, target: 125000 }
            ]
        }
    }
];

const teamMetrics = {
    overall: {
        totalRevenue: 1950000,
        totalAccountsAssigned: 705,
        totalAccountsResolved: 495,
        avgResolutionRate: 0.70, // Average of individual rates
        totalCallsMade: 5235,
        totalEmailsSent: 2840
    },
    activityHeatmap: [
        { hour: '8am', calls: 45, emails: 120 },
        { hour: '9am', calls: 180, emails: 150 },
        { hour: '10am', calls: 250, emails: 80 },
        { hour: '11am', calls: 220, emails: 60 },
        { hour: '12pm', calls: 100, emails: 40 },
        { hour: '1pm', calls: 240, emails: 90 },
        { hour: '2pm', calls: 280, emails: 70 },
        { hour: '3pm', calls: 260, emails: 110 },
        { hour: '4pm', calls: 190, emails: 140 },
        { hour: '5pm', calls: 80, emails: 160 }
    ],
    monthlyTrends: [
        { month: 'Jul', revenue: 1650000, accounts: 420, avgDays: 22 },
        { month: 'Aug', revenue: 1720000, accounts: 445, avgDays: 21 },
        { month: 'Sep', revenue: 1580000, accounts: 410, avgDays: 24 },
        { month: 'Oct', revenue: 1850000, accounts: 480, avgDays: 19 },
        { month: 'Nov', revenue: 1950000, accounts: 495, avgDays: 18 },
        { month: 'Dec (Proj)', revenue: 2100000, accounts: 520, avgDays: 17 }
    ]
};

const comprehensiveTimeline = [
    {
        id: 'evt-1001',
        type: 'call', // call, email, status_change, payment, note, escalation, settlement
        timestamp: '2024-11-15T09:30:00',
        accountId: 'ACC-12345',
        patientName: 'John Doe',
        user: 'Sarah Jenkins',
        outcome: 'Promise to Pay',
        details: 'Patient agreed to pay $500 by Friday',
        amount: 500,
        tags: ['PTP', 'High Value']
    },
    {
        id: 'evt-1002',
        type: 'email',
        timestamp: '2024-11-15T09:45:00',
        accountId: 'ACC-67890',
        patientName: 'Jane Smith',
        user: 'System',
        outcome: 'Sent',
        details: 'Automated 2nd notice sent',
        tags: ['Automated']
    },
    {
        id: 'evt-1003',
        type: 'status_change',
        timestamp: '2024-11-15T10:15:00',
        accountId: 'ACC-54321',
        patientName: 'Robert Johnson',
        user: 'Mike Ross',
        outcome: 'Escalated',
        details: 'Changed status to Legal Review',
        tags: ['Escalation']
    },
    {
        id: 'evt-1004',
        type: 'payment',
        timestamp: '2024-11-15T11:00:00',
        accountId: 'ACC-98765',
        patientName: 'Emily Davis',
        user: 'System',
        outcome: 'Success',
        details: 'Payment received via portal',
        amount: 250.00,
        tags: ['Payment']
    },
    {
        id: 'evt-1005',
        type: 'note',
        timestamp: '2024-11-15T11:30:00',
        accountId: 'ACC-12345',
        patientName: 'John Doe',
        user: 'Sarah Jenkins',
        details: 'Noted that patient prefers morning calls',
        tags: ['Preference']
    },
    {
        id: 'evt-1006',
        type: 'call',
        timestamp: '2024-11-15T13:20:00',
        accountId: 'ACC-11223',
        patientName: 'Michael Brown',
        user: 'Elena Rodriguez',
        outcome: 'Left Voicemail',
        details: 'Left standard message regarding balance',
        tags: []
    },
    {
        id: 'evt-1007',
        type: 'settlement',
        timestamp: '2024-11-15T14:45:00',
        accountId: 'ACC-33445',
        patientName: 'Sarah Wilson',
        user: 'Sarah Jenkins',
        outcome: 'Proposed',
        details: 'Proposed 20% discount if paid today',
        amount: 1200.00,
        tags: ['Settlement']
    },
    {
        id: 'evt-1008',
        type: 'escalation',
        timestamp: '2024-11-15T15:10:00',
        accountId: 'ACC-55667',
        patientName: 'David Lee',
        user: 'Mike Ross',
        outcome: 'Pending',
        details: 'Escalated due to dispute',
        tags: ['Dispute']
    },
    {
        id: 'evt-1009',
        type: 'call',
        timestamp: '2024-11-15T16:00:00',
        accountId: 'ACC-77889',
        patientName: 'Lisa Anderson',
        user: 'David Kim',
        outcome: 'Call Back',
        details: 'Requested call back after 5pm',
        tags: ['Callback']
    },
    {
        id: 'evt-1010',
        type: 'email',
        timestamp: '2024-11-15T16:30:00',
        accountId: 'ACC-99001',
        patientName: 'James Taylor',
        user: 'System',
        outcome: 'Sent',
        details: 'Payment receipt sent',
        tags: ['Automated']
    },
    // Generate more mock events if needed
    // ...
];

export const mockARData = {
    kpis,
    arTrend,
    agingBuckets,
    collectionVelocity,
    payerTreemap,
    aiInsights,
    highRiskClaims,
    denialReasons,
    paymentDistribution,
    topCPTCodes,
    accountDetails,
    activityTimeline,
    documents,
    alerts,
    // Phase 2 Data
    strategyRecommendations,
    recoveryInsights,
    propensityDetails,
    // Phase 3 Data
    actionTemplates,
    dispositionCodes,
    escalationReasons,
    userPerformanceMetrics,
    teamMetrics,
    comprehensiveTimeline
};

