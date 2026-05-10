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

function buildServiceFormData(data: CreateServiceDto | UpdateServiceDto | FormData) {
  if (data instanceof FormData) {
    return data;
  }

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

async function handleJsonResponse<T>(res: Response): Promise<ApiResponse<T>> {
  let json: ApiResponse<T>;

  try {
    json = await res.json();
  } catch {
    throw new Error("Réponse serveur invalide.");
  }

  if (!res.ok) {
    throw new Error(json.message || json.error || "Erreur serveur.");
  }

  return json;
}

export const serviceService = {
  async getAll(): Promise<ApiResponse<Service[]>> {
    const res = await fetch(`${API_URL}/services`, {
      method: "GET",
      cache: "no-store",
    });

    return handleJsonResponse<Service[]>(res);
  },

  async getById(id: number | string): Promise<ApiResponse<Service>> {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    return handleJsonResponse<Service>(res);
  },

  async create(
    data: CreateServiceDto | FormData,
  ): Promise<ApiResponse<Service>> {
    const formData = buildServiceFormData(data);

    const res = await fetch(`${API_URL}/services`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    return handleJsonResponse<Service>(res);
  },

  async update(
    id: number | string,
    data: UpdateServiceDto | FormData,
  ): Promise<ApiResponse<Service>> {
    const formData = buildServiceFormData(data);

    const res = await fetch(`${API_URL}/services/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: formData,
    });

    return handleJsonResponse<Service>(res);
  },

  async delete(id: number | string): Promise<ApiResponse<null>> {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    return handleJsonResponse<null>(res);
  },
};