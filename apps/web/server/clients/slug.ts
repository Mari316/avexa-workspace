import { slugify } from "../slug";

/** Client slugs are derived from the client name using the shared slug rule. */
export function slugifyClientName(name: string): string {
  return slugify(name);
}
