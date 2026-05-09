import { apiRequest } from "./api";
import type { Admin, ApiResponse, LoginDto, RegisterAdminDto } from "./types";

export const authService = {
  register(data: RegisterAdminDto): Promise<ApiResponse<Admin>> {
    return apiRequest("/admin/register", {
      method: "POST",
      body: data,
    });
  },

  login(data: LoginDto): Promise<ApiResponse<Admin>> {
    return apiRequest("/admin/login", {
      method: "POST",
      body: data,
    });
  },

  saveToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_token", token);
    }
  },

  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_token");
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
    }
  },

  isAuthenticated() {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("admin_token"));
  },
};