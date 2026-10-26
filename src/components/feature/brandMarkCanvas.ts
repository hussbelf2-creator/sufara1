/* Renders the Safeer emblem to a real raster file.
   The on-page logo is built from styled spans; a PNG export needs the same
   geometry drawn on a canvas. The proportions below mirror the `.brand-mark`
   rules in film.css one-to-one (frame at 12%, crown at 40%, ground at 82%),
   so the downloaded file is pixel-faithful to what people see on the site. */

export type BrandMarkVariant = 'solid' | 'transparent' | 'light';

const GOLD = '#d8b155';
const GOLD_DEEP = '#a97c27';
const GREEN_TOP = '#147a49';
const GREEN_DEEP = '#0a4a2c';
const CREAM = '#f8fbf6';

const LEAF_ANGLES = [-152, -119, -90, -61, -28];

function rgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draws the emblem at `size` x `size` pixels and returns a PNG data URL. */
export function renderBrandMarkPng(
  size: number,
  variant: BrandMarkVariant = 'solid',
): string {
  const px = Math.max(32, Math.round(size));
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const S = px;
  const unit = S / 34;

  if (variant === 'solid') {
    roundedPath(ctx, 0, 0, S, S, S * 0.28);
    const grad = ctx.createLinearGradient(0, 0, S, S);
    grad.addColorStop(0, GREEN_TOP);
    grad.addColorStop(1, GREEN_DEEP);
    ctx.fillStyle = grad;
    ctx.fill();
  } else if (variant === 'light') {
    roundedPath(ctx, 0, 0, S, S, S * 0.28);
    ctx.fillStyle = CREAM;
    ctx.fill();
  }

  const ink = variant === 'solid' ? GOLD : GOLD_DEEP;

  /* inner hairline frame */
  const inset = S * 0.12;
  const frameSize = S - inset * 2;
  roundedPath(ctx, inset, inset, frameSize, frameSize, frameSize * 0.26);
  ctx.lineWidth = Math.max(1, unit);
  ctx.strokeStyle = rgba(ink, variant === 'solid' ? 0.3 : 0.45);
  ctx.stroke();

  /* palm crown — five leaves fanning out of one hinge point */
  const hingeX = S * 0.5;
  const hingeY = S * 0.4;
  const leafW = S * 0.3;
  const leafH = S * 0.06;
  ctx.fillStyle = ink;
  for (const deg of LEAF_ANGLES) {
    ctx.save();
    ctx.translate(hingeX, hingeY);
    ctx.rotate((deg * Math.PI) / 180);
    roundedPath(ctx, 0, -leafH / 2, leafW, leafH, leafH / 2);
    ctx.fill();
    ctx.restore();
  }

  /* trunk */
  const trunkW = S * 0.065;
  const trunkTop = S * 0.4;
  const trunkBottom = S * 0.78;
  roundedPath(
    ctx,
    hingeX - trunkW / 2,
    trunkTop,
    trunkW,
    trunkBottom - trunkTop,
    trunkW / 2,
  );
  ctx.fill();

  /* ground line */
  ctx.beginPath();
  ctx.moveTo(S * 0.21, S * 0.82);
  ctx.lineTo(S * 0.79, S * 0.82);
  ctx.lineWidth = Math.max(1, unit * 1.5);
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(ink, 0.55);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

/** Triggers a browser download of the emblem as a PNG file. */
export function downloadBrandMarkPng(
  size: number,
  variant: BrandMarkVariant = 'solid',
): boolean {
  const url = renderBrandMarkPng(size, variant);
  if (!url) return false;
  const link = document.createElement('a');
  link.href = url;
  link.download = `sia-emblem-${variant}-${size}.png`;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}