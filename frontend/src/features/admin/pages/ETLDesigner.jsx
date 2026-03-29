import React from 'react';

export function ETLDesigner() {
 return (
 <div className="flex font-sans h-full overflow-hidden flex-col">
 <main className="flex flex-1 overflow-hidden relative">
 {/* Left Sidebar: Asset Library */}
 <aside className="w-64 border-r border-th-border bg-th-surface-raised flex flex-col z-10">
 <div className="p-4 border-b border-th-border">
 <div className="relative">
 <span className="material-symbols-outlined absolute left-3 top-2 text-th-secondary text-lg">search</span>
 <input className="w-full bg-th-surface-base border border-th-border rounded-lg pl-10 text-sm focus:ring-1 focus:ring-blue-500 text-th-heading py-2" placeholder="Search components..." type="text" />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-6">
 <div>
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-3">Extractors (EHR)</h3>
 <div className="space-y-2">
 <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-th-border hover:border-blue-500 cursor-grab bg-th-surface-base transition-colors">
 <span className="material-symbols-outlined text-blue-400">api</span>
 <span className="text-sm font-medium text-th-heading">Epic FHIR R4</span>
 </div>
 <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-th-border hover:border-blue-500 cursor-grab bg-th-surface-base transition-colors">
 <span className="material-symbols-outlined text-blue-400">database</span>
 <span className="text-sm font-medium text-th-heading">Cerner HL7 v2</span>
 </div>
 <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-th-border hover:border-blue-500 cursor-grab bg-th-surface-base transition-colors">
 <span className="material-symbols-outlined text-blue-400">lan</span>
 <span className="text-sm font-medium text-th-heading">Allscripts API</span>
 </div>
 </div>
 </div>
 <div>
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-3">Extractors (Aggregators)</h3>
 <div className="space-y-2">
 <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-th-border hover:border-blue-500 cursor-grab bg-th-surface-base transition-colors">
 <span className="material-symbols-outlined text-cyan-400">cloud_sync</span>
 <span className="text-sm font-medium text-th-heading">Availity</span>
 </div>
 <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-th-border hover:border-blue-500 cursor-grab bg-th-surface-base transition-colors">
 <span className="material-symbols-outlined text-cyan-400">swap_horiz</span>
 <span className="text-sm font-medium text-th-heading">Change Healthcare</span>
 </div>
 <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-th-border hover:border-blue-500 cursor-grab bg-th-surface-base transition-colors">
 <span className="material-symbols-outlined text-cyan-400">hub</span>
 <span className="text-sm font-medium text-th-heading">Waystar</span>
 </div>
 </div>
 </div>
 <div>
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-3">Transformers</h3>
 <div className="space-y-2">
 <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-th-border hover:border-blue-500 cursor-grab bg-th-surface-base transition-colors">
 <span className="material-symbols-outlined text-purple-400">enhanced_encryption</span>
 <span className="text-sm font-medium text-th-heading">De-identification</span>
 </div>
 <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-th-border hover:border-blue-500 cursor-grab bg-th-surface-base transition-colors">
 <span className="material-symbols-outlined text-purple-400">alt_route</span>
 <span className="text-sm font-medium text-th-heading">Schema Mapper</span>
 </div>
 <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-th-border hover:border-blue-500 cursor-grab bg-th-surface-base transition-colors">
 <span className="material-symbols-outlined text-purple-400">code</span>
 <span className="text-sm font-medium text-th-heading">Python Script</span>
 </div>
 </div>
 </div>
 <div>
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-3">Loaders</h3>
 <div className="space-y-2">
 <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-th-border hover:border-blue-500 cursor-grab bg-th-surface-base transition-colors">
 <span className="material-symbols-outlined text-orange-400">storage</span>
 <span className="text-sm font-medium text-th-heading">RCM Core DB</span>
 </div>
 </div>
 </div>
 </div>
 </aside>

 {/* Main Content: DAG Editor */}
 <div className="flex-1 flex flex-col relative bg-th-surface-base overflow-hidden">
 {/* Background Grid Pattern */}
 <div className="absolute inset-0 pointer-events-none opacity-20" style={{
 backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
 backgroundSize: '30px 30px'
 }}></div>

 {/* Canvas / Editor Area */}
 <div className="flex-1 relative overflow-hidden">
 {/* SVG Connections */}
 <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
 <path className="drop-shadow-[0_0_4px_#2563eb] opacity-60" d="M 320 200 C 400 200, 400 300, 480 300" fill="none" stroke="#2563eb" strokeWidth="2"></path>
 <path className="drop-shadow-[0_0_4px_#2563eb] opacity-60" d="M 320 400 C 400 400, 400 300, 480 300" fill="none" stroke="#2563eb" strokeWidth="2"></path>
 <path className="drop-shadow-[0_0_4px_#2563eb]" d="M 720 300 C 800 300, 800 300, 880 300" fill="none" stroke="#2563eb" strokeWidth="2"></path>
 </svg>

 {/* Node 1: EHR Source (Epic) */}
 <div className="absolute top-24 left-32 w-48 bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl shadow-2xl p-4 z-10 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-3">
 <div className="p-1.5 bg-blue-500/10 rounded-lg">
 <span className="material-symbols-outlined text-blue-500 text-lg">broadcast_on_home</span>
 </div>
 <span className="text-[10px] text-emerald-500 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">IDLE</span>
 </div>
 <h4 className="text-sm font-bold mb-1 text-th-heading">Epic FHIR Ingest</h4>
 <p className="text-[10px] text-th-muted mb-3">R4 Patient/Encounter</p>
 <div className="pt-2 border-t border-th-border flex justify-between items-end">
 <div className="flex flex-col">
 <span className="text-[10px] text-th-muted uppercase">Volume</span>
 <span className="text-xs font-mono font-bold text-th-heading tabular-nums">1.2k / s</span>
 </div>
 <div className="w-12 h-6 flex items-end gap-0.5">
 <div className="w-1 bg-blue-500/20 h-2"></div>
 <div className="w-1 bg-blue-500/40 h-4"></div>
 <div className="w-1 bg-blue-500/60 h-3"></div>
 <div className="w-1 bg-blue-600 h-5"></div>
 </div>
 </div>
 </div>

 {/* Node 2: Aggregator Source (Availity) */}
 <div className="absolute top-[350px] left-32 w-48 bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 rounded-xl shadow-2xl p-4 z-10 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-3">
 <div className="p-1.5 bg-cyan-500/10 rounded-lg">
 <span className="material-symbols-outlined text-cyan-500 text-lg">cloud_sync</span>
 </div>
 <span className="text-[10px] text-emerald-500 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">ACTIVE</span>
 </div>
 <h4 className="text-sm font-bold mb-1 text-th-heading">Availity Feed</h4>
 <p className="text-[10px] text-th-muted mb-3">Eligibility + Claims</p>
 <div className="pt-2 border-t border-th-border flex justify-between items-end">
 <div className="flex flex-col">
 <span className="text-[10px] text-th-muted uppercase">Volume</span>
 <span className="text-xs font-mono font-bold text-th-heading tabular-nums">4.8k / s</span>
 </div>
 <div className="w-12 h-6 flex items-end gap-0.5">
 <div className="w-1 bg-cyan-500/20 h-3"></div>
 <div className="w-1 bg-cyan-500/40 h-5"></div>
 <div className="w-1 bg-cyan-500/60 h-2"></div>
 <div className="w-1 bg-cyan-500 h-4"></div>
 </div>
 </div>
 </div>

 {/* Node 3: Transformation Logic (SELECTED) */}
 <div className="absolute top-1/2 left-[480px] -translate-y-1/2 w-60 bg-th-surface-raised border-2 border-blue-500 rounded-xl shadow-[0_0_25px_rgba(37,99,235,0.3)] p-5 z-20">
 <div className="flex items-center justify-between mb-4">
 <div className="p-2 bg-purple-500/10 rounded-lg">
 <span className="material-symbols-outlined text-purple-500">psychology</span>
 </div>
 <div className="flex flex-col items-end">
 <span className="text-[10px] text-blue-400 font-bold px-2 py-0.5 bg-blue-500/10 rounded mb-1">PROCESSING</span>
 <span className="text-[9px] text-th-muted font-mono tracking-tighter">Latency: 12ms</span>
 </div>
 </div>
 <h4 className="text-base font-bold mb-1 text-th-heading">HIPAA De-id Core</h4>
 <p className="text-xs text-th-secondary mb-4 leading-relaxed">Advanced scrub for patient identifiable data.</p>
 <div className="grid grid-cols-2 gap-2">
 <div className="bg-th-surface-base p-2 rounded border border-th-border">
 <div className="text-[9px] text-th-muted uppercase mb-1">Success</div>
 <div className="text-sm font-mono font-bold text-emerald-500 tracking-tight tabular-nums">99.8%</div>
 </div>
 <div className="bg-th-surface-base p-2 rounded border border-th-border">
 <div className="text-[9px] text-th-muted uppercase mb-1">Drops</div>
 <div className="text-sm font-mono font-bold text-red-500 tracking-tight tabular-nums">0.02%</div>
 </div>
 </div>
 </div>

 {/* Node 4: Loader */}
 <div className="absolute top-1/2 right-32 -translate-y-1/2 w-48 bg-th-surface-raised border border-th-border rounded-xl shadow-2xl p-4 opacity-50 z-10">
 <div className="flex items-center justify-between mb-3">
 <div className="p-1.5 bg-orange-500/10 rounded-lg">
 <span className="material-symbols-outlined text-orange-500 text-lg">dns</span>
 </div>
 <span className="text-[10px] text-th-muted font-bold px-1.5 py-0.5 bg-th-surface-overlay/300/10 rounded">QUEUED</span>
 </div>
 <h4 className="text-sm font-bold mb-1 text-th-heading">RCM Core</h4>
 <p className="text-[10px] text-th-muted mb-3">PostgreSQL Sink</p>
 </div>

 {/* Canvas Controls Overlay */}
 <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20">
 <div className="flex gap-2 p-1.5 bg-th-surface-raised border border-th-border rounded-xl shadow-lg">
 <button className="p-2 hover:bg-th-surface-overlay rounded-lg transition-colors"><span className="material-symbols-outlined text-th-secondary">add</span></button>
 <button className="p-2 hover:bg-th-surface-overlay rounded-lg transition-colors"><span className="material-symbols-outlined text-th-secondary">remove</span></button>
 <div className="w-px bg-th-surface-overlay mx-1"></div>
 <button className="p-2 hover:bg-th-surface-overlay rounded-lg text-blue-400 transition-colors"><span className="material-symbols-outlined">filter_center_focus</span></button>
 </div>
 </div>
 </div>

 {/* Bottom: Schema Mapping Panel */}
 <div className="h-64 border-t border-th-border bg-th-surface-raised flex flex-col z-30">
 <div className="flex items-center justify-between px-6 py-3 border-b border-th-border">
 <div className="flex items-center gap-4">
 <h3 className="text-sm font-bold flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-blue-400 text-lg">schema</span>
 Schema Mapping Validation
 </h3>
 <div className="flex gap-3">
 <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">check_circle</span> 142 Mapped
 </span>
 <span className="text-[11px] font-medium text-red-400 flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">error</span> 2 Mismatches
 </span>
 </div>
 </div>
 <div className="flex gap-2 text-th-muted">
 <button className="text-xs font-bold hover:text-blue-400 transition-colors">AUTO-MAP ALL</button>
 <span className="material-symbols-outlined cursor-pointer hover:text-th-heading">keyboard_arrow_down</span>
 </div>
 </div>
 <div className="flex-1 overflow-x-auto p-4 flex gap-6">
 {/* Source Schema */}
 <div className="min-w-[300px] flex-1">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Incoming: FHIR.Patient</div>
 <div className="space-y-1 font-mono text-xs">
 <div className="flex items-center justify-between p-2 rounded bg-th-surface-base border border-th-border">
 <span className="text-th-heading">patient_id</span>
 <span className="text-blue-400">UUID</span>
 </div>
 <div className="flex items-center justify-between p-2 rounded bg-red-400/5 border border-red-400/20 group relative">
 <span className="text-red-400">birth_date_full</span>
 <div className="flex items-center gap-2">
 <span className="text-[8px] px-1 rounded text-th-heading font-bold bg-gradient-to-r from-red-500 to-red-700">PHI</span>
 <span className="text-red-400">STRING</span>
 </div>
 </div>
 <div className="flex items-center justify-between p-2 rounded bg-th-surface-base border border-th-border">
 <span className="text-th-heading">marital_status</span>
 <span className="text-blue-400">CODE</span>
 </div>
 </div>
 </div>
 {/* Mapping Arrows */}
 <div className="flex flex-col justify-center gap-3">
 <span className="material-symbols-outlined text-blue-400">arrow_forward</span>
 <span className="material-symbols-outlined text-red-400">warning</span>
 <span className="material-symbols-outlined text-blue-400">arrow_forward</span>
 </div>
 {/* Target Schema */}
 <div className="min-w-[300px] flex-1">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Target: RCM_CORE.ENTITIES</div>
 <div className="space-y-1 font-mono text-xs">
 <div className="flex items-center justify-between p-2 rounded bg-th-surface-base border border-th-border">
 <span className="text-th-heading">entity_uid</span>
 <span className="text-emerald-400">UUID</span>
 </div>
 <div className="flex items-center justify-between p-2 rounded bg-th-surface-base border border-th-border">
 <span className="text-th-heading">dob_encrypted</span>
 <span className="text-emerald-400">VARBINARY</span>
 </div>
 <div className="flex items-center justify-between p-2 rounded bg-th-surface-base border border-th-border">
 <span className="text-th-heading">status_flag</span>
 <span className="text-emerald-400">INT8</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Right Sidebar: Logic Editor */}
 <aside className="w-[420px] border-l border-th-border bg-th-surface-raised flex flex-col z-40 shadow-2xl hidden xl:flex">
 <div className="p-4 border-b border-th-border flex items-center justify-between">
 <div className="flex items-center gap-3">
 <span className="material-symbols-outlined text-purple-400">code_blocks</span>
 <h3 className="text-sm font-bold text-th-heading">Logic: HIPAA De-id Core</h3>
 </div>
 <div className="flex gap-2">
 <select className="bg-th-surface-base border border-th-border text-[10px] font-bold text-th-heading rounded px-2 py-1 focus:ring-0">
 <option>PYTHON 3.11</option>
 <option>SQL (SPARK)</option>
 </select>
 </div>
 </div>
 <div className="flex-1 font-mono text-sm overflow-hidden flex flex-col">
 <div className="bg-th-surface-base/50 flex-1 p-4 overflow-y-auto">
 <div className="flex">
 <span className="text-th-muted mr-4 w-4 text-right">1</span>
 <span className="text-blue-300">import </span> <span className="text-th-heading">rcm_security </span> <span className="text-blue-300">as </span> <span className="text-th-heading">sec</span>
 </div>
 <div className="flex">
 <span className="text-th-muted mr-4 w-4 text-right">2</span>
 <span className="text-blue-300">from </span> <span className="text-th-heading">pyspark.sql </span> <span className="text-blue-300">import </span> <span className="text-th-heading">functions </span> <span className="text-blue-300">as </span> <span className="text-th-heading">F</span>
 </div>
 <div className="flex">
 <span className="text-th-muted mr-4 w-4 text-right">3</span>
 </div>
 <div className="flex">
 <span className="text-th-muted mr-4 w-4 text-right">4</span>
 <span className="text-purple-400">def </span> <span className="text-emerald-300">transform_patient</span><span className="text-th-heading">(df):</span>
 </div>
 <div className="flex">
 <span className="text-th-muted mr-4 w-4 text-right">5</span>
 <span className="text-th-muted pl-4"># Scrub HIPAA sensitive fields</span>
 </div>
 <div className="flex">
 <span className="text-th-muted mr-4 w-4 text-right">6</span>
 <span className="text-th-heading pl-4">df = df.withColumn(</span><span className="text-orange-300">&quot;dob&quot;</span><span className="text-th-heading">, sec.encrypt(F.col(</span><span className="text-orange-300">&quot;birthDate&quot;</span><span className="text-th-heading">)))</span>
 </div>
 <div className="flex">
 <span className="text-th-muted mr-4 w-4 text-right">7</span>
 <span className="text-th-heading pl-4">df = df.drop(</span><span className="text-orange-300">&quot;name&quot;</span><span className="text-th-heading">, </span> <span className="text-orange-300">&quot;telecom&quot;</span><span className="text-th-heading">)</span>
 </div>
 <div className="flex">
 <span className="text-th-muted mr-4 w-4 text-right">8</span>
 <span className="text-blue-300 pl-4">return </span> <span className="text-th-heading">df</span>
 </div>
 <div className="mt-8 flex gap-2 items-center bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
 <span className="material-symbols-outlined text-blue-400 text-lg">auto_awesome</span>
 <p className="text-[11px] text-blue-200 leading-snug">
 <span className="font-bold">AI Suggestion:</span> Add <span className="bg-blue-900/50 px-1 rounded font-mono text-[10px]">fuzzy_match</span> for secondary identifiers to increase patient matching accuracy by 14%.
 </p>
 </div>
 </div>
 </div>
 <div className="p-4 border-t border-th-border bg-th-surface-base space-y-3">
 <div className="flex items-center justify-between text-[11px] text-th-muted font-bold uppercase tracking-widest">
 <span>Performance Preview</span>
 <span className="text-emerald-500">OPTIMIZED</span>
 </div>
 <div className="h-1.5 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-blue-600 w-2/3"></div>
 </div>
 <div className="flex gap-2 pt-2">
 <button className="flex-1 py-2 bg-th-surface-overlay border border-th-border-strong hover:bg-th-surface-overlay text-th-heading rounded text-xs font-bold transition-colors">TEST LOGIC</button>
 <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-th-heading rounded text-xs font-bold transition-colors">SAVE NODE</button>
 </div>
 </div>
 </aside>
 </main>

 {/* Global Activity Bar (Bottom) */}
 <footer className="h-8 bg-th-surface-base border-t border-th-border flex items-center justify-between px-4 z-50">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2 text-[10px] text-th-secondary">
 <span className="material-symbols-outlined text-xs text-emerald-500">dns</span>
 Worker Pool: 14 Active
 </div>
 <div className="flex items-center gap-2 text-[10px] text-th-secondary">
 <span className="material-symbols-outlined text-xs">database</span>
 Source Lag: 4ms
 </div>
 </div>
 <div className="flex items-center gap-4 text-[10px] font-mono text-th-muted">
 <span className="tabular-nums">Uptime: 99.998%</span>
 <span>Cluster: US-EAST-1 (PROD)</span>
 </div>
 </footer>
 </div>
 );
}
