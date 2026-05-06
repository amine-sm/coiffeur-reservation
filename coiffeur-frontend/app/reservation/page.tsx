"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { serviceService } from "@/lib/serviceService";
import { rendezvousService } from "@/lib/rendezvousService";
import { creneauService } from "@/lib/creneauService";
import type { AvailableDate, Creneau, Service } from "@/lib/types";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Scissors,
  Sparkles,
  UserRound,
} from "lucide-react";

function cleanDate(value: string | Date | null | undefined) {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  return text;
}

function cleanHour(value: string | null | undefined) {
  if (!value) return "";

  return String(value).slice(0, 5);
}

function formatDateLabel(dateValue: string) {
  const clean = cleanDate(dateValue);

  if (!clean) return "-";

  const [year, month, day] = clean.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatLongDate(dateValue: string) {
  const clean = cleanDate(dateValue);

  if (!clean) return "-";

  const [year, month, day] = clean.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function ReservationContent() {
  const params = useSearchParams();
  const selectedService = params.get("service");

  const [services, setServices] = useState<Service[]>([]);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);

  const [message, setMessage] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);

  const [form, setForm] = useState({
    nom_client: "",
    prenom_client: "",
    email: "",
    telephone: "",
    service_id: selectedService || "",
    creneau_id: "",
    date_rdv: "",
    note: "",
  });

  async function loadServices() {
    setLoadingServices(true);

    const res = await serviceService.getAll();

    if (res.success && res.data) {
      setServices(res.data.filter((service) => service.statut !== "inactif"));
    } else {
      setServices([]);
    }

    setLoadingServices(false);
  }

  async function loadAvailableDates(serviceId: string) {
    if (!serviceId) {
      setAvailableDates([]);
      return;
    }

    setLoadingDates(true);

    const res = await creneauService.getAvailableDates({
      service_id: serviceId,
    });

    if (res.success && res.data) {
      setAvailableDates(res.data);
    } else {
      setAvailableDates([]);
    }

    setLoadingDates(false);
  }

  async function loadCreneaux(serviceId: string, date: string) {
    if (!serviceId || !date) {
      setCreneaux([]);
      return;
    }

    setLoadingCreneaux(true);

    const res = await creneauService.getPublic({
      service_id: serviceId,
      date,
    });

    if (res.success && res.data) {
      setCreneaux(res.data);
    } else {
      setCreneaux([]);
    }

    setLoadingCreneaux(false);
  }

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      setForm((prev) => ({
        ...prev,
        service_id: selectedService,
      }));
    }
  }, [selectedService]);

  useEffect(() => {
    loadAvailableDates(form.service_id);
  }, [form.service_id]);

  useEffect(() => {
    loadCreneaux(form.service_id, form.date_rdv);
  }, [form.service_id, form.date_rdv]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setMessage("");

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "service_id"
        ? {
            date_rdv: "",
            creneau_id: "",
          }
        : {}),
    }));
  }

  function selectDate(dateValue: string) {
    const clean = cleanDate(dateValue);

    setMessage("");

    setForm((prev) => ({
      ...prev,
      date_rdv: clean,
      creneau_id: "",
    }));
  }

  function selectCreneau(creneau: Creneau) {
    if (creneau.statut !== "disponible") return;

    setMessage("");

    setForm((prev) => ({
      ...prev,
      creneau_id: String(creneau.id),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nom_client.trim()) {
      setMessage("❌ Veuillez saisir votre nom.");
      return;
    }

    if (!form.telephone.trim()) {
      setMessage("❌ Veuillez saisir votre numéro de téléphone.");
      return;
    }

    if (!form.service_id) {
      setMessage("❌ Veuillez choisir un service.");
      return;
    }

    if (!form.date_rdv) {
      setMessage("❌ Veuillez choisir une date.");
      return;
    }

    if (!form.creneau_id) {
      setMessage("❌ Veuillez choisir une heure disponible.");
      return;
    }

    setLoadingSubmit(true);
    setMessage("");

    const res = await rendezvousService.create({
      nom_client: form.nom_client.trim(),
      prenom_client: form.prenom_client.trim(),
      email: form.email.trim(),
      telephone: form.telephone.trim(),
      service_id: form.service_id,
      creneau_id: form.creneau_id,
      note: form.note.trim(),
    });

    if (res.success) {
      setMessage("✅ Rendez-vous réservé avec succès. Votre créneau est maintenant bloqué.");

      const oldServiceId = form.service_id;

      setForm({
        nom_client: "",
        prenom_client: "",
        email: "",
        telephone: "",
        service_id: oldServiceId,
        creneau_id: "",
        date_rdv: "",
        note: "",
      });

      setCreneaux([]);

      await loadAvailableDates(oldServiceId);
    } else {
      setMessage("❌ " + (res.message || "Erreur lors de la réservation."));
    }

    setLoadingSubmit(false);
  }

  const selectedServiceInfo = useMemo(() => {
    return services.find((service) => String(service.id) === String(form.service_id));
  }, [services, form.service_id]);

  const selectedCreneauInfo = useMemo(() => {
    return creneaux.find((creneau) => String(creneau.id) === String(form.creneau_id));
  }, [creneaux, form.creneau_id]);

  return (
    <main className="min-h-screen bg-[#F6F8FA]">
      <Navbar />

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-7 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-[#FE5737]">
                <CalendarCheck size={15} />
                Réservation en ligne
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#1B4F59] md:text-4xl">
                Agenda des rendez-vous
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Choisissez votre service, cliquez sur un jour disponible, puis sélectionnez l’heure qui vous convient.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 text-sm">
              <p className="font-black text-slate-700">Légende</p>

              <div className="mt-3 flex flex-wrap gap-3 text-xs font-black">
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  Disponible
                </span>

                <span className="flex items-center gap-1 text-red-600">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  Réservé
                </span>
              </div>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#1B4F59]">
                <UserRound size={20} />
                Informations client
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  label="Nom *"
                  name="nom_client"
                  value={form.nom_client}
                  onChange={handleChange}
                  required
                  placeholder="Votre nom"
                />

                <InputField
                  label="Prénom"
                  name="prenom_client"
                  value={form.prenom_client}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                />

                <InputField
                  label="Téléphone *"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  required
                  placeholder="0550 00 00 00"
                />

                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="client@gmail.com"
                />
              </div>
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#1B4F59]">
                <Scissors size={20} />
                Service
              </h2>

              <select
                name="service_id"
                value={form.service_id}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FE5737] focus:ring-4 focus:ring-orange-100"
              >
                <option value="">Choisir un service</option>

                {loadingServices ? (
                  <option value="">Chargement...</option>
                ) : (
                  services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.nom} - {service.prix} DZD - {service.duree} min
                    </option>
                  ))
                )}
              </select>

              {selectedServiceInfo && (
                <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <p className="font-black text-[#1B4F59]">
                    {selectedServiceInfo.nom}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    Durée : {selectedServiceInfo.duree} min · Prix :{" "}
                    {selectedServiceInfo.prix} DZD
                  </p>
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#1B4F59]">
                <CalendarCheck size={20} />
                Choisir un jour
              </h2>

              {!form.service_id ? (
                <EmptyBox text="Choisissez d’abord un service pour afficher l’agenda." />
              ) : loadingDates ? (
                <LoadingBox text="Chargement des jours disponibles..." />
              ) : availableDates.length === 0 ? (
                <WarningBox text="Aucun jour disponible pour ce service." />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {availableDates.map((item) => {
                    const dateValue = cleanDate(item.date_creneau);
                    const totalDisponibles = Number(item.total_disponibles || 0);
                    const totalCreneaux = Number(item.total_creneaux || totalDisponibles);
                    const isSelected = form.date_rdv === dateValue;

                    return (
                      <button
                        type="button"
                        key={dateValue}
                        onClick={() => selectDate(dateValue)}
                        className={[
                          "rounded-3xl border p-4 text-left transition duration-200",
                          isSelected
                            ? "border-[#1B4F59] bg-[#1B4F59] text-white shadow-lg shadow-[#1B4F59]/20"
                            : "border-emerald-200 bg-emerald-50 text-slate-800 hover:-translate-y-1 hover:border-emerald-500 hover:bg-emerald-100",
                        ].join(" ")}
                      >
                        <p className="text-sm font-black capitalize">
                          {formatDateLabel(dateValue)}
                        </p>

                        <p
                          className={[
                            "mt-2 text-xs font-black",
                            isSelected ? "text-white/85" : "text-emerald-700",
                          ].join(" ")}
                        >
                          {totalDisponibles} disponible(s)
                        </p>

                        <p
                          className={[
                            "mt-1 text-[11px] font-bold",
                            isSelected ? "text-white/60" : "text-slate-400",
                          ].join(" ")}
                        >
                          {totalCreneaux} créneau(x)
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-lg font-black text-[#1B4F59]">
                  <Clock size={20} />
                  Choisir une heure
                </h2>

                {form.date_rdv && (
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black capitalize text-slate-600">
                    {formatLongDate(form.date_rdv)}
                  </span>
                )}
              </div>

              {!form.service_id || !form.date_rdv ? (
                <EmptyBox text="Cliquez sur un jour pour voir les rendez-vous disponibles." />
              ) : loadingCreneaux ? (
                <LoadingBox text="Chargement des heures du jour..." />
              ) : creneaux.length === 0 ? (
                <WarningBox text="Aucun créneau disponible pour ce jour." />
              ) : (
                <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {creneaux.map((creneau) => {
                      const isDisponible = creneau.statut === "disponible";
                      const isSelected = form.creneau_id === String(creneau.id);

                      return (
                        <button
                          type="button"
                          key={creneau.id}
                          disabled={!isDisponible}
                          onClick={() => selectCreneau(creneau)}
                          className={[
                            "rounded-2xl border px-4 py-4 text-sm font-black transition duration-200",
                            isDisponible && !isSelected
                              ? "border-emerald-200 bg-white text-emerald-700 hover:-translate-y-1 hover:border-emerald-500 hover:bg-emerald-50"
                              : "",
                            isSelected
                              ? "border-[#FE5737] bg-[#FE5737] text-white shadow-lg shadow-orange-500/20"
                              : "",
                            !isDisponible
                              ? "cursor-not-allowed border-red-200 bg-red-50 text-red-500 opacity-80"
                              : "",
                          ].join(" ")}
                        >
                          <span className="flex items-center justify-center gap-2">
                            {isDisponible ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <Lock size={16} />
                            )}

                            {cleanHour(creneau.heure_creneau)}
                          </span>

                          <span className="mt-1 block text-[11px] uppercase tracking-wide">
                            {isDisponible ? "Disponible" : "Réservé"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Note
              </label>

              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FE5737] focus:ring-4 focus:ring-orange-100"
                placeholder="Ex : coupe simple, barbe, préférence..."
              />
            </div>

            <button
              type="submit"
              disabled={loadingSubmit || !form.creneau_id}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FE5737] px-6 py-4 font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingSubmit ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Réservation...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Confirmer la réservation
                </>
              )}
            </button>
          </form>
        </div>

        <aside className="h-fit rounded-[34px] bg-[#1B4F59] p-7 text-white shadow-sm lg:sticky lg:top-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <CalendarCheck size={28} />
          </div>

          <h2 className="mt-6 text-2xl font-black">Résumé</h2>

          <div className="mt-6 space-y-4">
            <SummaryItem
              label="Service"
              value={selectedServiceInfo ? selectedServiceInfo.nom : "Non choisi"}
            />

            <SummaryItem
              label="Date"
              value={form.date_rdv ? formatLongDate(form.date_rdv) : "Non choisie"}
            />

            <SummaryItem
              label="Heure"
              value={
                selectedCreneauInfo
                  ? cleanHour(selectedCreneauInfo.heure_creneau)
                  : "Non choisie"
              }
            />

            <SummaryItem
              label="Prix"
              value={
                selectedServiceInfo
                  ? `${selectedServiceInfo.prix} DZD`
                  : "Non défini"
              }
            />
          </div>

          <div className="mt-8 rounded-3xl bg-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles size={22} />
              </div>

              <div>
                <p className="text-sm font-black">Fonctionnement</p>

                <p className="mt-1 text-xs leading-5 text-white/75">
                  Le client clique sur un jour, puis voit directement toutes les heures disponibles.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-white p-5 text-[#1B4F59]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#FE5737]">
                <Scissors size={22} />
              </div>

              <div>
                <p className="text-sm font-black">Salon professionnel</p>
                <p className="mt-1 text-xs text-slate-500">
                  Réservation simple, claire et rapide.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FE5737] focus:ring-4 focus:ring-orange-100"
        placeholder={placeholder}
      />
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">
      {text}
    </div>
  );
}

function LoadingBox({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
      <Loader2 className="animate-spin" size={17} />
      {text}
    </div>
  );
}

function WarningBox({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5 text-sm font-bold text-orange-700">
      {text}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/10 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-white/60">
        {label}
      </p>

      <p className="mt-2 text-sm font-black capitalize text-white">
        {value}
      </p>
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F6F8FA]">
          <Navbar />

          <div className="mx-auto max-w-7xl px-5 py-20">
            <div className="rounded-3xl bg-white p-8 text-center text-sm font-black text-slate-500 shadow-sm">
              Chargement de la réservation...
            </div>
          </div>
        </main>
      }
    >
      <ReservationContent />
    </Suspense>
  );
}