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

async function safeJsonResponse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message:
          data?.message ||
          data?.error ||
          `Erreur serveur HTTP ${res.status}`,
      } as ApiResponse<T>;
    }

    return data;
  } catch (error) {
    console.error("Erreur parsing JSON :", error);

    return {
      success: false,
      message: "Réponse serveur invalide. Vérifiez le backend.",
    } as ApiResponse<T>;
  }
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
    try {
      const res = await fetch(`${API_URL}/rendezvous`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      return safeJsonResponse<Rendezvous>(res);
    } catch (error) {
      console.error("Erreur create rendezvous :", error);

      return {
        success: false,
        message: "Impossible de créer le rendez-vous.",
      } as ApiResponse<Rendezvous>;
    }
  },

  async getAll(params?: {
    statut?: string;
    date?: string;
  }): Promise<ApiResponse<Rendezvous[]>> {
    try {
      const searchParams = new URLSearchParams();

      if (params?.statut) {
        searchParams.append("statut", params.statut);
      }

      if (params?.date) {
        searchParams.append("date", params.date);
      }

      const query = searchParams.toString();

      const res = await fetch(
        `${API_URL}/rendezvous${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
          cache: "no-store",
        }
      );

      return safeJsonResponse<Rendezvous[]>(res);
    } catch (error) {
      console.error("Erreur getAll rendezvous :", error);

      return {
        success: false,
        message: "Impossible de charger les rendez-vous.",
        data: [],
      } as ApiResponse<Rendezvous[]>;
    }
  },

  async getById(id: string | number): Promise<ApiResponse<Rendezvous>> {
    try {
      const res = await fetch(`${API_URL}/rendezvous/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      return safeJsonResponse<Rendezvous>(res);
    } catch (error) {
      console.error("Erreur getById rendezvous :", error);

      return {
        success: false,
        message: "Impossible de charger ce rendez-vous.",
      } as ApiResponse<Rendezvous>;
    }
  },

  async updateStatut(
    id: string | number,
    statut: RendezvousStatut
  ): Promise<ApiResponse<Rendezvous>> {
    try {
      const res = await fetch(`${API_URL}/rendezvous/${id}/statut`, {
        method: "PATCH",
        headers: getAuthHeaders(),

        // IMPORTANT :
        // Il faut envoyer un objet JSON complet :
        // { "statut": "termine" }
        // Et pas seulement : "termine"
        body: JSON.stringify({
          statut,
        }),
      });

      return safeJsonResponse<Rendezvous>(res);
    } catch (error) {
      console.error("Erreur updateStatut rendezvous :", error);

      return {
        success: false,
        message: "Impossible de modifier le statut du rendez-vous.",
      } as ApiResponse<Rendezvous>;
    }
  },

  async delete(id: string | number): Promise<ApiResponse<null>> {
    try {
      const res = await fetch(`${API_URL}/rendezvous/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      return safeJsonResponse<null>(res);
    } catch (error) {
      console.error("Erreur delete rendezvous :", error);

      return {
        success: false,
        message: "Impossible de supprimer le rendez-vous.",
        data: null,
      } as ApiResponse<null>;
    }
  },
};