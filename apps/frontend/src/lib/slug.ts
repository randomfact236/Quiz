/**
 * Chapter URL slugs are derived from the chapter name (chapters carry no slug
 * column — name is unique per subject, so the derived slug is too):
 * "Solar System" → "solar-system", "Artists & Bands" → "artists-bands".
 * Single source of truth so the chapter landing page, the subject landing's
 * chapter grid, the sitemap and the middleware slug validation can never
 * drift apart. Pure string work — safe to import from middleware (edge).
 */
export function chapterSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
