export type ContactStatus = "Active" | "Inactive";

export type CreateContactRequest = {
  firstName: string;
  lastName: string;
  clientId: string;
  email: string;
  role: string;
  status: ContactStatus;
};

export type UpdateContactRequest = {
  firstName?: string;
  lastName?: string;
  clientId?: string;
  email?: string;
  role?: string;
  status?: ContactStatus;
};

export type BuildContactInput = {
  clientId: string;
} & Partial<Omit<CreateContactRequest, "clientId">>;

export function buildContact(input: BuildContactInput): CreateContactRequest {
  const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  return {
    clientId: input.clientId,
    firstName: input.firstName ?? "PW",
    lastName: input.lastName ?? `Contact ${unique}`,
    email: input.email ?? `pw.contact.${unique}@example.test`,
    role: input.role ?? "Tester",
    status: input.status ?? "Active",
  };
}
