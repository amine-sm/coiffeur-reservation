"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { authService } from "@/lib/authService";
import { dashboardService } from "@/lib/dashboardService";
import { serviceService } from "@/lib/serviceService";
import { rendezvousService } from "@/lib/rendezvousService";
import { creneauService } from "@/lib/creneauService";
import AdminHeader from "@/components/admin/AdminHeader";
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

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

const minutesOptions = ["00", "15", "30", "45"];
const pageSizeOptions = [10, 20, 50];

const inputClass =
  "w-full rounded-2xl border px-4 py-3 text-base outline-none transition-all sm:text-sm " +
  "bg-white text-slate-900 placeholder-slate-400 border-slate-200 " +
  "focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 " +
  "dark:bg-[#111111] dark:text-white dark:placeholder-gray-500 dark:border-white/10";

const selectClass =
  "w-full rounded-2xl border px-4 py-3 text-base outline-none transition-all sm:text-sm " +
  "bg-white text-slate-900 border-slate-200 " +
  "focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 " +
  "dark:bg-[#111111] dark:text-white dark:border-white/10";

const cardClass =
  "rounded-[26px] border p-4 shadow-xl sm:rounded-3xl sm:p-6 " +
  "bg-white border-slate-200 shadow-slate-200/50 " +
  "dark:bg-[#0D0D0D] dark:border-white/10 dark:shadow-black/30";

const tableWrapperClass =
  "mt-5 overflow-x-auto rounded-[22px] border " +
  "bg-white border-slate-200 " +
  "dark:bg-[#0D0D0D] dark:border-white/15 " +
  "[-webkit-overflow-scrolling:touch]";

const tableClass = "w-full border-collapse text-left";

const theadClass = "bg-slate-100 text-slate-900 dark:bg-black dark:!text-white";

const thClass =
  "whitespace-nowrap px-3 py-3 text-[10px] font-black uppercase tracking-[0.12em] sm:px-4 sm:py-4 sm:text-xs " +
  "bg-slate-100 text-slate-700 dark:bg-black dark:!text-white";

const rowClass =
  "group transition-all duration-200 " +
  "bg-white hover:!bg-slate-100 " +
  "dark:bg-[#0D0D0D] dark:hover:!bg-white";

const tdWhite =
  "whitespace-nowrap px-3 py-3 text-xs font-semibold transition-colors duration-200 sm:px-4 sm:py-4 sm:text-sm " +
  "text-slate-900 group-hover:text-slate-950 " +
  "dark:!text-white dark:group-hover:!text-black";

const tdLight =
  "whitespace-nowrap px-3 py-3 text-xs font-semibold transition-colors duration-200 sm:px-4 sm:py-4 sm:text-sm " +
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

type ConfirmVariant = "delete" | "edit" | "warning";

type ConfirmState = {
  open: boolean;
  variant: ConfirmVariant;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
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

function getDateByOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Erreur inconnue. Vérifiez la console ou le backend.";
}

function getApiMessage(res: {
  success?: boolean;
  message?: string;
  error?: string;
}): string {
  return (
    res.message || res.error || "Une erreur est survenue pendant l'opération."
  );
}

function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("network request failed")
  );
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
    <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-gray-400 sm:text-xs">
          Lignes
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

        <span className="text-xs font-semibold text-slate-600 dark:text-gray-300 sm:text-sm">
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

        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-black text-amber-700 dark:text-amber-300 sm:px-4 sm:text-sm">
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

function ConfirmDialog({
  confirm,
  onClose,
}: {
  confirm: ConfirmState;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  if (!confirm?.open) return null;

  const config: Record<
    ConfirmVariant,
    {
      icon: React.ReactNode;
      iconClass: string;
      buttonClass: string;
    }
  > = {
    delete: {
      icon: <Trash2 size={24} />,
      iconClass:
        "border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-300",
      buttonClass:
        "bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white hover:opacity-90",
    },
    edit: {
      icon: <Pencil size={24} />,
      iconClass:
        "border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-300",
      buttonClass: `${goldBg} text-black hover:opacity-90`,
    },
    warning: {
      icon: <AlertCircle size={24} />,
      iconClass:
        "border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-300",
      buttonClass: `${goldBg} text-black hover:opacity-90`,
    },
  };

  async function handleConfirm() {
    try {
      setSubmitting(true);
      await confirm.onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-amber-400/25 bg-white p-5 shadow-2xl shadow-black/30 dark:bg-[#0D0D0D] sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]" />

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-900 hover:text-white disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white dark:hover:text-black"
          title="Fermer"
        >
          <X size={17} />
        </button>

        <div className="pr-10">
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${config[confirm.variant].iconClass}`}
          >
            {config[confirm.variant].icon}
          </div>

          <h3 className={`text-xl font-serif font-black ${goldText}`}>
            {confirm.title}
          </h3>

          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 dark:text-gray-300">
            {confirm.message}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            {confirm.cancelText || "Annuler"}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`rounded-2xl px-5 py-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${config[confirm.variant].buttonClass}`}
          >
            {submitting ? "Traitement..." : confirm.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

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
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 sm:w-auto sm:px-4"
      >
        <Moon size={18} />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border px-0 text-sm font-bold transition-all border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white sm:w-auto sm:gap-2 sm:px-4"
      title={isDark ? "Passer en mode normal" : "Passer en mode sombre"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      <span className="hidden sm:inline">
        {isDark ? "Mode normal" : "Mode sombre"}
      </span>
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
      iconBox: "bg-red-400/15 text-red-600 dark:text-red-300 border-red-400/30",
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
      iconBox: "bg-sky-400/15 text-sky-600 dark:text-sky-300 border-sky-400/30",
      glow: "shadow-sky-500/10",
    },
  };

  return (
    <div className="mx-auto mb-6 max-w-7xl space-y-3 px-4 sm:px-6">
      {alert && (
        <div
          className={`relative overflow-hidden rounded-[24px] border p-4 shadow-xl animate-[slideDown_0.25s_ease-out] sm:rounded-3xl ${
            alertConfig[alert.type].wrapper
          } ${alertConfig[alert.type].glow}`}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FBBF24]/70 to-transparent" />

          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border sm:h-12 sm:w-12 ${
                alertConfig[alert.type].iconBox
              }`}
            >
              {alertConfig[alert.type].icon}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-900 dark:text-white sm:text-sm">
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
        <div className="rounded-[24px] border border-amber-400/25 bg-white p-4 text-sm font-bold text-slate-900 shadow-xl shadow-amber-500/10 dark:bg-[#0D0D0D] dark:text-white sm:rounded-3xl">
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
    <div className="group rounded-[22px] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60 transition-all duration-300 hover:border-amber-400/40 dark:border-white/10 dark:bg-[#0D0D0D] dark:shadow-black/30 dark:hover:border-amber-400/30 sm:rounded-2xl sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-white sm:text-sm">
            {title}
          </p>
          <p
            className={`mt-2 truncate text-xl font-serif font-bold sm:text-2xl ${goldText}`}
          >
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-[#FBBF24] sm:h-12 sm:w-12">
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
    reserve: "border-red-400/40 bg-red-400/10 !text-red-600 dark:!text-red-300",
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
    termine: "border-sky-400/40 bg-sky-400/10 !text-sky-600 dark:!text-sky-300",
    annule: "border-red-400/40 bg-red-400/10 !text-red-600 dark:!text-red-300",
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
    <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md dark:border-white/10 dark:bg-[#050505]/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-lg shadow-amber-500/20">
            <Scissors size={20} />
          </div>

          <div className="min-w-0">
            <h1
              className={`truncate text-xl font-serif font-bold sm:text-2xl ${goldText}`}
            >
              Dashboard Admin
            </h1>

            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-gray-400 sm:text-xs">
              Services, RDV et créneaux
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeModeButton />

          <button
            onClick={onLogout}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
            title="Déconnexion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TopDayFilter({
  date,
  totalRdv,
  totalCreneaux,
  recetteJour,
  enAttente,
  confirmes,
  termines,
  annules,
  onDateChange,
  onToday,
  onTomorrow,
  onRefresh,
}: {
  date: string;
  totalRdv: number;
  totalCreneaux: number;
  recetteJour: number;
  enAttente: number;
  confirmes: number;
  termines: number;
  annules: number;
  onDateChange: (date: string) => void;
  onToday: () => void;
  onTomorrow: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="mx-auto mb-6 max-w-7xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-[#0D0D0D] dark:shadow-black/30 sm:rounded-3xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-amber-500/10 via-white to-white p-4 dark:border-white/10 dark:from-amber-500/10 dark:via-[#0D0D0D] dark:to-[#0D0D0D] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                <CalendarDays size={15} />
                Filtre par jour
              </div>

              <h2 className={`mt-3 text-2xl font-serif font-black ${goldText}`}>
                Vue du jour
              </h2>

              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-gray-400">
                Choisissez une date pour afficher directement les rendez-vous,
                les créneaux disponibles et la recette terminée de cette journée.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] xl:min-w-[740px]">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-gray-400">
                  Date du dashboard
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-black text-slate-900 outline-none transition focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 dark:border-white/20 dark:bg-[#111111] dark:text-white sm:text-sm"
                />
              </div>

              <button
                type="button"
                onClick={onToday}
                className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:self-end"
              >
                Aujourd’hui
              </button>

              <button
                type="button"
                onClick={onTomorrow}
                className="flex items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-400 hover:text-black dark:text-amber-300 sm:self-end"
              >
                Demain
              </button>

              <button
                type="button"
                onClick={onRefresh}
                className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-black transition hover:opacity-90 active:scale-[0.98] sm:self-end ${goldBg}`}
              >
                <RefreshCcw size={15} />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 sm:p-5">
          <TopDayStat
            title="Recette du jour"
            value={`${Number(recetteJour || 0).toLocaleString("fr-FR")} DZD`}
            tone="gold"
          />

          <TopDayStat title="RDV affichés" value={totalRdv} tone="sky" />

          <TopDayStat
            title="Créneaux dispo."
            value={totalCreneaux}
            tone="emerald"
          />

          <TopDayStat title="En attente" value={enAttente} tone="amber" />

          <TopDayStat title="Confirmés" value={confirmes} tone="green" />

          <TopDayStat title="Terminés / Annulés" value={`${termines} / ${annules}`} tone="slate" />
        </div>
      </div>
    </div>
  );
}

function TopDayStat({
  title,
  value,
  tone,
}: {
  title: string;
  value: string | number;
  tone: "gold" | "sky" | "emerald" | "amber" | "green" | "slate";
}) {
  const styles: Record<typeof tone, string> = {
    gold: "border-amber-400/25 bg-amber-400/10 text-amber-700 dark:text-amber-300",
    sky: "border-sky-400/25 bg-sky-400/10 text-sky-700 dark:text-sky-300",
    emerald:
      "border-emerald-400/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
    amber:
      "border-yellow-400/25 bg-yellow-400/10 text-yellow-700 dark:text-yellow-300",
    green:
      "border-green-400/25 bg-green-400/10 text-green-700 dark:text-green-300",
    slate:
      "border-slate-300 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${styles[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-80">
        {title}
      </p>

      <p className="mt-2 truncate text-xl font-black">{value}</p>
    </div>
  );
}

function StatsSection({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
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
          title="Dispos"
          value={stats?.creneaux_disponibles ?? 0}
          icon={<CheckCircle />}
        />

        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Recette"
            value={`${stats?.recette_totale ?? 0} DZD`}
            icon={<DollarSign />}
          />
        </div>
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
    >,
  ) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}) {
  const previewImage = form.imagePreview || form.oldImageUrl;

  return (
    <div className={cardClass}>
      <h2
        className={`flex items-center gap-2 text-lg font-serif font-bold sm:text-xl ${goldText}`}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-white/15 dark:bg-white/[0.03] sm:p-4">
            {previewImage ? (
              <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                <img
                  src={previewImage}
                  alt="Aperçu service"
                  className="h-40 w-full object-cover sm:h-44"
                />
              </div>
            ) : (
              <div className="mb-4 flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-400 dark:border-white/10 dark:bg-[#111111] dark:text-gray-500 sm:h-44">
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
              className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-400 file:px-3 file:py-2 file:font-black file:text-black hover:file:bg-amber-300 dark:border-white/10 dark:bg-[#111111] dark:text-white sm:px-4"
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
      <h2 className={`text-lg font-serif font-bold sm:text-xl ${goldText}`}>
        📋 Liste des services
      </h2>

      <div className={tableWrapperClass}>
        <table className={`${tableClass} min-w-[720px]`}>
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
                <td className="px-3 py-3 sm:px-4 sm:py-4">
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

                <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-900 transition-colors duration-200 group-hover:text-slate-950 dark:!text-white dark:group-hover:!text-black sm:px-4 sm:py-4 sm:text-sm">
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

                <td className="space-x-2 whitespace-nowrap px-3 py-3 text-right sm:px-4 sm:py-4">
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
      <h2 className={`text-lg font-serif font-bold sm:text-xl ${goldText}`}>
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

          <div className="max-h-72 space-y-2 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03] [-webkit-overflow-scrolling:touch]">
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
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none focus:border-[#F59E0B] dark:border-white/20 dark:bg-[#111111] dark:text-white sm:text-sm"
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
  const creneauxTries = useMemo(() => {
    return [...creneaux].sort((a, b) => {
      const timeA = formatTimeOnly(a.heure_creneau);
      const timeB = formatTimeOnly(b.heure_creneau);
      return timeA.localeCompare(timeB);
    });
  }, [creneaux]);

  const creneauxParHeure = useMemo(() => {
    const grouped: Record<string, Creneau[]> = {};

    creneauxTries.forEach((creneau) => {
      const heure = formatTimeOnly(creneau.heure_creneau);
      const hourKey =
        heure && heure !== "-" ? `${heure.slice(0, 2)}:00` : "--:--";

      if (!grouped[hourKey]) {
        grouped[hourKey] = [];
      }

      grouped[hourKey].push(creneau);
    });

    return grouped;
  }, [creneauxTries]);

  const heuresDisponibles = useMemo(() => {
    return Object.keys(creneauxParHeure).sort();
  }, [creneauxParHeure]);

  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={`text-lg font-serif font-bold sm:text-xl ${goldText}`}>
            📌 Créneaux disponibles
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-gray-400">
            Affichage professionnel par heure pour mieux visualiser les
            disponibilités.
          </p>
        </div>

        <div className="w-fit rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-600 dark:text-emerald-300">
          {creneaux.length} disponible(s)
        </div>
      </div>

      <CreneauxFilters
        filter={filter}
        total={creneaux.length}
        onChange={onFilterChange}
        onReset={onResetFilter}
      />

      {creneaux.length === 0 ? (
        <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 py-14 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <CalendarDays
            size={44}
            className="mx-auto mb-4 text-slate-400 dark:text-gray-600"
          />

          <p className="text-lg font-black text-slate-700 dark:text-white">
            Aucun créneau disponible
          </p>

          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-gray-400">
            Aucun créneau disponible pour la date {filter.date}.
          </p>
        </div>
      ) : (
        <div className="mt-6 max-h-[650px] space-y-5 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
          {heuresDisponibles.map((heure) => (
            <div
              key={heure}
              className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-300">
                    <Clock size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">
                      Heure
                    </p>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      {heure}
                    </h3>
                  </div>
                </div>

                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
                  {creneauxParHeure[heure].length} créneau(x)
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {creneauxParHeure[heure].map((creneau) => (
                  <div
                    key={creneau.id}
                    className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10 dark:border-white/10 dark:bg-[#111111]"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-300">
                            Disponible
                          </span>

                          <span className="text-xs font-bold text-slate-400">
                            #{creneau.id}
                          </span>
                        </div>

                        <p className="truncate text-base font-black text-slate-900 dark:text-white">
                          {creneau.service_nom || "Service non défini"}
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Date
                            </p>

                            <p className="mt-1 text-xs font-black text-slate-700 dark:text-gray-200">
                              {formatDateOnly(creneau.date_creneau)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                              Temps
                            </p>

                            <p className="mt-1 text-sm font-black text-amber-700 dark:text-amber-300">
                              {formatTimeOnly(creneau.heure_creneau)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDelete(creneau.id)}
                        disabled={creneau.statut === "reserve"}
                        title={
                          creneau.statut === "reserve"
                            ? "Créneau réservé, suppression impossible"
                            : "Supprimer ce créneau"
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-400/30 bg-red-400/10 text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:text-red-300"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
          className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base font-semibold text-slate-900 outline-none focus:border-[#F59E0B] dark:border-white/20 dark:bg-[#111111] dark:text-white sm:py-2 sm:text-sm"
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
          className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base font-semibold text-slate-900 outline-none focus:border-[#F59E0B] dark:border-white/20 dark:bg-[#111111] dark:text-white sm:py-2 sm:text-sm"
        />

        <button
          type="button"
          onClick={onApply}
          className={`rounded-2xl px-4 py-3 text-sm font-black text-black transition hover:opacity-90 active:scale-[0.98] sm:py-2 ${goldBg}`}
        >
          🔍 Filtrer
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:py-2"
        >
          <RefreshCcw size={15} />
          Aujourd’hui
        </button>

        <button
          type="button"
          onClick={onRefreshNow}
          className="flex items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-400 hover:text-black dark:text-amber-300 sm:py-2"
        >
          <RefreshCcw size={15} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-xs font-bold leading-6 text-sky-700 dark:text-sky-300">
        RDV affichés : <span className="font-black">{total}</span> • Date :{" "}
        <span className="font-black">{filter.date}</span> • Refresh automatique
        chaque 1 minute
        {lastRefresh && (
          <>
            {" "}
            • Dernier refresh :{" "}
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
        <table className={`${tableClass} min-w-[820px]`}>
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

                <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-900 transition-colors duration-200 group-hover:text-slate-950 dark:!text-white dark:group-hover:!text-black sm:px-4 sm:py-4 sm:text-sm">
                  <RdvBadge statut={rdv.statut} />
                </td>

                <td className={tdLight}>{rdv.prix} DZD</td>

                <td className="space-x-2 whitespace-nowrap px-3 py-3 text-right sm:px-4 sm:py-4">
                  <select
                    value={rdv.statut}
                    onChange={(e) =>
                      onUpdateStatut(rdv.id, e.target.value as RendezvousStatut)
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
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>(null);
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


  const daySummary = useMemo(() => {
    const enAttente = rendezvous.filter(
      (rdv) => rdv.statut === "en_attente",
    ).length;

    const confirmes = rendezvous.filter(
      (rdv) => rdv.statut === "confirme",
    ).length;

    const termines = rendezvous.filter(
      (rdv) => rdv.statut === "termine",
    ).length;

    const annules = rendezvous.filter(
      (rdv) => rdv.statut === "annule",
    ).length;

    const recetteJour = rendezvous
      .filter((rdv) => rdv.statut === "termine")
      .reduce((total, rdv) => total + Number(rdv.prix || 0), 0);

    return {
      enAttente,
      confirmes,
      termines,
      annules,
      recetteJour,
    };
  }, [rendezvous]);

  function openConfirm(data: Omit<NonNullable<ConfirmState>, "open">) {
    setConfirmDialog({
      open: true,
      ...data,
    });
  }

  function showAlert(type: AlertType, message: string) {
    setAlert({
      type,
      message,
    });

    if (type === "error") {
      console.error("🚨 Erreur affichée admin :", message);
    }
  }

  function showCatchError(context: string, error: unknown) {
    const message = getErrorMessage(error);

    console.error(`❌ ${context}:`, error);

    if (isNetworkError(error)) {
      showAlert(
        "error",
        `${context} : impossible de contacter le serveur. Vérifiez que le backend est lancé et que NEXT_PUBLIC_API_URL est correct.`,
      );
      return;
    }

    showAlert("error", `${context} : ${message}`);
  }

  function showApiError(
    context: string,
    res: { message?: string; error?: string },
  ) {
    const message = getApiMessage(res);

    console.error(`❌ ${context}:`, res);

    showAlert("error", `${context} : ${message}`);
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
          await Promise.allSettled([
            dashboardService.getStats(),
            serviceService.getAll(),
            rendezvousService.getAll({
              statut: rdvFilter.statut || undefined,
              date: rdvFilter.date || getTodayDateValue(),
            }),
            creneauService.getAllAdmin(),
          ]);

        if (statsRes.status === "fulfilled") {
          if (statsRes.value.success && statsRes.value.data) {
            setStats(statsRes.value.data);
          } else {
            showApiError("Erreur statistiques", statsRes.value);
          }
        } else {
          showCatchError("Erreur chargement statistiques", statsRes.reason);
        }

        if (servicesRes.status === "fulfilled") {
          if (servicesRes.value.success && servicesRes.value.data) {
            setServices(servicesRes.value.data);
          } else {
            showApiError("Erreur services", servicesRes.value);
          }
        } else {
          showCatchError("Erreur chargement services", servicesRes.reason);
        }

        if (rdvRes.status === "fulfilled") {
          if (rdvRes.value.success && rdvRes.value.data) {
            setRendezvous(rdvRes.value.data);
            setLastRdvRefresh(getCurrentTimeValue());
          } else {
            showApiError("Erreur rendez-vous", rdvRes.value);
          }
        } else {
          showCatchError("Erreur chargement rendez-vous", rdvRes.reason);
        }

        if (creneauxRes.status === "fulfilled") {
          if (creneauxRes.value.success && creneauxRes.value.data) {
            setCreneaux(creneauxRes.value.data);
          } else {
            showApiError("Erreur créneaux", creneauxRes.value);
          }
        } else {
          showCatchError("Erreur chargement créneaux", creneauxRes.reason);
        }
      } catch (error) {
        showCatchError("Erreur générale chargement dashboard", error);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [checkAuth, rdvFilter.date, rdvFilter.statut],
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
    >,
  ) {
    setServiceForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleServiceImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];

      if (!file) {
        showAlert("info", "Aucune image sélectionnée.");
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        showAlert(
          "warning",
          `Format image invalide : ${file.type || "inconnu"}. Utilisez JPG, PNG ou WEBP.`,
        );
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showAlert(
          "warning",
          `Image trop grande. Taille maximum : 5 MB. Taille actuelle : ${(file.size / 1024 / 1024).toFixed(2)} MB.`,
        );
        e.target.value = "";
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

      showAlert("success", "Image sélectionnée avec succès.");
    } catch (error) {
      showCatchError("Erreur sélection image", error);
    }
  }

  function editService(service: Service) {
    openConfirm({
      variant: "edit",
      title: "Modifier le service",
      message: `Voulez-vous modifier le service "${service.nom}" ? Le formulaire sera rempli automatiquement en haut de la page.`,
      confirmText: "Oui, modifier",
      cancelText: "Annuler",
      onConfirm: () => {
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
        showAlert(
          "info",
          `Mode modification activé pour le service : ${service.nom}.`,
        );
      },
    });
  }

  function resetServiceForm() {
    if (serviceForm.imagePreview) {
      URL.revokeObjectURL(serviceForm.imagePreview);
    }

    setServiceForm(initialServiceForm);
  }

  async function saveService(e: React.FormEvent) {
    e.preventDefault();

    try {
      const duree = Number(serviceForm.duree);
      const prix = Number(serviceForm.prix);

      if (!serviceForm.nom.trim()) {
        showAlert("warning", "Le nom du service est obligatoire.");
        return;
      }

      if (!duree || duree <= 0) {
        showAlert(
          "warning",
          "La durée du service doit être supérieure à 0 minute.",
        );
        return;
      }

      if (prix < 0 || Number.isNaN(prix)) {
        showAlert("warning", "Le prix du service est invalide.");
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
        showAlert(
          "success",
          serviceForm.id
            ? "Service modifié avec succès."
            : "Service ajouté avec succès.",
        );

        resetServiceForm();
        await loadData(true);
      } else {
        showApiError("Erreur enregistrement service", res);
      }
    } catch (error) {
      showCatchError("Erreur enregistrement service", error);
    }
  }

  async function deleteService(id: number) {
    openConfirm({
      variant: "delete",
      title: "Supprimer le service",
      message:
        "Voulez-vous vraiment supprimer ce service ? Cette action est irréversible.",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      onConfirm: async () => {
        try {
          const res = await serviceService.delete(id);

          if (res.success) {
            showAlert("success", "Service supprimé avec succès.");
            await loadData(true);
          } else {
            showApiError("Erreur suppression service", res);
          }
        } catch (error) {
          showCatchError("Erreur suppression service", error);
        }
      },
    });
  }

  function handleCreneauChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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

    try {
      const selectedServiceIds = Array.isArray(creneauForm.service_ids)
        ? creneauForm.service_ids
        : [];

      if (selectedServiceIds.length === 0) {
        showAlert("warning", "Veuillez cocher au moins un service.");
        return;
      }

      if (!creneauForm.date_creneau) {
        showAlert("warning", "Veuillez choisir une date.");
        return;
      }

      const heureFinale = `${creneauForm.heure}:${creneauForm.minute}`;

      if (isPastCreneau(creneauForm.date_creneau, heureFinale)) {
        showAlert(
          "error",
          `Impossible d'ajouter ce créneau : ${creneauForm.date_creneau} à ${heureFinale} est déjà passé.`,
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
          `Créneau ${heureFinale} ajouté pour ${selectedServiceIds.length} service(s).`,
        );

        setCreneauFilter({
          date: creneauForm.date_creneau,
        });

        setCreneauForm(initialCreneauForm);
        await loadData(true);
      } else {
        showApiError("Erreur ajout créneau", res);
      }
    } catch (error) {
      showCatchError("Erreur ajout créneau", error);
    }
  }

  async function deleteCreneau(id: number) {
    openConfirm({
      variant: "delete",
      title: "Supprimer le créneau",
      message:
        "Voulez-vous vraiment supprimer ce créneau disponible ? Il ne sera plus visible pour les clients.",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      onConfirm: async () => {
        try {
          const res = await creneauService.delete(id);

          if (res.success) {
            showAlert("success", "Créneau supprimé avec succès.");
            await loadData(true);
          } else {
            showApiError("Erreur suppression créneau", res);
          }
        } catch (error) {
          showCatchError("Erreur suppression créneau", error);
        }
      },
    });
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
      "Filtre réinitialisé sur les créneaux disponibles du jour",
    );
  }

  async function updateRdvStatut(id: number, statut: RendezvousStatut) {
    try {
      const res = await rendezvousService.updateStatut(id, { statut });

      if (res.success) {
        const labels: Record<RendezvousStatut, string> = {
          en_attente: "en attente",
          confirme: "confirmé",
          termine: "terminé",
          annule: "annulé",
        };

        showAlert(
          "success",
          `Statut du rendez-vous mis à jour : ${labels[statut]}.`,
        );

        await loadData(true);
      } else {
        showApiError("Erreur mise à jour statut RDV", res);
      }
    } catch (error) {
      showCatchError("Erreur mise à jour statut RDV", error);
    }
  }

  async function deleteRdv(id: number) {
    openConfirm({
      variant: "delete",
      title: "Supprimer le rendez-vous",
      message:
        "Voulez-vous vraiment supprimer ce rendez-vous ? Cette action est irréversible.",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      onConfirm: async () => {
        try {
          const res = await rendezvousService.delete(id);

          if (res.success) {
            showAlert("success", "Rendez-vous supprimé avec succès.");
            await loadData(true);
          } else {
            showApiError("Erreur suppression rendez-vous", res);
          }
        } catch (error) {
          showCatchError("Erreur suppression rendez-vous", error);
        }
      },
    });
  }

  function handleFilterChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setRdvFilter((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function applyFilters() {
    try {
      await loadData(true);
      showAlert("info", "Filtre appliqué avec succès.");
    } catch (error) {
      showCatchError("Erreur application filtre", error);
    }
  }

  function resetFilters() {
    const today = getTodayDateValue();

    setRdvFilter({
      statut: "",
      date: today,
    });

    setCreneauFilter({
      date: today,
    });

    showAlert("info", "Rendez-vous et créneaux du jour affichés.");
  }

  async function refreshRdvNow() {
    try {
      await loadData(false);
      showAlert("success", "Rendez-vous actualisés avec succès.");
    } catch (error) {
      showCatchError("Erreur actualisation rendez-vous", error);
    }
  }


  function changeDashboardDate(date: string) {
    const cleanDate = date || getTodayDateValue();

    setRdvFilter((prev) => ({
      ...prev,
      date: cleanDate,
    }));

    setCreneauFilter({
      date: cleanDate,
    });

    showAlert("info", `Filtre du jour appliqué : ${cleanDate}`);
  }

  function showTodayDashboard() {
    changeDashboardDate(getTodayDateValue());
  }

  function showTomorrowDashboard() {
    changeDashboardDate(getDateByOffset(1));
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

        html {
          scroll-behavior: smooth;
        }

        body {
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #fbbf24, #d97706);
          border-radius: 999px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #fde68a, #f59e0b);
        }

        @media (max-width: 640px) {
          input,
          select,
          textarea,
          button {
            font-size: 16px;
          }
        }
      `}</style>

      <AdminHeader />

      <ConfirmDialog
        confirm={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />

      <div className="pb-20">
        <PrettyAlert
          alert={alert}
          loading={loading}
          onClose={() => setAlert(null)}
        />

        <TopDayFilter
          date={rdvFilter.date}
          totalRdv={rendezvous.length}
          totalCreneaux={creneauxDisponiblesFiltres.length}
          recetteJour={daySummary.recetteJour}
          enAttente={daySummary.enAttente}
          confirmes={daySummary.confirmes}
          termines={daySummary.termines}
          annules={daySummary.annules}
          onDateChange={changeDashboardDate}
          onToday={showTodayDashboard}
          onTomorrow={showTomorrowDashboard}
          onRefresh={refreshRdvNow}
        />

        <StatsSection stats={stats} />

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[420px_1fr]">
            <div className="h-fit self-start">
              <ServiceForm
                form={serviceForm}
                onChange={handleServiceChange}
                onImageChange={handleServiceImageChange}
                onSubmit={saveService}
                onReset={resetServiceForm}
              />
            </div>

            <div className="min-w-0">
              <ServicesTable
                services={services}
                onEdit={editService}
                onDelete={deleteService}
              />
            </div>
          </div>

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[420px_1fr]">
            <div className="h-fit self-start">
              <CreneauForm
                form={creneauForm}
                services={services}
                onChange={handleCreneauChange}
                onToggleService={toggleCreneauService}
                onSubmit={saveCreneau}
              />
            </div>

            <div className="min-w-0">
              <CreneauxTable
                creneaux={creneauxDisponiblesFiltres}
                filter={creneauFilter}
                onFilterChange={handleCreneauFilterChange}
                onResetFilter={resetCreneauFilter}
                onDelete={deleteCreneau}
              />
            </div>
          </div>

          <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-[#0D0D0D] dark:shadow-black/30 sm:rounded-3xl sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2
                  className={`text-lg font-serif font-bold sm:text-xl ${goldText}`}
                >
                  👥 Rendez-vous clients du jour
                </h2>

                <p className="mt-1 text-sm font-medium leading-6 text-slate-500 dark:text-gray-400">
                  Les rendez-vous du jour sont affichés par défaut et se
                  rafraîchissent automatiquement chaque minute.
                </p>
              </div>

              <div className="w-full xl:max-w-4xl">
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
      </div>
    </main>
  );
}
