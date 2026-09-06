import type { TeamMemberDTO } from "../../server/team/team.dto";
import { request } from "./request";

export type { TeamMemberDTO };

export function getTeam(): Promise<TeamMemberDTO[]> {
  return request<TeamMemberDTO[]>("/api/v1/team");
}
