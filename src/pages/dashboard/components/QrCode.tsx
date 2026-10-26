import { useEffect, useState } from 'react';
import QR from 'qrcode';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/pages/dashboard/components/ui';

/* A real, scannable QR code (ISO/IEC 18004, error correction M) rendered
   to a PNG data URL. The earlier decorative pattern could not be scanned —
   which matters now that leader ambassadors print QR cards in batches for
   pilgrims' groups. */
export async function qrDataUrl(value: string, size = 512): Promise<string> {
  return QR.toDataURL(value || ' ', { errorCorrectionLevel: 'M', margin: 1, width: size, color: { dark: '#0f2a1d', light: '#ffffff' } });
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function QrCode({ value, size = 176 }: { value: string; size?: number }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    qrDataUrl(value, size * 2).then((url) => { if (alive) setSrc(url); }).catch(() => setSrc(''));
    return () => { alive = false; };
  }, [value, size]);
  return (
    <div className="qr is-real" style={{ width: size, height: size }}>
      {src && <img src={src} alt={value} width={size - 20} height={size - 20} />}
    </div>
  );
}

export function QrDownloadModal({
  open, onClose, value, target, onDownload,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  target: string;
  onDownload: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <Modal open={open} onClose={onClose} title={t('dashboard.qr.title')} sub={t('dashboard.qr.sub')}>
      <div className="qr-wrap">
        <QrCode value={value} />
      </div>
      <div className="code-box" style={{ marginTop: 14 }}>
        <div>
          <div className="small muted">{target}</div>
          <div className="val">{value}</div>
        </div>
      </div>
      <div className="modal-actions">
        <button
          type="button"
          className="btn primary"
          onClick={async () => {
            downloadDataUrl(await qrDataUrl(value, 1024), `safeer-qr-${value.replace(/[^\w-]+/g, '_').slice(0, 40)}.png`);
            onDownload();
          }}
        >
          <i className="ri-download-2-line" /> {t('dashboard.qr.download')}
        </button>
        <button type="button" className="btn ghost" onClick={copy}>
          <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} /> {copied ? t('dashboard.common.copied') : t('dashboard.common.copy')}
        </button>
      </div>
    </Modal>
  );
}