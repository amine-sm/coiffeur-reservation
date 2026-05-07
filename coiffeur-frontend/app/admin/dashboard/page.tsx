"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { authService } from "@/lib/authService";
import { dashboardService } from "@/lib/dashboardService";
import { serviceService } from "@/lib/serviceService";
import { rendezvousService } from "@/lib/rendezvousService";
import { creneauService } from "@/lib/creneauService";
import type {
  Creneau,
  DashboardStats,
  Rendezvous,
  RendezvousStatut,
  Service,
} from "@/lib/types";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  DollarSign,
  Info,
  LogOut,
  Moon,
  Pencil,
  Plus,
  RefreshCcw,
  Scissors,
  Sun,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

// ============================================================
// CONSTANTES & STYLES
// ============================================================

const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

const goldBg = "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";

const hours = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);

const minutesOptions = ["00", "15", "30", "45"];
const pageSizeOptions = [10, 20, 50];

const inputClass =
  "w-full rounded-2xl border px-4 py-3 outline-none transition-all " +
  "bg-white text-slate-900 placeholder-slate-400 border-slate-200 " +
  "focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 " +
  "dark:bg-[#111111] dark:text-white dark:placeholder-gray-500 dark:border-white/10";

const selectClass =
  "w-full rounded-2xl border px-4 py-3 outline-none transition-all " +
  "bg-white text-slate-900 border-slate-200 " +
  "focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 " +
  "dark:bg-[#111111] dark:text-white dark:border-white/10";

const cardClass =
  "rounded-3xl border p-6 shadow-2xl " +
  "bg-white border-slate-200 shadow-slate-200/60 " +
  "dark:bg-[#0D0D0D] dark:border-white/10 dark:shadow-black/40";

const tableWrapperClass =
  "mt-5 overflow-x-auto rounded-2xl border " +
  "bg-white border-slate-200 " +
  "dark:bg-[#0D0D0D] dark:border-white/15";

const tableClass = "w-full border-collapse text-left";

const theadClass =
  "bg-slate-100 text-slate-900 dark:bg-black dark:!text-white";

const thClass =
  "px-4 py-4 text-xs font-black uppercase tracking-[0.14em] " +
  "bg-slate-100 text-slate-700 dark:bg-black dark:!text-white";

const rowClass =
  "group transition-all duration-200 " +
  "bg-white hover:!bg-slate-100 " +
  "dark:bg-[#0D0D0D] dark:hover:!bg-white";

const tdWhite =
  "px-4 py-4 text-sm font-semibold transition-colors duration-200 " +
  "text-slate-900 group-hover:text-slate-950 " +
  "dark:!text-white dark:group-hover:!text-black";

const tdLight =
  "px-4 py-4 text-sm font-semibold transition-colors duration-200 " +
  "text-slate-700 group-hover:text-slate-950 " +
  "dark:!text-white dark:group-hover:!text-black";

// ============================================================
// TYPES
// ============================================================

type AlertType = "success" | "error" | "info" | "warning";

type AlertState = {
  type: AlertType;
  message: string;
} | null;

// ============================================================
// FONCTIONS UTILES
// ============================================================

function formatDateOnly(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return text;
}

function formatTimeOnly(value: string | null | undefined): string {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

function getTodayDateValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPastCreneau(dateValue: string, timeValue: string): boolean {
  if (!dateValue || !timeValue) return false;
  const selectedDateTime = new Date(`${dateValue}T${timeValue}:00`);
  const now = new Date();
  return selectedDateTime.getTime() < now.getTime();
}

function getCurrentTimeValue(): string {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}

// ============================================================
// FORMS INITIAUX
// ============================================================

const initialServiceForm = {
  id: "",
  nom: "",
  duree: "",
  prix: "",
  image: null as File | null,
  imagePreview: "",
  oldImageUrl: "",
  description: "",
  statut: "actif",
};

const initialCreneauForm = {
  service_ids: [] as string[],
  date_creneau: "",
  heure: "09",
  minute: "30",
};

const initialRdvFilter = {
  statut: "",
  date: getTodayDateValue(),
};

const initialCreneauFilter = {
  date: getTodayDateValue(),
};

// ============================================================
// PAGINATION
// ============================================================

function usePagination<T>(items: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = clampPage(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  useEffect(() => {
    setPage((current) => clampPage(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, totalItems]);

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems,
    setPage,
    setPageSize,
  };
}

function PaginationControls({
  page,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-gray-400">
          Lignes par page
        </span>

        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none focus:border-[#F59E0B] dark:border-white/10 dark:bg-[#111111] dark:text-white"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <span className="text-sm font-semibold text-slate-600 dark:text-gray-300">
          {totalItems === 0
            ? "0 résultat"
            : `${startIndex + 1}-${endIndex} sur ${totalItems}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#111111] dark:text-white dark:hover:bg-white/10"
          title="Première page"
        >
          <ChevronsLeft size={17} />
        </button>

        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#111111] dark:text-white dark:hover:bg-white/10"
          title="Page précédente"
        >
          <ChevronLeft size={17} />
        </button>

        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-black text-amber-700 dark:text-amber-300">
          Page {page} / {totalPages}
        </div>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#111111] dark:text-white dark:hover:bg-white/10"
          title="Page suivante"
        >
          <ChevronRight size={17} />
        </button>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#111111] dark:text-white dark:hover:bg-white/10"
          title="Dernière page"
        >
          <ChevronsRight size={17} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTS UI
// ============================================================

function ThemeModeButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
      >
        Thème
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-all border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
      title={isDark ? "Passer en mode normal" : "Passer en mode sombre"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      {isDark ? "Mode normal" : "Mode sombre"}
    </button>
  );
}

function PrettyAlert({
  alert,
  loading,
  onClose,
}: {
  alert: AlertState;
  loading: boolean;
  onClose: () => void;
}) {
  if (!alert && !loading) return null;

  const alertConfig: Record<
    AlertType,
    {
      icon: React.ReactNode;
      title: string;
      wrapper: string;
      iconBox: string;
      glow: string;
    }
  > = {
    success: {
      icon: <CheckCircle size={22} />,
      title: "Succès",
      wrapper:
        "border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 via-white to-white dark:via-[#0D0D0D] dark:to-[#0D0D0D]",
      iconBox:
        "bg-emerald-400/15 text-emerald-600 dark:text-emerald-300 border-emerald-400/30",
      glow: "shadow-emerald-500/10",
    },
    error: {
      icon: <AlertCircle size={22} />,
      title: "Erreur",
      wrapper:
        "border-red-400/30 bg-gradient-to-r from-red-500/15 via-white to-white dark:via-[#0D0D0D] dark:to-[#0D0D0D]",
      iconBox:
        "bg-red-400/15 text-red-600 dark:text-red-300 border-red-400/30",
      glow: "shadow-red-500/10",
    },
    warning: {
      icon: <AlertCircle size={22} />,
      title: "Attention",
      wrapper:
        "border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-white to-white dark:via-[#0D0D0D] dark:to-[#0D0D0D]",
      iconBox:
        "bg-amber-400/15 text-amber-600 dark:text-amber-300 border-amber-400/30",
      glow: "shadow-amber-500/10",
    },
    info: {
      icon: <Info size={22} />,
      title: "Information",
      wrapper:
        "border-sky-400/30 bg-gradient-to-r from-sky-500/15 via-white to-white dark:via-[#0D0D0D] dark:to-[#0D0D0D]",
      iconBox:
        "bg-sky-400/15 text-sky-600 dark:text-sky-300 border-sky-400/30",
      glow: "shadow-sky-500/10",
    },
  };

  return (
    <div className="mx-auto mb-6 max-w-7xl space-y-3 px-6">
      {alert && (
        <div
          className={`relative overflow-hidden rounded-3xl border p-4 shadow-2xl backdrop-blur-xl animate-[slideDown_0.25s_ease-out] ${
            alertConfig[alert.type].wrapper
          } ${alertConfig[alert.type].glow}`}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FBBF24]/70 to-transparent" />

          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                alertConfig[alert.type].iconBox
              }`}
            >
              {alertConfig[alert.type].icon}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900 dark:text-white">
                {alertConfig[alert.type].title}
              </h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-gray-200">
                {alert.message}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-900 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white dark:hover:text-black"
              title="Fermer"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-3xl border border-amber-400/25 bg-white p-4 text-sm font-bold text-slate-900 shadow-2xl shadow-amber-500/10 dark:bg-[#0D0D0D] dark:text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-[#FBBF24]">
              <span className="animate-spin">⏳</span>
            </div>
            <div>
              <p className="font-black text-slate-900 dark:text-white">
                Chargement
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">
                Chargement du dashboard...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-amber-500/10 dark:border-white/10 dark:bg-[#0D0D0D] dark:shadow-black/30 dark:hover:border-amber-400/30">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-white">
            {title}
          </p>
          <p className={`mt-2 text-2xl font-serif font-bold ${goldText}`}>
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-[#FBBF24] transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
      </div>
    </div>
  );
}

function CreneauBadge({ statut }: { statut: string }) {
  const badgeStyles: Record<string, string> = {
    disponible:
      "border-emerald-400/40 bg-emerald-400/10 !text-emerald-600 dark:!text-emerald-300",
    reserve:
      "border-red-400/40 bg-red-400/10 !text-red-600 dark:!text-red-300",
    bloque:
      "border-amber-400/40 bg-amber-400/10 !text-amber-600 dark:!text-amber-300",
  };

  const labels: Record<string, string> = {
    disponible: "Disponible",
    reserve: "Réservé",
    bloque: "Bloqué",
  };

  const style = badgeStyles[statut] || badgeStyles.disponible;
  const label = labels[statut] || statut;

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black transition-all duration-200 group-hover:border-black/30 group-hover:bg-black/5 group-hover:!text-black ${style}`}
    >
      {label}
    </span>
  );
}

function RdvBadge({ statut }: { statut: RendezvousStatut }) {
  const badgeStyles: Record<RendezvousStatut, string> = {
    en_attente:
      "border-amber-400/40 bg-amber-400/10 !text-amber-600 dark:!text-amber-300",
    confirme:
      "border-emerald-400/40 bg-emerald-400/10 !text-emerald-600 dark:!text-emerald-300",
    termine:
      "border-sky-400/40 bg-sky-400/10 !text-sky-600 dark:!text-sky-300",
    annule:
      "border-red-400/40 bg-red-400/10 !text-red-600 dark:!text-red-300",
  };

  const labels: Record<RendezvousStatut, string> = {
    en_attente: "En attente",
    confirme: "Confirmé",
    termine: "Terminé",
    annule: "Annulé",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black transition-all duration-200 group-hover:border-black/30 group-hover:bg-black/5 group-hover:!text-black ${badgeStyles[statut]}`}
    >
      {labels[statut]}
    </span>
  );
}

function DashboardHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 pb-6 pt-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-lg shadow-amber-500/20">
          <Scissors size={20} />
        </div>

        <div>
          <h1 className={`text-2xl font-serif font-bold ${goldText}`}>
            Dashboard Admin
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400">
            Services, rendez-vous et créneaux
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ThemeModeButton />

        <button
          onClick={onLogout}
          className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

function StatsSection({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total RDV"
          value={stats?.total_rendezvous ?? 0}
          icon={<CalendarDays />}
        />

        <StatCard
          title="En attente"
          value={stats?.rendezvous_en_attente ?? 0}
          icon={<Clock />}
        />

        <StatCard
          title="Confirmés"
          value={stats?.rendezvous_confirmes ?? 0}
          icon={<CheckCircle />}
        />

        <StatCard
          title="Disponibles"
          value={stats?.creneaux_disponibles ?? 0}
          icon={<CheckCircle />}
        />

        <StatCard
          title="Recette"
          value={`${stats?.recette_totale ?? 0} DZD`}
          icon={<DollarSign />}
        />
      </div>
    </div>
  );
}

function ServiceForm({
  form,
  onChange,
  onImageChange,
  onSubmit,
  onReset,
}: {
  form: typeof initialServiceForm;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}) {
  const previewImage = form.imagePreview || form.oldImageUrl;

  return (
    <div className={cardClass}>
      <h2
        className={`flex items-center gap-2 text-xl font-serif font-bold ${goldText}`}
      >
        <Plus size={20} />
        {form.id ? "Modifier le service" : "Ajouter un service"}
      </h2>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          name="nom"
          value={form.nom}
          onChange={onChange}
          required
          placeholder="Nom du service"
          className={inputClass}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-gray-400">
              Durée
            </label>
            <input
              name="duree"
              type="number"
              value={form.duree}
              onChange={onChange}
              required
              placeholder="Ex: 30"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-gray-400">
              Prix
            </label>
            <input
              name="prix"
              type="number"
              value={form.prix}
              onChange={onChange}
              required
              placeholder="Ex: 700"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold text-slate-500 dark:text-gray-400">
            Photo du service
          </label>

          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.03]">
            {previewImage ? (
              <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                <img
                  src={previewImage}
                  alt="Aperçu service"
                  className="h-44 w-full object-cover"
                />
              </div>
            ) : (
              <div className="mb-4 flex h-44 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-400 dark:border-white/10 dark:bg-[#111111] dark:text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud size={34} />
                  <span>Aucune photo sélectionnée</span>
                </div>
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={onImageChange}
              className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-400 file:px-4 file:py-2 file:font-black file:text-black hover:file:bg-amber-300 dark:border-white/10 dark:bg-[#111111] dark:text-white"
            />

            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-gray-400">
              Formats acceptés : JPG, PNG, WEBP. Taille maximum : 5 MB.
            </p>
          </div>
        </div>

        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={4}
          placeholder="Description du service..."
          className={inputClass}
        />

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-gray-400">
            Statut
          </label>
          <select
            name="statut"
            value={form.statut}
            onChange={onChange}
            className={selectClass}
          >
            <option value="actif">✅ Actif</option>
            <option value="inactif">❌ Inactif</option>
          </select>
        </div>

        <button
          type="submit"
          className={`w-full rounded-2xl px-5 py-3 font-black text-black transition hover:opacity-90 active:scale-[0.98] ${goldBg}`}
        >
          {form.id ? "✏️ Modifier le service" : "➕ Ajouter le service"}
        </button>

        {form.id && (
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            ↩️ Annuler la modification
          </button>
        )}
      </form>
    </div>
  );
}

function ServicesTable({
  services,
  onEdit,
  onDelete,
}: {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (id: number) => void;
}) {
  const pagination = usePagination(services, 10);

  return (
    <div className={cardClass}>
      <h2 className={`text-xl font-serif font-bold ${goldText}`}>
        📋 Liste des services
      </h2>

      <div className={tableWrapperClass}>
        <table className={`${tableClass} min-w-[850px]`}>
          <thead className={theadClass}>
            <tr>
              <th className={thClass}>Photo</th>
              <th className={thClass}>Nom</th>
              <th className={thClass}>Durée</th>
              <th className={thClass}>Prix</th>
              <th className={thClass}>Statut</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-white/20">
            {pagination.paginatedItems.map((service) => (
              <tr key={service.id} className={rowClass}>
                <td className="px-4 py-4">
                  {service.image_url || service.image ? (
                    <img
                      src={service.image_url || service.image || ""}
                      alt={service.nom}
                      className="h-14 w-20 rounded-2xl border border-slate-200 object-cover shadow-sm dark:border-white/10"
                    />
                  ) : (
                    <div className="flex h-14 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-400 dark:border-white/10 dark:bg-white/5">
                      Photo
                    </div>
                  )}
                </td>

                <td className={tdWhite}>{service.nom}</td>
                <td className={tdLight}>{service.duree} min</td>
                <td className={tdLight}>{service.prix} DZD</td>

                <td className="px-4 py-4 text-slate-900 transition-colors duration-200 group-hover:text-slate-950 dark:!text-white dark:group-hover:!text-black">
                  <span
                    className={
                      service.statut === "inactif"
                        ? "rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1 text-xs font-black !text-red-600 transition-all duration-200 group-hover:border-black/30 group-hover:bg-black/5 group-hover:!text-black dark:!text-red-300"
                        : "rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-black !text-emerald-600 transition-all duration-200 group-hover:border-black/30 group-hover:bg-black/5 group-hover:!text-black dark:!text-emerald-300"
                    }
                  >
                    {service.statut === "inactif" ? "Inactif" : "Actif"}
                  </span>
                </td>

                <td className="space-x-2 px-4 py-4 text-right">
                  <button
                    onClick={() => onEdit(service)}
                    title="Modifier ce service"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-900 hover:text-white group-hover:border-black/20 group-hover:bg-black/5 group-hover:!text-black dark:border-white/20 dark:bg-white/5 dark:!text-white dark:hover:bg-black dark:hover:!text-white"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => onDelete(service.id)}
                    title="Supprimer ce service"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/30 bg-red-400/10 !text-red-500 transition hover:bg-red-500 hover:!text-white group-hover:border-red-500/40 dark:!text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {services.length === 0 && (
          <div className="py-12 text-center">
            <Scissors
              size={40}
              className="mx-auto mb-3 text-slate-400 dark:text-gray-600"
            />
            <p className="font-semibold text-slate-500 dark:text-gray-400">
              Aucun service enregistré.
            </p>
          </div>
        )}
      </div>

      <PaginationControls
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  );
}

function CreneauForm({
  form,
  services,
  onChange,
  onToggleService,
  onSubmit,
}: {
  form: typeof initialCreneauForm;
  services: Service[];
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onToggleService: (serviceId: number | string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const activeServices = services.filter((s) => s.statut !== "inactif");
  const selectedServiceIds = Array.isArray(form.service_ids)
    ? form.service_ids
    : [];

  return (
    <div className={cardClass}>
      <h2 className={`text-xl font-serif font-bold ${goldText}`}>
        📅 Publier un créneau
      </h2>

      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-gray-400">
        Cochez un ou plusieurs services pour le même jour et la même heure.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold text-slate-500 dark:text-gray-400">
            Services concernés
          </label>

          <div className="max-h-72 space-y-2 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
            {activeServices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm font-bold text-slate-400 dark:border-white/10 dark:bg-[#111111]">
                Aucun service actif
              </div>
            ) : (
              activeServices.map((service) => {
                const checked = selectedServiceIds.includes(String(service.id));

                return (
                  <label
                    key={service.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all ${
                      checked
                        ? "border-amber-400 bg-amber-400/15 shadow-sm shadow-amber-500/10"
                        : "border-slate-200 bg-white hover:border-amber-300 dark:border-white/10 dark:bg-[#111111]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleService(service.id)}
                      className="h-5 w-5 accent-amber-500"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                        {service.nom}
                      </p>

                      <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                        {service.duree} min · {service.prix} DZD
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="mt-3 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-xs font-bold text-sky-700 dark:text-sky-300">
            Services sélectionnés : {selectedServiceIds.length}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-gray-400">
            Date
          </label>
          <input
            type="date"
            name="date_creneau"
            value={form.date_creneau}
            onChange={onChange}
            required
            min={getTodayDateValue()}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-gray-400">
              Heure
            </label>
            <select
              name="heure"
              value={form.heure}
              onChange={onChange}
              className={selectClass}
            >
              {hours.map((h) => (
                <option key={h} value={h}>
                  {h} h
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-gray-400">
              Minutes
            </label>
            <select
              name="minute"
              value={form.minute}
              onChange={onChange}
              className={selectClass}
            >
              {minutesOptions.map((m) => (
                <option key={m} value={m}>
                  :{m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-bold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-white">
          Créneau sélectionné :{" "}
          <span className="text-lg text-[#FBBF24]">
            {form.heure}:{form.minute}
          </span>
        </div>

        <button
          type="submit"
          className={`w-full rounded-2xl px-5 py-3 font-black text-black transition hover:opacity-90 active:scale-[0.98] ${goldBg}`}
        >
          📌 Ajouter le créneau aux services cochés
        </button>
      </form>
    </div>
  );
}

function CreneauxFilters({
  filter,
  total,
  onChange,
  onReset,
}: {
  filter: typeof initialCreneauFilter;
  total: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-900 dark:text-white">
            Filtre des créneaux disponibles
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-gray-400">
            Par défaut, les créneaux disponibles du jour sont affichés.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto] lg:w-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-gray-400">
              Date disponible
            </label>
            <input
              type="date"
              name="date"
              value={filter.date}
              min={getTodayDateValue()}
              onChange={onChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#F59E0B] dark:border-white/20 dark:bg-[#111111] dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:self-end dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <RefreshCcw size={15} />
            Aujourd’hui
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-300">
        Résultat : {total} créneau(x) disponible(s) pour la date {filter.date}
      </div>
    </div>
  );
}

function CreneauxTable({
  creneaux,
  filter,
  onFilterChange,
  onResetFilter,
  onDelete,
}: {
  creneaux: Creneau[];
  filter: typeof initialCreneauFilter;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetFilter: () => void;
  onDelete: (id: number) => void;
}) {
  const pagination = usePagination(creneaux, 10);

  return (
    <div className={cardClass}>
      <div>
        <h2 className={`text-xl font-serif font-bold ${goldText}`}>
          📌 Créneaux disponibles du jour
        </h2>

        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-gray-400">
          Le tableau affiche uniquement les créneaux disponibles selon la date
          choisie.
        </p>
      </div>

      <CreneauxFilters
        filter={filter}
        total={creneaux.length}
        onChange={onFilterChange}
        onReset={onResetFilter}
      />

      <div className={tableWrapperClass}>
        <table className={`${tableClass} min-w-[800px]`}>
          <thead className={theadClass}>
            <tr>
              <th className={thClass}>Service</th>
              <th className={thClass}>Date</th>
              <th className={thClass}>Heure</th>
              <th className={thClass}>Statut</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-white/20">
            {pagination.paginatedItems.map((creneau) => (
              <tr key={creneau.id} className={rowClass}>
                <td className={tdWhite}>{creneau.service_nom || "—"}</td>

                <td className={tdLight}>
                  {formatDateOnly(creneau.date_creneau)}
                </td>

                <td className={tdLight}>
                  {formatTimeOnly(creneau.heure_creneau)}
                </td>

                <td className="px-4 py-4 text-slate-900 transition-colors duration-200 group-hover:text-slate-950 dark:!text-white dark:group-hover:!text-black">
                  <CreneauBadge statut={creneau.statut} />
                </td>

                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => onDelete(creneau.id)}
                    disabled={creneau.statut === "reserve"}
                    title={
                      creneau.statut === "reserve"
                        ? "Créneau réservé, suppression impossible"
                        : "Supprimer ce créneau"
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/30 bg-red-400/10 !text-red-500 transition hover:bg-red-500 hover:!text-white disabled:cursor-not-allowed disabled:opacity-30 group-hover:border-red-500/40 dark:!text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {creneaux.length === 0 && (
          <div className="py-12 text-center">
            <CalendarDays
              size={40}
              className="mx-auto mb-3 text-slate-400 dark:text-gray-600"
            />
            <p className="font-semibold text-slate-500 dark:text-gray-400">
              Aucun créneau disponible pour cette date.
            </p>
          </div>
        )}
      </div>

      <PaginationControls
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  );
}

function RdvFilters({
  filter,
  lastRefresh,
  total,
  onChange,
  onApply,
  onReset,
  onRefreshNow,
}: {
  filter: typeof initialRdvFilter;
  lastRefresh: string;
  total: number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onApply: () => void;
  onReset: () => void;
  onRefreshNow: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <select
          name="statut"
          value={filter.statut}
          onChange={onChange}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#F59E0B] dark:border-white/20 dark:bg-[#111111] dark:text-white"
        >
          <option value="">📋 Tous les statuts</option>
          <option value="en_attente">🟡 En attente</option>
          <option value="confirme">🟢 Confirmé</option>
          <option value="termine">🔵 Terminé</option>
          <option value="annule">🔴 Annulé</option>
        </select>

        <input
          type="date"
          name="date"
          value={filter.date}
          onChange={onChange}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#F59E0B] dark:border-white/20 dark:bg-[#111111] dark:text-white"
        />

        <button
          type="button"
          onClick={onApply}
          className={`rounded-2xl px-4 py-2 text-sm font-black text-black transition hover:opacity-90 active:scale-[0.98] ${goldBg}`}
        >
          🔍 Filtrer
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          <RefreshCcw size={15} />
          Aujourd’hui
        </button>

        <button
          type="button"
          onClick={onRefreshNow}
          className="flex items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-black text-amber-700 transition hover:bg-amber-400 hover:text-black dark:text-amber-300"
        >
          <RefreshCcw size={15} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-xs font-bold text-sky-700 dark:text-sky-300">
        RDV affichés : <span className="font-black">{total}</span>
        {" "}• Date : <span className="font-black">{filter.date}</span>
        {" "}• Refresh automatique chaque 1 minute
        {lastRefresh && (
          <>
            {" "}• Dernier refresh :{" "}
            <span className="font-black">{lastRefresh}</span>
          </>
        )}
      </div>
    </div>
  );
}

function RdvTable({
  rendezvous,
  onUpdateStatut,
  onDelete,
}: {
  rendezvous: Rendezvous[];
  onUpdateStatut: (id: number, statut: RendezvousStatut) => void;
  onDelete: (id: number) => void;
}) {
  const pagination = usePagination(rendezvous, 10);

  return (
    <>
      <div className={tableWrapperClass}>
        <table className={`${tableClass} min-w-[950px]`}>
          <thead className={theadClass}>
            <tr>
              <th className={thClass}>Client</th>
              <th className={thClass}>Téléphone</th>
              <th className={thClass}>Service</th>
              <th className={thClass}>Date</th>
              <th className={thClass}>Heure</th>
              <th className={thClass}>Statut</th>
              <th className={thClass}>Prix</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-white/20">
            {pagination.paginatedItems.map((rdv) => (
              <tr key={rdv.id} className={rowClass}>
                <td className={tdWhite}>
                  {rdv.nom_client} {rdv.prenom_client || ""}
                </td>

                <td className={tdLight}>{rdv.telephone}</td>

                <td className={tdLight}>{rdv.service_nom || "—"}</td>

                <td className={tdLight}>{formatDateOnly(rdv.date_rdv)}</td>

                <td className={tdLight}>{formatTimeOnly(rdv.heure_rdv)}</td>

                <td className="px-4 py-4 text-slate-900 transition-colors duration-200 group-hover:text-slate-950 dark:!text-white dark:group-hover:!text-black">
                  <RdvBadge statut={rdv.statut} />
                </td>

                <td className={tdLight}>{rdv.prix} DZD</td>

                <td className="space-x-2 px-4 py-4 text-right">
                  <select
                    value={rdv.statut}
                    onChange={(e) =>
                      onUpdateStatut(
                        rdv.id,
                        e.target.value as RendezvousStatut
                      )
                    }
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-black text-slate-900 outline-none transition hover:border-[#F59E0B] dark:border-white/20 dark:bg-[#111111] dark:text-white"
                  >
                    <option value="en_attente">🟡 En attente</option>
                    <option value="confirme">🟢 Confirmé</option>
                    <option value="termine">🔵 Terminé</option>
                    <option value="annule">🔴 Annulé</option>
                  </select>

                  <button
                    onClick={() => onDelete(rdv.id)}
                    title="Supprimer ce rendez-vous"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/30 bg-red-400/10 !text-red-500 transition hover:bg-red-500 hover:!text-white group-hover:border-red-500/40 dark:!text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rendezvous.length === 0 && (
          <div className="py-12 text-center">
            <CalendarDays
              size={40}
              className="mx-auto mb-3 text-slate-400 dark:text-gray-600"
            />
            <p className="font-semibold text-slate-500 dark:text-gray-400">
              Aucun rendez-vous pour cette date.
            </p>
          </div>
        )}
      </div>

      <PaginationControls
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [rendezvous, setRendezvous] = useState<Rendezvous[]>([]);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);

  const [alert, setAlert] = useState<AlertState>(null);
  const [loading, setLoading] = useState(true);
  const [lastRdvRefresh, setLastRdvRefresh] = useState("");

  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [creneauForm, setCreneauForm] = useState(initialCreneauForm);
  const [rdvFilter, setRdvFilter] = useState(initialRdvFilter);
  const [creneauFilter, setCreneauFilter] = useState(initialCreneauFilter);

  const creneauxDisponiblesFiltres = useMemo(() => {
    return creneaux.filter((creneau) => {
      const isDisponible = creneau.statut === "disponible";
      const sameDate =
        formatDateOnly(creneau.date_creneau) === creneauFilter.date;

      return isDisponible && sameDate;
    });
  }, [creneaux, creneauFilter.date]);

  function showAlert(type: AlertType, message: string) {
    setAlert({ type, message });
  }

  useEffect(() => {
    if (!alert) return;

    const timer = setTimeout(() => {
      setAlert(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [alert]);

  const checkAuth = useCallback(() => {
    const isAuth = authService.isAuthenticated();

    if (!isAuth) {
      router.push("/admin/login");
      return false;
    }

    return true;
  }, [router]);

  const loadData = useCallback(
    async (showLoader: boolean = true) => {
      if (!checkAuth()) return;

      if (showLoader) {
        setLoading(true);
      }

      try {
        const [statsRes, servicesRes, rdvRes, creneauxRes] =
          await Promise.all([
            dashboardService.getStats(),
            serviceService.getAll(),
            rendezvousService.getAll({
              statut: rdvFilter.statut || undefined,
              date: rdvFilter.date || getTodayDateValue(),
            }),
            creneauService.getAllAdmin(),
          ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }

        if (servicesRes.success && servicesRes.data) {
          setServices(servicesRes.data);
        }

        if (rdvRes.success && rdvRes.data) {
          setRendezvous(rdvRes.data);
          setLastRdvRefresh(getCurrentTimeValue());
        }

        if (creneauxRes.success && creneauxRes.data) {
          setCreneaux(creneauxRes.data);
        }
      } catch (error) {
        console.error("Erreur chargement dashboard:", error);
        showAlert("error", "Erreur lors du chargement du dashboard");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [checkAuth, rdvFilter.date, rdvFilter.statut]
  );

  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [loadData]);

  function logout() {
    authService.logout();
    router.push("/admin/login");
  }

  function handleServiceChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setServiceForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleServiceImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      showAlert("warning", "Format invalide. Utilisez JPG, PNG ou WEBP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert("warning", "Image trop grande. Taille maximum : 5 MB");
      return;
    }

    if (serviceForm.imagePreview) {
      URL.revokeObjectURL(serviceForm.imagePreview);
    }

    setServiceForm((prev) => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  }

  function editService(service: Service) {
    if (serviceForm.imagePreview) {
      URL.revokeObjectURL(serviceForm.imagePreview);
    }

    setServiceForm({
      id: String(service.id),
      nom: service.nom || "",
      duree: String(service.duree || ""),
      prix: String(service.prix || ""),
      image: null,
      imagePreview: "",
      oldImageUrl: service.image_url || service.image || "",
      description: service.description || "",
      statut: service.statut || "actif",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetServiceForm() {
    if (serviceForm.imagePreview) {
      URL.revokeObjectURL(serviceForm.imagePreview);
    }

    setServiceForm(initialServiceForm);
  }

  async function saveService(e: React.FormEvent) {
    e.preventDefault();

    const duree = Number(serviceForm.duree);
    const prix = Number(serviceForm.prix);

    if (!serviceForm.nom.trim()) {
      showAlert("warning", "Le nom du service est obligatoire");
      return;
    }

    if (!duree || duree <= 0) {
      showAlert("warning", "Durée invalide");
      return;
    }

    if (prix < 0) {
      showAlert("warning", "Prix invalide");
      return;
    }

    const body = {
      nom: serviceForm.nom.trim(),
      duree,
      prix,
      image: serviceForm.image,
      description: serviceForm.description.trim(),
      statut: serviceForm.statut,
    };

    const res = serviceForm.id
      ? await serviceService.update(serviceForm.id, body)
      : await serviceService.create(body);

    if (res.success) {
      showAlert("success", "Service enregistré avec succès");
      resetServiceForm();
      loadData(true);
    } else {
      showAlert("error", res.message || "Erreur lors de l'enregistrement");
    }
  }

  async function deleteService(id: number) {
    if (!confirm("Supprimer ce service ? Cette action est irréversible.")) {
      return;
    }

    const res = await serviceService.delete(id);

    if (res.success) {
      showAlert("success", "Service supprimé avec succès");
      loadData(true);
    } else {
      showAlert("error", res.message || "Erreur suppression service");
    }
  }

  function handleCreneauChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setCreneauForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function toggleCreneauService(serviceId: number | string) {
    const id = String(serviceId);

    setCreneauForm((prev) => {
      const currentIds = Array.isArray(prev.service_ids)
        ? prev.service_ids
        : [];

      const alreadySelected = currentIds.includes(id);

      return {
        ...prev,
        service_ids: alreadySelected
          ? currentIds.filter((item) => item !== id)
          : [...currentIds, id],
      };
    });
  }

  async function saveCreneau(e: React.FormEvent) {
    e.preventDefault();

    const selectedServiceIds = Array.isArray(creneauForm.service_ids)
      ? creneauForm.service_ids
      : [];

    if (selectedServiceIds.length === 0) {
      showAlert("warning", "Veuillez cocher au moins un service");
      return;
    }

    if (!creneauForm.date_creneau) {
      showAlert("warning", "Veuillez choisir une date");
      return;
    }

    const heureFinale = `${creneauForm.heure}:${creneauForm.minute}`;

    if (isPastCreneau(creneauForm.date_creneau, heureFinale)) {
      showAlert(
        "error",
        `Impossible d'ajouter ce créneau : ${creneauForm.date_creneau} à ${heureFinale} est déjà passé`
      );
      return;
    }

    const res = await creneauService.create({
      service_ids: selectedServiceIds,
      date_creneau: creneauForm.date_creneau,
      heure_creneau: heureFinale,
      statut: "disponible",
    });

    if (res.success) {
      showAlert(
        "success",
        `Créneau ${heureFinale} ajouté pour ${selectedServiceIds.length} service(s)`
      );

      setCreneauFilter({
        date: creneauForm.date_creneau,
      });

      setCreneauForm(initialCreneauForm);
      loadData(true);
    } else {
      showAlert("error", res.message || "Erreur lors de l'ajout du créneau");
    }
  }

  async function deleteCreneau(id: number) {
    if (!confirm("Supprimer ce créneau ?")) return;

    const res = await creneauService.delete(id);

    if (res.success) {
      showAlert("success", "Créneau supprimé avec succès");
      loadData(true);
    } else {
      showAlert("error", res.message || "Erreur suppression créneau");
    }
  }

  function handleCreneauFilterChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCreneauFilter((prev) => ({
      ...prev,
      [e.target.name]: e.target.value || getTodayDateValue(),
    }));
  }

  function resetCreneauFilter() {
    setCreneauFilter({
      date: getTodayDateValue(),
    });

    showAlert(
      "info",
      "Filtre réinitialisé sur les créneaux disponibles du jour"
    );
  }

  async function updateRdvStatut(id: number, statut: RendezvousStatut) {
    const res = await rendezvousService.updateStatut(id, { statut });

    if (res.success) {
      showAlert("success", "Statut du rendez-vous mis à jour");
      loadData(true);
    } else {
      showAlert("error", res.message || "Erreur mise à jour statut");
    }
  }

  async function deleteRdv(id: number) {
    if (!confirm("Supprimer ce rendez-vous ? Cette action est irréversible.")) {
      return;
    }

    const res = await rendezvousService.delete(id);

    if (res.success) {
      showAlert("success", "Rendez-vous supprimé avec succès");
      loadData(true);
    } else {
      showAlert("error", res.message || "Erreur suppression RDV");
    }
  }

  function handleFilterChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setRdvFilter((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function applyFilters() {
    await loadData(true);
    showAlert("info", "Filtre appliqué avec succès");
  }

  function resetFilters() {
    setRdvFilter({
      statut: "",
      date: getTodayDateValue(),
    });

    showAlert("info", "Rendez-vous du jour affichés");
  }

  async function refreshRdvNow() {
    await loadData(false);
    showAlert("success", "Rendez-vous actualisés");
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-300 dark:bg-[#050505] dark:text-white">
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <DashboardHeader onLogout={logout} />

      <PrettyAlert
        alert={alert}
        loading={loading}
        onClose={() => setAlert(null)}
      />

      <StatsSection stats={stats} />

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <ServiceForm
            form={serviceForm}
            onChange={handleServiceChange}
            onImageChange={handleServiceImageChange}
            onSubmit={saveService}
            onReset={resetServiceForm}
          />

          <ServicesTable
            services={services}
            onEdit={editService}
            onDelete={deleteService}
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <CreneauForm
            form={creneauForm}
            services={services}
            onChange={handleCreneauChange}
            onToggleService={toggleCreneauService}
            onSubmit={saveCreneau}
          />

          <CreneauxTable
            creneaux={creneauxDisponiblesFiltres}
            filter={creneauFilter}
            onFilterChange={handleCreneauFilterChange}
            onResetFilter={resetCreneauFilter}
            onDelete={deleteCreneau}
          />
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/60 dark:border-white/10 dark:bg-[#0D0D0D] dark:shadow-black/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className={`text-xl font-serif font-bold ${goldText}`}>
                👥 Rendez-vous clients du jour
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-gray-400">
                Les rendez-vous du jour sont affichés par défaut et se
                rafraîchissent automatiquement chaque minute.
              </p>
            </div>

            <div className="w-full lg:max-w-4xl">
              <RdvFilters
                filter={rdvFilter}
                lastRefresh={lastRdvRefresh}
                total={rendezvous.length}
                onChange={handleFilterChange}
                onApply={applyFilters}
                onReset={resetFilters}
                onRefreshNow={refreshRdvNow}
              />
            </div>
          </div>

          <RdvTable
            rendezvous={rendezvous}
            onUpdateStatut={updateRdvStatut}
            onDelete={deleteRdv}
          />
        </div>
      </section>
    </main>
  );
}
