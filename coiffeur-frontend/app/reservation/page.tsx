"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ChangeEventHandler,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronRight,
  Crown,
  Gift,
  X,
} from "lucide-react";

const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

const goldBg = "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";

function cleanDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
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

  return new Date(year, month - 1, day).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatLongDate(dateValue: string) {
  const clean = cleanDate(dateValue);
  if (!clean) return "-";

  const [year, month, day] = clean.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function SuccessModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="
              relative mx-4 max-w-lg rounded-[48px] border p-10 text-center backdrop-blur-2xl
              border-amber-500/30 bg-white text-slate-950 shadow-[0_0_80px_rgba(245,158,11,0.18)]
              dark:bg-black/90 dark:text-white dark:shadow-[0_0_80px_rgba(251,191,36,0.2)]
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 ring-4 ring-amber-500/40">
              <CheckCircle2
                size={44}
                className="text-amber-500 dark:text-amber-400"
              />
            </div>

            <h2 className="font-serif text-4xl font-light text-slate-950 dark:text-white md:text-5xl">
              Demande <span className={`italic ${goldText}`}>envoyée</span>
            </h2>

            <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-gray-300">
              Votre créneau a bien été réservé et est temporairement bloqué.
              <br />
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Vous recevrez une confirmation définitive par téléphone / email
                une fois validée par le coiffeur.
              </span>
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-500 dark:text-gray-400">
              <Sparkles
                size={16}
                className="text-amber-500 dark:text-amber-400"
              />
              Merci pour votre confiance
              <Sparkles
                size={16}
                className="text-amber-500 dark:text-amber-400"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-[11px] font-black uppercase tracking-widest text-black transition-transform hover:scale-[1.02] ${goldBg}`}
            >
              <CheckCircle2 size={16} />
              Compris, merci !
            </button>

            <button
              type="button"
              onClick={onClose}
              className="
                absolute right-5 top-5 rounded-full p-1.5 transition-colors
                text-slate-500 hover:bg-slate-100 hover:text-slate-900
                dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-white
              "
            >
              <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
  const [showSuccess, setShowSuccess] = useState(false);

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

    try {
      const res = await serviceService.getAll();

      if (res.success && res.data) {
        setServices(res.data.filter((s) => s.statut !== "inactif"));
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Erreur chargement services:", error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }

  async function loadAvailableDates(serviceId: string) {
    if (!serviceId) {
      setAvailableDates([]);
      return;
    }

    setLoadingDates(true);

    try {
      const res = await creneauService.getAvailableDates({
        service_id: serviceId,
      });

      if (res.success && res.data) {
        setAvailableDates(res.data);
      } else {
        setAvailableDates([]);
      }
    } catch (error) {
      console.error("Erreur chargement dates:", error);
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  }

  async function loadCreneaux(serviceId: string, date: string) {
    if (!serviceId || !date) {
      setCreneaux([]);
      return;
    }

    setLoadingCreneaux(true);

    try {
      const res = await creneauService.getPublic({
        service_id: serviceId,
        date,
      });

      if (res.success && res.data) {
        setCreneaux(res.data);
      } else {
        setCreneaux([]);
      }
    } catch (error) {
      console.error("Erreur chargement créneaux:", error);
      setCreneaux([]);
    } finally {
      setLoadingCreneaux(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      setForm((prev) => ({ ...prev, service_id: selectedService }));
    }
  }, [selectedService]);

  useEffect(() => {
    loadAvailableDates(form.service_id);
  }, [form.service_id]);

  useEffect(() => {
    loadCreneaux(form.service_id, form.date_rdv);
  }, [form.service_id, form.date_rdv]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setMessage("");

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "service_id" ? { date_rdv: "", creneau_id: "" } : {}),
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

    try {
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
        setShowSuccess(true);

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
    } catch (error) {
      console.error("Erreur réservation:", error);
      setMessage("❌ Erreur lors de la réservation.");
    } finally {
      setLoadingSubmit(false);
    }
  }

  const selectedServiceInfo = useMemo(
    () => services.find((s) => String(s.id) === String(form.service_id)),
    [services, form.service_id]
  );

  const selectedCreneauInfo = useMemo(
    () => creneaux.find((c) => String(c.id) === String(form.creneau_id)),
    [creneaux, form.creneau_id]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <main
      className="
        min-h-screen selection:bg-amber-500/30
        bg-white text-slate-950
        dark:bg-black dark:text-white
      "
    >
      <Navbar />

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="
            absolute inset-0
            bg-gradient-to-br from-white via-slate-50 to-amber-50
            dark:from-black dark:via-[#0a0a0a] dark:to-[#1a0a00]
          "
        />

        <motion.div
          animate={{ x: ["0%", "100%", "0%"], y: ["0%", "50%", "0%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="
            absolute left-0 top-0 h-[80%] w-[80%] rounded-full blur-[150px]
            bg-amber-400/20
            dark:bg-amber-500/10
          "
        />

        <motion.div
          animate={{ x: ["100%", "0%", "100%"], y: ["100%", "0%", "100%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="
            absolute bottom-0 right-0 h-[60%] w-[60%] rounded-full blur-[130px]
            bg-orange-300/20
            dark:bg-purple-600/10
          "
        />
      </div>

      <section className="relative mx-auto max-w-7xl px-6 pt-36 pb-12 md:pt-40 lg:pt-44 lg:pb-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid gap-10 lg:grid-cols-[1fr_400px]"
        >
          <motion.div
            variants={itemVariants}
            className="
              rounded-[48px] border p-6 shadow-2xl backdrop-blur-xl md:p-10
              border-slate-200 bg-white/80
              dark:border-white/10 dark:bg-white/5
            "
          >
            <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 md:flex-row md:items-center md:justify-between dark:border-white/10">
              <div>
                <div
                  className="
                    mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md
                    border-amber-500/30 bg-white/70 text-amber-700
                    dark:bg-black/40 dark:text-amber-400
                  "
                >
                  <CalendarCheck size={14} />
                  Réservation exclusive
                </div>

                <h1 className="font-serif text-4xl font-light tracking-tight text-slate-950 dark:text-white md:text-5xl">
                  Votre{" "}
                  <span className={`italic font-extralight ${goldText}`}>
                    Fauteuil
                  </span>
                </h1>

                <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-gray-400">
                  Choisissez votre service, une date et l&apos;heure qui vous
                  convient.
                </p>
              </div>

              <div
                className="
                  rounded-2xl border p-4 backdrop-blur-sm
                  border-slate-200 bg-white/70
                  dark:border-white/10 dark:bg-black/30
                "
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Légende
                </p>

                <div className="mt-2 flex gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Disponible
                  </span>

                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Réservé
                  </span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="
                    mt-6 rounded-2xl border px-5 py-4 text-sm font-semibold backdrop-blur
                    border-red-500/20 bg-red-500/10 text-red-600
                    dark:text-red-400
                  "
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="mt-8 space-y-10">
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  <UserRound size={16} /> Coordonnées
                </h2>

                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    label="Nom *"
                    name="nom_client"
                    value={form.nom_client}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    required
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
                    placeholder="0550 00 00 00"
                    required
                  />

                  <InputField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="client@exemple.com"
                  />
                </div>
              </div>

              <div>
                <h2 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  <Scissors size={16} /> Prestation
                </h2>

                <select
                  name="service_id"
                  value={form.service_id}
                  onChange={handleChange}
                  required
                  className="
                    w-full rounded-2xl border px-5 py-4 text-sm outline-none backdrop-blur transition
                    border-slate-200 bg-white text-slate-950
                    focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                    dark:border-white/10 dark:bg-black/40 dark:text-white
                  "
                >
                  <option value="">Choisir un service</option>

                  {loadingServices ? (
                    <option disabled>Chargement...</option>
                  ) : (
                    services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nom} - {s.prix} DZD ({s.duree} min)
                      </option>
                    ))
                  )}
                </select>

                {selectedServiceInfo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="
                      mt-4 rounded-2xl border p-5 backdrop-blur
                      border-amber-500/20 bg-amber-50/70
                      dark:bg-black/40
                    "
                  >
                    <p className="font-serif text-lg text-slate-950 dark:text-white">
                      {selectedServiceInfo.nom}
                    </p>

                    <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
                      Durée : {selectedServiceInfo.duree} min · Prix :{" "}
                      <span className={goldText}>
                        {selectedServiceInfo.prix} DZD
                      </span>
                    </p>
                  </motion.div>
                )}
              </div>

              <div>
                <h2 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  <CalendarCheck size={16} /> Jour
                </h2>

                {!form.service_id ? (
                  <EmptyBox text="Choisissez d'abord un service" />
                ) : loadingDates ? (
                  <LoadingBox text="Chargement des disponibilités..." />
                ) : availableDates.length === 0 ? (
                  <WarningBox text="Aucun jour disponible pour ce service." />
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {availableDates.map((item) => {
                      const dateValue = cleanDate(item.date_creneau);
                      const totalDisponibles = Number(
                        item.total_disponibles || 0
                      );
                      const isSelected = form.date_rdv === dateValue;

                      return (
                        <button
                          type="button"
                          key={dateValue}
                          onClick={() => selectDate(dateValue)}
                          className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                            isSelected
                              ? `${goldBg} border-amber-500 text-black shadow-lg shadow-amber-500/20 scale-[1.02]`
                              : "border-slate-200 bg-white text-slate-950 hover:-translate-y-1 hover:border-amber-500/50 dark:border-white/10 dark:bg-black/40 dark:text-white"
                          }`}
                        >
                          <p className="text-sm font-bold capitalize">
                            {formatDateLabel(dateValue)}
                          </p>

                          <p
                            className={`mt-2 text-xs font-bold ${
                              isSelected
                                ? "text-black/80"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {totalDisponibles} dispo.
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                    <Clock size={16} /> Horaire
                  </h2>

                  {form.date_rdv && (
                    <span
                      className="
                        rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur
                        border-slate-200 bg-white text-slate-600
                        dark:border-white/10 dark:bg-black/40 dark:text-gray-300
                      "
                    >
                      {formatLongDate(form.date_rdv)}
                    </span>
                  )}
                </div>

                {!form.service_id || !form.date_rdv ? (
                  <EmptyBox text="Sélectionnez un jour pour voir les heures disponibles." />
                ) : loadingCreneaux ? (
                  <LoadingBox text="Chargement des horaires..." />
                ) : creneaux.length === 0 ? (
                  <WarningBox text="Aucun créneau disponible pour cette date." />
                ) : (
                  <div
                    className="
                      rounded-2xl border p-5 backdrop-blur
                      border-slate-200 bg-white/80
                      dark:border-white/10 dark:bg-black/40
                    "
                  >
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {creneaux.map((creneau) => {
                        const disponible = creneau.statut === "disponible";
                        const isSelected =
                          form.creneau_id === String(creneau.id);

                        return (
                          <button
                            type="button"
                            key={creneau.id}
                            disabled={!disponible}
                            onClick={() => selectCreneau(creneau)}
                            className={`rounded-xl border px-4 py-3 text-center font-bold transition-all duration-300 ${
                              disponible && !isSelected
                                ? "border-amber-500/30 bg-white text-amber-700 hover:-translate-y-1 hover:border-amber-500/70 hover:bg-amber-50 dark:bg-black/30 dark:text-amber-400 dark:hover:bg-white/5"
                                : ""
                            } ${
                              isSelected
                                ? `${goldBg} border-amber-500 text-black shadow-lg shadow-amber-500/20`
                                : ""
                            } ${
                              !disponible
                                ? "cursor-not-allowed border-red-500/30 bg-red-500/10 text-red-500 opacity-70 dark:text-red-400"
                                : ""
                            }`}
                          >
                            <span className="flex items-center justify-center gap-1">
                              {disponible ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <Lock size={14} />
                              )}
                              {cleanHour(creneau.heure_creneau)}
                            </span>

                            <span className="mt-1 block text-[9px] uppercase">
                              {disponible ? "Disponible" : "Réservé"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  Note spéciale
                </label>

                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows={3}
                  className="
                    w-full rounded-2xl border px-5 py-4 text-sm outline-none backdrop-blur transition
                    border-slate-200 bg-white text-slate-950 placeholder:text-slate-400
                    focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                    dark:border-white/10 dark:bg-black/40 dark:text-white dark:placeholder:text-gray-500
                  "
                  placeholder="Indiquez vos préférences (coupe, barbe, soin...)"
                />
              </div>

              <motion.button
                type="submit"
                disabled={loadingSubmit || !form.creneau_id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group flex w-full items-center justify-center gap-3 rounded-full px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black transition-all disabled:cursor-not-allowed disabled:opacity-50 ${goldBg}`}
              >
                {loadingSubmit ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Réservation en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Confirmer ma réservation
                    <ChevronRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          <motion.aside variants={itemVariants} className="space-y-6">
            <div
              className="
                sticky top-24 rounded-[48px] border p-7 shadow-2xl backdrop-blur-xl
                border-amber-500/20 bg-white/80
                dark:bg-black/60
              "
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
                <Crown size={28} />
              </div>

              <h2 className="mt-6 font-serif text-3xl font-light text-slate-950 dark:text-white">
                Récapitulatif
              </h2>

              <div className="mt-6 space-y-4">
                <SummaryItem
                  label="Service"
                  value={selectedServiceInfo?.nom || "Non choisi"}
                />

                <SummaryItem
                  label="Date"
                  value={
                    form.date_rdv
                      ? formatLongDate(form.date_rdv)
                      : "Non choisie"
                  }
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
                      : "---"
                  }
                />
              </div>

              <InfoCard
                icon={<Gift size={20} />}
                title="Cadeau de bienvenue"
                text="Offert pour toute première réservation : soin du cuir chevelu."
              />

              <InfoCard
                icon={<Sparkles size={20} />}
                title="Excellence garantie"
                text="Nos barbiers sont formés aux standards internationaux."
              />
            </div>
          </motion.aside>
        </motion.div>
      </section>

      <SuccessModal open={showSuccess} onClose={() => setShowSuccess(false)} />
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
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="
          w-full rounded-2xl border px-5 py-4 text-sm outline-none backdrop-blur transition
          border-slate-200 bg-white text-slate-950 placeholder:text-slate-400
          focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
          dark:border-white/10 dark:bg-black/40 dark:text-white dark:placeholder:text-gray-500
        "
        placeholder={placeholder}
      />
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div
      className="
        rounded-2xl border border-dashed p-6 text-center text-sm backdrop-blur
        border-slate-300 bg-white/70 text-slate-500
        dark:border-white/20 dark:bg-black/30 dark:text-gray-400
      "
    >
      {text}
    </div>
  );
}

function LoadingBox({ text }: { text: string }) {
  return (
    <div
      className="
        flex items-center justify-center gap-3 rounded-2xl border p-6 text-sm backdrop-blur
        border-slate-200 bg-white/70 text-amber-600
        dark:border-white/10 dark:bg-black/30 dark:text-amber-400
      "
    >
      <Loader2 className="animate-spin" size={18} />
      {text}
    </div>
  );
}

function WarningBox({ text }: { text: string }) {
  return (
    <div
      className="
        rounded-2xl border p-6 text-center text-sm backdrop-blur
        border-red-500/20 bg-red-500/10 text-red-600
        dark:text-red-400
      "
    >
      {text}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  const isPlaceholder =
    value === "Non choisi" || value === "Non choisie" || value === "---";

  return (
    <div
      className="
        rounded-2xl border p-4 backdrop-blur
        border-slate-200 bg-white/70
        dark:border-white/10 dark:bg-black/30
      "
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-medium ${
          isPlaceholder
            ? "text-slate-400 dark:text-gray-500"
            : "text-slate-950 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      className="
        mt-4 rounded-2xl border p-5
        border-amber-500/20 bg-amber-50/70
        dark:bg-amber-500/5
      "
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 text-amber-500 dark:text-amber-400">
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-slate-950 dark:text-white">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-600 dark:text-gray-400">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
          <Navbar />

          <div className="mx-auto max-w-7xl px-6 pt-36 text-center md:pt-40 lg:pt-44">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-amber-500" />

            <p className="text-slate-600 dark:text-gray-400">
              Chargement de l&apos;espace réservation...
            </p>
          </div>
        </main>
      }
    >
      <ReservationContent />
    </Suspense>
  );
}