import { asc } from "drizzle-orm";

import { isRole } from "../../lib/auth/permissions";
import { db } from "../db";
import { user } from "../db/schema";
import type { TeamMemberDTO } from "./team.dto";

export async function listTeamMembers(): Promise<TeamMemberDTO[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.name), asc(user.id));

  return rows.flatMap((row) => {
    if (!isRole(row.role)) {
      return [];
    }

    return [
      {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        createdAt: row.createdAt.toISOString(),
      },
    ];
  });
}
