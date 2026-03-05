import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockARData } from '../data/mockARData';
import { CollectionsStrategyModal } from '../components/modals/CollectionsStrategyModal';

export function AccountDetailsPage() {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [showStrategyModal, setShowStrategyModal] = useState(false);

    // In a real app, fetch account details by accountId
    const account = mockARData.accountDetails;
    const timeline = mockARData.activityTimeline;
    const docs = mockARData.documents;

    const formatCurrency = (amount) => `$${amount.toLocaleString()}`;
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const getRiskColor = (score) => {
        if (score >= 80) return 'bg-red-500';
        if (score >= 60) return 'bg-orange-500';
        return 'bg-amber-500';
    };

    const getActivityIcon = (type) => {
        const icons = {
            call: 'call',
            email: 'email',
            status_change: 'sync_alt',
            note: 'note_add'
        };
        return icons[type] || 'description';
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="max-w-[1600px] mx-auto px-10 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
                    <button onClick={() => navigate('/collections')} className="hover:text-primary transition-colors">
                        Collections Hub
                    </button>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-slate-900 dark:text-white font-medium">Account Details</span>
                </div>

                {/* Header Section */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 mb-6 shadow-sm">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                    {account.patient.name}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${account.status === 'In Collections'
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}>
                                    {account.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">MRN</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{account.patient.mrn}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">DOB</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(account.patient.dob)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{account.patient.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned To</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{account.assignedTo}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 min-w-[140px]">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Balance</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(account.balance.total)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 min-w-[140px]">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Days in A/R</p>
                                <p className="text-2xl font-black text-red-500">{account.daysInAR}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 min-w-[140px]">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Risk Score</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getRiskColor(account.riskScore)}`}></div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{account.riskScore}</p>
                                </div>
                            </div>
                            <div
                                onClick={() => navigate(`/collections/propensity/${accountId}`)}
                                className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 min-w-[140px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Propensity Score</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-black text-primary">{account.propensityScore}</p>
                                    <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => navigate(`/collections/action-center/${accountId}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">rocket_launch</span>
                            <span>Action Center</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <span className="material-symbols-outlined text-sm">call</span>
                            <span>Quick Call</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <span className="material-symbols-outlined text-sm">email</span>
                            <span>Quick Email</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors ml-auto">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            <span>Mark Complete</span>
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-200 dark:border-slate-800">
                        {['overview', 'claims', 'timeline', 'documents', 'insights'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 text-sm font-bold capitalize transition-colors ${activeTab === tab
                                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Aging Breakdown */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Aging Breakdown</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        {Object.entries(account.balance.aging).map(([bucket, amount]) => (
                                            <div key={bucket} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{bucket}</p>
                                                <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payer Information */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payer Information</h3>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Payer Name</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{account.payer.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Policy Number</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{account.payer.policyNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{account.payer.phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Contact Person</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{account.payer.contactPerson}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Claim Address</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{account.payer.claimAddress}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Claims Tab */}
                        {activeTab === 'claims' && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Claims</h3>
                                <div className="space-y-4">
                                    {account.claims.map((claim) => (
                                        <div key={claim.claimId} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{claim.claimId}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">DOS: {formatDate(claim.dos)}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${claim.status === 'Denied'
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                    }`}>
                                                    {claim.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">CPT Code</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{claim.cpt}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{claim.description}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Charged / Allowed</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(claim.chargedAmount)} / {formatCurrency(claim.allowedAmount)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Balance</p>
                                                    <p className="text-sm font-bold text-red-500">{formatCurrency(claim.balance)}</p>
                                                </div>
                                            </div>
                                            {claim.denialReason && (
                                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                                    <p className="text-xs font-bold text-red-700 dark:text-red-400">
                                                        Denial: {claim.denialReason} ({claim.denialCode})
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timeline Tab */}
                        {activeTab === 'timeline' && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Activity Timeline</h3>
                                <div className="space-y-4">
                                    {timeline.map((activity, index) => (
                                        <div key={activity.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary text-sm">
                                                        {getActivityIcon(activity.type)}
                                                    </span>
                                                </div>
                                                {index < timeline.length - 1 && (
                                                    <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 mt-2"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 pb-6">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{activity.action}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {activity.user} • {formatDate(activity.timestamp)}
                                                        </p>
                                                    </div>
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        {activity.outcome}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">{activity.notes}</p>
                                                {activity.duration && (
                                                    <p className="text-xs text-slate-400 mt-1">Duration: {activity.duration}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Documents</h3>
                                <div className="space-y-3">
                                    {docs.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary">description</span>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{doc.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {doc.type} • {doc.size} • Uploaded by {doc.uploadedBy}
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="text-primary hover:text-blue-700 transition-colors">
                                                <span className="material-symbols-outlined">download</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <span className="material-symbols-outlined text-sm">upload_file</span>
                                    <span>Upload Document</span>
                                </button>
                            </div>
                        )}

                        {/* AI Insights Tab */}
                        {activeTab === 'insights' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Insights & Recommendations</h3>
                                    <button
                                        onClick={() => setShowStrategyModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">psychology</span>
                                        <span>View AI Strategy</span>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {account.aiInsights.map((insight, index) => (
                                        <div key={index} className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                                            <div className="flex items-start gap-3">
                                                <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${insight.priority === 'high'
                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                            }`}>
                                                            {insight.priority} Priority
                                                        </span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            Confidence: {insight.confidence}%
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                        {insight.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Strategy Modal */}
                {showStrategyModal && (
                    <CollectionsStrategyModal
                        accountId={accountId}
                        onClose={() => setShowStrategyModal(false)}
                    />
                )}
            </div>
        </div>
    );
}
