import type { ApiResponse, AvailableDate, Creneau } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("admin_token") || "";
}

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export const creneauService = {
  async getAvailable(params?: {
    service_id?: string | number;
    date?: string;
  }): Promise<ApiResponse<Creneau[]>> {
    const searchParams = new URLSearchParams();

    if (params?.service_id) {
      searchParams.append("service_id", String(params.service_id));
    }

    if (params?.date) {
      searchParams.append("date", params.date);
    }

    const query = searchParams.toString();

    const res = await fetch(`${API_URL}/creneaux/disponibles${query ? `?${query}` : ""}`, {
      cache: "no-store",
    });

    return res.json();
  },

  async getPublic(params: {
    service_id: string | number;
    date: string;
  }): Promise<ApiResponse<Creneau[]>> {
    const searchParams = new URLSearchParams();

    searchParams.append("service_id", String(params.service_id));
    searchParams.append("date", params.date);

    const res = await fetch(`${API_URL}/creneaux/public?${searchParams.toString()}`, {
      cache: "no-store",
    });

    return res.json();
  },

  async getAvailableDates(params: {
    service_id: string | number;
  }): Promise<ApiResponse<AvailableDate[]>> {
    const searchParams = new URLSearchParams();

    searchParams.append("service_id", String(params.service_id));

    const res = await fetch(
      `${API_URL}/creneaux/dates-disponibles?${searchParams.toString()}`,
      {
        cache: "no-store",
      }
    );

    return res.json();
  },

  async getAllAdmin(): Promise<ApiResponse<Creneau[]>> {
    const res = await fetch(`${API_URL}/creneaux`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    return res.json();
  },

  async create(body: {
    service_id: string | number;
    date_creneau: string;
    heure_creneau: string;
    statut?: string;
  }): Promise<ApiResponse<Creneau>> {
    const res = await fetch(`${API_URL}/creneaux`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    return res.json();
  },

  async update(
    id: string | number,
    body: {
      service_id: string | number;
      date_creneau: string;
      heure_creneau: string;
      statut?: string;
    }
  ): Promise<ApiResponse<Creneau>> {
    const res = await fetch(`${API_URL}/creneaux/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    return res.json();
  },

  async delete(id: string | number): Promise<ApiResponse<null>> {
    const res = await fetch(`${API_URL}/creneaux/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    return res.json();
  },
};