export const mockCommandCenterData = {
    // LAYER 1: Executive Pulse
    executive: {
        totalPipeline: {
            value: "$14,250,000",
            trend: "+8.4%",
            trendLabel: "vs Last Month",
            isPositive: true,
            targetRoute: "/finance/reconciliation",
            context: { view: "pipeline" }
        },
        cleanClaimRatio: {
            value: "94.2%",
            trend: "-1.2%",
            trendLabel: "Scrub Failures",
            isPositive: false,
            targetRoute: "/claims-scrubbing",
            context: { status: "clean" }
        },
        denialRate: {
            value: "3.8%",
            trend: "-0.5%",
            trendLabel: "Improvement",
            isPositive: true,
            targetRoute: "/denials/analytics",
            context: { metric: "denial_rate" }
        },
        revenueAtRisk: {
            value: "$1.2M",
            trend: "+12%",
            trendLabel: "AI Detected",
            isPositive: false,
            status: "critical",
            targetRoute: "/denials/high-risk",
            context: { risk: "high" }
        },
        systemHealth: {
            value: "98/100",
            trend: "Stable",
            isPositive: true,
            targetRoute: "/admin/integrations"
        }
    },

    // LAYER 2: Lifecycle Flow
    lifecycle: [
        {
            id: "unbilled",
            stage: "Unbilled",
            count: 452,
            value: "$1.2M",
            avgDwell: "2.1d",
            sla: "3d",
            status: "healthy",
            trend: "stable",
            targetRoute: "/claims"
        },
        {
            id: "scrubbing",
            stage: "Scrubbing",
            count: 128,
            value: "$840k",
            avgDwell: "0.8d",
            sla: "1d",
            status: "warning",
            trend: "improving",
            targetRoute: "/claims/pre-batch-scrub/dashboard"
        },
        {
            id: "billed",
            stage: "Billed",
            count: 1102,
            value: "$4.5M",
            avgDwell: "12d",
            sla: "14d",
            status: "healthy",
            trend: "stable",
            targetRoute: "/claims/work-queue"
        },
        {
            id: "adjudicated",
            stage: "Adjudicated/AR",
            count: 890,
            value: "$3.8M",
            avgDwell: "35d",
            sla: "45d",
            status: "critical",
            trend: "degrading",
            targetRoute: "/collections/hub"
        },
        {
            id: "posted",
            stage: "Posted/Closed",
            count: 2405,
            value: "$12.4M",
            avgDwell: "N/A",
            sla: "N/A",
            status: "healthy",
            trend: "stable",
            targetRoute: "/finance/reconciliation"
        }
    ],

    // LAYER 3: Bottleneck Radar
    bottlenecks: [
        {
            id: "b1",
            type: "Payer",
            name: "Cigna",
            impact: "$450k",
            delay: "4.2 Days",
            description: "Adjudication delay on Ortho structure",
            confidence: 92,
            targetRoute: "/finance/payer-performance",
            trend: "degrading"
        },
        {
            id: "b2",
            type: "Process",
            name: "Coding Scrub",
            impact: "$120k",
            delay: "1.2 Days",
            description: "Spike in modifier -25 rejections",
            confidence: 88,
            targetRoute: "/ai-coding/audit",
            trend: "stable"
        },
        {
            id: "b3",
            type: "Team",
            name: "Verification",
            impact: "$85k",
            delay: "0.8 Days",
            description: "Staffing shortage in heavy volume hrs",
            confidence: 75,
            targetRoute: "/insurance-verification/overview",
            trend: "improving"
        }
    ],

    // LAYER 4: AI Intelligence Engine
    aiInsights: {
        situational: [
            { id: "i1", title: "Denial Spike Prediction", prob: "85%", impact: "$250k At Risk", desc: "Projected 15% increase in denial rate for BCBS next week based on policy update patterns.", action: "Review Coding Rules" },
            { id: "i2", title: "Cash Flow Alert", prob: "92%", impact: "-$1.2M Variance", desc: "End of month collections projected to miss target by 8% due to payer holidays.", action: "Accelerate AR Outreach" }
        ],
        diagnostic: [
            { id: "d1", title: "Root Cause: Auth Failures", impact: "42 Claims", desc: "Authorization failures traced to new CPT code mapping in intake form.", action: "Fix Mapping" },
            { id: "d2", title: "Payer Behavior Change", impact: "High", desc: "UHC increased documentation requests for PT visits > 12.", action: "Update Doc Requirements" }
        ],
        prescriptive: [
            { id: "p1", title: "Auto-Fix Optimization", impact: "+$45k/mo", desc: "Increasing auto-fix threshold to 98% confidence would process 150 more claims/day.", action: "Update Threshold" },
            { id: "p2", title: "Workforce Reallocation", impact: "+15% Efficiency", desc: "Shift 2 FTEs from Billing to AR Follow-up for next 3 days to clear deadlock.", action: "Reassign Tasks" }
        ]
    },

    // LAYER 5: Performance Intelligence
    performance: {
        team: [
            { name: "Alpha Team", efficiency: "94%", backlog: "12 Claims", status: "healthy", avatar: "A" },
            { name: "Beta Team", efficiency: "82%", backlog: "45 Claims", status: "warning", avatar: "B" },
            { name: "Gamma Team", efficiency: "98%", backlog: "5 Claims", status: "healthy", avatar: "G" }
        ],
        automation: {
            autoFixRate: "78%",
            cleanPassRate: "92%",
            predictionAccuracy: "96.4%",
            uptime: "99.9%"
        }
    },

    // LAYER 6: Actions & Tickets
    tickets: [
        { id: "T-1024", title: "Cigna Adjudication Delay", priority: "Critical", owner: "System", time: "2h ago", status: "Open", source: "Bottleneck Radar" },
        { id: "T-1023", title: "Coding Rule Update Required", priority: "High", owner: "AI Agent", time: "4h ago", status: "In Progress", source: "AI Diagnostic" },
        { id: "T-1022", title: "Credentialing Expiry Warning", priority: "Medium", owner: "System", time: "1d ago", status: "Open", source: "Compliance" },
        { id: "T-1020", title: "Bulk Re-submission Failure", priority: "High", owner: "Sarah J.", time: "1d ago", status: "Resolved", source: "Manual" }
    ]
};
