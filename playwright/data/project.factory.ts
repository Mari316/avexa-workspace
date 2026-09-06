export type ProjectEnvironment =
  | "Development"
  | "QA"
  | "Staging"
  | "Production"
  | "Demo";

export type ProjectStatus = "Active" | "On Hold";

export type CreateProjectRequest = {
  name: string;
  clientId: string;
  environment: ProjectEnvironment;
  status: ProjectStatus;
};

export type UpdateProjectRequest = {
  name?: string;
  clientId?: string;
  environment?: ProjectEnvironment;
  status?: ProjectStatus;
};

export type BuildProjectInput = {
  clientId: string;
} & Partial<Omit<CreateProjectRequest, "clientId">>;

export function buildProject(input: BuildProjectInput): CreateProjectRequest {
  return {
    clientId: input.clientId,
    name: input.name ?? `PW project ${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    environment: input.environment ?? "QA",
    status: input.status ?? "Active",
  };
}
