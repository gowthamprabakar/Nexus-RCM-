import React, { useState } from 'react';

export function DataSchemaExplorer() {
 const [activeTab, setActiveTab] = useState('mapping');

 const schemaTabs = [
 { id: 'mapping', label: 'Source Mapping' },
 { id: 'metadata', label: 'Field Metadata' },
 { id: 'validation', label: 'Validation Rules' },
 ];

 const schemaTree = [
 { id: 'claims', icon: 'description', label: 'Claims', active: true, children: ['Professional Claims', 'Institutional Claims', 'Claim Line Items'] },
 { id: 'patients', icon: 'group', label: 'Patients' },
 { id: 'providers', icon: 'medical_services', label: 'Providers' },
 { id: 'payments', icon: 'payments', label: 'Payments' },
 { id: 'common', icon: 'inventory_2', label: 'Common Entities' },
 ];

 return (
 <div className="text-th-heading font-sans h-screen flex flex-col overflow-hidden">
 <div className="flex flex-1 overflow-hidden">
 {/* Left Sidebar: Global Schema Tree */}
 <aside className="hidden lg:flex w-72 bg-th-surface-raised border-r border-th-border flex-col shrink-0">
 <div className="p-4 border-b border-th-border">
 <h1 className="text-th-heading text-base font-bold flex items-center gap-2">
 Global Schema Tree
 </h1>
 <p className="text-th-secondary text-xs font-normal mt-1"><span className="tabular-nums">642</span> Connected Data Sources</p>
 </div>
 <div className="flex-1 overflow-y-auto p-2">
 <div className="flex flex-col gap-1">
 {schemaTree.map(item => (
 <div key={item.id}>
 <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${item.active ? 'bg-primary/10 text-primary' : 'text-th-secondary hover:bg-th-surface-overlay/30'}`}>
 <span className="material-symbols-outlined text-lg">{item.icon}</span>
 <p className={`text-sm ${item.active ? 'font-semibold' : 'font-medium'}`}>{item.label}</p>
 <span className="material-symbols-outlined ml-auto text-sm">{item.active ? 'expand_more' : 'chevron_right'}</span>
 </div>
 {item.children && (
 <div className="ml-4 border-l-2 border-primary/20 pl-2 flex flex-col gap-1 mt-1">
 {item.children.map((child, idx) => (
 <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${idx === 0 ? 'text-primary bg-primary/5' : 'text-th-secondary hover:bg-th-surface-overlay/30'}`}>
 <span className="material-symbols-outlined text-base">table_chart</span>
 {child}
 </div>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </aside>

 {/* Main Workspace */}
 <main className="flex-1 overflow-y-auto">
 {/* Breadcrumbs & Heading */}
 <div className="px-8 pt-6">
 <div className="flex flex-wrap gap-2 mb-4">
 <a className="text-th-muted text-xs font-medium hover:text-primary flex items-center" href="#">
 Unified Model
 <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
 </a>
 <a className="text-th-muted text-xs font-medium hover:text-primary flex items-center" href="#">
 Claims
 <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
 </a>
 <span className="text-th-heading text-xs font-bold">Professional Claims</span>
 </div>
 <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
 <div className="flex flex-col gap-1">
 <h2 className="text-th-heading tracking-tight text-2xl font-bold leading-tight flex items-center gap-2">
 Professional Claims Schema
 <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Standard V4.2</span>
 </h2>
 <p className="text-th-secondary text-sm font-normal max-w-2xl">Manage mapping definitions from Epic, Cerner, and HL7 sources to unified internal RCM record standards.</p>
 </div>
 <div className="flex gap-2">
 <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-th-surface-raised border border-th-border text-th-heading text-sm font-medium hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-lg mr-2">download</span>
 Export Schema
 </button>
 <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-primary text-th-heading text-sm font-bold hover:bg-blue-600 shadow-sm transition-colors">
 <span className="material-symbols-outlined text-lg mr-2">save</span>
 Save Mapping
 </button>
 </div>
 </div>
 {/* Tabs */}
 <div className="border-b border-th-border flex gap-8 mb-6">
 {schemaTabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex flex-col items-center justify-center border-b-2 pb-3 pt-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-th-muted hover:text-primary'}`}
 >
 <p className="text-sm font-bold tracking-tight">{tab.label}</p>
 </button>
 ))}
 <div className="ml-auto pb-3 flex items-center">
 <span className="ai-descriptive">Descriptive AI</span>
 </div>
 </div>
 </div>

 {/* Mapping Grid */}
 <div className="px-8 pb-10">
 <div className="grid grid-cols-1 gap-4">
 {/* Mapping Card 1 */}
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-primary rounded-xl overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="bg-th-surface-overlay/50 px-4 py-2 flex items-center justify-between border-b border-th-border">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-primary text-lg">key</span>
 <span className="text-xs font-bold font-mono text-primary">CLAIM_ID</span>
 <span className="text-[10px] text-th-secondary px-1.5 py-0.5 border border-th-border-strong rounded">Primary Key</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="material-symbols-outlined text-th-secondary text-lg">info</span>
 <span className="material-symbols-outlined text-th-secondary text-lg">more_vert</span>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
 <div className="flex flex-col gap-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Source Fields</span>
 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-2 p-2 rounded bg-th-surface-overlay/50 border border-th-border">
 <span className="text-[10px] bg-green-900/50 text-green-400 px-1 rounded font-bold">Epic</span>
 <span className="text-xs font-mono text-th-heading">patient_claim_no</span>
 </div>
 <div className="flex items-center gap-2 p-2 rounded bg-th-surface-overlay/50 border border-th-border">
 <span className="text-[10px] bg-orange-900/50 text-orange-400 px-1 rounded font-bold">Cerner</span>
 <span className="text-xs font-mono text-th-heading">CLAIM_NUM_EXT</span>
 </div>
 </div>
 </div>
 <div className="flex flex-col items-center justify-center px-4 text-center">
 <span className="material-symbols-outlined text-th-muted text-3xl">trending_flat</span>
 <div className="mt-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Trim & Uppercase</div>
 </div>
 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Field Metadata</span>
 <span className="text-xs text-green-400 font-bold flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">check_circle</span>
 Validated
 </span>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className="bg-th-surface-overlay/50 p-2 rounded border border-th-border">
 <span className="block text-[9px] text-th-muted uppercase">Type</span>
 <span className="text-xs font-bold text-th-heading">VARCHAR(64)</span>
 </div>
 <div className="bg-th-surface-overlay/50 p-2 rounded border border-th-border">
 <span className="block text-[9px] text-th-muted uppercase">Privacy</span>
 <span className="text-xs font-bold text-th-heading">Non-Sensitive</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Mapping Card 2 (Sensitive PHI) */}
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-yellow-500 rounded-xl overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="bg-th-surface-overlay/50 px-4 py-2 flex items-center justify-between border-b border-th-border">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-th-muted text-lg">subject</span>
 <span className="text-xs font-bold font-mono text-th-heading">PATIENT_SSN</span>
 <span className="text-[10px] bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded flex items-center gap-1">
 <span className="material-symbols-outlined text-[12px] text-yellow-500">warning</span>
 HIPAA PHI
 </span>
 </div>
 <div className="flex items-center gap-3">
 <span className="material-symbols-outlined text-th-secondary text-lg">info</span>
 <span className="material-symbols-outlined text-th-secondary text-lg">more_vert</span>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
 <div className="flex flex-col gap-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Source Fields</span>
 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-2 p-2 rounded bg-th-surface-overlay/50 border border-th-border">
 <span className="text-[10px] bg-green-900/50 text-green-400 px-1 rounded font-bold">Epic</span>
 <span className="text-xs font-mono text-th-heading">ssn_no_formatted</span>
 </div>
 </div>
 </div>
 <div className="flex flex-col items-center justify-center px-4 text-center">
 <span className="material-symbols-outlined text-th-muted text-3xl">trending_flat</span>
 <div className="mt-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Regex Strip & Mask</div>
 </div>
 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Field Metadata</span>
 <span className="text-xs text-blue-400 font-bold flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">verified_user</span>
 Encrypted
 </span>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className="bg-th-surface-overlay/50 p-2 rounded border border-th-border">
 <span className="block text-[9px] text-th-muted uppercase">Type</span>
 <span className="text-xs font-bold text-th-heading">INT(9)</span>
 </div>
 <div className="bg-th-surface-overlay/50 p-2 rounded border border-th-border">
 <span className="block text-[9px] text-th-muted uppercase">Privacy</span>
 <span className="text-xs font-bold text-yellow-400">Restricted PII</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </main>

 {/* Right Sidebar: Lineage Panel */}
 <aside className="hidden xl:flex w-80 bg-th-surface-raised border-l border-th-border flex-col shrink-0">
 <div className="p-4 border-b border-th-border flex items-center justify-between">
 <h1 className="text-th-heading text-base font-bold">Cross-System Lineage</h1>
 <button className="text-primary hover:text-blue-400 transition-colors">
 <span className="material-symbols-outlined text-lg">fullscreen</span>
 </button>
 </div>
 <div className="flex-1 overflow-y-auto p-6">
 <div className="flex flex-col items-center">
 <div className="w-full flex flex-col items-center gap-4">
 <div className="w-full bg-th-surface-overlay/50 p-3 rounded-lg border border-th-border relative">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-green-900/50 flex items-center justify-center">
 <span className="material-symbols-outlined text-green-400 text-lg">database</span>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Source System</p>
 <p className="text-sm font-bold text-th-heading">Epic Chronicles</p>
 </div>
 </div>
 </div>
 <span className="material-symbols-outlined text-th-muted">arrow_downward</span>
 <div className="w-full bg-th-surface-overlay/50 p-3 rounded-lg border border-th-border">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-blue-900/50 flex items-center justify-center">
 <span className="material-symbols-outlined text-primary text-lg">settings_suggest</span>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">ETL / Normalization</p>
 <p className="text-sm font-bold text-th-heading">Airflow: RCM_Ingest_V4</p>
 </div>
 </div>
 </div>
 <span className="material-symbols-outlined text-th-muted">arrow_downward</span>
 <div className="w-full bg-primary/10 p-3 rounded-lg border-2 border-primary">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
 <span className="material-symbols-outlined text-th-heading text-lg">hub</span>
 </div>
 <div>
 <p className="text-[10px] font-bold text-primary uppercase">Current Entity</p>
 <p className="text-sm font-bold text-th-heading">Unified Professional Claim</p>
 </div>
 </div>
 </div>
 <span className="material-symbols-outlined text-th-muted">arrow_downward</span>
 <div className="w-full bg-th-surface-overlay/50 p-3 rounded-lg border border-th-border">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-purple-900/50 flex items-center justify-center">
 <span className="material-symbols-outlined text-purple-400 text-lg">analytics</span>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Downstream Consumer</p>
 <p className="text-sm font-bold text-th-heading">Revenue Forecaster AI</p>
 </div>
 </div>
 </div>
 </div>

 <div className="w-full mt-10 space-y-4">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Health Metrics</h3>
 <div className="space-y-2">
 <div className="flex justify-between items-center text-xs">
 <span className="text-th-secondary">Data Freshness</span>
 <span className="font-bold text-green-400 tabular-nums">4m ago</span>
 </div>
 <div className="w-full bg-th-surface-overlay h-1.5 rounded-full overflow-hidden">
 <div className="bg-green-500 h-full" style={{ width: '95%' }}></div>
 </div>
 <div className="flex justify-between items-center text-xs">
 <span className="text-th-secondary">Mapping Coverage</span>
 <span className="font-bold text-primary tabular-nums">88%</span>
 </div>
 <div className="w-full bg-th-surface-overlay h-1.5 rounded-full overflow-hidden">
 <div className="bg-primary h-full" style={{ width: '88%' }}></div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </aside>
 </div>
 </div>
 );
}
