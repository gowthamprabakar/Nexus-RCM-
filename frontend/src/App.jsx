import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ExecutiveDashboard } from './pages/dashboard/ExecutiveDashboard';

import { ClaimScrubbing } from './pages/claims/ClaimScrubbing';
import { AICodingLayout } from './pages/coding/AICodingLayout';
import { CodingOptimizer } from './pages/coding/CodingOptimizer';
import { AICodingAudit } from './pages/coding/AICodingAudit';
import { AICodingCompliance } from './pages/coding/AICodingCompliance';
import { AICodingRulebook } from './pages/coding/AICodingRulebook';
import { DenialManagement } from './pages/denials/DenialManagement';
import { AppealGenerator } from './pages/denials/AppealGenerator';
import { DenialAnalytics } from './pages/denials/DenialAnalytics';
import { CollectionsHub } from './pages/collections/CollectionsHub';
import { CollectionsQueue } from './pages/collections/CollectionsQueue';
import { PaymentPortal } from './pages/collections/PaymentPortal';
import { PayerPerformance } from './pages/finance/PayerPerformance';
import { AuditLog } from './pages/finance/AuditLog';
import { RevenueReconciliation } from './pages/finance/RevenueReconciliation';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { IntegrationHub } from './pages/admin/IntegrationHub';
import { ETLDesigner } from './pages/admin/ETLDesigner';
import { EVVDashboard } from './pages/evv/EVVDashboard';
import { EVVVisitDetails } from './pages/evv/EVVVisitDetails';
import { EVVFraudDetection } from './pages/evv/EVVFraudDetection';
import { MCPAgentHub } from './pages/developer/MCPAgentHub';
import { AIModelMonitor } from './pages/developer/AIModelMonitor';
import { DataSchemaExplorer } from './pages/developer/DataSchemaExplorer';
import { DriftLogs } from './pages/developer/ai/DriftLogs';
import { ModelRegistry } from './pages/developer/ai/ModelRegistry';
import { FeatureImportance } from './pages/developer/ai/FeatureImportance';
import { PSIDistribution } from './pages/developer/ai/PSIDistribution';
import { ClaimsAnalytics } from './pages/analytics/ClaimsAnalytics';
import { InsuranceVerification } from './pages/insurance/InsuranceVerification';
import { Reporting } from './pages/reporting/Reporting';
import { PatientAccounts } from './pages/patients/PatientAccounts';
import { APIManager } from './pages/admin/APIManager';
import { Scheduler } from './pages/admin/Scheduler';
import { IntegrationDebugger } from './pages/admin/IntegrationDebugger';
// import { LidaAnalytics } from './pages/analytics/LidaAnalytics'; // Removed in favor of new module
import { ReconciliationAdvanced } from './pages/finance/ReconciliationAdvanced';
import { StateMandates } from './pages/evv/StateMandates';
import { PayerVariance } from './pages/denials/PayerVariance';
import { CollectionsCommand } from './pages/collections/CollectionsCommand';
import { InsuranceLayout } from './pages/insurance/InsuranceLayout';
import { PatientAccessHub } from './pages/insurance/PatientAccessHub';
import { PriorAuthManager } from './pages/insurance/PriorAuthManager';
import { BenefitAnalytics } from './pages/insurance/BenefitAnalytics';
import { VerificationHistory } from './pages/insurance/VerificationHistory';
import { ClaimsLayout } from './pages/claims/ClaimsLayout';
import { ClaimsOverview } from './pages/claims/ClaimsOverview';
import { ClaimsWorkQueue } from './pages/claims/ClaimsWorkQueue';
import { BatchActions } from './pages/claims/BatchActions';
import { MassScrub } from './pages/claims/MassScrub';
import { RuleEngine } from './pages/claims/RuleEngine';
import { LidaLayout } from './pages/lida/LidaLayout';
import { LidaDashboard } from './pages/lida/LidaDashboard';
import { LidaChat } from './pages/lida/LidaChat';
import { MECEReportBuilder } from './pages/lida/MECEReportBuilder';
import { TicketHub } from './pages/lida/TicketHub';

import { SettingsLayout } from './pages/settings/SettingsLayout';
import { BillingRules } from './pages/settings/BillingRules';
import { AIConfiguration } from './pages/settings/AIConfiguration';
import { UserManagement } from './pages/settings/UserManagement';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<ExecutiveDashboard />} />
                <Route path="claims-scrubbing" element={<ClaimScrubbing />} />
                <Route path="claims" element={<ClaimsLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<ClaimsOverview />} />
                    <Route path="work-queue" element={<ClaimsWorkQueue />} />
                    <Route path="batch" element={<BatchActions />} />
                    <Route path="mass-scrub" element={<MassScrub />} />
                    <Route path="rules" element={<RuleEngine />} />
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
                <Route path="collections" element={<CollectionsHub />} />
                <Route path="collections/tasks" element={<CollectionsQueue />} />
                <Route path="collections/portal" element={<PaymentPortal />} />
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
