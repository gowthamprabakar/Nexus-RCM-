import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ExecutiveDashboard } from './features/dashboard/pages/ExecutiveDashboard';
import { CommandCenter } from './features/dashboard/pages/CommandCenter';

import { ClaimScrubbing } from './features/claims/pages/ClaimScrubbing';
import { AICodingLayout } from './features/coding/pages/AICodingLayout';
import { CodingOptimizer } from './features/coding/pages/CodingOptimizer';
import { AICodingAudit } from './features/coding/pages/AICodingAudit';
import { AICodingCompliance } from './features/coding/pages/AICodingCompliance';
import { AICodingRulebook } from './features/coding/pages/AICodingRulebook';
import { DenialManagement } from './features/denials/pages/DenialManagement';
import { AppealGenerator } from './features/denials/pages/AppealGenerator';
import { DenialAnalytics } from './features/denials/pages/DenialAnalytics';
import { DenialPreventionDashboard } from './features/denials/pages/DenialPreventionDashboard';
import { HighRiskClaims } from './features/denials/pages/HighRiskClaims';
import { ClaimDenialDetail } from './features/denials/pages/ClaimDenialDetail';
import { DenialPredictionAnalysis } from './features/denials/pages/DenialPredictionAnalysis';
import { PreventionWorkspace } from './features/denials/pages/PreventionWorkspace';
import { DenialWorkflowLog } from './features/denials/pages/DenialWorkflowLog';
import { EVVAutoRetryManager } from './features/denials/pages/EVVAutoRetryManager';
import { COBAutoManager } from './features/denials/pages/COBAutoManager';
import { BankReconciliation } from './features/denials/pages/BankReconciliation';
import { CollectionsHub } from './features/collections/pages/CollectionsHub';
import { CollectionsQueue } from './features/collections/pages/CollectionsQueue';
import { PaymentPortal } from './features/collections/pages/PaymentPortal';
import { AccountDetailsPage } from './features/collections/pages/AccountDetailsPage';
import { AlertsQueue } from './features/collections/pages/AlertsQueue';
import { RecoveryInsights } from './features/collections/pages/RecoveryInsights';
import { PropensityScoreDetails } from './features/collections/pages/PropensityScoreDetails';
import { CollectionsActionCenter } from './features/collections/pages/CollectionsActionCenter';
import { PerformanceAnalytics } from './features/collections/pages/PerformanceAnalytics';
import { CollectionsTimeline } from './features/collections/pages/CollectionsTimeline';
import { PayerPerformance } from './features/finance/pages/PayerPerformance';
import { AuditLog } from './features/finance/pages/AuditLog';
import { RevenueReconciliation } from './features/finance/pages/RevenueReconciliation';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { IntegrationHub } from './features/admin/pages/IntegrationHub';
import { ETLDesigner } from './features/admin/pages/ETLDesigner';
import { EVVDashboard } from './features/evv/pages/EVVDashboard';
import { EVVVisitDetails } from './features/evv/pages/EVVVisitDetails';
import { EVVFraudDetection } from './features/evv/pages/EVVFraudDetection';
import { MCPAgentHub } from './features/developer/pages/MCPAgentHub';
import { AIModelMonitor } from './features/developer/pages/AIModelMonitor';
import { DataSchemaExplorer } from './features/developer/pages/DataSchemaExplorer';
import { DriftLogs } from './features/developer/pages/ai/DriftLogs';
import { ModelRegistry } from './features/developer/pages/ai/ModelRegistry';
import { FeatureImportance } from './features/developer/pages/ai/FeatureImportance';
import { PSIDistribution } from './features/developer/pages/ai/PSIDistribution';
import { ClaimsAnalytics } from './features/analytics/pages/ClaimsAnalytics';
import { InsuranceVerification } from './features/insurance/pages/InsuranceVerification';
import { Reporting } from './features/reporting/pages/Reporting';
import { PatientAccounts } from './features/patients/pages/PatientAccounts';
import { APIManager } from './features/admin/pages/APIManager';
import { Scheduler } from './features/admin/pages/Scheduler';
import { IntegrationDebugger } from './features/admin/pages/IntegrationDebugger';
// import { LidaAnalytics } from './features/analytics/pages/LidaAnalytics'; // Removed in favor of new module
import { ReconciliationAdvanced } from './features/finance/pages/ReconciliationAdvanced';
import { TransactionLedger } from './features/finance/pages/TransactionLedger';
import { AIInsightDetail } from './features/finance/pages/AIInsightDetail';
import { StateMandates } from './features/evv/pages/StateMandates';
import { PayerVariance } from './features/denials/pages/PayerVariance';
import { CollectionsCommand } from './features/collections/pages/CollectionsCommand';
import { InsuranceLayout } from './features/insurance/pages/InsuranceLayout';
import { PatientAccessHub } from './features/insurance/pages/PatientAccessHub';
import { PriorAuthManager } from './features/insurance/pages/PriorAuthManager';
import { BenefitAnalytics } from './features/insurance/pages/BenefitAnalytics';
import { VerificationHistory } from './features/insurance/pages/VerificationHistory';
import { ClaimsLayout } from './features/claims/pages/ClaimsLayout';
import { ClaimsOverview } from './features/claims/pages/ClaimsOverview';
import { ClaimsWorkQueue } from './features/claims/pages/ClaimsWorkQueue';
import { BatchActions } from './features/claims/pages/BatchActions';
import { MassScrub } from './features/claims/pages/MassScrub';
import { RuleEngine } from './features/claims/pages/RuleEngine';
import { PreBatchScrubLayout } from './features/claims/pages/PreBatchScrubLayout';
import { ScrubDashboard } from './features/claims/pages/ScrubDashboard';
import { ValidationQueue } from './features/claims/pages/ValidationQueue';
import { AutoFixCenter } from './features/claims/pages/AutoFixCenter';
import { ClaimValidationDetail } from './features/claims/pages/ClaimValidationDetail';
import { LidaLayout } from './features/lida/pages/LidaLayout';
import { LidaDashboard } from './features/lida/pages/LidaDashboard';
import { LidaChat } from './features/lida/pages/LidaChat';
import { MECEReportBuilder } from './features/lida/pages/MECEReportBuilder';
import { TicketHub } from './features/lida/pages/TicketHub';

import { SettingsLayout } from './features/settings/pages/SettingsLayout';
import { BillingRules } from './features/settings/pages/BillingRules';
import { AIConfiguration } from './features/settings/pages/AIConfiguration';
import { UserManagement } from './features/settings/pages/UserManagement';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<CommandCenter />} />
                <Route path="command-center" element={<CommandCenter />} />
                <Route path="executive-dashboard" element={<ExecutiveDashboard />} />
                <Route path="claims-scrubbing" element={<ClaimScrubbing />} />
                <Route path="claims" element={<ClaimsLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<ClaimsOverview />} />
                    <Route path="work-queue" element={<ClaimsWorkQueue />} />
                    <Route path="batch" element={<BatchActions />} />
                    <Route path="mass-scrub" element={<MassScrub />} />
                    <Route path="rules" element={<RuleEngine />} />
                    <Route path="pre-batch-scrub" element={<PreBatchScrubLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<ScrubDashboard />} />
                        <Route path="queue" element={<ValidationQueue />} />
                        <Route path="auto-fix" element={<AutoFixCenter />} />
                        <Route path="claim/:claimId" element={<ClaimValidationDetail />} />
                    </Route>
                </Route>
                <Route path="ai-coding" element={<AICodingLayout />}>
                    <Route index element={<CodingOptimizer />} />
                    <Route path="audit" element={<AICodingAudit />} />
                    <Route path="compliance" element={<AICodingCompliance />} />
                    <Route path="rulebook" element={<AICodingRulebook />} />
                </Route>
                <Route path="denials" element={<DenialManagement />} />
                <Route path="denials/appeal" element={<AppealGenerator />} />
                <Route path="denials/analytics" element={<DenialAnalytics />} />
                <Route path="denials/prevention-dashboard" element={<DenialPreventionDashboard />} />
                <Route path="denials/high-risk" element={<HighRiskClaims />} />
                <Route path="denials/claim/:id" element={<ClaimDenialDetail />} />
                <Route path="denials/prediction/:id" element={<DenialPredictionAnalysis />} />
                <Route path="denials/workspace" element={<PreventionWorkspace />} />
                <Route path="denials/workflow-log" element={<DenialWorkflowLog />} />
                <Route path="automation/evv-retry" element={<EVVAutoRetryManager />} />
                <Route path="automation/cob-manager" element={<COBAutoManager />} />
                <Route path="reconciliation/bank-view" element={<BankReconciliation />} />
                <Route path="collections" element={<CollectionsHub />} />
                <Route path="collections/tasks" element={<CollectionsQueue />} />
                <Route path="collections/portal" element={<PaymentPortal />} />
                <Route path="collections/account/:accountId" element={<AccountDetailsPage />} />
                <Route path="collections/alerts" element={<AlertsQueue />} />
                <Route path="collections/recovery-insights" element={<RecoveryInsights />} />
                <Route path="collections/propensity/:accountId" element={<PropensityScoreDetails />} />
                <Route path="collections/action-center/:accountId" element={<CollectionsActionCenter />} />
                <Route path="collections/performance" element={<PerformanceAnalytics />} />
                <Route path="collections/timeline" element={<CollectionsTimeline />} />
                <Route path="finance/payer-performance" element={<PayerPerformance />} />
                <Route path="finance/audit-log" element={<AuditLog />} />
                <Route path="finance/reconciliation" element={<RevenueReconciliation />} />
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/integrations" element={<IntegrationHub />} />
                <Route path="admin/etl-designer" element={<ETLDesigner />} />
                <Route path="evv/dashboard" element={<EVVDashboard />} />
                <Route path="evv/visit-details" element={<EVVVisitDetails />} />
                <Route path="evv/fraud-detection" element={<EVVFraudDetection />} />
                <Route path="developer/mcp-agents" element={<MCPAgentHub />} />
                <Route path="developer/ai-monitor" element={<AIModelMonitor />}>
                    <Route path="drift-logs" element={<DriftLogs />} />
                    <Route path="registry" element={<ModelRegistry />} />
                    <Route path="feature-importance" element={<FeatureImportance />} />
                    <Route path="psi" element={<PSIDistribution />} />
                </Route>
                <Route path="developer/data-schema" element={<DataSchemaExplorer />} />
                <Route path="claims-analytics" element={<ClaimsAnalytics />} />
                <Route path="reporting" element={<Reporting />} />
                <Route path="reporting" element={<Reporting />} />
                <Route path="insurance-verification" element={<InsuranceLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<PatientAccessHub />} />
                    <Route path="eligibility" element={<InsuranceVerification />} />
                    <Route path="auths" element={<PriorAuthManager />} />
                    <Route path="benefits" element={<BenefitAnalytics />} />
                    <Route path="history" element={<VerificationHistory />} />
                </Route>
                <Route path="admin/api-manager" element={<APIManager />} />
                <Route path="admin/scheduler" element={<Scheduler />} />
                <Route path="admin/debugger" element={<IntegrationDebugger />} />
                <Route path="lida" element={<LidaLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<LidaDashboard />} />
                    <Route path="chat" element={<LidaChat />} />
                    <Route path="reports" element={<MECEReportBuilder />} />
                    <Route path="tickets" element={<TicketHub />} />
                </Route>

                <Route path="settings" element={<SettingsLayout />}>
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="billing-rules" element={<BillingRules />} />
                    <Route path="ai-config" element={<AIConfiguration />} />
                    <Route path="users" element={<UserManagement />} />
                    {/* Placeholders for links not yet implemented */}
                    <Route path="profile" element={<div className="p-10 font-bold text-gray-500">Practice Profile (Coming Soon)</div>} />
                    <Route path="compliance" element={<div className="p-10 font-bold text-gray-500">Compliance & Audit (Coming Soon)</div>} />
                </Route>

                <Route path="finance/reconciliation-advanced" element={<ReconciliationAdvanced />} />
                <Route path="finance/reconciliation/transaction/:transactionId" element={<TransactionLedger />} />
                <Route path="finance/insights/:insightId" element={<AIInsightDetail />} />
                <Route path="evv/mandates" element={<StateMandates />} />
                <Route path="denials/variance" element={<PayerVariance />} />
                <Route path="collections/command" element={<CollectionsCommand />} />
                <Route path="patient-accounts" element={<PatientAccounts />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default App;
