import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const STATIC_CONNECTORS = [
 { code: 'EP', name: 'Epic App Orchard', category: 'EHR Integration', latency: '12ms', successRate: '99.98%' },
 { code: 'CE', name: 'Cerner Ignite', category: 'EHR Integration', latency: '84ms', successRate: '98.2%' },
 { code: 'AS', name: 'Allscripts Open', category: 'EHR Integration', latency: '28ms', successRate: '99.5%' },
 { code: 'AV', name: 'Availity', category: 'Aggregator', latency: '32ms', successRate: '100%' },
 { code: 'WS', name: 'Waystar', category: 'Aggregator', latency: '18ms', successRate: '99.9%' },
];

export function IntegrationHub() {
 const [loading, setLoading] = useState(true);
 const [ollamaStatus, setOllamaStatus] = useState(null);
 const [simulationStatus, setSimulationStatus] = useState(null);
 const [connectors, setConnectors] = useState(STATIC_CONNECTORS);

 useEffect(() => {
  let cancelled = false;
  async function load() {
   setLoading(true);
   try {
    const [aiHealth, scenarios, schedulerHealth] = await Promise.allSettled([
     api.ai.health(),
     api.simulation.getScenarios(),
     api.simulation.getSchedulerStatus(),
    ]);
    if (cancelled) return;
    setOllamaStatus(aiHealth.status === 'fulfilled' ? aiHealth.value : { status: 'degraded', ollama: false });
    setSimulationStatus(scenarios.status === 'fulfilled' ? scenarios.value : null);

    // Add Ollama and MiroFish as dynamic connectors
    const dynamicConnectors = [...STATIC_CONNECTORS];

    const ollamaConnected = aiHealth.status === 'fulfilled' && (aiHealth.value?.ollama === true || aiHealth.value?.status === 'ok');
    dynamicConnectors.push({
     code: 'OL',
     name: 'Ollama LLM Engine',
     category: 'AI Service',
     latency: aiHealth.value?.latency_ms ? `${aiHealth.value.latency_ms}ms` : (ollamaConnected ? '~50ms' : 'TIMEOUT'),
     successRate: ollamaConnected ? '99.9%' : '0%',
     status: ollamaConnected ? 'connected' : 'disconnected',
     model: aiHealth.value?.model || null,
    });

    const schedulerOk = schedulerHealth.status === 'fulfilled' && schedulerHealth.value != null;
    const miroConnected = schedulerOk || (scenarios.status === 'fulfilled' && scenarios.value != null);
    dynamicConnectors.push({
     code: 'MF',
     name: 'MiroFish Simulator',
     category: 'What-If Engine',
     latency: miroConnected ? '120ms' : 'TIMEOUT',
     successRate: miroConnected ? '99%' : '0%',
     status: miroConnected ? 'connected' : 'disconnected',
     scenarioCount: miroConnected && Array.isArray(scenarios.value) ? scenarios.value.length : (scenarios.value?.scenarios?.length || 0),
    });

    setConnectors(dynamicConnectors);
   } catch (err) {
    console.error('IntegrationHub load error:', err);
   } finally {
    if (!cancelled) setLoading(false);
   }
  }
  load();
  const interval = setInterval(load, 60000);
  return () => { cancelled = true; clearInterval(interval); };
 }, []);

 const totalActive = connectors.filter(c => c.status !== 'disconnected').length;
 const totalConnectors = connectors.length;

 function getStatusBadge(connector) {
  if (connector.status === 'disconnected') {
   return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-full border border-red-500/20">
     <span className="h-1.5 w-1.5 bg-red-500 rounded-full"></span>
     <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Disconnected</span>
    </div>
   );
  }
  if (connector.status === 'syncing') {
   return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
     <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse"></span>
     <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Syncing</span>
    </div>
   );
  }
  return (
   <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Connected</span>
   </div>
  );
 }

 return (
  <div className="flex-1 overflow-y-auto font-sans h-full">
   <div className="flex h-full">
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
     {/* Stats & Live Health Map Row */}
     <div className="p-8 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
       {/* Map Panel */}
       <div className="lg:col-span-2 bg-th-surface-raised border border-th-border rounded-xl overflow-hidden relative group h-[240px]">
        <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5">
         <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
          <span className="text-xs font-bold text-th-heading uppercase tracking-wider">Live Traffic Map</span>
         </div>
        </div>
        <div className="h-full w-full bg-th-surface-base flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
         <span className="text-th-secondary font-bold uppercase tracking-widest">[Live Connection Map Visualization]</span>
        </div>
        <div className="absolute bottom-4 right-4 text-right">
         <p className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">GLOBAL_EDGE_NODES: ACTIVE</p>
        </div>
       </div>
       {/* Stats Panel */}
       <div className="flex flex-col gap-4">
        <div className="flex-1 bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-5 flex flex-col justify-center hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
         <p className="text-th-secondary text-sm font-medium">Total Active</p>
         <div className="flex items-baseline gap-2">
          {loading ? (
           <h3 className="text-3xl font-black text-th-heading tabular-nums animate-pulse">--/--</h3>
          ) : (
           <>
            <h3 className="text-3xl font-black text-th-heading tabular-nums">{totalActive}/{totalConnectors}</h3>
            <span className="text-emerald-500 text-xs font-bold tabular-nums">
             {totalActive === totalConnectors ? 'All Online' : `${totalConnectors - totalActive} Offline`}
            </span>
           </>
          )}
         </div>
        </div>
        <div className="flex-1 bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 rounded-xl p-5 flex flex-col justify-center hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
         <p className="text-th-secondary text-sm font-medium">System Throughput</p>
         <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-th-heading tabular-nums">1.2M <span className="text-lg font-normal opacity-60">rec/hr</span></h3>
          <span className="text-emerald-500 text-xs font-bold tabular-nums">+12.1%</span>
         </div>
        </div>
        <div className="flex-1 bg-th-surface-raised border border-th-border border-l-[3px] border-l-amber-500 rounded-xl p-5 flex flex-col justify-center hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
         <p className="text-th-secondary text-sm font-medium">Avg. Latency</p>
         <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-th-heading tabular-nums">
           {ollamaStatus?.latency_ms ? `${ollamaStatus.latency_ms}ms` : '42ms'}
          </h3>
          <span className="text-orange-500 text-xs font-bold tabular-nums">-5.2%</span>
         </div>
        </div>
       </div>
      </div>
     </div>

     {/* Search and Filters Sticky Bar */}
     <div className="sticky top-0 z-20 px-8 py-4 bg-th-surface-base/80 backdrop-blur-md border-y border-th-border flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[300px]">
       <div className="relative group">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-th-secondary group-focus-within:text-blue-400 transition-colors">search</span>
        <input className="w-full bg-th-surface-base border border-th-border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-th-heading transition-all" placeholder={`Search ${totalConnectors}+ connectors (e.g. Epic, Cerner, Ollama)...`} type="text" />
       </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
       <button className="px-4 py-2 bg-blue-600 text-th-heading text-xs font-bold rounded-full whitespace-nowrap shadow-md shadow-blue-600/20">All Connectors</button>
       <button className="px-4 py-2 bg-th-surface-overlay border border-th-border-strong text-th-heading text-xs font-bold rounded-full hover:border-blue-500 transition-all whitespace-nowrap">EHR Systems</button>
       <button className="px-4 py-2 bg-th-surface-overlay border border-th-border-strong text-th-heading text-xs font-bold rounded-full hover:border-blue-500 transition-all whitespace-nowrap">Payer Portals</button>
       <button className="px-4 py-2 bg-th-surface-overlay border border-th-border-strong text-th-heading text-xs font-bold rounded-full hover:border-blue-500 transition-all whitespace-nowrap">AI Services</button>
       <button className="px-4 py-2 bg-th-surface-overlay border border-th-border-strong text-th-heading text-xs font-bold rounded-full hover:border-blue-500 transition-all whitespace-nowrap">Aggregators</button>
      </div>
     </div>

     {/* Connector Marketplace Grid */}
     <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {loading ? (
       <div className="col-span-full flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
       </div>
      ) : (
       connectors.map((connector, i) => {
        const isDisconnected = connector.status === 'disconnected';
        return (
         <div key={i} className={`bg-th-surface-raised border border-th-border rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group flex flex-col gap-4 ${
          isDisconnected ? 'border-l-4 border-l-red-500 hover:border-red-500/50' : 'hover:border-blue-500/50'
         }`}>
          <div className="flex justify-between items-start">
           <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-th-surface-overlay flex items-center justify-center font-bold text-th-heading">{connector.code}</div>
            <div>
             <h4 className="font-bold text-th-heading">{connector.name}</h4>
             <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">{connector.category}</p>
            </div>
           </div>
           {getStatusBadge(connector)}
          </div>
          <div className="grid grid-cols-2 gap-4 py-2 border-y border-th-border">
           <div>
            <p className="text-[10px] text-th-secondary font-bold uppercase">Latency</p>
            <p className={`text-sm font-mono font-bold tabular-nums ${isDisconnected ? 'text-red-400' : 'text-th-heading'}`}>{connector.latency}</p>
           </div>
           <div>
            <p className="text-[10px] text-th-secondary font-bold uppercase">Success Rate</p>
            <p className={`text-sm font-mono font-bold tabular-nums ${isDisconnected ? 'text-red-500' : 'text-emerald-500'}`}>{connector.successRate}</p>
           </div>
           {connector.model && (
            <div className="col-span-2">
             <p className="text-[10px] text-th-secondary font-bold uppercase">Active Model</p>
             <p className="text-sm font-mono font-bold text-th-heading">{connector.model}</p>
            </div>
           )}
           {connector.scenarioCount > 0 && (
            <div className="col-span-2">
             <p className="text-[10px] text-th-secondary font-bold uppercase">Scenarios</p>
             <p className="text-sm font-mono font-bold text-th-heading tabular-nums">{connector.scenarioCount} available</p>
            </div>
           )}
          </div>
          <div className="flex items-center gap-2 mt-auto">
           {isDisconnected ? (
            <>
             <button className="flex-1 bg-red-500 text-th-heading py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-red-500/20 hover:bg-red-600">Fix Connection</button>
             <button className="flex-1 bg-th-surface-overlay border border-th-border-strong hover:bg-th-surface-overlay text-th-heading py-2 rounded-lg text-xs font-bold transition-all">Logs</button>
            </>
           ) : (
            <>
             <button className="flex-1 bg-th-surface-overlay border border-th-border-strong hover:bg-th-surface-overlay text-th-heading py-2 rounded-lg text-xs font-bold transition-all">Config</button>
             <button className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 py-2 rounded-lg text-xs font-bold transition-all">Logs</button>
            </>
           )}
          </div>
         </div>
        );
       })
      )}
     </div>

     {/* Smart Suggestion AI Banner */}
     <div className="mx-8 mb-12 p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-6 overflow-hidden relative">
      <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-blue-500/10 pointer-events-none">
       <span className="material-symbols-outlined text-[160px]">auto_awesome</span>
      </div>
      <div className="flex gap-4 relative z-10">
       <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-th-heading shrink-0 shadow-lg shadow-blue-600/30">
        <span className="material-symbols-outlined">auto_awesome</span>
       </div>
       <div>
        <h5 className="font-bold text-th-heading">AI Optimization Suggestion</h5>
        <p className="text-sm text-th-secondary max-w-xl mt-1">
         {ollamaStatus?.ollama
          ? 'Ollama is connected. Our AI detected a potential performance bottleneck in the Cerner FHIR API. Switching to the Batch-Fetch protocol could reduce latency by 45%.'
          : 'Ollama LLM is currently offline. Connect Ollama to enable AI-powered optimization suggestions for your integration pipelines.'
         }
        </p>
       </div>
      </div>
      <button className="relative z-10 bg-blue-600 hover:bg-blue-700 text-th-heading px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:scale-105 transition-all">
       {ollamaStatus?.ollama ? 'Apply Optimization' : 'Connect Ollama'}
      </button>
     </div>
    </div>
   </div>
  </div>
 );
}
