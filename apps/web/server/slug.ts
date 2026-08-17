/**
 * Authoritative slug rule for every routable entity. The UI must not derive slugs
 * itself: a slug is the routing identity and has to satisfy the `*_slug_url_safe`
 * database constraints, `^[a-z0-9]+(-[a-z0-9]+)*$`.
 *
 * Returns an empty string when the input contains nothing sluggable, which callers
 * translate into their own domain error.
 */
export function slugify(value: string): string {
  return (
    value
      // Split accented characters into base letter + combining mark, then drop the marks.
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      // Any run of characters that cannot appear in a slug becomes a single separator.
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}
