import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import {
 AIInsightCard,
 ConfidenceBar,
 FilterChipGroup,
 DateRangePicker,
} from '../../../components/ui';
import { PropensityBadge } from '../../../components/predictions';

const PROPENSITY_BUCKET = (score) => {
 if (score > 80) return '>80% (Hot)';
 if (score >= 60) return '60-80% (Warm)';
 return '<60% (Cold)';
};

/* Derive root cause badge from existing task data (no extra API call) */
const ROOT_CAUSE_MAP = {
 'Review Denial': 'DENIAL',
 'Submit Claim': 'TIMELY_FILING',
 'Call Payer': 'PAYER_DELAY',
 'Validate COB': 'ELIGIBILITY',
 'Appeal': 'DENIAL',
 'Resubmit': 'CODING',
};
const getRootCauseBadge = (action) => ROOT_CAUSE_MAP[action] || null;

export function CollectionsQueue() {
 const navigate = useNavigate();
 const [liveQueue, setLiveQueue] = useState([]);
 const [queueTotal, setQueueTotal] = useState(0);
 const [callScript, setCallScript] = useState('');
 const [scriptLoading, setScriptLoading] = useState(false);
 const [scriptTask, setScriptTask] = useState(null);
 const [diagnosticCount, setDiagnosticCount] = useState(null);
 const [preventionCount, setPreventionCount] = useState(null);
 const [collSummary, setCollSummary] = useState(null);

 const handleGenerateScript = async (task) => {
   setScriptTask(task);
   setCallScript('');
   setScriptLoading(true);
   const result = await api.ai.getCallScript({
     task_id: task.id,
     patient_name: task.patient,
     payer_name: task.payer,
     balance: task.balance,
     days_outstanding: task.daysAR,
     action_type: task.nextAction,
     priority: task.priority,
   });
   setCallScript(result?.call_script || 'Unable to generate script. Please try again.');
   setScriptLoading(false);
 };

 useEffect(() => {
   async function load() {
     const data = await api.collections.getQueue({ page: 1, size: 50 });
     if (data?.items) {
       setLiveQueue(data.items.map(t => ({
         id: t.task_id,
         patient: t.patient_name || 'Unknown',
         mrn: t.claim_id,
         payer: t.payer_name || t.payer_id,
         balance: t.balance,
         daysAR: t.days_outstanding,
         propensity: t.propensity_score || 50,
         priority: t.priority === 'CRITICAL' ? 'HIGH' : t.priority,
         nextAction: t.action_type,
         taskType: t.action_type,
         collector: t.assigned_to || 'Unassigned',
         active: t.status === 'IN_PROGRESS',
       })));
       setQueueTotal(data.total);
     }
   }
   load();
   // Non-blocking: diagnostics + prevention
   api.diagnostics.getFindings({ severity: 'critical' }).then(d => setDiagnosticCount(d)).catch(() => null);
   api.prevention.scan(3).then(d => setPreventionCount(d)).catch(() => null);
   api.collections.getSummary().then(d => setCollSummary(d)).catch(() => null);
 }, []);

 /* ── Filter state ───────────────────────────────────── */
 const [filterDateRange, setFilterDateRange] = useState(null);
 const [filterPayer, setFilterPayer] = useState('All');
 const [filterPriority, setFilterPriority] = useState('All');
 const [filterCollector, setFilterCollector] = useState('All');
 const [filterTaskType, setFilterTaskType] = useState('All');
 const [filterPropensity, setFilterPropensity] = useState('All');

 const activeChips = [
  ...(filterDateRange ? [{ key: 'dateRange', label: 'Date', value: filterDateRange.label, color: 'blue' }] : []),
  ...(filterPayer !== 'All' ? [{ key: 'payer', label: 'Payer', value: filterPayer, color: 'blue' }] : []),
  ...(filterPriority !== 'All' ? [{ key: 'priority', label: 'Priority', value: filterPriority, color: 'amber' }] : []),
  ...(filterCollector !== 'All' ? [{ key: 'collector', label: 'Collector', value: filterCollector, color: 'emerald' }] : []),
  ...(filterTaskType !== 'All' ? [{ key: 'taskType', label: 'Task Type', value: filterTaskType, color: 'purple' }] : []),
  ...(filterPropensity !== 'All' ? [{ key: 'propensity', label: 'Propensity', value: filterPropensity, color: 'amber' }] : []),
 ];

 const handleChipRemove = (key) => {
  if (key === 'dateRange') setFilterDateRange(null);
  if (key === 'payer') setFilterPayer('All');
  if (key === 'priority') setFilterPriority('All');
  if (key === 'collector') setFilterCollector('All');
  if (key === 'taskType') setFilterTaskType('All');
  if (key === 'propensity') setFilterPropensity('All');
 };

 const clearAllFilters = () => {
  setFilterDateRange(null);
  setFilterPayer('All');
  setFilterPriority('All');
  setFilterCollector('All');
  setFilterTaskType('All');
  setFilterPropensity('All');
 };

 /* ── Filtered tasks ─────────────────────────────────── */
 const tasks = liveQueue;
 const filteredTasks = tasks.filter((t) => {
  if (filterPayer !== 'All' && t.payer !== filterPayer) return false;
  if (filterCollector !== 'All' && t.collector !== filterCollector) return false;
  if (filterTaskType !== 'All' && t.taskType !== filterTaskType) return false;
  if (filterPriority !== 'All') {
   const map = { Critical: 'CRIT', High: 'HIGH', Medium: 'MED', Low: 'LOW' };
   if (t.priority !== (map[filterPriority] || filterPriority)) return false;
  }
  if (filterPropensity !== 'All') {
   if (PROPENSITY_BUCKET(t.propensity) !== filterPropensity) return false;
  }
  return true;
 });

 /* ── Small select helper ────────────────────────────── */
 const FilterSelect = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1">
   <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">{label}</label>
   <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-th-surface-base border border-th-border text-th-heading text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
   >
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
   </select>
  </div>
 );

 return (
  <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden font-sans">

   {/* ── Enhanced Filter Bar ──────────────────────────── */}
   <div className="bg-th-surface-raised border-b border-th-border px-4 lg:px-6 py-3 shrink-0 z-10 space-y-3">
    <div className="flex flex-wrap items-end gap-3">
     <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">Due Date Range</label>
      <DateRangePicker value={filterDateRange?.label} onChange={setFilterDateRange} />
     </div>
     <FilterSelect
      label="Payer"
      value={filterPayer}
      onChange={setFilterPayer}
      options={['All', 'Medicare', 'Medicaid', 'BCBS', 'Aetna', 'United', 'Cigna']}
     />
     <FilterSelect
      label="Priority"
      value={filterPriority}
      onChange={setFilterPriority}
      options={['All', 'Critical', 'High', 'Medium', 'Low']}
     />
     <FilterSelect
      label="Collector"
      value={filterCollector}
      onChange={setFilterCollector}
      options={['All', 'Sarah M.', 'James K.', 'Lisa R.']}
     />
     <FilterSelect
      label="Task Type"
      value={filterTaskType}
      onChange={setFilterTaskType}
      options={['All', 'Phone Call', 'Letter', 'Legal', 'Payment Plan']}
     />
     <FilterSelect
      label="Propensity Score"
      value={filterPropensity}
      onChange={setFilterPropensity}
      options={['All', '>80% (Hot)', '60-80% (Warm)', '<60% (Cold)']}
     />
    </div>
    {activeChips.length > 0 && (
     <FilterChipGroup
      filters={activeChips}
      onRemove={handleChipRemove}
      onClearAll={clearAllFilters}
     />
    )}
   </div>

   {/* ── AI Collection Intelligence Bar ──────────────── */}
   <div className="bg-th-surface-raised border-b border-th-border px-4 lg:px-6 py-3 shrink-0">
    <div className="flex flex-wrap items-center gap-4 lg:gap-6">
     <div className="flex items-center gap-2">
      <span className="material-icons text-purple-400 text-sm">auto_awesome</span>
      <span className="text-xs font-semibold text-th-secondary">
       AI Propensity Model: <span className="text-purple-400 tabular-nums">{collSummary?.recovery_rate ? `${collSummary.recovery_rate}%` : '--'} recovery</span>
       <span className="text-th-muted mx-2">|</span>
       Queue: <span className="text-th-heading">{collSummary?.total_tasks?.toLocaleString() || '--'} tasks</span>
      </span>
     </div>
     {diagnosticCount?.findings?.length > 0 && (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
       <span className="material-symbols-outlined text-xs">biotech</span>
       {diagnosticCount.findings.length} critical findings
      </span>
     )}
     {preventionCount && (preventionCount.total > 0 || preventionCount.alerts?.length > 0) && (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
       <span className="material-symbols-outlined text-xs">shield</span>
       {preventionCount.total || preventionCount.alerts?.length || 0} prevention alerts
      </span>
     )}
     <div className="flex flex-wrap gap-4 ml-auto">
      {[
       { label: 'Total Collectible', value: collSummary?.total_collectible ? `$${(collSummary.total_collectible/1e6).toFixed(1)}M` : '--' },
       { label: 'Active Alerts', value: collSummary?.active_alerts ? `${collSummary.active_alerts} alerts` : '--' },
       { label: 'Queue Size', value: collSummary?.total_tasks ? `${collSummary.total_tasks.toLocaleString()} tasks` : '--' },
      ].map((stat) => (
       <div key={stat.label} className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-th-muted">{stat.label}</span>
        <span className="text-sm font-bold text-th-heading tabular-nums">{stat.value}</span>
       </div>
      ))}
     </div>
    </div>
   </div>

   {/* KPI Ribbon */}
   <div className="flex flex-wrap gap-4 p-4 lg:px-6 bg-th-surface-raised border-b border-th-border shrink-0 z-10">
    <div className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-xl p-4 border border-th-border bg-th-surface-raised border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex justify-between items-center text-th-secondary">
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Calls Completed</p>
      <span className="material-symbols-outlined text-lg">call</span>
     </div>
     <div className="flex items-end justify-between">
      <p className="text-2xl font-black text-th-heading tabular-nums">{collSummary?.completed_tasks || 0} / {collSummary?.total_tasks || '--'}</p>
      <p className="text-th-muted text-sm font-medium flex items-center gap-1 tabular-nums">
       {collSummary?.recovery_rate ? `${collSummary.recovery_rate}% rate` : 'Current period'}
      </p>
     </div>
     <div className="w-full bg-th-surface-overlayh-1.5 rounded-full mt-2 overflow-hidden">
      <div className="bg-primary h-full rounded-full" style={{ width: '30%' }}></div>
     </div>
    </div>
    <div className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-xl p-4 border border-th-border bg-th-surface-raised border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex justify-between items-center text-th-secondary">
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">PTP Amount</p>
      <span className="material-symbols-outlined text-lg">payments</span>
     </div>
     <div className="flex items-end justify-between">
      <p className="text-2xl font-black text-th-heading tabular-nums">{collSummary?.total_collectible ? `$${(collSummary.total_collectible/1e3).toFixed(0)}K` : '--'}</p>
      <p className="text-th-muted text-sm font-medium flex items-center gap-1 tabular-nums">
       Total collectible
      </p>
     </div>
     <p className="text-[10px] text-th-muted mt-2">From {collSummary?.total_tasks?.toLocaleString() || '--'} tasks</p>
    </div>
    <div className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-xl p-4 border border-th-border bg-th-surface-raised border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex justify-between items-center text-th-secondary">
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Tasks Remaining</p>
      <span className="material-symbols-outlined text-lg">assignment</span>
     </div>
     <div className="flex items-end justify-between">
      <p className="text-2xl font-black text-th-heading tabular-nums">{collSummary?.total_tasks ? (collSummary.total_tasks - (collSummary.completed_tasks || 0)).toLocaleString() : '--'}</p>
      <p className="text-th-muted text-sm font-medium flex items-center gap-1 tabular-nums">
       Remaining
      </p>
     </div>
     <p className="text-[10px] text-th-muted mt-2">{collSummary?.active_alerts || 0} active alerts</p>
    </div>
    <div className="hidden xl:flex min-w-[200px] flex-1 flex-col gap-1 rounded-xl p-4 border border-th-border bg-th-surface-raised border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex justify-between items-center text-th-secondary">
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Average Handling</p>
      <span className="material-symbols-outlined text-lg">timer</span>
     </div>
     <div className="flex items-end justify-between">
      <p className="text-2xl font-black text-th-heading tabular-nums">4.2m</p>
      <p className="text-primary text-sm font-medium">On Target</p>
     </div>
     <p className="text-[10px] text-th-muted mt-2">Historical: 4.5m</p>
    </div>
   </div>

   <div className="flex-1 flex overflow-hidden">
    {/* Left Side: AI Insights + Task Table Content */}
    <div className="flex-1 overflow-auto">

     {/* ── AI Insights ───────────────────────────────── */}
     <div className="px-6 pt-5 pb-2">
      <div className="flex items-center gap-2 mb-3">
       <span className="material-icons text-purple-400 text-sm">auto_awesome</span>
       <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
       <AIInsightCard
        title="Propensity Score Spike: Medicare"
        description="Medicare patient propensity scores jumped 12% after EOB delivery this morning. 34 accounts now in 'hot' category. Recommend immediate outreach."
        confidence={93}
        impact="high"
        category="Predictive"
        action="Prioritize Medicare queue"
        value="34 hot accounts"
        icon="local_fire_department"
       />
       <AIInsightCard
        title="PTP Rate Declining — Aetna"
        description="Promise-to-pay compliance rate for Aetna accounts dropped to 58% this month vs 74% historical. Recommend escalation to supervisor-led calls."
        confidence={88}
        impact="medium"
        category="Diagnostic"
        action="Escalate Aetna accounts"
        value="16% PTP drop"
        icon="trending_down"
       />
      </div>
     </div>

     {/* Task Table Header */}
     <div className="px-6 py-4 flex items-center justify-between border-b border-th-border sticky top-0 bg-th-surface-base z-10">
      <div className="flex items-center gap-4">
       <h3 className="font-bold text-lg text-th-heading">Task Queue</h3>
       <div className="flex items-center gap-2">
        <button className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full">All Tasks</button>
        <button className="px-3 py-1 text-xs font-medium text-th-secondary hover:bg-th-surface-overlayrounded-full transition-colors">High Probability</button>
        <button className="px-3 py-1 text-xs font-medium text-th-secondary hover:bg-th-surface-overlayrounded-full transition-colors">Payer Follow-up</button>
       </div>
      </div>
      <div className="flex items-center gap-2 text-th-secondary">
       <span className="text-xs">Sort by: AI Priority</span>
       <span className="material-symbols-outlined cursor-pointer hover:text-primary">filter_list</span>
      </div>
     </div>

     <div className="min-w-full inline-block align-middle">
      <table className="min-w-full divide-y divide-th-border">
       <thead className="bg-th-surface-base/50 sticky top-[61px] z-10">
        <tr>
         <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-th-muted">Priority</th>
         <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-th-muted">Patient/MRN</th>
         <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-th-muted">Payer</th>
         <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-th-muted">Balance</th>
         <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-th-muted">Days in A/R</th>
         <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-th-muted">Propensity</th>
         <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-th-muted">Pay Pred.</th>
         <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-th-muted">Next AI Action</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-th-border">
        {filteredTasks.length === 0 && !loading && (
          <tr>
            <td colSpan={10} className="text-center py-12 text-sm text-th-muted">
              <span className="material-symbols-outlined text-3xl mb-2 block">inbox</span>
              No tasks in queue matching current filters
            </td>
          </tr>
        )}
        {filteredTasks.map((task) => (
         <tr
          key={task.id}
          onClick={() => navigate(`/collections/account/${task.id}`)}
          className={`transition-colors cursor-pointer group ${task.active ? 'bg-primary/5 border-l-4 border-primary hover:bg-primary/10' : 'hover:bg-th-surface-overlay/50'}`}
         >
          <td className="px-6 py-4 whitespace-nowrap">
           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
            task.priority === 'HIGH' ? 'bg-rose-900/30 text-rose-400' :
            task.priority === 'MED' ? 'bg-amber-900/30 text-amber-400' :
            'bg-th-surface-overlay text-th-heading'
           }`}>{task.priority}</span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
           <div className="text-sm font-semibold text-th-heading">{task.patient}</div>
           <div className="text-xs text-th-secondary">{task.mrn}</div>
           {task.mrn && (
            <div className="text-[10px] text-primary font-bold cursor-pointer hover:underline mt-0.5" onClick={(e) => { e.stopPropagation(); navigate(`/analytics/denials/root-cause/claim/${task.mrn}`); }}>View Claim</div>
           )}
           {getRootCauseBadge(task.nextAction) && (
            <span className="inline-flex items-center gap-0.5 mt-0.5 text-[9px] font-bold text-amber-400 bg-amber-900/20 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
             <span className="material-icons" style={{fontSize:'9px'}}>troubleshoot</span>
             {getRootCauseBadge(task.nextAction)}
            </span>
           )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-th-heading">{task.payer}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-right text-th-heading tabular-nums">
           ${task.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-th-heading tabular-nums">{task.daysAR}</td>
          <td className="px-6 py-4 whitespace-nowrap min-w-[140px]">
           <ConfidenceBar score={task.propensity} label="Propensity" size="sm" showBar showLabel />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
           <PropensityBadge patientId={task.id} compact />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
           <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold group-hover:text-primary transition-colors ${task.active ? 'text-primary' : 'text-th-heading'}`}>
             {task.nextAction}
            </span>
            {task.active && <span className="material-symbols-outlined text-sm text-primary">bolt</span>}
           </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
           <button
            onClick={(e) => { e.stopPropagation(); handleGenerateScript(task); }}
            className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-full font-bold hover:bg-purple-500/20 flex items-center gap-1 whitespace-nowrap"
           >
            <span className="material-icons" style={{fontSize:'10px'}}>auto_awesome</span>
            Script
           </button>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>

    {/* Right Side: Contact Workspace */}
    <div className="w-[420px] bg-th-surface-raised border-l border-th-border flex flex-col shrink-0">
     <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* Workspace Header */}
      <div className="flex flex-col gap-1">
       <div className="flex items-center justify-between">
        <h1 className="text-th-heading text-lg font-bold leading-tight">Contact Workspace</h1>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/20">LIVE ACCOUNT</span>
       </div>
       <p className="text-th-muted text-sm">Active: <span className="text-th-heading font-medium">John Doe (MRN-882)</span></p>
      </div>

      {/* Dialer Section */}
      <div className="bg-th-surface-overlay/50 rounded-xl p-4 border border-th-border">
       <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
         <span className="material-symbols-outlined text-primary">phone_in_talk</span>
         <span className="text-sm font-bold text-th-heading">UnitedHealth Provider Line</span>
        </div>
        <span className="text-xs text-th-secondary">800-842-1100</span>
       </div>
       <button className="w-full py-3 bg-primary hover:bg-primary/90 text-th-heading rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
        <span className="material-symbols-outlined">call</span>
        <span>Start One-Click Dial</span>
       </button>
      </div>

      {/* AI Script Panel — Ollama Live */}
      <div className="flex flex-col gap-3">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
         <span className="material-symbols-outlined text-purple-400">auto_awesome</span>
         <h3 className="text-sm font-bold text-th-heading">AI Call Script</h3>
         {callScript && <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">Live · Ollama</span>}
        </div>
       </div>
       <div className="p-4 rounded-xl border border-th-border bg-th-surface-raised flex flex-col gap-3 min-h-[120px]">
        {!scriptTask && !callScript && (
         <p className="text-th-muted text-xs italic">Select a task from the queue and click "Generate Script" to create an AI-powered call script.</p>
        )}
        {scriptLoading && (
         <div className="flex flex-col items-center justify-center gap-2 py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
          <p className="text-th-muted text-xs">llama3 drafting script for {scriptTask?.patient}...</p>
         </div>
        )}
        {!scriptLoading && callScript && (
         <>
          <p className="text-[10px] text-th-muted font-semibold uppercase tracking-wider">{scriptTask?.patient} · {scriptTask?.payer} · ${(scriptTask?.balance||0).toLocaleString()}</p>
          <pre className="text-th-secondary text-xs whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">{callScript}</pre>
          <div className="flex gap-2 pt-1">
           <button onClick={() => navigator.clipboard.writeText(callScript)} className="flex-1 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold rounded-lg hover:bg-purple-500/20 flex items-center justify-center gap-1">
            <span className="material-icons text-xs">content_copy</span> Copy Script
           </button>
          </div>
         </>
        )}
       </div>
      </div>

      {/* Tabs/Tools Section */}
      <div className="flex flex-col flex-1">
       <div className="flex border-b border-th-border mb-4">
        <button className="px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary">Templates</button>
        <button className="px-4 py-2 text-xs font-medium text-th-secondary hover:text-th-heading transition-colors">History</button>
        <button className="px-4 py-2 text-xs font-medium text-th-secondary hover:text-th-heading transition-colors">Notes</button>
       </div>
       <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between p-3 rounded-lg border border-th-border hover:border-primary/50 cursor-pointer transition-colors group bg-th-surface-raised">
         <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-th-secondary group-hover:text-primary transition-colors">mail</span>
          <div>
           <p className="text-sm font-medium text-th-heading">COB Information Request</p>
           <p className="text-[10px] text-th-muted">Patient Email Template</p>
          </div>
         </div>
         <span className="material-symbols-outlined text-xs text-th-muted">chevron_right</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-th-border hover:border-primary/50 cursor-pointer transition-colors group bg-th-surface-raised">
         <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-th-secondary group-hover:text-primary transition-colors">description</span>
          <div>
           <p className="text-sm font-medium text-th-heading">Payer Appeal Form</p>
           <p className="text-[10px] text-th-muted">Standardized Denial Appeal</p>
          </div>
         </div>
         <span className="material-symbols-outlined text-xs text-th-muted">chevron_right</span>
        </div>
       </div>

       {/* Notes Area */}
       <div className="mt-6 font-sans">
        <label className="block text-[10px] font-bold text-th-muted uppercase tracking-widest mb-2">Quick Note (Auto-saves)</label>
        <textarea className="w-full bg-th-surface-overlayborder-th-border rounded-lg text-sm p-3 h-24 focus:ring-primary focus:border-primary text-th-heading" placeholder="Type call notes here..."></textarea>
        <div className="flex items-center justify-between mt-2">
         <div className="flex items-center gap-1 text-[10px] text-th-muted">
          <span className="material-symbols-outlined text-xs text-emerald-500">check_circle</span>
          Synced with EPIC EHR
         </div>
         <button className="text-[10px] font-bold text-primary hover:underline">Complete Task (Alt + C)</button>
        </div>
       </div>
      </div>
     </div>
    </div>
   </div>

   {/* Hotkey Toolbar (Bottom) */}
   <footer className="bg-th-surface-raised border-t border-th-border px-6 py-2 flex items-center justify-between shrink-0 h-10">
    <div className="flex items-center gap-4 text-[10px] font-medium text-th-secondary uppercase tracking-widest">
     <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-th-surface-overlayborder border-th-border font-sans">&#8984;</kbd><kbd className="px-1.5 py-0.5 rounded bg-th-surface-overlayborder border-th-border font-sans">K</kbd> Search</span>
     <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-th-surface-overlayborder border-th-border font-sans">Enter</kbd> Open Task</span>
     <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-th-surface-overlayborder border-th-border font-sans">ESC</kbd> Close Call</span>
    </div>
    <div className="flex items-center gap-2">
     <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
     <span className="text-xs font-semibold text-emerald-500">VOIP Ready</span>
    </div>
   </footer>
  </div>
 );
}
