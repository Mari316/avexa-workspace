let pendingDeleteSuccessMessage = false;

export function markTaskDeleteSuccess(): void {
  pendingDeleteSuccessMessage = true;
}

export function consumeDeleteSuccessMessage(): boolean {
  if (!pendingDeleteSuccessMessage) {
    return false;
  }

  pendingDeleteSuccessMessage = false;
  return true;
}
