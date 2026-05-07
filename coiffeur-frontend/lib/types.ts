export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

export type Service = {
  id: number;
  nom: string;
  description?: string | null;
  duree: number;
  prix: number;
  image?: string | null;
  image_url?: string | null;
  statut?: "actif" | "inactif" | string;
};

export type CreateServiceDto = {
  nom: string;
  description?: string;
  duree: number;
  prix: number;
  statut?: "actif" | "inactif" | string;
  image?: File | null;
};

export type UpdateServiceDto = Partial<CreateServiceDto>;

export type Creneau = {
  id: number;
  service_id: number | string;
  date_creneau: string;
  heure_creneau: string;
  statut: "disponible" | "reserve" | "bloque" | string;
  service_nom?: string;
  service_duree?: number;
  service_prix?: number;
};

export type CreateCreneauDto = {
  service_id?: string | number;
  service_ids?: Array<string | number>;
  date_creneau: string;
  heure_creneau: string;
  statut?: string;
};

export type AvailableDate = {
  date_creneau: string;
  total_creneaux: number;
  total_disponibles: number;
};

export type RendezvousStatut =
  | "en_attente"
  | "confirme"
  | "termine"
  | "annule";

export type Rendezvous = {
  id: number;
  client_id?: number | null;
  nom_client: string;
  prenom_client?: string | null;
  email?: string | null;
  telephone: string;
  service_id: number | string;
  creneau_id: number | string;
  date_rdv: string;
  heure_rdv: string;
  statut: RendezvousStatut;
  prix: number;
  note?: string | null;
  service_nom?: string;
  service_duree?: number;
  date_creneau?: string;
  heure_creneau?: string;
  creneau_statut?: string;
};

export type DashboardStats = {
  total_rendezvous: number;
  rendezvous_en_attente: number;
  rendezvous_confirmes: number;
  creneaux_disponibles: number;
  recette_totale: number;
};