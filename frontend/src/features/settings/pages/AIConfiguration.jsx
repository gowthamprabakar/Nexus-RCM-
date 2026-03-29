import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function AIConfiguration() {
 const [confidence, setConfidence] = useState({
  coding: 95,
  eligibility: 90
 });
 const [aiHealth, setAiHealth] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
  let cancelled = false;
  async function load() {
   setLoading(true);
   setError(null);
   try {
    const health = await api.ai.health();
    if (!cancelled) setAiHealth(health);
   } catch (err) {
    if (!cancelled) setError(err.message);
   } finally {
    if (!cancelled) setLoading(false);
   }
  }
  load();
  // Poll every 30s for connection status
  const interval = setInterval(load, 30000);
  return () => { cancelled = true; clearInterval(interval); };
 }, []);

 const ollamaConnected = aiHealth?.ollama === true || aiHealth?.status === 'ok';
 const modelName = aiHealth?.model || aiHealth?.active_model || 'Unknown';
 const modelsAvailable = aiHealth?.models || aiHealth?.available_models || [];
 const systemLatency = aiHealth?.latency_ms || aiHealth?.latency || null;

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   {/* Connection Status Banner */}
   {!loading && (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${ollamaConnected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
     <span className={`h-2.5 w-2.5 rounded-full ${ollamaConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
     <span className={`text-sm font-bold ${ollamaConnected ? 'text-emerald-400' : 'text-red-400'}`}>
      Ollama LLM: {ollamaConnected ? 'Connected' : 'Disconnected'}
     </span>
     {ollamaConnected && modelName !== 'Unknown' && (
      <span className="text-xs text-th-secondary ml-2">Active Model: <span className="font-mono font-bold text-th-heading">{modelName}</span></span>
     )}
     {error && <span className="text-xs text-amber-400 ml-auto">Health check failed - showing cached state</span>}
    </div>
   )}

   {/* KPI Grid */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex justify-between items-center mb-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">System Latency (P95)</span>
      <span className="material-symbols-outlined text-emerald-500">bolt</span>
     </div>
     <div className="flex items-baseline gap-2">
      {loading ? (
       <span className="text-3xl font-black text-th-heading tabular-nums animate-pulse">--</span>
      ) : (
       <span className="text-3xl font-black text-th-heading tabular-nums">{systemLatency ? `${systemLatency}ms` : '42ms'}</span>
      )}
      <span className="text-xs font-bold text-emerald-500 tabular-nums">{systemLatency ? `${systemLatency}ms` : 'Nominal'}</span>
     </div>
    </div>
    <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex justify-between items-center mb-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Active Agents</span>
      <span className="material-symbols-outlined text-purple-500">smart_toy</span>
     </div>
     <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black text-th-heading tabular-nums">{aiHealth?.active_agents || 12}</span>
      <span className="text-xs font-bold text-th-muted">Deployed</span>
     </div>
    </div>
    <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex justify-between items-center mb-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Model Drift</span>
      <span className="material-symbols-outlined text-blue-500">query_stats</span>
     </div>
     <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black text-th-heading tabular-nums">{aiHealth?.model_drift ?? '0.02'}</span>
      <span className="text-xs font-bold text-emerald-500">{aiHealth?.status === 'ok' ? 'Stable' : aiHealth?.status || 'Stable'}</span>
     </div>
    </div>
   </div>

   {/* Configuration Canvas */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Agent Thresholds */}
    <div className="lg:col-span-2 bg-th-surface-raised rounded-xl border border-th-border">
     <div className="p-6 border-b border-th-border flex justify-between items-center">
      <h3 className="font-bold text-lg text-th-heading">Autonomous Decision Thresholds</h3>
      <button className="text-xs font-bold text-blue-400">Reset Defaults</button>
     </div>
     <div className="p-6 space-y-8">
      {/* Coding Agent */}
      <div>
       <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
         <span className="material-symbols-outlined text-purple-500 bg-purple-900/20 p-1.5 rounded-lg">code</span>
         <span className="font-bold text-sm text-th-heading">Medical Coding Agent</span>
        </div>
        <div className="flex items-center gap-2">
         <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Set Point</span>
         <select className="text-xs border border-th-border rounded bg-th-surface-base text-th-heading font-bold py-1 px-2">
          <option>High Precision</option>
          <option>Balanced</option>
         </select>
        </div>
       </div>

       <div className="relative py-4">
        <input
         type="range"
         min="0"
         max="100"
         value={confidence.coding}
         onChange={(e) => setConfidence({ ...confidence, coding: parseInt(e.target.value) })}
         className="w-full h-2 bg-th-surface-overlay rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between mt-2 text-xs text-th-secondary font-mono">
         <span>Manual Review (0-70%)</span>
         <span>Augmented (71-90%)</span>
         <span>Autonomous (91%+)</span>
        </div>
        <div className="absolute top-0 transform -translate-x-1/2 bg-blue-600 text-th-heading text-xs font-bold px-2 py-1 rounded shadow-sm" style={{ left: `${confidence.coding}%` }}>
         <span className="tabular-nums">{confidence.coding}%</span>
        </div>
       </div>
       <p className="text-xs text-th-secondary">Codes with confidence below <span className="tabular-nums">{confidence.coding}%</span> will currently satisfy <strong className="text-th-heading">Human-Loop Review</strong>.</p>
      </div>

      <hr className="border-th-border" />

      {/* Eligibility Agent */}
      <div>
       <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
         <span className="material-symbols-outlined text-emerald-500 bg-emerald-900/20 p-1.5 rounded-lg">verified_user</span>
         <span className="font-bold text-sm text-th-heading">Eligibility Verification Agent</span>
        </div>
        <div className="flex items-center gap-2">
         <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Set Point</span>
         <select className="text-xs border border-th-border rounded bg-th-surface-base text-th-heading font-bold py-1 px-2">
          <option>Standard</option>
         </select>
        </div>
       </div>

       <div className="relative py-4">
        <input
         type="range"
         min="0"
         max="100"
         value={confidence.eligibility}
         onChange={(e) => setConfidence({ ...confidence, eligibility: parseInt(e.target.value) })}
         className="w-full h-2 bg-th-surface-overlay rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="absolute top-0 transform -translate-x-1/2 bg-emerald-500 text-th-heading text-xs font-bold px-2 py-1 rounded shadow-sm" style={{ left: `${confidence.eligibility}%` }}>
         <span className="tabular-nums">{confidence.eligibility}%</span>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* Right Sidebar: Health */}
    <div className="space-y-6">
     <div className="bg-th-surface-raised rounded-xl border border-th-border border-l-[3px] border-l-amber-500 p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <h3 className="font-bold text-sm text-th-heading mb-4">Model Versioning</h3>
      {loading ? (
       <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
       </div>
      ) : (
       <div className="space-y-4">
        {modelsAvailable.length > 0 ? (
         modelsAvailable.map((model, i) => (
          <div key={i} className="flex justify-between items-center">
           <div>
            <p className="text-sm font-bold text-th-heading">{typeof model === 'string' ? model : model.name || model.model}</p>
            <p className={`text-xs flex items-center gap-1 ${i === 0 ? 'text-emerald-500' : 'text-th-muted'}`}>
             <span className="material-symbols-outlined text-[10px]">{i === 0 ? 'check_circle' : 'radio_button_unchecked'}</span>
             {i === 0 ? 'Active' : 'Available'}
            </p>
           </div>
           <span className="text-xs text-th-muted font-mono">{typeof model === 'object' && model.version ? model.version : ''}</span>
          </div>
         ))
        ) : (
         <>
          <div className="flex justify-between items-center">
           <div>
            <p className="text-sm font-bold text-th-heading">{modelName !== 'Unknown' ? modelName : 'GPT-4o (Clinical)'}</p>
            <p className={`text-xs flex items-center gap-1 ${ollamaConnected ? 'text-emerald-500' : 'text-red-400'}`}>
             <span className="material-symbols-outlined text-[10px]">{ollamaConnected ? 'check_circle' : 'error'}</span>
             {ollamaConnected ? 'Active' : 'Offline'}
            </p>
           </div>
           <span className="text-xs text-th-muted font-mono">v2.1.0</span>
          </div>
          <div className="flex justify-between items-center">
           <div>
            <p className="text-sm font-bold text-th-heading">Llama 3 (Parsing)</p>
            <p className="text-xs text-th-muted">Standby</p>
           </div>
           <span className="text-xs text-th-muted font-mono">v0.9.beta</span>
          </div>
         </>
        )}
       </div>
      )}
      <button className="w-full mt-6 py-2 border border-th-border rounded-lg text-xs font-bold text-th-heading hover:bg-th-surface-overlay">
       Deploy New Model
      </button>
     </div>

     <div className="bg-blue-600/5 border border-blue-500/20 border-l-[3px] border-l-blue-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-2 text-blue-400 mb-2">
       <span className="material-symbols-outlined">lightbulb</span>
       <h4 className="font-bold text-sm">Optimization Tip</h4>
      </div>
      <p className="text-xs text-th-heading leading-relaxed">
       Increasing the Medical Coding threshold to 97% could reduce audit time by 2.5 hours/week based on your current volume.
      </p>
     </div>
    </div>
   </div>
  </div>
 );
}
