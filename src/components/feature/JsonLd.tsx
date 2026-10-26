import { useEffect } from 'react';

interface JsonLdProps {
  id: string;
  data: Record<string, unknown>;
}

/* Injects one JSON-LD block into <head> for the lifetime of the page and
   removes it on unmount, so navigating between pages never leaves stale
   structured data behind. */
export default function JsonLd({ id, data }: JsonLdProps) {
  const json = JSON.stringify(data);

  useEffect(() => {
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = json;
    document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [id, json]);

  return null;
}