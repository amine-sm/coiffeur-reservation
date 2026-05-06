import type { ApiResponse, Rendezvous, RendezvousStatut } from "@/lib/types";

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

export const rendezvousService = {
  async create(body: {
    nom_client: string;
    prenom_client?: string;
    email?: string;
    telephone: string;
    service_id: string | number;
    creneau_id: string | number;
    note?: string;
  }): Promise<ApiResponse<Rendezvous>> {
    const res = await fetch(`${API_URL}/rendezvous`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return res.json();
  },

  async getAll(params?: {
    statut?: string;
    date?: string;
  }): Promise<ApiResponse<Rendezvous[]>> {
    const searchParams = new URLSearchParams();

    if (params?.statut) {
      searchParams.append("statut", params.statut);
    }

    if (params?.date) {
      searchParams.append("date", params.date);
    }

    const query = searchParams.toString();

    const res = await fetch(`${API_URL}/rendezvous${query ? `?${query}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    return res.json();
  },

  async getById(id: string | number): Promise<ApiResponse<Rendezvous>> {
    const res = await fetch(`${API_URL}/rendezvous/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    return res.json();
  },

  async updateStatut(
    id: string | number,
    body: {
      statut: RendezvousStatut;
    }
  ): Promise<ApiResponse<Rendezvous>> {
    const res = await fetch(`${API_URL}/rendezvous/${id}/statut`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    return res.json();
  },

  async delete(id: string | number): Promise<ApiResponse<null>> {
    const res = await fetch(`${API_URL}/rendezvous/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    return res.json();
  },
};