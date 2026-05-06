import { apiRequest } from "./api";
import type {
  ApiResponse,
  CreateServiceDto,
  Service,
  UpdateServiceDto,
} from "./types";

export const serviceService = {
  getAll(): Promise<ApiResponse<Service[]>> {
    return apiRequest("/services", {
      method: "GET",
    });
  },

  getById(id: number | string): Promise<ApiResponse<Service>> {
    return apiRequest(`/services/${id}`, {
      method: "GET",
    });
  },

  create(data: CreateServiceDto): Promise<ApiResponse<Service>> {
    return apiRequest("/services", {
      method: "POST",
      body: data,
      auth: true,
    });
  },

  update(id: number | string, data: UpdateServiceDto): Promise<ApiResponse<Service>> {
    return apiRequest(`/services/${id}`, {
      method: "PUT",
      body: data,
      auth: true,
    });
  },

  delete(id: number | string): Promise<ApiResponse> {
    return apiRequest(`/services/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};