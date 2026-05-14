"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCcw,
  Search,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";

import AdminHeader from "@/components/admin/AdminHeader";
import { authService } from "@/lib/authService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

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

type Client = {
  id: number;
  nom: string | null;
  prenom?: string | null;
  email?: string | null;
  telephone?: string | null;
  telegram_chat_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AlertType = "success" | "error" | "info" | "warning";

type AlertState = {
  type: AlertType;
  message: string;
} | null;

// ============================================================
// FONCTIONS UTILES
// ============================================================

function getToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("adminToken") ||
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token")
  );
}

function clearBadTokens() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin_token");
  localStorage.removeItem("token");
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getCurrentTimeValue(): string {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getClientFullName(client: Client) {
  const fullName = `${client.nom || ""} ${client.prenom || ""}`.trim();

  return fullName || "Client sans nom";
}

function getApiMessage(result: any): string {
  return (
    result?.message ||
    result?.error ||
    "Une erreur est survenue pendant l'opération."
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erreur inconnue. Vérifiez la console ou le backend.";
}

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(page, 1), totalPages);
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
      icon: ReactNode;
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
              type="button"
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
                Chargement des clients...
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
  icon: ReactNode;
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

function TopClientsHeader({
  totalClients,
  clientsWithPhone,
  clientsWithEmail,
  clientsWithTelegram,
  lastRefresh,
  onRefresh,
}: {
  totalClients: number;
  clientsWithPhone: number;
  clientsWithEmail: number;
  clientsWithTelegram: number;
  lastRefresh: string;
  onRefresh: () => void;
}) {
  return (
    <div className="mx-auto mb-6 max-w-7xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-[#0D0D0D] dark:shadow-black/30 sm:rounded-3xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-amber-500/10 via-white to-white p-4 dark:border-white/10 dark:from-amber-500/10 dark:via-[#0D0D0D] dark:to-[#0D0D0D] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                <Users size={15} />
                Gestion clients
              </div>

              <h1 className={`mt-3 text-3xl font-serif font-black ${goldText}`}>
                Clients
              </h1>

              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500 dark:text-gray-400">
                Consultez les clients enregistrés automatiquement depuis les
                rendez-vous avec leurs coordonnées et leur liaison Telegram.
              </p>

              {lastRefresh && (
                <p className="mt-2 text-xs font-bold text-sky-700 dark:text-sky-300">
                  Dernier refresh : {lastRefresh}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-black transition hover:opacity-90 active:scale-[0.98] ${goldBg}`}
            >
              <RefreshCcw size={16} />
              Actualiser
            </button>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <TopMiniStat title="Total clients" value={totalClients} tone="gold" />
          <TopMiniStat title="Avec téléphone" value={clientsWithPhone} tone="sky" />
          <TopMiniStat title="Avec email" value={clientsWithEmail} tone="emerald" />
          <TopMiniStat title="Telegram liés" value={clientsWithTelegram} tone="green" />
        </div>
      </div>
    </div>
  );
}

function TopMiniStat({
  title,
  value,
  tone,
}: {
  title: string;
  value: string | number;
  tone: "gold" | "sky" | "emerald" | "green";
}) {
  const styles: Record<typeof tone, string> = {
    gold: "border-amber-400/25 bg-amber-400/10 text-amber-700 dark:text-amber-300",
    sky: "border-sky-400/25 bg-sky-400/10 text-sky-700 dark:text-sky-300",
    emerald:
      "border-emerald-400/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
    green:
      "border-green-400/25 bg-green-400/10 text-green-700 dark:text-green-300",
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
  totalClients,
  clientsWithPhone,
  clientsWithEmail,
  clientsWithTelegram,
}: {
  totalClients: number;
  clientsWithPhone: number;
  clientsWithEmail: number;
  clientsWithTelegram: number;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <StatCard title="Total clients" value={totalClients} icon={<Users />} />

        <StatCard
          title="Avec téléphone"
          value={clientsWithPhone}
          icon={<Phone />}
        />

        <StatCard title="Avec email" value={clientsWithEmail} icon={<Mail />} />

        <StatCard
          title="Telegram liés"
          value={clientsWithTelegram}
          icon={<MessageCircle />}
        />
      </div>
    </div>
  );
}

function TelegramBadge({ value }: { value?: string | null }) {
  if (value) {
    return (
      <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-black !text-emerald-600 transition-all duration-200 group-hover:border-black/30 group-hover:bg-black/5 group-hover:!text-black dark:!text-emerald-300">
        Lié
      </span>
    );
  }

  return (
    <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-black !text-slate-500 transition-all duration-200 group-hover:border-black/30 group-hover:bg-black/5 group-hover:!text-black dark:border-white/10 dark:bg-white/[0.04] dark:!text-gray-300">
      Non lié
    </span>
  );
}

function ContactValue({ value }: { value?: string | null }) {
  if (!value) {
    return <span className="text-slate-400 group-hover:text-slate-500">-</span>;
  }

  return <span>{value}</span>;
}

function SearchBox({
  search,
  onSearchChange,
  total,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  total: number;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par nom, téléphone, email, Telegram..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 dark:border-white/20 dark:bg-[#111111] dark:text-white sm:text-sm"
          />
        </div>

        <div className="flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-xs font-black text-sky-700 dark:text-sky-300">
          {total} client(s) affiché(s)
        </div>
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

function ClientsTable({ clients }: { clients: Client[] }) {
  const pagination = usePagination(clients, 10);

  return (
    <>
      <div className={tableWrapperClass}>
        <table className={`${tableClass} min-w-[860px]`}>
          <thead className={theadClass}>
            <tr>
              <th className={thClass}>Client</th>
              <th className={thClass}>Téléphone</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Telegram</th>
              <th className={thClass}>Date création</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-white/20">
            {pagination.paginatedItems.map((client) => (
              <tr key={client.id} className={rowClass}>
                <td className={tdWhite}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-300">
                      <UserRound size={16} />
                    </div>

                    <div>
                      <p className="font-black">{getClientFullName(client)}</p>

                      <p className="mt-0.5 text-[11px] font-bold text-slate-500 group-hover:text-slate-600 dark:text-gray-400">
                        ID #{client.id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className={tdLight}>
                  <ContactValue value={client.telephone} />
                </td>

                <td className={tdLight}>
                  <ContactValue value={client.email} />
                </td>

                <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-900 transition-colors duration-200 group-hover:text-slate-950 dark:!text-white dark:group-hover:!text-black sm:px-4 sm:py-4 sm:text-sm">
                  <TelegramBadge value={client.telegram_chat_id} />
                </td>

                <td className={tdLight}>{formatDate(client.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {clients.length === 0 && (
          <div className="py-12 text-center">
            <Users
              size={40}
              className="mx-auto mb-3 text-slate-400 dark:text-gray-600"
            />

            <p className="font-semibold text-slate-500 dark:text-gray-400">
              Aucun client trouvé.
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

export default function ClientsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState>(null);
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");

  function showAlert(type: AlertType, message: string) {
    setAlert({ type, message });

    if (type === "error") {
      console.error("🚨 Erreur clients :", message);
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

  const loadClients = useCallback(
    async (showLoader = true) => {
      if (!checkAuth()) return;

      if (showLoader) setLoading(true);

      try {
        const token = getToken();

        if (!token) {
          clearBadTokens();
          router.replace("/admin/login");
          return;
        }

        const res = await fetch(`${API_URL}/clients`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const result = await res.json().catch(() => null);

        if (res.status === 401 || res.status === 403) {
          clearBadTokens();
          showAlert(
            "error",
            result?.message || "Session expirée ou token invalide. Reconnectez-vous.",
          );

          setTimeout(() => {
            router.replace("/admin/login");
          }, 800);

          return;
        }

        if (!res.ok || !result?.success) {
          showAlert("error", getApiMessage(result));
          setClients([]);
          return;
        }

        setClients(Array.isArray(result.data) ? result.data : []);
        setLastRefresh(getCurrentTimeValue());
      } catch (error) {
        showAlert("error", getErrorMessage(error));
        setClients([]);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [checkAuth, router],
  );

  useEffect(() => {
    loadClients(true);
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return clients;

    return clients.filter((client) => {
      const fullName = getClientFullName(client).toLowerCase();
      const email = String(client.email || "").toLowerCase();
      const phone = String(client.telephone || "").toLowerCase();
      const telegram = String(client.telegram_chat_id || "").toLowerCase();

      return (
        fullName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        telegram.includes(q)
      );
    });
  }, [clients, search]);

  const totalClients = clients.length;

  const clientsWithPhone = useMemo(() => {
    return clients.filter((client) => client.telephone).length;
  }, [clients]);

  const clientsWithEmail = useMemo(() => {
    return clients.filter((client) => client.email).length;
  }, [clients]);

  const clientsWithTelegram = useMemo(() => {
    return clients.filter((client) => client.telegram_chat_id).length;
  }, [clients]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050505] dark:text-white">
      <AdminHeader />

      <PrettyAlert
        alert={alert}
        loading={loading}
        onClose={() => setAlert(null)}
      />

      <TopClientsHeader
        totalClients={totalClients}
        clientsWithPhone={clientsWithPhone}
        clientsWithEmail={clientsWithEmail}
        clientsWithTelegram={clientsWithTelegram}
        lastRefresh={lastRefresh}
        onRefresh={() => loadClients(false)}
      />

      <StatsSection
        totalClients={totalClients}
        clientsWithPhone={clientsWithPhone}
        clientsWithEmail={clientsWithEmail}
        clientsWithTelegram={clientsWithTelegram}
      />

      <section className="mx-auto mt-6 max-w-7xl px-4 pb-10 sm:px-6">
        <div className={cardClass}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                className={`flex items-center gap-2 text-lg font-serif font-bold sm:text-xl ${goldText}`}
              >
                <Users size={20} />
                Liste des clients
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-gray-400">
                Recherchez et consultez les informations des clients enregistrés.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-700 dark:text-amber-300">
              <Sparkles size={15} />
              {filteredClients.length} client(s)
            </div>
          </div>

          <SearchBox
            search={search}
            onSearchChange={setSearch}
            total={filteredClients.length}
          />

          <ClientsTable clients={filteredClients} />
        </div>
      </section>
    </main>
  );
}