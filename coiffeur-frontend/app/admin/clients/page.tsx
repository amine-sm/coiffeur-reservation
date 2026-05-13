"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCcw,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import AdminHeader from "@/components/admin/AdminHeader";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

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

function getToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("admin_token")
  );
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

function getClientFullName(client: Client) {
  const fullName = `${client.nom || ""} ${client.prenom || ""}`.trim();
  return fullName || "Client sans nom";
}

function getTelegramUrl(value?: string | null) {
  if (!value) return null;

  const cleanValue = String(value).trim();

  if (!cleanValue) return null;

  if (cleanValue.startsWith("@")) {
    return `https://t.me/${cleanValue.replace("@", "")}`;
  }

  if (cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
    return cleanValue;
  }

  return `https://t.me/${cleanValue}`;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadClients() {
    setLoading(true);
    setMessage("");

    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/clients`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setMessage(result.message || "Erreur récupération clients.");
        setClients([]);
        return;
      }

      setClients(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error(error);
      setMessage("Erreur serveur pendant le chargement des clients.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-black dark:text-white">
        <AdminHeader />

        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-500" />

            <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-gray-400">
              Chargement des clients...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-black dark:text-white">
      <AdminHeader />

      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <Users size={16} />
              Gestion clients
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Clients
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-gray-400">
              Consultez les clients enregistrés automatiquement depuis les
              rendez-vous avec leurs coordonnées et leur liaison Telegram.
            </p>
          </div>

          <button
            type="button"
            onClick={loadClients}
            className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-black text-black transition hover:bg-amber-400"
          >
            <RefreshCcw size={16} />
            Actualiser
          </button>
        </div>

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-600">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <span>{message}</span>
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Users />}
            label="Total clients"
            value={String(totalClients)}
          />

          <StatCard
            icon={<Phone />}
            label="Avec téléphone"
            value={String(clientsWithPhone)}
          />

          <StatCard
            icon={<Mail />}
            label="Avec email"
            value={String(clientsWithEmail)}
          />

          <StatCard
            icon={<MessageCircle />}
            label="Telegram liés"
            value={String(clientsWithTelegram)}
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black">Liste des clients</h2>

              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-gray-400">
                {filteredClients.length} client(s) affiché(s)
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher client..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-amber-500 dark:border-white/10 dark:bg-black/30"
              />
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-50 dark:bg-black/40">
                    <tr>
                      <Th>Client</Th>
                      <Th>Téléphone</Th>
                      <Th>Email</Th>
                      <Th>Telegram</Th>
                      <Th>Date</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                      >
                        <Td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                              <UserRound size={20} />
                            </div>

                            <div>
                              <p className="font-black">
                                {getClientFullName(client)}
                              </p>

                              <p className="mt-0.5 text-xs font-bold text-slate-500">
                                ID #{client.id}
                              </p>
                            </div>
                          </div>
                        </Td>

                        <Td>
                          <ContactValue value={client.telephone} />
                        </Td>

                        <Td>
                          <ContactValue value={client.email} />
                        </Td>

                        <Td>
                          <TelegramBadge value={client.telegram_chat_id} />
                        </Td>

                        <Td>{formatDate(client.created_at)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {filteredClients.map((client) => (
                  <ClientMobileCard key={client.id} client={client} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-widest text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-gray-200">
      {children}
    </td>
  );
}

function ContactValue({ value }: { value?: string | null }) {
  if (!value) {
    return <span className="text-slate-400">-</span>;
  }

  return <span>{value}</span>;
}

function TelegramBadge({ value }: { value?: string | null }) {
  const telegramUrl = getTelegramUrl(value);

  if (telegramUrl) {
    return (
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-400"
        title="Ouvrir Telegram"
      >
        Lié
        <ExternalLink size={13} />
      </a>
    );
  }

  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500 dark:border-white/10 dark:bg-black/30">
      Non lié
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-black/30">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
        <UserRound size={26} />
      </div>

      <h3 className="mt-4 text-lg font-black">Aucun client trouvé</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-gray-400">
        Aucun client ne correspond à votre recherche ou aucun client n’est
        encore enregistré.
      </p>
    </div>
  );
}

function ClientMobileCard({ client }: { client: Client }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-black/30">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <UserRound size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black">
            {getClientFullName(client)}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-500">
            ID #{client.id}
          </p>
        </div>

        <TelegramBadge value={client.telegram_chat_id} />
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <MobileInfo
          icon={<Phone size={16} />}
          label="Téléphone"
          value={client.telephone || "-"}
        />

        <MobileInfo
          icon={<Mail size={16} />}
          label="Email"
          value={client.email || "-"}
        />

        <MobileInfo
          icon={<UserRound size={16} />}
          label="Créé le"
          value={formatDate(client.created_at)}
        />
      </div>
    </div>
  );
}

function MobileInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="font-bold">{label}</span>
      </div>

      <span className="max-w-[55%] truncate text-right font-black">
        {value}
      </span>
    </div>
  );
}