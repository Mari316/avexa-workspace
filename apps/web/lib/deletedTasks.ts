const STORAGE_KEY = "avexa.taskDeleted";

export function markTaskDeleteSuccess(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Ignore quota / private-mode failures; the list redirect still succeeds.
  }
}

export function hasTaskDeleteSuccess(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearTaskDeleteSuccess(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage access failures.
  }
}
