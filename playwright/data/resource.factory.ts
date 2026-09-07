export type ResourceType =
  | "Repository"
  | "API Docs"
  | "Environment"
  | "Test Management"
  | "Documentation"
  | "Other";

export type ResourceStatus = "Active" | "Inactive";

export type CreateResourceRequest = {
  name: string;
  url: string;
  type: ResourceType;
  status: ResourceStatus;
  projectId: string;
};

export type UpdateResourceRequest = {
  name?: string;
  url?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  projectId?: string;
};

export type BuildResourceInput = {
  projectId: string;
} & Partial<Omit<CreateResourceRequest, "projectId">>;

export function buildResource(input: BuildResourceInput): CreateResourceRequest {
  const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  return {
    projectId: input.projectId,
    name: input.name ?? `PW resource ${suffix}`,
    url: input.url ?? `https://example.com/pw-${suffix}`,
    type: input.type ?? "Documentation",
    status: input.status ?? "Active",
  };
}
