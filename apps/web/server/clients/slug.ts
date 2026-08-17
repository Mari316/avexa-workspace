/**
 * Authoritative slug rule for clients. The UI must not derive slugs itself:
 * a slug is the routing identity and has to satisfy the `clients_slug_url_safe`
 * database constraint, `^[a-z0-9]+(-[a-z0-9]+)*$`.
 */
export function slugifyClientName(name: string): string {
  return name
    // Split accented characters into base letter + combining mark, then drop the marks.
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // Any run of characters that cannot appear in a slug becomes a single separator.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
