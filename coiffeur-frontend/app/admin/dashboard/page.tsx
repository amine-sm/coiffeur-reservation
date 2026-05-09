"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import { authService } from "@/lib/authService";
import { rendezvousService } from "@/lib/rendezvousService";
import type { Rendezvous, RendezvousStatut } from "@/lib/types";
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
  Loader2,
  RefreshCcw,
  Sparkles,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";

// ============================================================
// CONSTANTES & STYLES
// ============================================================

const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

const goldBg = "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";

const pageSizeOptions = [10, 20, 50];

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

type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
} | null;

type ChartItem = {
  label: string;
  value: number;
};

const initialRdvFilter = {
  statut: "",
  date: getTodayDateValue(),
};

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
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
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

function formatMoney(value: number | string | null | undefined) {
  return `${Number(value || 0).toLocaleString("fr-FR")} DZD`;
}

function groupByHour(rendezvous: Rendezvous[]): ChartItem[] {
  const map: Record<string, number> = {};

  rendezvous.forEach((rdv) => {
    const hour = formatTimeOnly(rdv.heure_rdv);
    const key = hour !== "-" ? `${hour.slice(0, 2)}:00` : "--:--";
    map[key] = (map[key] || 0) + 1;
  });

  return Object.keys(map)
    .sort()
    .map((key) => ({
      label: key,
      value: map[key],
    }));
}

function groupByService(rendezvous: Rendezvous[]): ChartItem[] {
  const map: Record<string, number> = {};

  rendezvous.forEach((rdv) => {
    const key = rdv.service_nom || "Service inconnu";
    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map)
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function groupByStatus(rendezvous: Rendezvous[]): ChartItem[] {
  const labels: Record<RendezvousStatut, string> = {
    en_attente: "En attente",
    confirme: "Confirmés",
    termine: "Terminés",
    annule: "Annulés",
  };

  const map: Record<RendezvousStatut, number> = {
    en_attente: 0,
    confirme: 0,
    termine: 0,
    annule: 0,
  };

  rendezvous.forEach((rdv) => {
    if (rdv.statut in map) {
      map[rdv.statut] += 1;
    }
  });

  return Object.entries(map).map(([key, value]) => ({
    label: labels[key as RendezvousStatut],
    value,
  }));
}

function getUniqueClientsCount(rendezvous: Rendezvous[]) {
  const set = new Set<string>();

  rendezvous.forEach((rdv) => {
    const key =
      String((rdv as any).client_id || "") ||
      `${rdv.telephone || ""}-${rdv.nom_client || ""}`;

    if (key.trim()) set.add(key);
  });

  return set.size;
}

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
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-red-400/25 bg-white p-5 shadow-2xl shadow-black/30 dark:bg-[#0D0D0D] sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-700" />

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
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-300">
            <Trash2 size={24} />
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
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-700 px-5 py-3 text-sm font-black text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Traitement..." : confirm.confirmText}
          </button>
        </div>
      </div>
    </div>
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
    }
  > = {
    success: {
      icon: <CheckCircle size={22} />,
      title: "Succès",
      wrapper:
        "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      iconBox:
        "bg-emerald-400/15 text-emerald-600 dark:text-emerald-300 border-emerald-400/30",
    },
    error: {
      icon: <AlertCircle size={22} />,
      title: "Erreur",
      wrapper: "border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-300",
      iconBox: "bg-red-400/15 text-red-600 dark:text-red-300 border-red-400/30",
    },
    warning: {
      icon: <AlertCircle size={22} />,
      title: "Attention",
      wrapper:
        "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      iconBox:
        "bg-amber-400/15 text-amber-600 dark:text-amber-300 border-amber-400/30",
    },
    info: {
      icon: <Info size={22} />,
      title: "Information",
      wrapper: "border-sky-400/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
      iconBox: "bg-sky-400/15 text-sky-600 dark:text-sky-300 border-sky-400/30",
    },
  };

  return (
    <div className="mx-auto mb-6 max-w-7xl space-y-3 px-4 sm:px-6">
      {alert && (
        <div
          className={`rounded-[24px] border p-4 shadow-xl sm:rounded-3xl ${
            alertConfig[alert.type].wrapper
          }`}
        >
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

              <p className="mt-1 text-sm font-semibold leading-6">
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
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <div>
              <p className="font-black">Chargement</p>
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

function TopDayFilter({
  date,
  totalRdv,
  recetteJour,
  enAttente,
  confirmes,
  termines,
  annules,
  clientsUniques,
  onDateChange,
  onToday,
  onTomorrow,
  onRefresh,
}: {
  date: string;
  totalRdv: number;
  recetteJour: number;
  enAttente: number;
  confirmes: number;
  termines: number;
  annules: number;
  clientsUniques: number;
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
                Vue clients et performance
              </h2>

              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-gray-400">
                Dashboard concentré sur les clients, les rendez-vous, la recette
                et les graphiques.
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
            value={formatMoney(recetteJour)}
            tone="gold"
          />

          <TopDayStat title="RDV affichés" value={totalRdv} tone="sky" />

          <TopDayStat
            title="Clients uniques"
            value={clientsUniques}
            tone="emerald"
          />

          <TopDayStat title="En attente" value={enAttente} tone="amber" />

          <TopDayStat title="Confirmés" value={confirmes} tone="green" />

          <TopDayStat
            title="Terminés / Annulés"
            value={`${termines} / ${annules}`}
            tone="slate"
          />
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

function StatsSection({
  totalRdvJour,
  clientsUniques,
  enAttente,
  confirmes,
  recetteJour,
}: {
  totalRdvJour: number;
  clientsUniques: number;
  enAttente: number;
  confirmes: number;
  recetteJour: number;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
        <StatCard
          title="RDV du jour"
          value={totalRdvJour}
          icon={<CalendarDays />}
        />

        <StatCard
          title="Clients jour"
          value={clientsUniques}
          icon={<Users />}
        />

        <StatCard title="En attente" value={enAttente} icon={<Clock />} />

        <StatCard title="Confirmés" value={confirmes} icon={<CheckCircle />} />

        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Recette du jour"
            value={formatMoney(recetteJour)}
            icon={<DollarSign />}
          />
        </div>
      </div>
    </div>
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

function SimpleBarChart({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: ChartItem[];
  emptyText: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className={cardClass}>
      <h2
        className={`flex items-center gap-2 text-lg font-serif font-bold sm:text-xl ${goldText}`}
      >
        <TrendingUp size={20} />
        {title}
      </h2>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500 dark:border-white/15">
          {emptyText}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-black text-slate-700 dark:text-gray-200">
                  {item.label}
                </span>

                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
                  {item.value}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]"
                  style={{
                    width: `${Math.max(8, (item.value / max) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusChart({ items }: { items: ChartItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cardClass}>
      <h2
        className={`flex items-center gap-2 text-lg font-serif font-bold sm:text-xl ${goldText}`}
      >
        <Sparkles size={20} />
        Répartition des statuts
      </h2>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const percent =
            total === 0 ? 0 : Math.round((item.value / total) * 100);

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {item.value}
              </p>

              <p className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-300">
                {percent}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
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
        <table className={`${tableClass} min-w-[880px]`}>
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
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-300">
                      <UserRound size={16} />
                    </div>

                    <span>
                      {rdv.nom_client} {rdv.prenom_client || ""}
                    </span>
                  </div>
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

                  {rdv.statut === "termine" ? (
                    <button
                      type="button"
                      disabled
                      title="Impossible de supprimer un rendez-vous terminé, car il sert au calcul de la recette"
                      className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-xl border border-slate-300 bg-slate-100 !text-slate-400 opacity-60 dark:border-white/10 dark:bg-white/5 dark:!text-gray-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDelete(rdv.id)}
                      title="Supprimer ce rendez-vous"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/30 bg-red-400/10 !text-red-500 transition hover:bg-red-500 hover:!text-white group-hover:border-red-500/40 dark:!text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rendezvous.length === 0 && (
          <div className="py-12 text-center">
            <Users
              size={40}
              className="mx-auto mb-3 text-slate-400 dark:text-gray-600"
            />

            <p className="font-semibold text-slate-500 dark:text-gray-400">
              Aucun client/rendez-vous pour cette date.
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

  const [rendezvous, setRendezvous] = useState<Rendezvous[]>([]);
  const [alert, setAlert] = useState<AlertState>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>(null);
  const [loading, setLoading] = useState(true);
  const [lastRdvRefresh, setLastRdvRefresh] = useState("");
  const [rdvFilter, setRdvFilter] = useState(initialRdvFilter);

  const dayStats = useMemo(() => {
    const recetteJour = rendezvous
      .filter((rdv) => rdv.statut === "termine")
      .reduce((sum, rdv) => sum + Number(rdv.prix || 0), 0);

    return {
      recetteJour,
      totalRdvJour: rendezvous.length,
      enAttente: rendezvous.filter((rdv) => rdv.statut === "en_attente").length,
      confirmes: rendezvous.filter((rdv) => rdv.statut === "confirme").length,
      termines: rendezvous.filter((rdv) => rdv.statut === "termine").length,
      annules: rendezvous.filter((rdv) => rdv.statut === "annule").length,
      clientsUniques: getUniqueClientsCount(rendezvous),
    };
  }, [rendezvous]);

  const charts = useMemo(() => {
    return {
      byHour: groupByHour(rendezvous),
      byService: groupByService(rendezvous),
      byStatus: groupByStatus(rendezvous),
    };
  }, [rendezvous]);

  function showAlert(type: AlertType, message: string) {
    setAlert({ type, message });

    if (type === "error") {
      console.error("🚨 Erreur admin :", message);
    }
  }

  useEffect(() => {
    if (!alert) return;

    const timer = setTimeout(() => {
      setAlert(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [alert]);

  const checkAuth = useCallback(() => {
    if (!authService.isAuthenticated()) {
      router.replace("/admin/login");
      return false;
    }

    return true;
  }, [router]);

  const loadData = useCallback(
    async (showLoader = true) => {
      if (!checkAuth()) return;

      if (showLoader) setLoading(true);

      try {
        const rdvRes = await rendezvousService.getAll({
          statut: rdvFilter.statut || undefined,
          date: rdvFilter.date || getTodayDateValue(),
        });

        if (rdvRes.success && rdvRes.data) {
          setRendezvous(rdvRes.data);
          setLastRdvRefresh(getCurrentTimeValue());
        } else {
          showAlert("error", getApiMessage(rdvRes));
        }
      } catch (error) {
        showAlert("error", getErrorMessage(error));
      } finally {
        if (showLoader) setLoading(false);
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

  function handleRdvFilterChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setRdvFilter((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function resetFilters() {
    const today = getTodayDateValue();

    setRdvFilter({
      statut: "",
      date: today,
    });

    showAlert("info", "Clients et rendez-vous du jour affichés.");
  }

  function refreshRdvNow() {
    loadData(false);
    showAlert("info", "Dashboard actualisé.");
  }

  function changeDashboardDate(date: string) {
    const cleanDate = date || getTodayDateValue();

    setRdvFilter((prev) => ({
      ...prev,
      date: cleanDate,
    }));

    showAlert("info", `Filtre du jour appliqué : ${cleanDate}`);
  }

  function showTodayDashboard() {
    changeDashboardDate(getTodayDateValue());
  }

  function showTomorrowDashboard() {
    changeDashboardDate(getDateByOffset(1));
  }

  async function updateRdvStatut(id: number, statut: RendezvousStatut) {
    try {
      const res = await rendezvousService.updateStatut(id, statut);

      if (res.success) {
        showAlert("success", "Statut du rendez-vous modifié avec succès.");
        await loadData(false);
      } else {
        showAlert("error", getApiMessage(res));
      }
    } catch (error) {
      showAlert("error", getErrorMessage(error));
    }
  }

  function deleteRdv(id: number) {
    const rdv = rendezvous.find((item) => item.id === id);

    if (rdv?.statut === "termine") {
      showAlert(
        "warning",
        "Impossible de supprimer un rendez-vous terminé, car il sert au calcul de la recette.",
      );
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Supprimer le rendez-vous",
      message:
        rdv?.statut === "annule"
          ? "Ce rendez-vous est annulé. Voulez-vous le supprimer définitivement ?"
          : "Voulez-vous vraiment supprimer ce rendez-vous ? Cette action est définitive.",
      confirmText: "Supprimer",
      onConfirm: async () => {
        try {
          const res = await rendezvousService.delete(id);

          if (res.success) {
            showAlert("success", "Rendez-vous supprimé avec succès.");
            await loadData(false);
          } else {
            showAlert("error", getApiMessage(res));
          }
        } catch (error) {
          showAlert("error", getErrorMessage(error));
        }
      },
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050505] dark:text-white">
      <AdminHeader />

      <PrettyAlert
        alert={alert}
        loading={loading}
        onClose={() => setAlert(null)}
      />

      <TopDayFilter
        date={rdvFilter.date}
        totalRdv={dayStats.totalRdvJour}
        recetteJour={dayStats.recetteJour}
        enAttente={dayStats.enAttente}
        confirmes={dayStats.confirmes}
        termines={dayStats.termines}
        annules={dayStats.annules}
        clientsUniques={dayStats.clientsUniques}
        onDateChange={changeDashboardDate}
        onToday={showTodayDashboard}
        onTomorrow={showTomorrowDashboard}
        onRefresh={refreshRdvNow}
      />

      <StatsSection
        totalRdvJour={dayStats.totalRdvJour}
        clientsUniques={dayStats.clientsUniques}
        enAttente={dayStats.enAttente}
        confirmes={dayStats.confirmes}
        recetteJour={dayStats.recetteJour}
      />

      <section className="mx-auto mt-6 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
        <SimpleBarChart
          title="RDV par heure"
          items={charts.byHour}
          emptyText="Aucune donnée horaire pour cette date."
        />

        <SimpleBarChart
          title="Services réservés"
          items={charts.byService}
          emptyText="Aucun service réservé pour cette date."
        />

        <StatusChart items={charts.byStatus} />
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 pb-10 sm:px-6">
        <div className={cardClass}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                className={`flex items-center gap-2 text-lg font-serif font-bold sm:text-xl ${goldText}`}
              >
                <Users size={20} />
                Clients et rendez-vous
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-gray-400">
                Liste des clients qui ont réservé pour la date sélectionnée.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-700 dark:text-amber-300">
              <Sparkles size={15} />
              {dayStats.totalRdvJour} RDV · {dayStats.clientsUniques} client(s)
            </div>
          </div>

          <RdvFilters
            filter={rdvFilter}
            lastRefresh={lastRdvRefresh}
            total={dayStats.totalRdvJour}
            onChange={handleRdvFilterChange}
            onApply={() => loadData(false)}
            onReset={resetFilters}
            onRefreshNow={refreshRdvNow}
          />

          <RdvTable
            rendezvous={rendezvous}
            onUpdateStatut={updateRdvStatut}
            onDelete={deleteRdv}
          />
        </div>
      </section>

      <ConfirmDialog
        confirm={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </main>
  );
}