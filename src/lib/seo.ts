/* Public site canonical origin, used by JSON-LD blocks and the sitemap.
   Change this one constant if the store moves to a custom domain. */
export const SITE_URL = 'https://safeer.sa';

export interface Crumb {
  name: string;
  path: string;
}

export function absoluteUrl(path: string) {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}