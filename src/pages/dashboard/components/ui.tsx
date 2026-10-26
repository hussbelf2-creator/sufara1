import type { ReactNode } from 'react';

export function Pill({ tone = 'mute', children }: { tone?: string; children: ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function Card({
  title, sub, action, children, className = '',
}: {
  title?: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Stat({
  icon, num, lbl, delta, up = true,
}: { icon: string; num: string; lbl: string; delta?: string; up?: boolean }) {
  return (
    <div className="stat">
      <div className="top">
        <div className="ic"><i className={icon} /></div>
        {delta && <span className={`delta ${up ? 'up' : 'down'}`}>{delta}</span>}
      </div>
      <div className="num">{num}</div>
      <div className="lbl">{lbl}</div>
    </div>
  );
}

export function Bar({ value, slim = false }: { value: number; slim?: boolean }) {
  return (
    <div className={`bar ${slim ? 'slim' : ''}`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

/* A conic-gradient progress ring — used for the ambassador level progress and
   the monthly challenges. Pure CSS (no SVG), so it recolours itself whenever
   the palette regenerates and animates in on mount. */
export function Ring({
  value, size = 112, tone = 'accent', center, sub,
}: {
  value: number; size?: number; tone?: 'accent' | 'gold'; center?: string; sub?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const deg = (clamped / 100) * 360;
  const color = tone === 'gold' ? 'var(--accent2)' : 'var(--accent)';
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <div
        className="ring-arc"
        style={{ background: `conic-gradient(${color} ${deg}deg, var(--surface-2) ${deg}deg)` }}
        aria-hidden="true"
      />
      <div className="ring-hole">
        <span className="ring-num">{center ?? `${Math.round(clamped)}`}</span>
        {sub && <span className="ring-sub">{sub}</span>}
      </div>
    </div>
  );
}

export function Timeline({ items }: { items: { t: string; s: string; done: boolean }[] }) {
  return (
    <div className="tl">
      {items.map((it, i) => (
        <div key={i} className={`tl-item ${it.done ? 'done' : ''}`}>
          <div className="t">{it.t}</div>
          <div className="s">{it.s}</div>
        </div>
      ))}
    </div>
  );
}

export function PageHead({
  eyebrow, title, sub, actions,
}: { eyebrow?: string; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Modal({
  open, title, sub, onClose, children,
}: { open: boolean; title: string; sub?: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="modal-mask" role="presentation" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {sub && <p className="sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function Switch({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
      <span>{label}</span>
    </label>
  );
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="dash-toast" role="status" aria-live="polite">
      <i className="ri-checkbox-circle-fill" />
      <span>{message}</span>
    </div>
  );
}

/* A single-series column chart used for the click / order / commission trends.
   Bars are plain divs — no SVG, no chart dependency — so they re-scale cleanly
   when the palette changes and stay perfectly on-theme. */
export function MiniTrend({
  title, values, labels, total, delta, up = true, tone = 'accent', format,
}: {
  title: string;
  values: number[];
  labels: string[];
  total: string;
  delta?: string;
  up?: boolean;
  tone?: 'accent' | 'gold' | 'ink';
  format: (n: number) => string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className={`mt ${tone}`}>
      <div className="mt-head">
        <span className="mt-title">{title}</span>
        {delta && <span className={`delta ${up ? 'up' : 'down'}`}>{delta}</span>}
      </div>
      <div className="mt-total">{total}</div>
      <div className="mt-plot">
        {values.map((v, i) => (
          <div className="mt-col" key={labels[i] ?? i}>
            <div className="mt-track">
              <span
                className="mt-bar"
                style={{ height: `${Math.max(6, (v / max) * 100)}%`, animationDelay: `${i * 0.06}s` }}
                title={`${labels[i]}: ${format(v)}`}
              />
            </div>
            <span className="mt-x">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* A thicker, labelled horizontal bar chart for categorical distributions
   (sales by country, factory performance) — a real chart rather than a hair-
   thin progress bar. */
export function HBars({
  items, tone = 'accent',
}: {
  items: { label: string; value: number; display: string }[];
  tone?: 'accent' | 'gold';
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className={`hbars ${tone}`}>
      {items.map((it) => (
        <div className="hbar" key={it.label}>
          <div className="hbar-top">
            <span className="strong">{it.label}</span>
            <span className="muted small">{it.display}</span>
          </div>
          <div className="hbar-track">
            <span style={{ width: `${Math.max(4, (it.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}