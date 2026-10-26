import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '@/lib/monitoring';

/* Catches render errors anywhere below it, reports them, and shows a calm
   fallback instead of a blank page. Bilingual on purpose: it must not depend
   on i18n, which may be what failed. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, `render${info.componentStack ? ` ${info.componentStack.split('\n')[1]?.trim() ?? ''}` : ''}`);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'inherit', textAlign: 'center' }}>
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>حدث خطأ غير متوقع</h1>
          <p style={{ opacity: 0.75, marginBottom: 4 }}>سُجّل الخطأ تلقائيًا وسيراجعه فريقنا.</p>
          <p style={{ opacity: 0.75, marginBottom: 16 }} dir="ltr">Something went wrong — the error was reported.</p>
          <button type="button" onClick={() => window.location.reload()}
            style={{ padding: '10px 22px', borderRadius: 999, border: 0, background: '#1f7a4d', color: '#fff', cursor: 'pointer', fontSize: 15 }}>
            إعادة تحميل الصفحة · Reload
          </button>
        </div>
      </div>
    );
  }
}
