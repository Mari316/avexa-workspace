const deletedTaskSlugs = new Set<string>();
let pendingDeleteSuccessMessage = false;

export function markTaskDeleted(slug: string): void {
  deletedTaskSlugs.add(slug);
  pendingDeleteSuccessMessage = true;
}

export function isTaskDeleted(slug: string): boolean {
  return deletedTaskSlugs.has(slug);
}

export function filterDeletedTasks<T extends { slug: string }>(tasks: T[]): T[] {
  return tasks.filter((task) => !deletedTaskSlugs.has(task.slug));
}

export function consumeDeleteSuccessMessage(): boolean {
  if (!pendingDeleteSuccessMessage) {
    return false;
  }

  pendingDeleteSuccessMessage = false;
  return true;
}
