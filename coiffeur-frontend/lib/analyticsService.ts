const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export type AnalyticsRecommendation = {
  type: "warning" | "success" | "info";
  title: string;
  message: string;
};

export type SmartAnalytics = {
  revenue: {
    today: number;
    week: number;
    month: number;
    previous_month: number;
    month_growth_percent: number;
  };

  rendezvous: {
    total: number;
    en_attente: number;
    confirmes: number;
    termines: number;
    annules: number;
    cancellation_rate: number;
  };

  services: {
    requested: Array<{
      id: number;
      nom: string;
      total_reservations: number;
    }>;

    revenue: Array<{
      id: number;
      nom: string;
      total_rdv: number;
      total_revenue: number;
    }>;

    cancelled: Array<{
      id: number;
      nom: string;
      total_annulations: number;
    }>;

    top_requested_service?: {
      id: number;
      nom: string;
    } | null;

    top_revenue_service?: {
      id: number;
      nom: string;
    } | null;

    top_cancelled_service?: {
      id: number;
      nom: string;
    } | null;
  };

  clients: {
    loyal_clients: Array<{
      id: number;
      nom: string;
      prenom: string;
      telephone?: string;
      email?: string;
      total_rdv: number;
      total_depense: number;
    }>;

    best_client?: {
      id: number;
      nom: string;
      prenom: string;
      total_rdv: number;
      total_depense: number;
    } | null;
  };

  days: {
    all_days: Array<{
      day_key: string;
      day_name: string;
      total: number;
    }>;

    best_day?: {
      day_key: string;
      day_name: string;
      total: number;
    } | null;

    weak_day?: {
      day_key: string;
      day_name: string;
      total: number;
    } | null;
  };

  hours: {
    all_hours: Array<{
      hour: string;
      total: number;
    }>;

    peak_hour?: {
      hour: string;
      total: number;
    } | null;

    weak_hour?: {
      hour: string;
      total: number;
    } | null;
  };

  creneaux: {
    disponibles: number;
    reserves: number;
  };

  recommendations: AnalyticsRecommendation[];
};

export const analyticsService = {
  async getSmartAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    data?: SmartAnalytics;
  }> {
    const query = new URLSearchParams();

    if (params?.startDate) {
      query.set("startDate", params.startDate);
    }

    if (params?.endDate) {
      query.set("endDate", params.endDate);
    }

    const url = `${API_URL}/analytics/smart${
      query.toString() ? `?${query.toString()}` : ""
    }`;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("adminToken")
        : null;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Erreur chargement analytics.",
      };
    }

    return data;
  },
};