"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  ChevronRight,
  Clock,
  Crown,
  Diamond,
  Eye,
  Loader2,
  Quote,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ContactFooter from "@/components/ContactFooter";
import { serviceService } from "@/lib/serviceService";
import type { Service } from "@/lib/types";

const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

const goldBg =
  "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:4000";

function getServiceImage(service: Service): string {
  const image = service.image_url || service.image;

  if (!image) return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (image.startsWith("/uploads")) {
    return `${API_ORIGIN}${image}`;
  }

  return image;
}

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=90&w=2200",
    title: "L’Éclat du Prestige.",
    subtitle:
      "Plus qu’une coupe, une distinction. Découvrez l’excellence de la coiffure masculine dans un cadre luxueux.",
  },
  {
    src: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=90&w=2200",
    title: "L’Art du détail.",
    subtitle:
      "Des gestes précis, des produits premium et une expérience pensée pour l’homme moderne.",
  },
  {
    src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=90&w=2200",
    title: "Une expérience privée.",
    subtitle:
      "Un salon raffiné à Hydra, Alger, pour une image impeccable et une confiance absolue.",
  },
  {
    src: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&q=90&w=2200",
    title: "Votre fauteuil vous attend.",
    subtitle:
      "Réservez votre créneau en ligne et profitez d’un service sur-mesure dans une ambiance premium.",
  },
];

const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.21, 0.45, 0.32, 0.9],
    },
  },
};

const staggerContainer = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

function getServiceIcon(index: number) {
  const icons = [
    <Scissors key="scissors" className="h-6 w-6" />,
    <Sparkles key="sparkles" className="h-6 w-6" />,
    <Crown key="crown" className="h-6 w-6" />,
    <Diamond key="diamond" className="h-6 w-6" />,
  ];

  return icons[index % icons.length];
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -8 }}
      className="
        group rounded-3xl border p-8 backdrop-blur-sm transition-all
        border-slate-200 bg-white shadow-sm hover:border-amber-400/50 hover:bg-amber-50
        dark:border-white/5 dark:bg-white/5 dark:hover:border-[#F59E0B]/40 dark:hover:bg-white/10
      "
    >
      <div className="mb-6 inline-flex rounded-2xl bg-[#F59E0B]/10 p-4 text-[#F59E0B] transition-transform group-hover:scale-110 dark:text-[#FBBF24]">
        {icon}
      </div>

      <h3 className="mb-3 text-xl font-bold text-slate-950 dark:text-white">
        {title}
      </h3>

      <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-400">
        {description}
      </p>
    </motion.div>
  );
}

function TestimonialCard({
  name,
  role,
  content,
  rating,
  image,
}: {
  name: string;
  role: string;
  content: string;
  rating: number;
  image: string;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -5 }}
      className="
        relative rounded-3xl border p-8 backdrop-blur-sm
        border-slate-200 bg-white shadow-sm
        dark:border-white/5 dark:bg-gradient-to-br dark:from-white/5 dark:to-transparent
      "
    >
      <Quote className="absolute right-6 top-6 h-12 w-12 text-[#F59E0B]/20" />

      <div className="mb-6 flex items-center gap-4">
        <img
          src={image}
          alt={name}
          className="h-14 w-14 rounded-full object-cover ring-2 ring-[#F59E0B]/30"
        />

        <div>
          <h4 className="font-bold text-slate-950 dark:text-white">{name}</h4>
          <p className="text-xs text-slate-500 dark:text-gray-400">{role}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={
              i < rating
                ? "fill-[#FBBF24] text-[#FBBF24]"
                : "text-slate-300 dark:text-gray-600"
            }
          />
        ))}
      </div>

      <p className="relative z-10 text-sm italic leading-relaxed text-slate-600 dark:text-gray-300">
        “{content}”
      </p>
    </motion.div>
  );
}

function GalleryImage({
  src,
  alt,
  index,
}: {
  src: string;
  alt: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="group relative overflow-hidden rounded-2xl"
    >
      <img
        src={src}
        alt={alt}
        className="h-80 w-full object-cover transition duration-700 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

      <Eye className="absolute bottom-4 right-4 h-6 w-6 text-white opacity-0 transition duration-300 group-hover:opacity-100" />
    </motion.div>
  );
}

function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = heroImages[activeIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroImages.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      className="
        relative min-h-screen overflow-hidden px-6
        bg-white pt-36 dark:bg-[#050505] md:pt-40 lg:pt-44
      "
    >
      <div
        className="
          relative mx-auto flex min-h-[720px] max-w-7xl items-center overflow-hidden rounded-[64px] border shadow-2xl
          border-slate-200 bg-white
          dark:border-white/10 dark:bg-black
        "
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={current.src}
            src={current.src}
            alt={current.title}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/10 dark:from-black dark:via-black/75 dark:to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(251,191,36,0.18),transparent_35%)]" />

        <div className="relative z-10 w-full px-8 py-16 md:px-14 lg:px-20">
          <div className="max-w-4xl">
            <motion.div
              key={`badge-${activeIndex}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="
                mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px]
                font-black uppercase tracking-[0.25em] backdrop-blur-md
                border-amber-500/30 bg-white/75 text-amber-700
                dark:bg-black/40 dark:text-amber-400
              "
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FBBF24] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FBBF24]" />
              </span>
              Ouvert à Hydra • Alger
            </motion.div>

            <motion.h1
              key={`title-${activeIndex}`}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="font-serif text-6xl font-light leading-[1.05] text-slate-950 dark:text-white sm:text-7xl lg:text-[8rem]"
            >
              {current.title.includes("Prestige") ? (
                <>
                  L’Éclat du <br />
                  <span className={`font-extralight italic ${goldText}`}>
                    Prestige.
                  </span>
                </>
              ) : (
                <>
                  {current.title.split(" ").slice(0, -1).join(" ")} <br />
                  <span className={`font-extralight italic ${goldText}`}>
                    {current.title.split(" ").slice(-1)}
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p
              key={`subtitle-${activeIndex}`}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08 }}
              className="mt-8 max-w-2xl text-base font-light leading-relaxed text-slate-600 dark:text-gray-300 sm:text-xl"
            >
              {current.subtitle}
            </motion.p>

            <motion.div
              key={`buttons-${activeIndex}`}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.16 }}
              className="mt-12 flex flex-col gap-5 sm:flex-row"
            >
              <Link
                href="/reservation"
                className={`group inline-flex items-center justify-center gap-4 rounded-full px-10 py-5 text-[11px] font-black uppercase tracking-widest text-black shadow-2xl shadow-[#F59E0B]/20 transition-all hover:-translate-y-1 active:scale-95 ${goldBg}`}
              >
                Réserver mon fauteuil
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="#services"
                className="
                  inline-flex items-center justify-center gap-3 rounded-full border px-8 py-5 text-[11px]
                  font-black uppercase tracking-widest transition-all
                  border-slate-300 bg-white/60 text-slate-950 backdrop-blur-md hover:border-[#FBBF24] hover:text-[#B45309]
                  dark:border-white/20 dark:bg-black/30 dark:text-white dark:hover:border-[#FBBF24] dark:hover:text-[#FBBF24]
                "
              >
                <ShieldCheck size={16} />
                Découvrir
              </Link>
            </motion.div>
          </div>
        </div>

        <div
          className="
            absolute bottom-8 right-8 z-20 hidden rounded-3xl border p-5 backdrop-blur-md
            border-white/40 bg-white/75 shadow-xl
            dark:border-white/10 dark:bg-black/40
            md:block
          "
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
              <Crown size={26} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                Prestige
              </p>

              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Service privé & premium
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-8 z-20 flex items-center gap-2 md:left-14 lg:left-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${
                activeIndex === index
                  ? "w-12 bg-amber-500"
                  : "w-2 bg-slate-500/60 dark:bg-white/40"
              }`}
              aria-label={`Changer image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LuxuryGoldBarber() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        setLoadingServices(true);
        setServicesError(null);

        const response = await serviceService.getAll();

        if (!isMounted) return;

        if (!response.success) {
          setServicesError(
            response.message ||
              response.error ||
              "Impossible de charger les services."
          );
          setServices([]);
          return;
        }

        const activeServices = (response.data || []).filter(
          (service) => service.statut !== "inactif"
        );

        setServices(activeServices);
      } catch (error) {
        if (!isMounted) return;

        console.error("Erreur chargement services:", error);
        setServicesError("Erreur de connexion avec le serveur.");
        setServices([]);
      } finally {
        if (isMounted) {
          setLoadingServices(false);
        }
      }
    }

    loadServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredServices = useMemo(() => services.slice(0, 6), [services]);

  const values = [
    {
      icon: <Diamond size={24} />,
      title: "Savoir-faire d'exception",
      description:
        "Des barbiers formés aux techniques françaises et italiennes, maîtrisant l'art de la coupe et du rasage.",
    },
    {
      icon: <Award size={24} />,
      title: "Produits haut de gamme",
      description:
        "Sélection rigoureuse des meilleurs produits de coiffure et barbier, sans compromis sur la qualité.",
    },
    {
      icon: <Users size={24} />,
      title: "Service personnalisé",
      description:
        "Chaque client reçoit une attention unique, de l'accueil à la fin de la prestation.",
    },
  ];

  const testimonials = [
    {
      name: "Karim B.",
      role: "Chef d'entreprise",
      content:
        "Un lieu d'exception où le souci du détail est poussé à l'extrême. Je n'ai jamais eu une coupe aussi parfaite.",
      rating: 5,
      image: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      name: "Mehdi L.",
      role: "Avocat",
      content:
        "L'ambiance est feutrée, le personnel attentif. Le résultat est toujours à la hauteur de mes attentes.",
      rating: 5,
      image: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    {
      name: "Sofia R.",
      role: "Cliente régulière",
      content:
        "Je viens pour les soins du cuir chevelu. Un moment de détente absolu dans un cadre magnifique.",
      rating: 4,
      image: "https://randomuser.me/api/portraits/women/68.jpg",
    },
  ];

  const galleryImages = [
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1621799754526-a0d52c49fad5?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800",
  ];

  return (
    <main
      className="
        min-h-screen overflow-x-hidden selection:bg-[#FBBF24] selection:text-black
        bg-white text-slate-950
        dark:bg-[#050505] dark:text-white
      "
    >
      <Navbar />

      <HeroSlider />

      <section className="relative z-10 -mt-10 px-6 md:-mt-14">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-6 md:grid-cols-3"
          >
            {values.map((value, i) => (
              <ValueCard key={i} {...value} />
            ))}
          </motion.div>
        </div>
      </section>

      <section
        id="services"
        className="bg-slate-50 py-32 dark:bg-[#0A0A0A] lg:py-48"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-24 grid items-end gap-16 lg:grid-cols-2">
            <div>
              <span className="mb-4 block text-[11px] font-black uppercase tracking-[0.3em] text-[#B45309] dark:text-[#FBBF24]">
                Le Menu Privé
              </span>

              <h2 className="font-serif text-5xl font-light text-slate-950 dark:text-white sm:text-7xl">
                Expériences <br />
                <span className={`font-extralight italic ${goldText}`}>
                  Sur-mesure
                </span>
              </h2>
            </div>

            <p className="max-w-md pb-2 text-slate-600 dark:text-gray-500">
              Chaque détail est pensé pour l&apos;homme moderne. Nos services
              sont chargés directement depuis votre système de réservation.
            </p>
          </div>

          {loadingServices && (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[40px] border border-slate-200 bg-white p-10 text-center dark:border-white/5 dark:bg-white/[0.03]">
              <Loader2 className="mb-5 h-10 w-10 animate-spin text-[#FBBF24]" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                Chargement des services...
              </p>
            </div>
          )}

          {!loadingServices && servicesError && (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[40px] border border-red-500/20 bg-red-500/5 p-10 text-center">
              <AlertCircle className="mb-5 h-10 w-10 text-red-400" />

              <h3 className="mb-2 text-xl font-bold text-slate-950 dark:text-white">
                Services indisponibles
              </h3>

              <p className="max-w-md text-sm text-slate-600 dark:text-gray-400">
                {servicesError}
              </p>
            </div>
          )}

          {!loadingServices &&
            !servicesError &&
            featuredServices.length === 0 && (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[40px] border border-slate-200 bg-white p-10 text-center dark:border-white/5 dark:bg-white/[0.03]">
                <Scissors className="mb-5 h-10 w-10 text-[#FBBF24]" />

                <h3 className="mb-2 text-xl font-bold text-slate-950 dark:text-white">
                  Aucun service disponible
                </h3>

                <p className="max-w-md text-sm text-slate-600 dark:text-gray-400">
                  Ajoutez vos services depuis l&apos;administration pour les
                  afficher ici.
                </p>
              </div>
            )}

          {!loadingServices &&
            !servicesError &&
            featuredServices.length > 0 && (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {featuredServices.map((service, index) => {
                  const serviceImage = getServiceImage(service);

                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -10 }}
                      className="
                        group relative overflow-hidden rounded-[38px] border transition-all duration-500
                        border-slate-200 bg-white shadow-xl shadow-slate-200/70
                        hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-500/20
                        dark:border-white/10 dark:bg-[#101010] dark:shadow-none dark:hover:border-amber-400/50
                      "
                    >
                      <div className="relative h-64 overflow-hidden">
                        {serviceImage ? (
                          <img
                            src={serviceImage}
                            alt={service.nom}
                            className="
                              h-full w-full object-cover transition-all duration-700
                              group-hover:scale-110
                            "
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            className="
                              flex h-full w-full items-center justify-center
                              bg-gradient-to-br from-amber-50 via-white to-slate-100
                              dark:from-neutral-900 dark:via-black dark:to-neutral-800
                            "
                          >
                            <Scissors className="h-16 w-16 text-amber-400/60" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div
                          className="
                            absolute left-5 top-5 flex items-center gap-2 rounded-full border px-4 py-2
                            border-amber-400/40 bg-black/45 text-amber-300 backdrop-blur-md
                          "
                        >
                          <Crown size={14} />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            Prestige
                          </span>
                        </div>

                        <div
                          className="
                            absolute right-5 top-5 flex items-center gap-2 rounded-full px-4 py-2
                            bg-white/90 text-slate-900 shadow-lg backdrop-blur-md
                            dark:bg-black/60 dark:text-white
                          "
                        >
                          <Clock size={14} className="text-amber-500" />
                          <span className="text-xs font-black">
                            {service.duree} min
                          </span>
                        </div>

                        <div className="absolute bottom-5 left-5">
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
                            À partir de
                          </p>

                          <div className="mt-1 flex items-end gap-1">
                            <span className="text-3xl font-black text-white">
                              {Number(service.prix || 0).toLocaleString(
                                "fr-DZ"
                              )}
                            </span>

                            <span className="mb-1 text-sm font-bold text-amber-300">
                              DA
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative p-7">
                        <div className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

                        <div className="mb-3 flex items-center gap-2">
                          <Sparkles size={15} className="text-amber-500" />

                          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                            Service Signature
                          </span>
                        </div>

                        <h3 className="font-serif text-3xl font-bold text-slate-950 transition group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-400">
                          {service.nom}
                        </h3>

                        <p className="mt-4 min-h-[72px] text-sm leading-relaxed text-slate-600 dark:text-gray-400">
                          {service.description ||
                            "Service premium réalisé avec précision, élégance et soin professionnel."}
                        </p>

                        <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-5 dark:border-white/10">
                          <div className="flex items-center gap-3">
                            <div
                              className="
                                flex h-11 w-11 items-center justify-center rounded-2xl
                                bg-amber-500/10 text-amber-600 dark:text-amber-400
                              "
                            >
                              {getServiceIcon(index)}
                            </div>

                            <div>
                              <p className="text-xs font-bold text-slate-500 dark:text-gray-500">
                                Disponibilité
                              </p>

                              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                Disponible
                              </p>
                            </div>
                          </div>

                          <Link
                            href={`/reservation?service=${service.id}`}
                            className={`
                              inline-flex items-center gap-2 rounded-full px-5 py-3
                              text-[10px] font-black uppercase tracking-widest text-black
                              transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/30
                              ${goldBg}
                            `}
                          >
                            Réserver
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>

                      <div
                        className="
                          pointer-events-none absolute inset-0 rounded-[38px] opacity-0 transition-opacity duration-500
                          group-hover:opacity-100
                        "
                      >
                        <div className="absolute inset-0 rounded-[38px] shadow-[inset_0_0_55px_rgba(251,191,36,0.18)]" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

          {!loadingServices && !servicesError && services.length > 6 && (
            <div className="mt-14 flex justify-center">
              <Link
                href="/services"
                className="rounded-full border border-slate-300 px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-950 transition-all hover:border-[#FBBF24] hover:text-[#B45309] dark:border-white/10 dark:text-white dark:hover:border-[#FBBF24] dark:hover:text-[#FBBF24]"
              >
                Voir tous les services
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-32 dark:bg-[#050505]">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <span className="mb-4 block text-[11px] font-black uppercase tracking-[0.3em] text-[#B45309] dark:text-[#FBBF24]">
              Notre Art en Images
            </span>

            <h2 className="font-serif text-4xl font-light text-slate-950 dark:text-white sm:text-6xl">
              L&apos;Élégance <span className={goldText}>capturée</span>
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((src, i) => (
              <GalleryImage
                key={i}
                src={src}
                alt={`Galerie ${i + 1}`}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-32 dark:bg-[#0A0A0A]">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <span className="mb-4 block text-[11px] font-black uppercase tracking-[0.3em] text-[#B45309] dark:text-[#FBBF24]">
              Ils parlent de nous
            </span>

            <h2 className="font-serif text-4xl font-light text-slate-950 dark:text-white sm:text-6xl">
              Ce que nos <span className={goldText}>clients</span> disent
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-32 dark:bg-[#050505]">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=2000"
            className="h-full w-full object-cover opacity-10 blur-sm dark:opacity-20"
            alt=""
          />
        </div>

        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="mx-auto mb-6 h-12 w-12 text-[#FBBF24]" />

            <h2 className="font-serif text-4xl font-light text-slate-950 dark:text-white sm:text-6xl">
              Prêt à rejoindre l&apos;excellence ?
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-slate-600 dark:text-gray-400">
              Offrez-vous une expérience unique dans notre salon privé.
              Réservation recommandée.
            </p>

            <Link
              href="/reservation"
              className={`mt-10 inline-flex items-center gap-3 rounded-full px-10 py-5 text-[11px] font-black uppercase tracking-widest text-black transition-all hover:-translate-y-1 ${goldBg}`}
            >
              Réserver ma place <ChevronRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      <ContactFooter />
    </main>
  );
}