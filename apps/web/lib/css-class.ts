/**
 * CSS modules are typed as `{ readonly [key: string]: string }`.
 * With `noUncheckedIndexedAccess`, every class lookup is `string | undefined`
 * even when the class exists in the stylesheet.
 */
export function requireCssClass(className: string | undefined): string {
  if (className === undefined) {
    throw new Error("Missing CSS module class");
  }

  return className;
}
