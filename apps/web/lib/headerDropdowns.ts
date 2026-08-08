export type HeaderDropdown = "search" | "notifications" | "userMenu";

const listeners = new Set<(opened: HeaderDropdown) => void>();

export function openHeaderDropdown(dropdown: HeaderDropdown): void {
  listeners.forEach((listener) => listener(dropdown));
}

export function subscribeHeaderDropdown(
  listener: (opened: HeaderDropdown) => void,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
