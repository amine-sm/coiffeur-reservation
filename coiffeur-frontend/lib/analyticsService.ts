const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export type AnalyticsRecommendation = {
  type: "success" | "warning" | "info" | string;
  title: string;
  message: string;
};

export type SmartAnalytics = {
  generated_at: string;
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
    top_requested_service: {
      id: number;
      nom: string;
      total_reservations: number;
    } | null;
    top_revenue_service: {
      id: number;
      nom: string;
      total_rdv: number;
      total_revenue: number;
    } | null;
    top_cancelled_service: {
      id: number;
      nom: string;
      total_annulations: number;
    } | null;
  };
  days: {
    all_days: Array<{
      day_key: string;
      day_name: string;
      total: number;
    }>;
    best_day: {
      day_key: string;
      day_name: string;
      total: number;
    } | null;
    weak_day: {
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
    peak_hour: {
      hour: string;
      total: number;
    } | null;
    weak_hour: {
      hour: string;
      total: number;
    } | null;
  };
  clients: {
    loyal_clients: Array<{
      id: number;
      nom: string;
      prenom: string;
      telephone: string;
      email: string;
      total_rdv: number;
      total_depense: number;
    }>;
    best_client: {
      id: number;
      nom: string;
      prenom: string;
      telephone: string;
      email: string;
      total_rdv: number;
      total_depense: number;
    } | null;
  };
  creneaux: {
    disponibles: number;
    reserves: number;
  };
  recommendations: AnalyticsRecommendation[];
};

export const analyticsService = {
  async getSmartAnalytics(): Promise<{
    success: boolean;
    message?: string;
    data?: SmartAnalytics;
  }> {
    const res = await fetch(`${API_URL}/analytics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    return res.json();
  },
};