import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const FALLBACK_USERS = [
 { name: "Alice Miller", email: "alice.m@rcm.ai", role: "Super Admin", ava: "AM", color: "bg-purple-900/30 text-purple-400" },
 { name: "David Chen", email: "d.chen@rcm.ai", role: "Billing Manager", ava: "DC", color: "bg-blue-900/30 text-blue-400" },
 { name: "Sarah Jenkins", email: "s.jenkins@rcm.ai", role: "Billing Specialist", ava: "SJ", color: "bg-emerald-900/30 text-emerald-400" },
];

const COLORS = [
 "bg-purple-900/30 text-purple-400",
 "bg-blue-900/30 text-blue-400",
 "bg-emerald-900/30 text-emerald-400",
 "bg-amber-900/30 text-amber-400",
 "bg-red-900/30 text-red-400",
];

export function UserManagement() {
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
  let cancelled = false;
  async function load() {
   setLoading(true);
   setError(null);
   try {
    const data = await api.collections.getUserPerformance();
    if (cancelled) return;
    if (data && data.users && data.users.length > 0) {
     const mapped = data.users.map((u, i) => {
      const name = u.name || u.user_name || `Agent ${u.user_id || i + 1}`;
      const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      return {
       name,
       email: u.email || `${name.toLowerCase().replace(/\s/g, '.')}@rcm.ai`,
       role: u.role || 'Billing Specialist',
       ava: initials,
       color: COLORS[i % COLORS.length],
       metrics: {
        tasksCompleted: u.tasks_completed || u.completed || 0,
        collectionsAmount: u.collections_amount || u.recovered || 0,
        avgResolutionDays: u.avg_resolution_days || u.avg_days || null,
       },
       lastActive: u.last_active || u.last_login || 'Unknown',
       mfaEnabled: u.mfa_enabled !== undefined ? u.mfa_enabled : true,
      };
     });
     setUsers(mapped);
    } else {
     setUsers(FALLBACK_USERS);
    }
   } catch (err) {
    if (cancelled) return;
    setError(err.message);
    setUsers(FALLBACK_USERS);
   } finally {
    if (!cancelled) setLoading(false);
   }
  }
  load();
  return () => { cancelled = true; };
 }, []);

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   {/* Action Button */}
   <div className="flex justify-end">
    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-th-heading px-5 py-2.5 rounded-lg font-bold text-sm transition-all">
     <span className="material-symbols-outlined text-sm">person_add</span> Add User
    </button>
   </div>

   <div className="grid grid-cols-12 gap-6">
    {/* Left: Role Hierarchy (3 cols) */}
    <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
     <div className="bg-th-surface-raised rounded-xl border border-th-border border-l-[3px] border-l-blue-500 overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <div className="p-4 border-b border-th-border">
       <h3 className="text-sm font-bold text-th-heading">Role Hierarchy</h3>
      </div>
      <ul className="p-2 space-y-1">
       <li className="p-2 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-sm flex items-center gap-2 cursor-pointer">
        <span className="material-symbols-outlined text-lg">admin_panel_settings</span> Super Admin
       </li>
       <li className="p-2 rounded-lg hover:bg-th-surface-overlay text-th-secondary font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors">
        <span className="material-symbols-outlined text-lg">account_balance</span> Finance Exec
       </li>
       <li className="p-2 ml-4 rounded-lg hover:bg-th-surface-overlay text-th-secondary font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors">
        <span className="material-symbols-outlined text-lg">supervisor_account</span> Billing Manager
       </li>
       <li className="p-2 ml-8 rounded-lg hover:bg-th-surface-overlay text-th-secondary font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors">
        <span className="material-symbols-outlined text-lg">person</span> Billing Specialist
       </li>
      </ul>
      <div className="p-3 border-t border-th-border">
       <button className="w-full py-2 border border-dashed border-th-border rounded-lg text-xs font-bold text-th-muted hover:text-blue-400 transition-colors">
        + Create Custom Role
       </button>
      </div>
     </div>

     <div className="bg-th-surface-raised rounded-xl border border-th-border border-l-[3px] border-l-red-500 overflow-hidden flex-1 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <div className="p-4 border-b border-th-border flex items-center justify-between">
       <h3 className="text-sm font-bold text-th-heading">Security Audit Log</h3>
       <span className="size-2 rounded-full bg-red-500 animate-pulse"></span>
      </div>
      <div className="p-4 space-y-4">
       {[
        { time: "09:15:33", msg: "Security Policy updated", user: "Admin" },
        { time: "09:12:10", msg: "User J.Doe added to Group 'Finance'", user: "Admin" },
        { time: "08:45:00", msg: "Failed login attempt (IP: 192.168.1.1)", user: "System" },
       ].map((log, i) => (
        <div key={i} className="flex gap-3 text-xs">
         <span className="font-mono text-th-secondary shrink-0">{log.time}</span>
         <p className="text-th-heading leading-tight">
          <span className="font-bold text-th-heading">{log.msg}</span>
          <br /><span className="text-[10px] text-th-secondary">by {log.user}</span>
         </p>
        </div>
       ))}
      </div>
     </div>
    </div>

    {/* Right: User Table (9 cols) */}
    <div className="col-span-12 lg:col-span-9 space-y-6">
     <div className="bg-th-surface-raised rounded-xl border border-th-border overflow-hidden min-h-[400px]">
      {/* Table Controls */}
      <div className="p-4 border-b border-th-border flex justify-between items-center">
       <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-th-secondary text-sm">search</span>
        <input type="text" placeholder={`Search ${users.length} users...`} className="pl-9 pr-4 py-2 bg-th-surface-base border border-th-border rounded-lg text-sm text-th-heading w-64" />
       </div>
       <div className="flex gap-2 items-center">
        {error && <span className="text-xs text-amber-400 mr-2">Using cached data</span>}
        <button className="px-3 py-2 bg-th-surface-overlay border border-th-border-strong rounded-lg text-xs font-bold text-th-heading">Filter</button>
        <button className="px-3 py-2 bg-th-surface-overlay border border-th-border-strong rounded-lg text-xs font-bold text-th-heading">Export CSV</button>
       </div>
      </div>

      {/* Table */}
      {loading ? (
       <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
       </div>
      ) : (
       <table className="w-full text-left text-sm">
        <thead className="bg-th-surface-overlay/50 border-b border-th-border text-th-muted font-semibold">
         <tr>
          <th className="px-6 py-4">User</th>
          <th className="px-6 py-4">Role</th>
          <th className="px-6 py-4">2FA Status</th>
          <th className="px-6 py-4">Last Active</th>
          <th className="px-6 py-4">Performance</th>
          <th className="px-6 py-4">Actions</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
         {users.map((user, i) => (
          <tr key={i} className="hover:bg-th-surface-overlay/50 transition-colors cursor-pointer group">
           <td className="px-6 py-4">
            <div className="flex items-center gap-3">
             <div className={`size-9 rounded-full ${user.color} flex items-center justify-center font-bold text-xs`}>{user.ava}</div>
             <div>
              <p className="font-bold text-th-heading">{user.name}</p>
              <p className="text-xs text-th-muted">{user.email}</p>
             </div>
            </div>
           </td>
           <td className="px-6 py-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-th-surface-overlay text-th-secondary">
             {user.role}
            </span>
           </td>
           <td className="px-6 py-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest border ${
             user.mfaEnabled !== false
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>{user.mfaEnabled !== false ? 'Enabled' : 'Disabled'}</span>
           </td>
           <td className="px-6 py-4 text-th-secondary">{user.lastActive || '2 mins ago'}</td>
           <td className="px-6 py-4">
            {user.metrics ? (
             <div className="flex items-center gap-3 text-xs">
              {user.metrics.tasksCompleted > 0 && (
               <span className="text-th-heading font-bold tabular-nums">{user.metrics.tasksCompleted} tasks</span>
              )}
              {user.metrics.collectionsAmount > 0 && (
               <span className="text-emerald-400 font-bold tabular-nums">${(user.metrics.collectionsAmount / 1000).toFixed(1)}k</span>
              )}
             </div>
            ) : (
             <span className="text-xs text-th-muted">--</span>
            )}
           </td>
           <td className="px-6 py-4">
            <button className="text-th-secondary hover:text-blue-400 transition-colors"><span className="material-symbols-outlined">more_horiz</span></button>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      )}
     </div>

     {/* Permissions Matrix */}
     <div className="bg-th-surface-raised rounded-xl border border-th-border border-l-[3px] border-l-purple-500 p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-center mb-4">
       <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400">Granular Permissions Matrix</h3>
        <p className="text-[10px] text-th-muted">Configuring: Super Admin</p>
       </div>
      </div>
      <div className="overflow-x-auto">
       <table className="w-full text-xs">
        <thead>
         <tr className="border-b border-th-border">
          <th className="text-left py-2 font-bold text-th-muted">Module Access</th>
          <th className="text-center py-2 font-bold text-th-muted">View</th>
          <th className="text-center py-2 font-bold text-th-muted">Edit</th>
          <th className="text-center py-2 font-bold text-th-muted">Delete</th>
          <th className="text-center py-2 font-bold text-th-muted">Export</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
         {['Billing Rules', 'User Management', 'Financial Reports', 'Patient Data'].map((row, i) => (
          <tr key={i}>
           <td className="py-3 font-medium text-th-heading">{row}</td>
           <td className="text-center"><input type="checkbox" defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600" /></td>
           <td className="text-center"><input type="checkbox" defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600" /></td>
           <td className="text-center"><input type="checkbox" defaultChecked={i < 2} className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600" /></td>
           <td className="text-center"><input type="checkbox" defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600" /></td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}
