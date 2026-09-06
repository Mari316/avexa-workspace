import type { Role } from "../../lib/auth/permissions";

export type TeamMemberDTO = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};
