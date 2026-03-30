import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfidenceBar } from '../../../components/ui';
import { api } from '../../../services/api';

// ─── Formatted message text with **bold** support ────────────────────────────
function FormattedText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-sm text-th-heading leading-relaxed whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </p>
  );
}

// ─── Message action buttons ───────────────────────────────────────────────────
function MsgActions({ actions, onAction }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={() => onAction?.(a)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
            i === 0
              ? 'bg-primary text-white border-transparent hover:brightness-110 shadow-sm'
              : 'bg-th-surface-overlay text-th-heading border-th-border hover:bg-th-surface-overlay/80'
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

// ─── Root Cause Impact Bars ──────────────────────────────────────────────────
function RootCauseBars({ rootCauses }) {
  if (!rootCauses || rootCauses.length === 0) return null;
  const maxImpact = Math.max(...rootCauses.map(rc => rc.impact || 0), 1);
  const groupColors = {
    PROCESS: 'bg-purple-500',
    PREVENTABLE: 'bg-amber-500',
    PAYER: 'bg-blue-500',
    CLINICAL: 'bg-red-500',
  };
  const groupBorderColors = {
    PROCESS: 'border-purple-500/30',
    PREVENTABLE: 'border-amber-500/30',
    PAYER: 'border-blue-500/30',
    CLINICAL: 'border-red-500/30',
  };

  const fmtDollars = (v) => {
    if (!v) return '$0';
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return `$${v.toLocaleString()}`;
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-sm text-orange-400">troubleshoot</span>
        <span className="text-xs font-bold text-th-heading uppercase tracking-wider">Root Causes</span>
      </div>
      {rootCauses.slice(0, 5).map((rc, i) => (
        <div key={i} className={`rounded-lg border ${groupBorderColors[rc.group] || 'border-th-border'} bg-th-surface-base p-2.5`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${groupColors[rc.group] || 'bg-gray-500'} text-white`}>
                {rc.group}
              </span>
              <span className="text-xs font-bold text-th-heading">{rc.cause?.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-th-secondary">
              <span>{rc.count?.toLocaleString()} claims</span>
              <span className="font-bold text-th-heading">{fmtDollars(rc.impact)}</span>
              <span>{rc.pct?.toFixed(1)}%</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${groupColors[rc.group] || 'bg-gray-500'}`}
              style={{ width: `${Math.max((rc.impact / maxImpact) * 100, 3)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Suggested Actions Panel ─────────────────────────────────────────────────
function SuggestedActions({ actions, onNavigate }) {
  if (!actions || actions.length === 0) return null;
  const typeIcons = {
    automation: 'bolt',
    investigation: 'search',
    prevention: 'shield',
  };
  const typeColors = {
    automation: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    investigation: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    prevention: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-sm text-emerald-400">task_alt</span>
        <span className="text-xs font-bold text-th-heading uppercase tracking-wider">Suggested Actions</span>
      </div>
      <div className="space-y-1.5">
        {actions.slice(0, 5).map((a, i) => (
          <button
            key={i}
            onClick={() => onNavigate?.(a.link || '/analytics/denials/root-cause')}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all hover:brightness-110 ${typeColors[a.type] || 'text-th-heading bg-th-surface-overlay border-th-border'}`}
          >
            <span className="material-symbols-outlined text-sm">{typeIcons[a.type] || 'arrow_forward'}</span>
            <span className="flex-1">{a.action}</span>
            {a.impact > 0 && (
              <span className="text-[10px] font-bold opacity-70">
                {Math.abs(a.impact) >= 1e6 ? `$${(a.impact / 1e6).toFixed(1)}M` : `$${(a.impact / 1e3).toFixed(0)}K`}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Follow-up Question Chips ────────────────────────────────────────────────
function FollowUpChips({ questions, onAsk }) {
  if (!questions || questions.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-sm text-purple-400">forum</span>
        <span className="text-xs font-bold text-th-heading uppercase tracking-wider">Ask Next</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onAsk?.(q)}
            className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-medium text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Data keywords for routing to LIDA ────────────────────────────────────────
const DATA_KEYWORDS = [
  'denial', 'denied', 'deny', 'carc', 'root cause', 'appeal',
  'payment', 'era', 'paid', 'reimbursement', 'underpay', 'collected',
  'claim', 'cpt', 'icd', 'crs', 'clean claim',
  'ar', 'a/r', 'aging', 'outstanding', 'days in',
  'reconcil', 'bank', 'float', 'variance',
  'revenue', 'payer', 'collection rate', 'how many', 'total',
  'top', 'highest', 'lowest', 'trend', 'average', 'distribution',
  'show', 'chart', 'graph', 'visualize', 'plot',
];

function isDataQuestion(text) {
  const lower = text.toLowerCase();
  return DATA_KEYWORDS.some(kw => lower.includes(kw));
}

// ─── Pre-populated conversation ───────────────────────────────────────────────
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'assistant',
    text: "Welcome to LIDA AI. I can analyze your **denials, payments, claims, A/R, and reconciliation** data in real time. Ask me a question about your RCM data, or try one of the suggestions below.\n\nData questions are routed through **LIDA** for structured answers with optional visualizations. General questions use streaming AI.",
    isLida: true,
  },
];

const QUICK_ACTIONS = [
  'What are the top denial reasons?',
  'Show me payment trends by payer',
  'How many claims are over 90 days?',
  'What is the denial rate by payer?',
  'Why does Medicare have high denials?',
  'Why is AR aging increasing?',
];

const SUGGESTED_CHIPS = ['Top denial root causes', 'Show payment trends', 'AR aging breakdown'];

// ─── Main Component ───────────────────────────────────────────────────────────
// ─── Dataset-to-route mapping ─────────────────────────────────────────────────
const DATASET_ROUTES = {
  denials: '/analytics/denials/overview',
  payments: '/analytics/payments/overview',
  claims: '/analytics/claims/overview',
  ar: '/analytics/revenue/ar-aging',
  reconciliation: '/analytics/revenue/reconciliation',
};

export function LidaChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [lidaHealth, setLidaHealth] = useState(null);
  const [notification, setNotification] = useState(null);
  const messagesEndRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Check LIDA health on mount
  useEffect(() => {
    api.lida.health().then(setLidaHealth).catch(() => {});
  }, []);

  // Pre-fill from ?q= search param (used by LidaDashboard goal cards)
  useEffect(() => {
    const prefill = searchParams.get('q');
    if (prefill) {
      sendMessage(prefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // ─── Action button handlers ─────────────────────────────────────────────────
  const handleViewAnalysis = (msg) => {
    const dataset = (msg.datasetUsed || '').toLowerCase();
    const route = DATASET_ROUTES[dataset];
    if (route) {
      navigate(route);
    } else {
      // Default to denials overview
      navigate('/analytics/denials/overview');
    }
  };

  const handleExportInsights = (msg) => {
    const report = {
      question: msg.question || msg.text,
      answer: msg.answer || msg.text,
      dataset: msg.datasetUsed,
      timestamp: new Date().toISOString(),
      ontology_context: msg.ontologyContext,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lida-insight-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification({ type: 'success', text: 'Insight exported successfully' });
  };

  const handleCreateAction = async (msg) => {
    try {
      await api.automation.evaluate();
      setNotification({ type: 'success', text: 'Action item created — rule evaluation triggered' });
    } catch {
      // Fallback: navigate to automation page with context
      navigate('/work/automation');
    }
  };

  const handleMsgAction = (actionLabel, msg) => {
    if (actionLabel === 'View Full Analysis') handleViewAnalysis(msg);
    else if (actionLabel === 'Export Insights') handleExportInsights(msg);
    else if (actionLabel === 'Create Action Item') handleCreateAction(msg);
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;
    const userMsgId = Date.now();
    const assistantMsgId = userMsgId + 1;

    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text: trimmed }]);
    setInputValue('');
    setIsThinking(true);

    // Route: data question -> LIDA ask, general -> SSE streaming
    if (isDataQuestion(trimmed)) {
      // ── LIDA Data Answer Path ──
      setMessages((prev) => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        text: '',
        streaming: true,
        isLida: true,
      }]);

      try {
        let result = await api.lida.ask(trimmed);

        // Retry once if LLM was cold/unavailable on first attempt
        if (result?.answer?.startsWith('LLM unavailable')) {
          await new Promise(r => setTimeout(r, 2000));
          result = await api.lida.ask(trimmed);
        }

        if (result && result.answer && !result.answer.startsWith('LLM unavailable')) {
          // Show text answer immediately
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    text: result.answer,
                    streaming: false,
                    isLida: true,
                    datasetUsed: result.dataset_used,
                    ontologyContext: result.ontology_context || result.ontology_enriched,
                    chartImage: null,
                    actions: ['View Full Analysis', 'Export Insights', 'Create Action Item'],
                    // Root cause data (populated when method === 'root_cause_search')
                    rootCauses: result.root_causes || null,
                    suggestedActions: result.suggested_actions || null,
                    followUpQuestions: result.follow_up_questions || null,
                    method: result.method || null,
                  }
                : m
            )
          );

          // Fetch chart separately (non-blocking)
          api.lida.chart(result.dataset_used || 'denials', trimmed).then((chartResult) => {
            const raster = chartResult?.charts?.[0]?.raster;
            if (raster) {
              setMessages((prev) =>
                prev.map((m) => m.id === assistantMsgId ? { ...m, chartImage: raster } : m)
              );
            }
          }).catch(() => {});
        } else {
          // Fallback to Ollama streaming
          let fallbackText = '';
          try {
            await api.ai.streamInsights(trimmed, (token) => {
              fallbackText += token;
              setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, text: fallbackText } : m));
            }, () => {
              setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, streaming: false, isLida: false } : m));
            });
          } catch {
            setMessages((prev) => prev.map((m) => m.id === assistantMsgId
              ? { ...m, text: 'Ollama is warming up. Please try again in a few seconds.', streaming: false, isLida: true }
              : m));
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, text: 'Connecting to AI... Please try again in a moment.', streaming: false, isLida: true }
              : m
          )
        );
      }
      setIsThinking(false);
    } else {
      // ── General Chat SSE Path ──
      setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', text: '', streaming: true }]);

      let accumulated = '';
      esRef.current = api.ai.streamChat(
        trimmed,
        (token) => {
          accumulated += token;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, text: accumulated } : m))
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, streaming: false, actions: ['View Full Analysis', 'Export Insights', 'Create Action Item'] }
                : m
            )
          );
          setIsThinking(false);
          esRef.current = null;
        }
      );

      // Fallback if SSE fails after 8s
      const fallbackTimer = setTimeout(async () => {
        if (accumulated.length === 0 && esRef.current) {
          esRef.current.close();
          esRef.current = null;
          try {
            const result = await api.ai.getInsights(trimmed);
            const fallbackText = result?.insights?.map((i) => i.text || i.insight || JSON.stringify(i)).join('\n\n')
              || 'I was unable to generate a response. Please try again.';
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, text: fallbackText, streaming: false } : m))
            );
          } catch {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, text: 'Sorry, the AI service is currently unavailable. Please try again later.', streaming: false }
                  : m
              )
            );
          }
          setIsThinking(false);
        }
      }, 8000);

      const currentEs = esRef.current;
      if (currentEs) {
        const origOnMsg = currentEs.onmessage;
        currentEs.onmessage = (e) => {
          if (e.data === '[DONE]') clearTimeout(fallbackTimer);
          origOnMsg?.(e);
        };
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleChipClick = (text) => {
    setInputValue(text);
    sendMessage(text);
  };

  return (
    <div className="flex h-full text-th-heading font-sans overflow-hidden">
      {/* ── LEFT PANEL: Quick Actions ── */}
      <aside className="w-[280px] bg-th-surface-sidebar border-r border-th-border flex flex-col shrink-0 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-th-border flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-purple-500 text-lg">psychology</span>
          <h3 className="text-sm font-bold text-th-heading">Session Context</h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
          {/* LIDA Status */}
          <div>
            <p className="section-title">LIDA Engine</p>
            <div className={`rounded-lg border p-3 ${
              lidaHealth?.ready ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {lidaHealth?.ready ? (
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <span className="size-2 rounded-full bg-amber-400" />
                )}
                <p className="text-xs font-bold text-th-heading">
                  {lidaHealth?.ready ? 'Connected' : 'Checking...'}
                </p>
              </div>
              <p className="text-[10px] text-th-muted">
                LIDA: {lidaHealth?.lida_installed ? 'OK' : 'N/A'} | Ollama: {lidaHealth?.ollama_reachable ? 'OK' : 'Offline'}
              </p>
            </div>
          </div>

          {/* Routing Info */}
          <div>
            <p className="section-title">Smart Routing</p>
            <div className="space-y-1.5">
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-2.5">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-0.5">Data Questions</p>
                <p className="text-[10px] text-th-muted">Routed to LIDA for structured answers + charts</p>
              </div>
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-2.5">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">WHY Questions</p>
                <p className="text-[10px] text-th-muted">Root cause engine with actions + follow-ups</p>
              </div>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-2.5">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">General Chat</p>
                <p className="text-[10px] text-th-muted">Streamed via Ollama SSE</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="section-title">Quick Actions</p>
            <div className="space-y-1.5">
              {QUICK_ACTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleChipClick(q)}
                  disabled={isThinking}
                  className="w-full text-left px-3 py-2 rounded-lg bg-th-surface-overlay border border-th-border text-xs text-th-heading hover:bg-th-surface-overlay/80 hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                >
                  <span className="material-symbols-outlined text-sm text-th-muted group-hover:text-primary transition-colors">arrow_forward</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── CENTER: Chat Interface ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Chat Header */}
        <header className="h-14 border-b border-th-border bg-th-surface-raised flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-purple-600 flex items-center justify-center shadow-[0_0_14px_rgba(139,92,246,0.45)]">
              <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-th-heading">LIDA AI</span>
                <span className="text-th-muted text-xs">Revenue Intelligence Assistant</span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
              lidaHealth?.ready ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-amber-500/15 border border-amber-500/30'
            }`}>
              <span className={`size-1.5 rounded-full ${lidaHealth?.ready ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={`text-[10px] font-bold ${lidaHealth?.ready ? 'text-emerald-400' : 'text-amber-400'}`}>
                {lidaHealth?.ready ? 'Live' : 'Degraded'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded-full bg-th-surface-overlay border border-th-border text-[10px] font-bold text-th-secondary">
              LIDA + Ollama + RCM Ontology
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className="flex gap-3"
              style={{
                animation: 'fadeSlideIn 0.35s ease both',
                animationDelay: `${Math.min(index * 60, 400)}ms`,
              }}
            >
              {/* Avatar */}
              {msg.role === 'user' ? (
                <div className="size-8 rounded-full bg-th-surface-overlay border border-th-border flex items-center justify-center shrink-0 text-[11px] font-bold text-th-heading">
                  JC
                </div>
              ) : (
                <div className="size-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                  <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${msg.role === 'user' ? 'text-th-secondary' : 'text-purple-400'}`}>
                    {msg.role === 'user' ? 'You' : 'LIDA AI'}
                  </span>
                  {msg.isLida && !msg.streaming && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/25">
                      Data Answer
                    </span>
                  )}
                  {msg.datasetUsed && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                      {msg.datasetUsed}
                    </span>
                  )}
                  {msg.method === 'root_cause_search' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      Root Cause
                    </span>
                  )}
                  {msg.ontologyContext && !msg.method && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ontology
                    </span>
                  )}
                </div>

                {/* Main message text */}
                <FormattedText text={msg.text} />

                {/* Streaming cursor */}
                {msg.streaming && (
                  <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse rounded-sm" />
                )}

                {/* LIDA Chart Image */}
                {msg.chartImage && (
                  <div className="mt-3 rounded-lg border border-purple-500/30 bg-th-surface-base overflow-hidden shadow-lg shadow-purple-500/5">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-th-border bg-th-surface-raised/50">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-purple-500">bar_chart</span>
                        <span className="text-xs font-bold text-th-heading">LIDA Visualization</span>
                      </div>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `data:image/png;base64,${msg.chartImage}`;
                          link.download = `lida-chart-${Date.now()}.png`;
                          link.click();
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">download</span>
                        Download Chart
                      </button>
                    </div>
                    <div className="p-4 flex justify-center bg-[#1a1a2e]">
                      <img
                        src={`data:image/png;base64,${msg.chartImage}`}
                        alt="LIDA generated visualization"
                        className="max-w-full max-h-96 rounded"
                      />
                    </div>
                  </div>
                )}

                {/* Root Cause Analysis (when method === root_cause_search) */}
                {msg.rootCauses && msg.rootCauses.length > 0 && (
                  <RootCauseBars rootCauses={msg.rootCauses} />
                )}

                {/* Suggested Actions from root cause engine */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <SuggestedActions
                    actions={msg.suggestedActions}
                    onNavigate={(link) => navigate(link)}
                  />
                )}

                {/* Follow-up Question Chips */}
                {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                  <FollowUpChips
                    questions={msg.followUpQuestions}
                    onAsk={(q) => handleChipClick(q)}
                  />
                )}

                {/* Action buttons */}
                {msg.actions && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <MsgActions actions={msg.actions} onAction={(label) => handleMsgAction(label, msg)} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                <span className="material-symbols-outlined text-white text-sm animate-spin">progress_activity</span>
              </div>
              <div className="flex items-center gap-2 pt-1.5">
                <span className="text-sm text-th-secondary italic">LIDA is analyzing...</span>
                <span className="flex gap-1">
                  <span className="size-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="size-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="size-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-th-border bg-th-surface-raised p-4 shrink-0">
          {/* Suggested chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[11px] text-th-muted font-semibold">Suggested:</span>
            {SUGGESTED_CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => handleChipClick(c)}
                disabled={isThinking}
                className="px-3 py-1 rounded-full bg-th-surface-overlay border border-th-border text-[11px] font-medium text-th-heading hover:border-primary/50 hover:bg-th-surface-overlay/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Input box */}
          <div className="flex items-center gap-2 bg-th-surface-base border border-th-border rounded-xl p-2 focus-within:ring-1 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all">
            <span className="material-symbols-outlined text-th-muted p-1 text-lg">auto_awesome</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              className="flex-1 bg-transparent border-none text-th-heading text-sm focus:ring-0 focus:outline-none placeholder-th-muted"
              placeholder="Ask LIDA about revenue, denials, payments, coding..."
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isThinking}
              className="p-2 bg-purple-600 text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-th-muted mt-2">
            Data questions routed to <span className="font-semibold text-purple-400">LIDA</span> | General chat via <span className="font-semibold text-blue-400">Ollama SSE</span>
          </p>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`absolute top-16 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border text-xs font-bold animate-[fadeSlideIn_0.3s_ease] ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
          }`}>
            <span className="material-symbols-outlined text-sm">
              {notification.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {notification.text}
            <button onClick={() => setNotification(null)} className="ml-2 opacity-60 hover:opacity-100">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
      </main>

      {/* ── Fade-in keyframes ── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
