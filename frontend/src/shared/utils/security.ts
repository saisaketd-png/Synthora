/**
 * Safe JSON-LD Serializer.
 * 
 * Prevents HTML/script-context breakout attacks (XSS) when embedding JSON-LD
 * within <script type="application/ld+json"> tags.
 * 
 * Standard JSON.stringify does not escape characters like '<', '>', '&' or
 * Unicode line/paragraph separators (U+2028, U+2029). If user-controlled or
 * database content contains strings like "</script><script>...", the HTML parser
 * terminates the script context early and executes the injected tag.
 * 
 * By escaping these characters into valid JSON Unicode escape sequences (\u003c, etc.),
 * the payload remains strictly valid JSON for search engines (Schema.org / Googlebot)
 * while completely neutralizing script-context breakout vulnerabilities.
 */
export function serializeJsonLd(data: unknown): string {
  if (data === null || data === undefined) {
    return "{}";
  }

  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
