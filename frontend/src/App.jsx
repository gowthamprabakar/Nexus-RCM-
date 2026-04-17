import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ui';

// ── Command Center ─────────────────────────────────────────────────────
import { CommandCenter } from './features/dashboard/pages/CommandCenter';
import { ExecutiveDashboard } from './features/dashboard/pages/ExecutiveDashboard';

// ── Analytics Layouts ──────────────────────────────────────────────────
import { RevenueAnalyticsLayout } from './features/analytics/layouts/RevenueAnalyticsLayout';
import { DenialAnalyticsLayout } from './features/analytics/layouts/DenialAnalyticsLayout';
import { PaymentIntelligenceLayout } from './features/analytics/layouts/PaymentIntelligenceLayout';
import { ClaimsPipelineLayout } from './features/analytics/layouts/ClaimsPipelineLayout';

// ── Analytics Pages ────────────────────────────────────────────────────
import OutcomeDashboard from './features/analytics/pages/OutcomeDashboard';
import { RevenueReconciliation } from './features/finance/pages/RevenueReconciliation';
import { ARAgingPage } from './features/analytics/pages/ARAgingPage';
import { RootCauseClaimsPage } from './features/analytics/pages/RootCauseClaimsPage';
import { CashFlowPage } from './features/analytics/pages/CashFlowPage';
import { DenialAnalytics } from './features/denials/pages/DenialAnalytics';
import { DenialTrends } from './features/denials/pages/DenialTrends';
import { RootCauseIntelligence } from './features/analytics/pages/RootCauseIntelligence';
import { ClaimRootCauseDetail } from './features/analytics/pages/ClaimRootCauseDetail';
import { PaymentDashboard } from './features/payments/pages/PaymentDashboard';
import { PayerPerformance } from './features/finance/pages/PayerPerformance';
import { ERABankRecon } from './features/payments/pages/ERABankRecon';
import { ADTPMonitor } from './features/analytics/pages/ADTPMonitor';
import { ContractAudit } from './features/payments/pages/ContractAudit';
import { ClaimsOverview } from './features/claims/pages/ClaimsOverview';
import { ScrubDashboard } from './features/claims/pages/ScrubDashboard';
import { PayerVariance } from './features/denials/pages/PayerVariance';
import GraphExplorer from './features/analytics/pages/GraphExplorer';
import ComplianceRiskDashboard from './features/analytics/pages/ComplianceRiskDashboard';
import ContractVarianceDashboard from './features/payments/pages/ContractVarianceDashboard';
import PayerHealthScorecard from './features/analytics/pages/PayerHealthScorecard';
import ProviderLeaderboard from './features/analytics/pages/ProviderLeaderboard';

// ── Work Center Layouts ────────────────────────────────────────────────
import { ClaimsWorkCenterLayout } from './features/workcenters/layouts/ClaimsWorkCenterLayout';
import { DenialWorkCenterLayout } from './features/workcenters/layouts/DenialWorkCenterLayout';
import { CollectionsWorkCenterLayout } from './features/workcenters/layouts/CollectionsWorkCenterLayout';
import { PaymentWorkCenterLayout } from './features/workcenters/layouts/PaymentWorkCenterLayout';
import { AutomationDashboard } from './features/workcenters/pages/AutomationDashboard';

// ── Work Center Pages ──────────────────────────────────────────────────
import { ClaimsWorkQueue } from './features/claims/pages/ClaimsWorkQueue';
import { AutoFixCenter } from './features/claims/pages/AutoFixCenter';
import { BatchActions } from './features/claims/pages/BatchActions';
import { DenialManagement } from './features/denials/pages/DenialManagement';
import AppealPipelineTracker from './features/denials/pages/AppealPipelineTracker';
import { HighRiskClaims } from './features/denials/pages/HighRiskClaims';
import { AppealGenerator } from './features/denials/pages/AppealGenerator';
import { DenialWorkflowLog } from './features/denials/pages/DenialWorkflowLog';
import DenialIntelligence from './features/denials/pages/DenialIntelligence';
import { CollectionsQueue } from './features/collections/pages/CollectionsQueue';
import { AlertsQueue } from './features/collections/pages/AlertsQueue';
import { PaymentPortal } from './features/collections/pages/PaymentPortal';
import { ERAProcessing } from './features/payments/pages/ERAProcessing';
import { PaymentPosting } from './features/payments/pages/PaymentPosting';
import { ContractManager } from './features/payments/pages/ContractManager';

// ── Intelligence ───────────────────────────────────────────────────────
import { LidaLayout } from './features/lida/pages/LidaLayout';
import { LidaDashboard } from './features/lida/pages/LidaDashboard';
import { LidaChat } from './features/lida/pages/LidaChat';
import { MECEReportBuilder } from './features/lida/pages/MECEReportBuilder';
import { TicketHub } from './features/lida/pages/TicketHub';
import { Reporting } from './features/reporting/pages/Reporting';
import { RevenueForecast } from './features/intelligence/pages/RevenueForecast';
import { SimulationDashboard } from './features/intelligence/pages/SimulationDashboard';
import { StandardReports } from './features/intelligence/pages/StandardReports';

// ── Specialty: Patient Access ──────────────────────────────────────────
import { InsuranceLayout } from './features/insurance/pages/InsuranceLayout';
import { PatientAccessHub } from './features/insurance/pages/PatientAccessHub';
import { InsuranceVerification } from './features/insurance/pages/InsuranceVerification';
import { PriorAuthManager } from './features/insurance/pages/PriorAuthManager';
import { BenefitAnalytics } from './features/insurance/pages/BenefitAnalytics';
import { VerificationHistory } from './features/insurance/pages/VerificationHistory';
import { PatientAccounts } from './features/patients/pages/PatientAccounts';

// ── Specialty: Coding & Charge ─────────────────────────────────────────
import { AICodingLayout } from './features/coding/pages/AICodingLayout';
import { CodingOptimizer } from './features/coding/pages/CodingOptimizer';
import { AICodingAudit } from './features/coding/pages/AICodingAudit';
import { AICodingCompliance } from './features/coding/pages/AICodingCompliance';
import { AICodingRulebook } from './features/coding/pages/AICodingRulebook';

// ── Specialty: EVV ─────────────────────────────────────────────────────
import { EVVDashboard } from './features/evv/pages/EVVDashboard';
import { EVVVisitDetails } from './features/evv/pages/EVVVisitDetails';
import { EVVFraudDetection } from './features/evv/pages/EVVFraudDetection';
import { StateMandates } from './features/evv/pages/StateMandates';
import { EVVAutoRetryManager } from './features/denials/pages/EVVAutoRetryManager';

// ── Settings & Admin ───────────────────────────────────────────────────
import { SettingsLayout } from './features/settings/pages/SettingsLayout';
import { BillingRules } from './features/settings/pages/BillingRules';
import { AIConfiguration } from './features/settings/pages/AIConfiguration';
import { UserManagement } from './features/settings/pages/UserManagement';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { IntegrationHub } from './features/admin/pages/IntegrationHub';
import { ETLDesigner } from './features/admin/pages/ETLDesigner';
import { APIManager } from './features/admin/pages/APIManager';
import { Scheduler } from './features/admin/pages/Scheduler';
import { AuditLog } from './features/finance/pages/AuditLog';

// ── Remaining pages used by legacy redirects or deep links ─────────────
import { ClaimDenialDetail } from './features/denials/pages/ClaimDenialDetail';
import { DenialPredictionAnalysis } from './features/denials/pages/DenialPredictionAnalysis';
import { COBAutoManager } from './features/denials/pages/COBAutoManager';
import { CollectionsHub } from './features/collections/pages/CollectionsHub';
import { AccountDetailsPage } from './features/collections/pages/AccountDetailsPage';
import { RecoveryInsights } from './features/collections/pages/RecoveryInsights';
import { PropensityScoreDetails } from './features/collections/pages/PropensityScoreDetails';
import { CollectionsActionCenter } from './features/collections/pages/CollectionsActionCenter';
import { PerformanceAnalytics } from './features/collections/pages/PerformanceAnalytics';
import { CollectionsTimeline } from './features/collections/pages/CollectionsTimeline';
import { ReconciliationAdvanced } from './features/finance/pages/ReconciliationAdvanced';
import { PayerReconClaimsPage } from './features/finance/pages/PayerReconClaimsPage';
import { BankReconciliation } from './features/denials/pages/BankReconciliation';
import { TransactionLedger } from './features/finance/pages/TransactionLedger';
import { AIInsightDetail } from './features/finance/pages/AIInsightDetail';
import { PayerPaymentIntelligence } from './features/payments/pages/PayerPaymentIntelligence';
import { ClaimsAnalytics } from './features/analytics/pages/ClaimsAnalytics';
import { PreventionDashboard } from './features/analytics/pages/PreventionDashboard';
import { ClaimValidationDetail } from './features/claims/pages/ClaimValidationDetail';
import { ValidationQueue } from './features/claims/pages/ValidationQueue';
import { MassScrub } from './features/claims/pages/MassScrub';
import { RuleEngine } from './features/claims/pages/RuleEngine';
import { PreBatchScrubLayout } from './features/claims/pages/PreBatchScrubLayout';
import { AIPerformanceEngine } from './features/developer/pages/AIPerformanceEngine';
import { MCPAgentHub } from './features/developer/pages/MCPAgentHub';
import { AIModelMonitor } from './features/developer/pages/AIModelMonitor';
import { DriftLogs } from './features/developer/pages/ai/DriftLogs';
import { ModelRegistry } from './features/developer/pages/ai/ModelRegistry';
import { FeatureImportance } from './features/developer/pages/ai/FeatureImportance';
import { PSIDistribution } from './features/developer/pages/ai/PSIDistribution';
import { DataSchemaExplorer } from './features/developer/pages/DataSchemaExplorer';

// ── Stub pages for routes not yet built ────────────────────────────────
const StubPage = ({ title, subtitle }) => (
    <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-primary">construction</span>
            </div>
            <h2 className="text-xl font-semibold text-th-heading mb-2">{title}</h2>
            <p className="text-sm text-th-secondary">{subtitle || 'This module is being built.'}</p>
        </div>
    </div>
);

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>

                {/* ════════════════════════════════════════════════════════
                    COMMAND CENTER
                   ════════════════════════════════════════════════════════ */}
                <Route index element={<CommandCenter />} />

                {/* ════════════════════════════════════════════════════════
                    ANALYTICS
                   ════════════════════════════════════════════════════════ */}

                {/* Revenue Analytics */}
                <Route path="analytics/revenue" element={<RevenueAnalyticsLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<ExecutiveDashboard />} />
                    <Route path="reconciliation" element={<RevenueReconciliation />} />
                    <Route path="reconciliation/payer-claims" element={<PayerReconClaimsPage />} />
                    <Route path="ar-aging" element={<ARAgingPage />} />
                    <Route path="cash-flow" element={<CashFlowPage />} />
                </Route>

                {/* Denial Analytics — wrapped in ErrorBoundary so one API failure doesn't kill the layout */}
                <Route path="analytics/denials" element={<DenialAnalyticsLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<ErrorBoundary label="Denial Intelligence"><DenialAnalytics /></ErrorBoundary>} />
                    <Route path="root-cause" element={<ErrorBoundary label="Root Cause Intelligence"><RootCauseIntelligence /></ErrorBoundary>} />
                    <Route path="root-cause/claims" element={<ErrorBoundary label="Root Cause Claims"><RootCauseClaimsPage /></ErrorBoundary>} />
                    <Route path="root-cause/claim/:claimId" element={<ErrorBoundary label="Claim RCA Detail"><ClaimRootCauseDetail /></ErrorBoundary>} />
                    <Route path="payer-patterns" element={<ErrorBoundary label="Payer Patterns"><PayerVariance /></ErrorBoundary>} />
                    <Route path="trends" element={<ErrorBoundary label="Denial Trends"><DenialTrends /></ErrorBoundary>} />
                </Route>

                {/* Payment Intelligence */}
                <Route path="analytics/payments" element={<PaymentIntelligenceLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<PaymentDashboard />} />
                    <Route path="payer-profiles" element={<PayerPaymentIntelligence />} />
                    <Route path="contract-audit" element={<ContractAudit />} />
                    <Route path="era-bank-recon" element={<ERABankRecon />} />
                </Route>

                {/* Outcome Analytics */}
                <Route path="analytics/outcomes" element={<OutcomeDashboard />} />

                {/* Prevention Intelligence */}
                <Route path="analytics/prevention" element={<PreventionDashboard />} />

                {/* Graph Explorer */}
                <Route path="analytics/graph-explorer" element={<GraphExplorer />} />

                {/* Compliance Risk */}
                <Route path="analytics/compliance" element={<ComplianceRiskDashboard />} />

                {/* Contract Variance */}
                <Route path="payments/contract-variance" element={<ContractVarianceDashboard />} />

                {/* Payer Health Scorecard */}
                <Route path="analytics/payer-health" element={<ErrorBoundary label="Payer Health Scorecard"><PayerHealthScorecard /></ErrorBoundary>} />

                {/* Provider Leaderboard */}
                <Route path="analytics/provider-leaderboard" element={<ProviderLeaderboard />} />

                {/* Claims Pipeline */}
                <Route path="analytics/claims" element={<ClaimsPipelineLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<ClaimsOverview />} />
                    <Route path="scrub-analytics" element={<ScrubDashboard />} />
                    <Route path="queue" element={<ValidationQueue />} />
                    <Route path="claim/:claimId" element={<ClaimValidationDetail />} />
                    <Route path="mass-scrub" element={<MassScrub />} />
                </Route>

                {/* ════════════════════════════════════════════════════════
                    WORK CENTERS
                   ════════════════════════════════════════════════════════ */}

                {/* Claims Work Center */}
                <Route path="work/claims" element={<ClaimsWorkCenterLayout />}>
                    <Route index element={<Navigate to="queue" replace />} />
                    <Route path="queue" element={<ClaimsWorkQueue />} />
                    <Route path="auto-fix" element={<AutoFixCenter />} />
                    <Route path="batch" element={<BatchActions />} />
                    <Route path="scrub" element={<ScrubDashboard />} />
                </Route>

                {/* Denial Work Center — DenialManagement has its own shell (DW-1) — wrapped in ErrorBoundary */}
                <Route path="work/denials" element={<ErrorBoundary label="Denial Command"><DenialManagement /></ErrorBoundary>} />
                <Route path="work/denials/queue" element={<ErrorBoundary label="Denial Command"><DenialManagement /></ErrorBoundary>} />
                {/* High Risk Claims is now a TAB inside DenialManagement — no separate sidebar entry */}
                <Route path="work/denials/high-risk" element={<ErrorBoundary label="High Risk Claims"><DenialManagement /></ErrorBoundary>} />
                {/* Appeal Workbench routes directly to the rebuilt 3-column AppealPipelineTracker */}
                <Route path="work/denials/appeals" element={<ErrorBoundary label="Appeal Workbench"><AppealPipelineTracker /></ErrorBoundary>} />
                <Route path="work/denials/workflow-log" element={<DenialWorkflowLog />} />
                <Route path="work/denials/claim/:id" element={<DenialIntelligence />} />

                {/* Legacy alias for deep-links — also renders AppealPipelineTracker */}
                <Route path="denials/appeal-pipeline" element={<ErrorBoundary label="Appeal Pipeline"><AppealPipelineTracker /></ErrorBoundary>} />

                {/* Collections Work Center */}
                <Route path="work/collections" element={<CollectionsWorkCenterLayout />}>
                    <Route index element={<Navigate to="hub" replace />} />
                    <Route path="hub" element={<CollectionsHub />} />
                    <Route path="queue" element={<CollectionsQueue />} />
                    <Route path="alerts" element={<AlertsQueue />} />
                    <Route path="portal" element={<PaymentPortal />} />
                    <Route path="timeline" element={<CollectionsTimeline />} />
                </Route>

                {/* Payment Work Center */}
                <Route path="work/payments" element={<PaymentWorkCenterLayout />}>
                    <Route index element={<Navigate to="era" replace />} />
                    <Route path="era" element={<ERAProcessing />} />
                    <Route path="posting" element={<PaymentPosting />} />
                    <Route path="contracts" element={<ContractManager />} />
                </Route>

                {/* Automation Dashboard */}
                <Route path="work/automation" element={<AutomationDashboard />} />

                {/* ════════════════════════════════════════════════════════
                    INTELLIGENCE
                   ════════════════════════════════════════════════════════ */}

                {/* LIDA AI — wrapped in ErrorBoundary so one failure doesn't kill the layout */}
                <Route path="intelligence/lida" element={<LidaLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<ErrorBoundary label="LIDA Dashboard"><LidaDashboard /></ErrorBoundary>} />
                    <Route path="chat" element={<ErrorBoundary label="LIDA Chat"><LidaChat /></ErrorBoundary>} />
                    <Route path="reports" element={<ErrorBoundary label="MECE Report Builder"><MECEReportBuilder /></ErrorBoundary>} />
                    <Route path="tickets" element={<ErrorBoundary label="Ticket Hub"><TicketHub /></ErrorBoundary>} />
                </Route>

                {/* Revenue Forecast */}
                <Route path="intelligence/forecast" element={<RevenueForecast />} />

                {/* Simulation Engine */}
                <Route path="intelligence/simulation" element={<SimulationDashboard />} />

                {/* Standard Reports */}
                <Route path="intelligence/reports" element={<StandardReports />} />

                {/* ════════════════════════════════════════════════════════
                    SPECIALTY
                   ════════════════════════════════════════════════════════ */}

                {/* Patient Access */}
                <Route path="specialty/patient-access" element={<InsuranceLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<PatientAccessHub />} />
                    <Route path="eligibility" element={<InsuranceVerification />} />
                    <Route path="auths" element={<PriorAuthManager />} />
                    <Route path="benefits" element={<BenefitAnalytics />} />
                    <Route path="history" element={<VerificationHistory />} />
                    <Route path="accounts" element={<PatientAccounts />} />
                </Route>

                {/* Coding & Charge */}
                <Route path="specialty/coding" element={<AICodingLayout />}>
                    <Route index element={<CodingOptimizer />} />
                    <Route path="audit" element={<AICodingAudit />} />
                    <Route path="compliance" element={<AICodingCompliance />} />
                    <Route path="rulebook" element={<AICodingRulebook />} />
                </Route>

                {/* EVV Home Health */}
                <Route path="specialty/evv" element={<Navigate to="/specialty/evv/dashboard" replace />} />
                <Route path="specialty/evv/dashboard" element={<EVVDashboard />} />
                <Route path="specialty/evv/visits" element={<EVVVisitDetails />} />
                <Route path="specialty/evv/fraud" element={<EVVFraudDetection />} />
                <Route path="specialty/evv/mandates" element={<StateMandates />} />
                <Route path="specialty/evv/auto-retry" element={<EVVAutoRetryManager />} />

                {/* ════════════════════════════════════════════════════════
                    SETTINGS
                   ════════════════════════════════════════════════════════ */}
                <Route path="settings" element={<SettingsLayout />}>
                    <Route index element={<Navigate to="users" replace />} />
                    <Route path="billing-rules" element={<BillingRules />} />
                    <Route path="ai-config" element={<AIConfiguration />} />
                    <Route path="users" element={<UserManagement />} />
                </Route>
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/integrations" element={<IntegrationHub />} />
                <Route path="admin/etl-designer" element={<ETLDesigner />} />
                <Route path="admin/api-manager" element={<APIManager />} />
                <Route path="admin/scheduler" element={<Scheduler />} />

                {/* ════════════════════════════════════════════════════════
                    LEGACY REDIRECTS
                    All old routes redirect to their new locations
                   ════════════════════════════════════════════════════════ */}

                {/* Intelligence Hub legacy */}
                <Route path="command-center" element={<Navigate to="/" replace />} />
                <Route path="executive-dashboard" element={<Navigate to="/analytics/revenue" replace />} />
                <Route path="reporting" element={<Navigate to="/intelligence/forecast" replace />} />
                <Route path="lida" element={<Navigate to="/intelligence/lida" replace />} />
                <Route path="lida/*" element={<Navigate to="/intelligence/lida" replace />} />

                {/* Patient Access legacy */}
                <Route path="insurance-verification" element={<Navigate to="/specialty/patient-access" replace />} />
                <Route path="insurance-verification/*" element={<Navigate to="/specialty/patient-access" replace />} />
                <Route path="patient-accounts" element={<Navigate to="/specialty/patient-access/accounts" replace />} />

                {/* Coding legacy */}
                <Route path="ai-coding" element={<Navigate to="/specialty/coding" replace />} />
                <Route path="ai-coding/*" element={<Navigate to="/specialty/coding" replace />} />

                {/* Claims legacy */}
                <Route path="claims" element={<Navigate to="/analytics/claims" replace />} />
                <Route path="claims/overview" element={<Navigate to="/analytics/claims/overview" replace />} />
                <Route path="claims/work-queue" element={<Navigate to="/work/claims/queue" replace />} />
                <Route path="claims/batch" element={<Navigate to="/work/claims/batch" replace />} />
                <Route path="claims/pre-batch-scrub" element={<Navigate to="/analytics/claims/scrub-analytics" replace />} />
                <Route path="claims/pre-batch-scrub/*" element={<Navigate to="/analytics/claims/scrub-analytics" replace />} />
                <Route path="claims/rules" element={<Navigate to="/work/claims/queue" replace />} />
                <Route path="claims/mass-scrub" element={<Navigate to="/work/claims/queue" replace />} />
                <Route path="claims/submission-tracking" element={<Navigate to="/analytics/claims" replace />} />
                <Route path="claims/acknowledgments" element={<Navigate to="/analytics/claims" replace />} />
                <Route path="claims-scrubbing" element={<Navigate to="/analytics/claims/scrub-analytics" replace />} />
                <Route path="claims-analytics" element={<Navigate to="/analytics/claims" replace />} />

                {/* Payments legacy */}
                <Route path="payments/dashboard" element={<Navigate to="/analytics/payments" replace />} />
                <Route path="payments/era-processing" element={<Navigate to="/work/payments/era" replace />} />
                <Route path="payments/posting" element={<Navigate to="/work/payments/posting" replace />} />
                <Route path="payments/contracts" element={<Navigate to="/work/payments/contracts" replace />} />
                <Route path="payments/payer-intelligence" element={<Navigate to="/analytics/payments/payer-profiles" replace />} />
                <Route path="payments/era-bank-recon" element={<Navigate to="/analytics/payments/era-bank-recon" replace />} />
                <Route path="finance/payer-performance" element={<Navigate to="/analytics/payments/payer-profiles" replace />} />

                {/* Denials legacy */}
                <Route path="denials" element={<Navigate to="/work/denials/queue" replace />} />
                <Route path="denials/analytics" element={<Navigate to="/analytics/denials" replace />} />
                <Route path="denials/prevention-dashboard" element={<Navigate to="/analytics/denials" replace />} />
                <Route path="denials/variance" element={<Navigate to="/analytics/denials/payer-patterns" replace />} />
                <Route path="denials/high-risk" element={<Navigate to="/work/denials/high-risk" replace />} />
                <Route path="denials/appeal" element={<Navigate to="/work/denials/appeals" replace />} />
                <Route path="denials/workflow-log" element={<Navigate to="/work/denials/workflow-log" replace />} />
                <Route path="denials/workspace" element={<Navigate to="/work/denials/queue" replace />} />
                <Route path="denials/claim/:id" element={<ClaimDenialDetail />} />
                <Route path="denials/prediction/:id" element={<DenialPredictionAnalysis />} />
                <Route path="automation/cob-manager" element={<Navigate to="/work/automation" replace />} />

                {/* Collections legacy */}
                <Route path="collections" element={<Navigate to="/work/collections/queue" replace />} />
                <Route path="collections/tasks" element={<Navigate to="/work/collections/queue" replace />} />
                <Route path="collections/portal" element={<Navigate to="/work/collections/portal" replace />} />
                <Route path="collections/alerts" element={<Navigate to="/work/collections/alerts" replace />} />
                <Route path="collections/account/:accountId" element={<AccountDetailsPage />} />
                <Route path="collections/recovery-insights" element={<Navigate to="/work/collections/queue" replace />} />
                <Route path="collections/propensity/:accountId" element={<PropensityScoreDetails />} />
                <Route path="collections/action-center/:accountId" element={<CollectionsActionCenter />} />
                <Route path="collections/performance" element={<Navigate to="/work/collections/queue" replace />} />
                <Route path="collections/timeline" element={<Navigate to="/work/collections/queue" replace />} />
                <Route path="collections/statements" element={<Navigate to="/work/collections/queue" replace />} />

                {/* Reconciliation legacy */}
                <Route path="finance/reconciliation" element={<Navigate to="/analytics/revenue/reconciliation" replace />} />
                <Route path="finance/reconciliation-advanced" element={<Navigate to="/analytics/revenue/reconciliation" replace />} />
                <Route path="finance/reconciliation/transaction/:transactionId" element={<TransactionLedger />} />
                <Route path="finance/insights/:insightId" element={<AIInsightDetail />} />
                <Route path="finance/audit-log" element={<Navigate to="/settings" replace />} />
                <Route path="reconciliation/bank-view" element={<Navigate to="/analytics/payments/era-bank-recon" replace />} />
                <Route path="reconciliation/ar-balance" element={<Navigate to="/analytics/payments/era-bank-recon" replace />} />

                {/* EVV legacy */}
                <Route path="evv/dashboard" element={<Navigate to="/specialty/evv/dashboard" replace />} />
                <Route path="evv/visit-details" element={<Navigate to="/specialty/evv/visits" replace />} />
                <Route path="evv/fraud-detection" element={<Navigate to="/specialty/evv/fraud" replace />} />
                <Route path="evv/mandates" element={<Navigate to="/specialty/evv/mandates" replace />} />
                <Route path="evv/billing-bridge" element={<Navigate to="/specialty/evv/dashboard" replace />} />
                <Route path="automation/evv-retry" element={<Navigate to="/specialty/evv/auto-retry" replace />} />

                {/* Analytics legacy */}
                <Route path="analytics/root-cause" element={<Navigate to="/analytics/denials/root-cause" replace />} />
                <Route path="analytics/root-cause/claim/:claimId" element={<ClaimRootCauseDetail />} />
                <Route path="analytics/adtp" element={<Navigate to="/analytics/payments/overview" replace />} />
                <Route path="analytics/payments/adtp" element={<Navigate to="/analytics/payments/overview" replace />} />

                {/* AI Engine / Developer legacy */}
                <Route path="ai-engine/performance" element={<Navigate to="/work/automation" replace />} />
                <Route path="developer/mcp-agents" element={<Navigate to="/work/automation" replace />} />
                <Route path="developer/ai-monitor" element={<Navigate to="/work/automation" replace />} />
                <Route path="developer/ai-monitor/*" element={<Navigate to="/work/automation" replace />} />
                <Route path="developer/data-schema" element={<Navigate to="/work/automation" replace />} />

                {/* ── Catch-all ────────────────────────────────────────── */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default App;
