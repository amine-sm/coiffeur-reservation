"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import { authService } from "@/lib/authService";
import { serviceService } from "@/lib/serviceService";
import { creneauService } from "@/lib/creneauService";
import type { Creneau, Service } from "@/lib/types";
import {
  CalendarDays,
  Clock,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";

const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

const goldBg = "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutesOptions = ["00", "15", "30", "45"];

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

type AlertState = {
  type: "success" | "error" | "info" | "warning";
  message: string;
} | null;

const initialCreneauForm = {
  service_ids: [] as string[],
  date_creneau: "",
  heure: "09",
  minute: "30",
};

function getTodayDateValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erreur inconnue.";
}

export default function AdminCreneauxPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [form, setForm] = useState(initialCreneauForm);
  const [filterDate, setFilterDate] = useState(getTodayDateValue());
  const [alert, setAlert] = useState<AlertState>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeServices = useMemo(
    () => services.filter((service) => service.statut !== "inactif"),
    [services],
  );

  const filteredCreneaux = useMemo(() => {
    return creneaux
      .filter((creneau) => {
        return (
          creneau.statut === "disponible" &&
          formatDateOnly(creneau.date_creneau) === filterDate
        );
      })
      .sort((a, b) => {
        return formatTimeOnly(a.heure_creneau).localeCompare(
          formatTimeOnly(b.heure_creneau),
        );
      });
  }, [creneaux, filterDate]);

  const groupedByHour = useMemo(() => {
    const grouped: Record<string, Creneau[]> = {};

    filteredCreneaux.forEach((creneau) => {
      const hour = formatTimeOnly(creneau.heure_creneau);
      const key = hour && hour !== "-" ? `${hour.slice(0, 2)}:00` : "--:--";

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(creneau);
    });

    return grouped;
  }, [filteredCreneaux]);

  const hourKeys = Object.keys(groupedByHour).sort();

  const checkAuth = useCallback(() => {
    if (!authService.isAuthenticated()) {
      router.push("/admin/login");
      return false;
    }

    return true;
  }, [router]);

  function setPrettyAlert(type: "success" | "error" | "info" | "warning", message: string) {
    setAlert({ type, message });

    setTimeout(() => {
      setAlert(null);
    }, 4500);
  }

  async function loadData() {
    if (!checkAuth()) return;

    setLoading(true);

    try {
      const [servicesRes, creneauxRes] = await Promise.all([
        serviceService.getAll(),
        creneauService.getAllAdmin(),
      ]);

      if (servicesRes.success && servicesRes.data) {
        setServices(servicesRes.data);
      } else {
        setPrettyAlert("error", servicesRes.message || "Erreur chargement services.");
      }

      if (creneauxRes.success && creneauxRes.data) {
        setCreneaux(creneauxRes.data);
      } else {
        setPrettyAlert("error", creneauxRes.message || "Erreur chargement créneaux.");
      }
    } catch (error) {
      setPrettyAlert("error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [checkAuth]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function toggleService(serviceId: number | string) {
    const id = String(serviceId);

    setForm((prev) => {
      const exists = prev.service_ids.includes(id);

      return {
        ...prev,
        service_ids: exists
          ? prev.service_ids.filter((item) => item !== id)
          : [...prev.service_ids, id],
      };
    });
  }

  async function submitCreneau(e: React.FormEvent) {
    e.preventDefault();

    if (form.service_ids.length === 0) {
      setPrettyAlert("warning", "Sélectionnez au moins un service.");
      return;
    }

    if (!form.date_creneau) {
      setPrettyAlert("warning", "La date est obligatoire.");
      return;
    }

    const heureCreneau = `${form.heure}:${form.minute}`;

    setSaving(true);

    try {
      const res = await creneauService.create({
        service_ids: form.service_ids,
        date_creneau: form.date_creneau,
        heure_creneau: heureCreneau,
      });

      if (res.success) {
        setPrettyAlert("success", "Créneau publié avec succès.");

        setForm({
          ...initialCreneauForm,
          date_creneau: form.date_creneau,
        });

        setFilterDate(form.date_creneau);
        await loadData();
      } else {
        setPrettyAlert("error", res.message || "Erreur création créneau.");
      }
    } catch (error) {
      setPrettyAlert("error", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCreneau(id: number) {
    const ok = window.confirm("Voulez-vous vraiment supprimer ce créneau ?");

    if (!ok) return;

    try {
      const res = await creneauService.delete(id);

      if (res.success) {
        setPrettyAlert("success", "Créneau supprimé avec succès.");
        await loadData();
      } else {
        setPrettyAlert("error", res.message || "Erreur suppression créneau.");
      }
    } catch (error) {
      setPrettyAlert("error", getErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050505] dark:text-white">
      <AdminHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
              <CalendarDays size={15} />
              Gestion créneaux
            </div>

            <h1 className={`mt-3 text-3xl font-serif font-black ${goldText}`}>
              Créneaux disponibles
            </h1>

            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-gray-400">
              Publiez les disponibilités du salon et organisez-les par jour et par heure.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="flex items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-400 hover:text-black dark:text-amber-300"
          >
            <RefreshCcw size={16} />
            Actualiser
          </button>
        </div>

        {alert && (
          <div
            className={`mb-6 rounded-3xl border p-4 text-sm font-bold ${
              alert.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-600"
                : alert.type === "warning"
                  ? "border-amber-400/30 bg-amber-500/10 text-amber-600"
                  : alert.type === "info"
                    ? "border-sky-400/30 bg-sky-500/10 text-sky-600"
                    : "border-red-400/30 bg-red-500/10 text-red-600"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{alert.message}</span>
              <button type="button" onClick={() => setAlert(null)}>
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
          <section className={cardClass}>
            <h2 className={`flex items-center gap-2 text-xl font-serif font-bold ${goldText}`}>
              <Plus size={20} />
              Publier un créneau
            </h2>

            <form onSubmit={submitCreneau} className="mt-6 space-y-4">
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
                      const checked = form.service_ids.includes(String(service.id));

                      return (
                        <label
                          key={service.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all ${
                            checked
                              ? "border-amber-400 bg-amber-400/15"
                              : "border-slate-200 bg-white hover:border-amber-300 dark:border-white/10 dark:bg-[#111111]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(service.id)}
                            className="h-5 w-5 accent-amber-500"
                          />

                          <div>
                            <p className="text-sm font-black">{service.nom}</p>
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
                  Services sélectionnés : {form.service_ids.length}
                </div>
              </div>

              <input
                type="date"
                name="date_creneau"
                value={form.date_creneau}
                onChange={handleChange}
                required
                min={getTodayDateValue()}
                className={inputClass}
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  name="heure"
                  value={form.heure}
                  onChange={handleChange}
                  className={selectClass}
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h} h
                    </option>
                  ))}
                </select>

                <select
                  name="minute"
                  value={form.minute}
                  onChange={handleChange}
                  className={selectClass}
                >
                  {minutesOptions.map((m) => (
                    <option key={m} value={m}>
                      :{m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-bold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-white">
                Créneau sélectionné :{" "}
                <span className="text-lg text-[#FBBF24]">
                  {form.heure}:{form.minute}
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`w-full rounded-2xl px-5 py-3 font-black text-black transition hover:opacity-90 disabled:opacity-50 ${goldBg}`}
              >
                {saving ? "Publication..." : "Publier le créneau"}
              </button>
            </form>
          </section>

          <section className={cardClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`text-xl font-serif font-bold ${goldText}`}>
                  Créneaux du jour
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-gray-400">
                  Affichage professionnel par heure.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-gray-400">
                  Date disponible
                </label>

                <input
                  type="date"
                  value={filterDate}
                  min={getTodayDateValue()}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-300">
              Résultat : {filteredCreneaux.length} créneau(x) disponible(s) pour la date {filterDate}
            </div>

            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
              </div>
            ) : filteredCreneaux.length === 0 ? (
              <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 py-14 text-center dark:border-white/15 dark:bg-white/[0.03]">
                <CalendarDays size={44} className="mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-black text-slate-700 dark:text-white">
                  Aucun créneau disponible
                </p>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-gray-400">
                  Aucun créneau disponible pour la date {filterDate}.
                </p>
              </div>
            ) : (
              <div className="mt-6 max-h-[650px] space-y-5 overflow-y-auto pr-1">
                {hourKeys.map((hour) => (
                  <div
                    key={hour}
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
                            {hour}
                          </h3>
                        </div>
                      </div>

                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
                        {groupedByHour[hour].length} créneau(x)
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                      {groupedByHour[hour].map((creneau) => (
                        <div
                          key={creneau.id}
                          className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10 dark:border-white/10 dark:bg-[#111111]"
                        >
                          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]" />

                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-300">
                                  Disponible
                                </span>
                                <span className="text-xs font-bold text-slate-400">
                                  #{creneau.id}
                                </span>
                              </div>

                              <p className="text-base font-black text-slate-900 dark:text-white">
                                {creneau.service_nom || "Service non défini"}
                              </p>

                              <p className="mt-2 text-sm font-bold text-amber-600 dark:text-amber-300">
                                {formatTimeOnly(creneau.heure_creneau)}
                              </p>
                            </div>

                            <button
                              onClick={() => deleteCreneau(creneau.id)}
                              disabled={creneau.statut === "reserve"}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-400/30 bg-red-400/10 text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
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
          </section>
        </div>
      </div>
    </main>
  );
}
