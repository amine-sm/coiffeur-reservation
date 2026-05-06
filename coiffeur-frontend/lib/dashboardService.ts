import { apiRequest } from "./api";
import type { ApiResponse, DashboardStats } from "./types";

export const dashboardService = {
  getStats(): Promise<ApiResponse<DashboardStats>> {
    return apiRequest("/admin/stats", {
      method: "GET",
      auth: true,
    });
  },
};