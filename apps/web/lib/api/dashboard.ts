import type {
  DashboardDTO,
  DashboardTaskItem,
} from "../../server/dashboard/dashboard.dto";
import { request } from "./request";

export type { DashboardDTO, DashboardTaskItem };

export function getDashboard(): Promise<DashboardDTO> {
  return request<DashboardDTO>("/api/v1/dashboard");
}
