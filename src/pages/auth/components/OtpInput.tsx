import { useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';

type Props = {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  onComplete?: (code: string) => void;
  label: string;
};

export default function OtpInput({
  value, onChange, length = 6, disabled, invalid, onComplete, label,
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? '');

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const focusAt = (index: number) => {
    const target = refs.current[Math.max(0, Math.min(length - 1, index))];
    target?.focus();
    target?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      const next = chars.slice();
      next[index] = '';
      onChange(next.join('').replace(/\s/g, ''));
      return;
    }
    const next = chars.slice();
    digits.split('').forEach((digit, offset) => {
      const slot = index + offset;
      if (slot < length) next[slot] = digit;
    });
    const merged = next.join('');
    onChange(merged);
    const filled = Math.min(length - 1, index + digits.length);
    focusAt(filled);
    if (merged.length === length) onComplete?.(merged);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !chars[index]) {
      event.preventDefault();
      const next = chars.slice();
      next[Math.max(0, index - 1)] = '';
      onChange(next.join(''));
      focusAt(index - 1);
    }
    if (event.key === 'ArrowLeft') focusAt(index - 1);
    if (event.key === 'ArrowRight') focusAt(index + 1);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    commit(event.clipboardData.getData('text'));
    focusAt(length - 1);
  };

  return (
    <div className={`au-otp ${invalid ? 'is-bad' : ''}`} role="group" aria-label={label}>
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          value={char}
          disabled={disabled}
          aria-label={`${label} ${index + 1}`}
          className={char ? 'is-filled' : ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}