"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Clock,
  Crown,
  Filter,
  Loader2,
  RefreshCcw,
  Scissors,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AdminHeader from "@/components/admin/AdminHeader";
import {
  analyticsService,
  type AnalyticsRecommendation,
  type SmartAnalytics,
} from "@/lib/analyticsService";

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("fr-FR")} DA`;
}

function formatDateISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayISO() {
  return formatDateISO(new Date());
}

function getFirstDayOfMonthISO() {
  const date = new Date();
  return formatDateISO(new Date(date.getFullYear(), date.getMonth(), 1));
}

function formatShortDate(value: string) {
  if (!value) return "-";

  const parts = value.slice(0, 10).split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDatesBetween(startDate: string, endDate: string) {
  if (!startDate || !endDate) return [];

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (start > end) return [];

  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

type RevenueCurveItem = {
  date: string;
  name: string;
  recette: number;
};

type DailyRevenueItem = {
  date?: string;
  day?: string;
  name?: string;
  total?: number;
  recette?: number;
  revenue?: number;
  montant?: number;
};

function getRevenueValue(item: DailyRevenueItem) {
  const recette = Number(item.recette || 0);
  const total = Number(item.total || 0);
  const revenue = Number(item.revenue || 0);
  const montant = Number(item.montant || 0);

  return recette || total || revenue || montant || 0;
}

function buildRevenueCurveData(
  data: SmartAnalytics | null,
  startDate: string,
  endDate: string,
): RevenueCurveItem[] {
  const dates = getDatesBetween(startDate, endDate);

  if (!data || dates.length === 0) {
    return [];
  }

  const revenueAny = data.revenue as unknown as {
    month?: number;
    daily?: DailyRevenueItem[];
    by_day?: DailyRevenueItem[];
    byDay?: DailyRevenueItem[];
    days?: DailyRevenueItem[];
  };

  const dailyData =
    revenueAny.daily ||
    revenueAny.by_day ||
    revenueAny.byDay ||
    revenueAny.days ||
    [];

  const revenueByDate = new Map<string, number>();

  if (Array.isArray(dailyData)) {
    dailyData.forEach((item) => {
      const rawDate = item.date || item.day || item.name;

      if (!rawDate) return;

      const dateKey = String(rawDate).slice(0, 10);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;

      revenueByDate.set(dateKey, getRevenueValue(item));
    });
  }

  /*
    IMPORTANT :
    Si une seule date est sélectionnée et que daily est vide,
    on utilise seulement revenue.month.
    On ne prend PAS revenue.today, sinon une ancienne date
    affiche la recette d'aujourd'hui par erreur.
  */
  if (dates.length === 1 && revenueByDate.size === 0) {
    return [
      {
        date: dates[0],
        name: formatShortDate(dates[0]),
        recette: Number(data.revenue.month || 0),
      },
    ];
  }

  return dates.map((date) => ({
    date,
    name: formatShortDate(date),
    recette: Number(revenueByDate.get(date) || 0),
  }));
}

export default function AnalyticsPage() {
  const [data, setData] = useState<SmartAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [startDate, setStartDate] = useState(getFirstDayOfMonthISO());
  const [endDate, setEndDate] = useState(getTodayISO());

  async function loadAnalytics(
    customStartDate = startDate,
    customEndDate = endDate,
  ) {
    setLoading(true);
    setMessage("");

    try {
      const res = await analyticsService.getSmartAnalytics({
        startDate: customStartDate,
        endDate: customEndDate,
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        setData(null);
        setMessage(res.message || "Erreur chargement analyse intelligente.");
      }
    } catch (error) {
      console.error(error);
      setData(null);
      setMessage("Erreur serveur analyse intelligente.");
    } finally {
      setLoading(false);
    }
  }

  function handleFilterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!startDate || !endDate) {
      setMessage("Veuillez choisir une date début et une date fin.");
      return;
    }

    if (startDate > endDate) {
      setMessage("La date début ne peut pas être supérieure à la date fin.");
      return;
    }

    loadAnalytics(startDate, endDate);
  }

  function resetToToday() {
    const today = getTodayISO();

    setStartDate(today);
    setEndDate(today);
    loadAnalytics(today, today);
  }

  function resetToMonth() {
    const firstDay = getFirstDayOfMonthISO();
    const today = getTodayISO();

    setStartDate(firstDay);
    setEndDate(today);
    loadAnalytics(firstDay, today);
  }

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rendezVousChartData = useMemo(() => {
    if (!data) return [];

    return [
      {
        name: "En attente",
        total: Number(data.rendezvous.en_attente || 0),
      },
      {
        name: "Confirmés",
        total: Number(data.rendezvous.confirmes || 0),
      },
      {
        name: "Terminés",
        total: Number(data.rendezvous.termines || 0),
      },
      {
        name: "Annulés",
        total: Number(data.rendezvous.annules || 0),
      },
    ];
  }, [data]);

  const revenueChartData = useMemo(() => {
    return buildRevenueCurveData(data, startDate, endDate);
  }, [data, startDate, endDate]);

  const revenueIntervalTotal = useMemo(() => {
    if (!data) return 0;

    /*
      Le total intervalle vient toujours du backend.
      On n'utilise jamais revenue.today ici.
    */
    return Number(data.revenue.month || 0);
  }, [data]);

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

          <button
            onClick={() => loadAnalytics()}
            className="mt-5 rounded-full bg-amber-500 px-6 py-3 text-sm font-black text-black transition hover:bg-amber-400"
          >
            Réessayer
          </button>
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
            onClick={() => loadAnalytics()}
            className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-black text-black transition hover:bg-amber-400"
          >
            <RefreshCcw size={16} />
            Actualiser
          </button>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Filter size={20} />
            </div>

            <div>
              <h2 className="text-lg font-black">
                Filtrer par intervalle de date
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                Choisissez une date début et une date fin pour afficher la
                courbe des recettes jour par jour.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto_auto] md:items-end">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                Date début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-amber-500 dark:border-white/10 dark:bg-black/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                Date fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-amber-500 dark:border-white/10 dark:bg-black/30"
              />
            </div>

            <button
              type="submit"
              className="h-12 rounded-2xl bg-amber-500 px-6 text-sm font-black text-black transition hover:bg-amber-400"
            >
              Appliquer
            </button>

            <button
              type="button"
              onClick={resetToToday}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black transition hover:bg-slate-50 dark:border-white/10 dark:bg-black/30 dark:hover:bg-white/10"
            >
              Aujourd’hui
            </button>

            <button
              type="button"
              onClick={resetToMonth}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black transition hover:bg-slate-50 dark:border-white/10 dark:bg-black/30 dark:hover:bg-white/10"
            >
              Ce mois
            </button>
          </div>
        </form>

        {message && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-600">
            {message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Wallet />}
            label="Recette aujourd’hui"
            value={formatMoney(data.revenue.today)}
          />

          <StatCard
            icon={<TrendingUp />}
            label="Recette intervalle"
            value={formatMoney(revenueIntervalTotal)}
          />

          <StatCard
            icon={<CalendarDays />}
            label="Total rendez-vous"
            value={String(data.rendezvous.total)}
          />

          <StatCard
            icon={<AlertTriangle />}
            label="Taux d’annulation"
            value={`${data.rendezvous.cancellation_rate}%`}
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <BigCard title="Courbe des recettes" icon={<Wallet />}>
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  Recettes jour par jour
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-gray-400">
                  Période sélectionnée : {startDate} jusqu’à {endDate}
                </p>
              </div>

              <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-600 dark:text-amber-400">
                Total intervalle : {formatMoney(revenueIntervalTotal)}
              </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <MiniMoneyStat
                label="Aujourd’hui"
                value={formatMoney(data.revenue.today)}
              />
              <MiniMoneyStat
                label="Total intervalle"
                value={formatMoney(revenueIntervalTotal)}
              />
            </div>

            <div className="h-[360px] w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/30">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueChartData}
                  margin={{
                    top: 20,
                    right: 25,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    className="stroke-slate-200 dark:stroke-white/10"
                  />

                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={revenueChartData.length > 10 ? -35 : 0}
                    textAnchor={revenueChartData.length > 10 ? "end" : "middle"}
                    height={revenueChartData.length > 10 ? 60 : 35}
                    tick={{
                      fontSize: 11,
                      fontWeight: 700,
                      fill: "#64748B",
                    }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 12,
                      fontWeight: 700,
                      fill: "#64748B",
                    }}
                    tickFormatter={(value) =>
                      `${Number(value || 0).toLocaleString("fr-FR")}`
                    }
                  />

                  <Tooltip
                    cursor={{
                      stroke: "#F59E0B",
                      strokeWidth: 2,
                      strokeDasharray: "4 4",
                    }}
                    contentStyle={{
                      borderRadius: "18px",
                      border: "1px solid rgba(148, 163, 184, 0.25)",
                      boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
                      fontWeight: 700,
                    }}
                    formatter={(value) => [
                      formatMoney(Number(value)),
                      "Recette",
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload as
                        | RevenueCurveItem
                        | undefined;

                      return item?.date
                        ? `Date : ${item.date}`
                        : `Date : ${label}`;
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="recette"
                    name="Recette"
                    stroke="#F59E0B"
                    strokeWidth={4}
                    dot={{
                      r: 5,
                      strokeWidth: 3,
                      fill: "#FFFFFF",
                      stroke: "#F59E0B",
                    }}
                    activeDot={{
                      r: 9,
                      strokeWidth: 3,
                      fill: "#F59E0B",
                      stroke: "#FFFFFF",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {revenueChartData.length > 0 &&
              revenueChartData.every(
                (item) => Number(item.recette || 0) === 0,
              ) && (
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-bold text-amber-700 dark:text-amber-300">
                  La courbe affiche toutes les dates de l’intervalle, mais les
                  recettes journalières sont à 0. Si vous avez des ventes dans
                  cette période, vérifiez que le backend renvoie bien{" "}
                  <span className="font-black">revenue.daily</span> avec{" "}
                  <span className="font-black">date</span> et{" "}
                  <span className="font-black">total</span>.
                </div>
              )}
          </BigCard>

          <BigCard title="Graphique des rendez-vous" icon={<BarChart3 />}>
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  Répartition par statut
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-gray-400">
                  Période sélectionnée : {startDate} jusqu’à {endDate}
                </p>
              </div>

              <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-600 dark:text-amber-400">
                Total : {data.rendezvous.total} RDV
              </div>
            </div>

            <div className="h-[360px] w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/30">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rendezVousChartData} barSize={46}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-slate-200 dark:stroke-white/10"
                  />

                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 12,
                      fontWeight: 700,
                      fill: "#64748B",
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 12,
                      fontWeight: 700,
                      fill: "#64748B",
                    }}
                  />

                  <Tooltip
                    cursor={{
                      fill: "rgba(245, 158, 11, 0.08)",
                    }}
                    contentStyle={{
                      borderRadius: "18px",
                      border: "1px solid rgba(148, 163, 184, 0.25)",
                      boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
                      fontWeight: 700,
                    }}
                    formatter={(value) => [`${value} RDV`, "Total"]}
                    labelFormatter={(label) => `Statut : ${label}`}
                  />

                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#F59E0B"
                    radius={[14, 14, 6, 6]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BigCard>
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
            <InfoLine
              label="Plus demandé"
              value={data.services.top_requested_service?.nom || "-"}
            />
            <InfoLine
              label="Plus rentable"
              value={data.services.top_revenue_service?.nom || "-"}
            />
            <InfoLine
              label="Plus annulé"
              value={data.services.top_cancelled_service?.nom || "-"}
            />
          </BigCard>

          <BigCard title="Créneaux et planning" icon={<Clock />}>
            <InfoLine
              label="Jour fort"
              value={data.days.best_day?.day_name || "-"}
            />
            <InfoLine
              label="Jour faible"
              value={data.days.weak_day?.day_name || "-"}
            />
            <InfoLine
              label="Heure forte"
              value={data.hours.peak_hour?.hour || "-"}
            />
            <InfoLine
              label="Heure faible"
              value={data.hours.weak_hour?.hour || "-"}
            />
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
                    key={client.id || index}
                    index={index + 1}
                    label={`${client.nom || ""} ${client.prenom || ""}`.trim()}
                    value={`${client.total_rdv} RDV · ${formatMoney(
                      client.total_depense,
                    )}`}
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
  icon: ReactNode;
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

      {subValue && (
        <p className="mt-2 text-xs font-bold text-emerald-500">{subValue}</p>
      )}
    </div>
  );
}

function BigCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
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
      <p className="mt-1 text-2xl font-black">{Number(value || 0)}</p>
    </div>
  );
}

function MiniMoneyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/30">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
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