import { useTranslation } from 'react-i18next';
import type { RegField } from '@/pages/auth/lib/registerFields';

type Props = {
  field: RegField;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const inputType: Record<string, string> = {
  text: 'text',
  tel: 'tel',
  url: 'url',
  email: 'email',
};

export default function RegFieldInput({ field, value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const label = t(`dashboard.auth.field.${field.name}`);
  const placeholder = field.placeholder
    ?? (field.kind === 'select' ? t('dashboard.auth.field.choose') : t(`dashboard.auth.field.${field.name}Ph`));

  return (
    <label className={`au-field ${field.half ? 'is-half' : 'is-full'}`}>
      <span>
        {label}
        {field.required && <em className="au-req">*</em>}
      </span>
      <div className={`au-input ${field.kind === 'select' ? 'is-select' : ''}`}>
        <i className={field.icon} />
        {field.kind === 'select' ? (
          <select
            name={field.name}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{t('dashboard.auth.field.choose')}</option>
            {(field.options ?? []).map((key) => (
              <option key={key} value={key}>
                {t(`dashboard.auth.option.${key}`)}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={inputType[field.kind] ?? 'text'}
            name={field.name}
            value={value}
            disabled={disabled}
            dir={field.ltr ? 'ltr' : undefined}
            autoComplete="off"
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    </label>
  );
}