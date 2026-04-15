import React from 'react';

/**
 * ErrorBoundary — catches React render errors so a single page failure doesn't
 * crash the entire Detect layout. Used around routes that call many APIs with
 * varying response shapes (detectBriefing, RCA tree, etc.).
 *
 * Usage:
 *   <ErrorBoundary label="Denial Command">
 *     <DenialManagement />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // Surface to console so devs can diagnose; keep UI friendly.
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${this.props.label || 'Page'}]`, error, info);
  }

  reset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    const { error, info } = this.state;
    const { children, label } = this.props;

    if (!error) return children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 gap-4 text-center">
        <div className="size-14 rounded-full bg-[rgb(var(--color-danger-bg))] flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px] text-[rgb(var(--color-danger))]">error</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-th-heading">Something went wrong{label ? ` in ${label}` : ''}</h2>
          <p className="text-sm text-th-muted mt-1 max-w-md">
            The page hit an unexpected error and couldn't render. Other pages are unaffected.
          </p>
        </div>
        <pre className="text-[11px] font-mono text-th-danger bg-[rgb(var(--color-danger-bg))]/40 border border-[rgb(var(--color-danger))]/30 rounded-md p-3 max-w-2xl overflow-x-auto text-left">
          {error?.message || String(error)}
        </pre>
        <div className="flex gap-2">
          <button
            onClick={this.reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary))] text-white text-sm font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] focus-visible:ring-offset-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-th-surface-raised border border-th-border text-th-heading text-sm font-semibold hover:bg-th-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Back to Command Center
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
