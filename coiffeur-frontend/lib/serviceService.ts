import type {
  ApiResponse,
  CreateServiceDto,
  Service,
  UpdateServiceDto,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("admin_token") || "";
}

function getAuthHeaders() {
  const token = getToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}

function buildServiceFormData(data: CreateServiceDto | UpdateServiceDto) {
  const formData = new FormData();

  if (data.nom !== undefined) {
    formData.append("nom", String(data.nom));
  }

  if (data.duree !== undefined) {
    formData.append("duree", String(data.duree));
  }

  if (data.prix !== undefined) {
    formData.append("prix", String(data.prix));
  }

  if (data.description !== undefined) {
    formData.append("description", String(data.description || ""));
  }

  if (data.statut !== undefined) {
    formData.append("statut", String(data.statut || "actif"));
  }

  if (data.image instanceof File) {
    formData.append("image", data.image);
  }

  return formData;
}

export const serviceService = {
  async getAll(): Promise<ApiResponse<Service[]>> {
    const res = await fetch(`${API_URL}/services`, {
      method: "GET",
      cache: "no-store",
    });

    return res.json();
  },

  async getById(id: number | string): Promise<ApiResponse<Service>> {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    return res.json();
  },

  async create(data: CreateServiceDto): Promise<ApiResponse<Service>> {
    const formData = buildServiceFormData(data);

    const res = await fetch(`${API_URL}/services`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    return res.json();
  },

  async update(
    id: number | string,
    data: UpdateServiceDto
  ): Promise<ApiResponse<Service>> {
    const formData = buildServiceFormData(data);

    const res = await fetch(`${API_URL}/services/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: formData,
    });

    return res.json();
  },

  async delete(id: number | string): Promise<ApiResponse<null>> {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    });

    return res.json();
  },
};