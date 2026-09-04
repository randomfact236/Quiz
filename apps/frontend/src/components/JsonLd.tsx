/**
 * JSON-LD structured data injector (plan/15-seo.md P1).
 * Server-safe: renders a plain <script type="application/ld+json">. The `<`
 * escaping keeps user-derived strings from closing the script tag early.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}): JSX.Element {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
