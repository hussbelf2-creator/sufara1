export type CmsLang = 'ar' | 'en';

export type CmsEntry = {
  id: number;
  key: string;
  lang: string;
  page_key: string;
  area: string;
  label_ar: string | null;
  label_en: string | null;
  value: string;
  kind: string;
  published: boolean;
  sort_order: number;
  updated_at?: string | null;
  last_editor?: string | null;
  scheduled_at?: string | null;
  scheduled_value?: string | null;
  scheduled_published?: boolean | null;
  scheduled_editor?: string | null;
};

export type CmsVersion = {
  id: number;
  entry_id: number;
  key: string;
  lang: string;
  page_key: string;
  area: string;
  label_ar: string | null;
  label_en: string | null;
  value: string;
  kind: string;
  published: boolean;
  sort_order: number;
  action: string;
  editor: string;
  created_at: string;
};

export type CmsMedia = {
  id: number;
  title_ar: string;
  title_en: string;
  kind: string;
  lang: string;
  section: string;
  url: string;
  poster_url: string | null;
  storage_path: string | null;
  status: string;
  sort_order: number;
  created_at?: string | null;
};