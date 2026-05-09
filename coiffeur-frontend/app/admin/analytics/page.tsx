"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Clock,
  Crown,
  Loader2,
  RefreshCcw,
  Scissors,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  analyticsService,
  type SmartAnalytics,
  type AnalyticsRecommendation,
} from "@/lib/analyticsService";

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("fr-FR")} DA`;
}

function formatPercent(value: number) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${number}%`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<SmartAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setMessage("");

    try {
      const res = await analyticsService.getSmartAnalytics();

      if (res.success && res.data) {
        setData(res.data);
      } else {
        setMessage(res.message || "Erreur chargement analyse intelligente.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Erreur serveur analyse intelligente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-black dark:text-white">
        <AdminHeader />

        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-500" />
            <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">
              Analyse intelligente en cours...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-black dark:text-white">
        <AdminHeader />

        <div className="mx-auto max-w-7xl p-4 md:p-8">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-600">
            {message || "Aucune donnée disponible."}
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
              <Sparkles size={16} />
              Smart Analytics
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Analyse intelligente du salon
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-gray-400">
              Analyse automatique des rendez-vous, recettes, services, clients,
              annulations et créneaux pour améliorer la gestion du salon.
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-black text-black transition hover:bg-amber-400"
          >
            <RefreshCcw size={16} />
            Actualiser
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-600">
            {message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Wallet />} label="Recette aujourd’hui" value={formatMoney(data.revenue.today)} />
          <StatCard icon={<TrendingUp />} label="Recette du mois" value={formatMoney(data.revenue.month)} subValue={`${formatPercent(data.revenue.month_growth_percent)} vs mois précédent`} />
          <StatCard icon={<CalendarDays />} label="Total rendez-vous" value={String(data.rendezvous.total)} />
          <StatCard icon={<AlertTriangle />} label="Taux d’annulation" value={`${data.rendezvous.cancellation_rate}%`} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <BigCard title="Résumé des rendez-vous" icon={<BarChart3 />}>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="En attente" value={data.rendezvous.en_attente} />
              <MiniStat label="Confirmés" value={data.rendezvous.confirmes} />
              <MiniStat label="Terminés" value={data.rendezvous.termines} />
              <MiniStat label="Annulés" value={data.rendezvous.annules} />
            </div>
          </BigCard>

          <BigCard title="Services principaux" icon={<Scissors />}>
            <InfoLine label="Plus demandé" value={data.services.top_requested_service?.nom || "-"} />
            <InfoLine label="Plus rentable" value={data.services.top_revenue_service?.nom || "-"} />
            <InfoLine label="Plus annulé" value={data.services.top_cancelled_service?.nom || "-"} />
          </BigCard>

          <BigCard title="Créneaux et planning" icon={<Clock />}>
            <InfoLine label="Jour fort" value={data.days.best_day?.day_name || "-"} />
            <InfoLine label="Jour faible" value={data.days.weak_day?.day_name || "-"} />
            <InfoLine label="Heure forte" value={data.hours.peak_hour?.hour || "-"} />
            <InfoLine label="Heure faible" value={data.hours.weak_hour?.hour || "-"} />
          </BigCard>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <BigCard title="Top services demandés" icon={<Crown />}>
            <div className="space-y-3">
              {data.services.requested.length === 0 ? (
                <EmptyText text="Aucun service réservé pour le moment." />
              ) : (
                data.services.requested.map((service, index) => (
                  <RankLine
                    key={service.id || index}
                    index={index + 1}
                    label={service.nom || "Service inconnu"}
                    value={`${service.total_reservations} réservation(s)`}
                  />
                ))
              )}
            </div>
          </BigCard>

          <BigCard title="Clients fidèles" icon={<Users />}>
            <div className="space-y-3">
              {data.clients.loyal_clients.length === 0 ? (
                <EmptyText text="Pas encore assez de données clients." />
              ) : (
                data.clients.loyal_clients.map((client, index) => (
                  <RankLine
                    key={client.id}
                    index={index + 1}
                    label={`${client.nom || ""} ${client.prenom || ""}`.trim()}
                    value={`${client.total_rdv} RDV · ${formatMoney(client.total_depense)}`}
                  />
                ))
              )}
            </div>
          </BigCard>
        </section>

        <section className="mt-8">
          <BigCard title="Recommandations intelligentes" icon={<Sparkles />}>
            <div className="grid gap-4 md:grid-cols-2">
              {data.recommendations.map((item, index) => (
                <RecommendationCard key={index} recommendation={item} />
              ))}
            </div>
          </BigCard>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
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
      {subValue && <p className="mt-2 text-xs font-bold text-emerald-500">{subValue}</p>}
    </div>
  );
}

function BigCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          {icon}
        </div>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/30">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm dark:border-white/10">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function RankLine({
  index,
  label,
  value,
}: {
  index: number;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/30">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-sm font-black text-black">
          {index}
        </div>
        <p className="font-bold">{label || "-"}</p>
      </div>
      <p className="text-sm font-bold text-slate-500">{value}</p>
    </div>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: AnalyticsRecommendation;
}) {
  const color =
    recommendation.type === "warning"
      ? "border-red-500/20 bg-red-500/10 text-red-600"
      : recommendation.type === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
        : "border-sky-500/20 bg-sky-500/10 text-sky-600";

  return (
    <div className={`rounded-2xl border p-5 ${color}`}>
      <p className="font-black">{recommendation.title}</p>
      <p className="mt-2 text-sm leading-6">{recommendation.message}</p>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-slate-500">{text}</p>;
}
