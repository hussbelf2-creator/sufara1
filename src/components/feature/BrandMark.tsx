type BrandMarkProps = {
  size?: number;
  variant?: 'solid' | 'outline';
  className?: string;
  label?: string;
};

/**
 * Safeer emblem — a geometric date-palm crown over a trunk, drawn in fine gold
 * lines on deep Saudi green. Inspired by the "Made in Saudi" identity.
 */
export default function BrandMark({
  size = 34,
  variant = 'solid',
  className = '',
  label = 'Safeer',
}: BrandMarkProps) {
  return (
    <span
      className={`brand-mark brand-mark--${variant}${className ? ` ${className}` : ''}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="img"
      aria-label={label}
    >
      <span className="bm-frame" aria-hidden="true" />
      <span className="bm-leaf bm-leaf-1" aria-hidden="true" />
      <span className="bm-leaf bm-leaf-2" aria-hidden="true" />
      <span className="bm-leaf bm-leaf-3" aria-hidden="true" />
      <span className="bm-leaf bm-leaf-4" aria-hidden="true" />
      <span className="bm-leaf bm-leaf-5" aria-hidden="true" />
      <span className="bm-trunk" aria-hidden="true" />
      <span className="bm-ground" aria-hidden="true" />
    </span>
  );
}