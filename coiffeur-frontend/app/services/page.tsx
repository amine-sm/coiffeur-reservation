"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  ChevronRight,
  Crown,
  Diamond,
  Filter,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import ServiceCard from "@/components/ServiceCard";
import { serviceService } from "@/lib/serviceService";
import type { Service } from "@/lib/types";

const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

const goldBg =
  "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=90&w=2200",
    title: "Nos Services Signature",
    subtitle:
      "Des prestations d’exception pensées pour révéler votre élégance avec précision, confort et raffinement.",
  },
  {
    src: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=90&w=2200",
    title: "L’Art de la Coupe",
    subtitle:
      "Chaque détail est travaillé avec soin pour offrir une expérience premium digne d’un salon privé.",
  },
  {
    src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=90&w=2200",
    title: "Prestige & Savoir-faire",
    subtitle:
      "Coiffure, barbe et soins réalisés avec des produits sélectionnés pour un résultat élégant et durable.",
  },
  {
    src: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&q=90&w=2200",
    title: "Votre Moment Premium",
    subtitle:
      "Choisissez votre service et réservez votre fauteuil dans un espace luxueux, calme et professionnel.",
  },
];

/*
  IMPORTANT :
  Ne pas utiliser Math.random() directement dans le JSX avec Next.js.
  Sinon tu peux avoir une erreur hydration.
*/
const particles = [
  { top: "8%", left: "12%", opacity: 0.18 },
  { top: "14%", left: "78%", opacity: 0.25 },
  { top: "22%", left: "34%", opacity: 0.2 },
  { top: "28%", left: "91%", opacity: 0.28 },
  { top: "36%", left: "15%", opacity: 0.22 },
  { top: "44%", left: "65%", opacity: 0.18 },
  { top: "52%", left: "42%", opacity: 0.3 },
  { top: "60%", left: "88%", opacity: 0.2 },
  { top: "68%", left: "22%", opacity: 0.26 },
  { top: "74%", left: "55%", opacity: 0.18 },
  { top: "82%", left: "9%", opacity: 0.22 },
  { top: "88%", left: "72%", opacity: 0.3 },
  { top: "92%", left: "38%", opacity: 0.16 },
];

function ServicesHeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = heroImages[activeIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroImages.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative z-10 overflow-hidden px-6 pt-36 md:pt-40 lg:pt-44">
      <div
        className="
          relative mx-auto min-h-[520px] max-w-7xl overflow-hidden rounded-[60px] border shadow-2xl
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
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/10 dark:from-black dark:via-black/75 dark:to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(251,191,36,0.18),transparent_35%)]" />

        <div className="relative z-10 flex min-h-[520px] items-center">
          <div className="max-w-4xl px-8 py-14 md:px-14 lg:px-16">
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
              <Crown size={14} />
              L&apos;Art de la Distinction
            </motion.div>

            <motion.h1
              key={`title-${activeIndex}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="font-serif text-5xl font-light leading-[1.02] text-slate-950 dark:text-white md:text-7xl lg:text-8xl"
            >
              {current.title.split(" ").slice(0, -1).join(" ")}{" "}
              <br />
              <span className={`italic ${goldText}`}>
                {current.title.split(" ").slice(-1)}
              </span>
            </motion.h1>

            <motion.p
              key={`subtitle-${activeIndex}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08 }}
              className="mt-7 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-gray-300 md:text-lg"
            >
              {current.subtitle}
            </motion.p>

            <motion.div
              key={`actions-${activeIndex}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.16 }}
              className="mt-9 flex flex-col gap-4 sm:flex-row"
            >
              <a
                href="#services-list"
                className={`inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-[11px] font-black uppercase tracking-widest text-black shadow-xl shadow-amber-500/20 transition hover:-translate-y-1 ${goldBg}`}
              >
                Voir les prestations
                <ChevronRight size={16} />
              </a>

              <Link
                href="/reservation"
                className="
                  inline-flex items-center justify-center gap-3 rounded-full border px-8 py-4 text-[11px]
                  font-black uppercase tracking-widest transition-all
                  border-slate-300 bg-white/60 text-slate-950 backdrop-blur-md hover:border-amber-500 hover:text-amber-700
                  dark:border-white/20 dark:bg-black/30 dark:text-white dark:hover:border-amber-400 dark:hover:text-amber-400
                "
              >
                <ShieldCheck size={16} />
                Réserver
              </Link>
            </motion.div>
          </div>
        </div>

        <div
          className="
            absolute bottom-6 right-6 z-20 hidden rounded-3xl border p-4 backdrop-blur-md
            border-white/40 bg-white/75 shadow-xl
            dark:border-white/10 dark:bg-black/40
            md:block
          "
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
              <Star size={22} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
                Premium
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Services sur-mesure
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 left-8 z-20 flex items-center gap-2 md:left-14 lg:left-16">
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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);

  const categories = useMemo(() => {
    const cats = new Set(
      services
        .map((s) => s.categorie)
        .filter((value): value is string => Boolean(value))
    );

    return ["all", ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return services;

    return services.filter((s) => s.categorie === selectedCategory);
  }, [services, selectedCategory]);

  async function loadServices() {
    setLoading(true);

    try {
      const res = await serviceService.getAll();

      if (res.success && res.data) {
        setServices(res.data);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Erreur chargement services:", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  const { scrollYProgress } = useScroll({
    target: headerRef,
    offset: ["start start", "end start"],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.25]);

  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
      },
    },
  };

  return (
    <main
      className="
        min-h-screen overflow-x-hidden selection:bg-amber-500/30
        bg-white text-slate-950
        dark:bg-black dark:text-white
      "
    >
      <Navbar />

      {/* ========== ARRIÈRE-PLAN ========== */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className="
            absolute inset-0
            bg-gradient-to-br from-white via-slate-50 to-amber-50
            dark:from-black dark:via-[#0a0a0a] dark:to-[#1a0a00]
          "
        />

        <motion.div
          animate={{
            x: ["0%", "100%", "0%"],
            y: ["0%", "50%", "0%"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="
            absolute left-0 top-0 h-[80%] w-[80%] rounded-full blur-[150px]
            bg-amber-400/20
            dark:bg-amber-500/10
          "
        />

        <motion.div
          animate={{
            x: ["100%", "0%", "100%"],
            y: ["100%", "0%", "100%"],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="
            absolute bottom-0 right-0 h-[60%] w-[60%] rounded-full blur-[130px]
            bg-orange-300/20
            dark:bg-purple-600/10
          "
        />

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="
            absolute left-1/2 top-1/2 h-[90%] w-[90%]
            -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]
            bg-amber-300/10
            dark:bg-amber-400/5
          "
        />

        <div className="absolute inset-0 opacity-30">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="
                absolute h-0.5 w-0.5 rounded-full
                bg-amber-500/70
                dark:bg-white
              "
              style={{
                top: particle.top,
                left: particle.left,
                opacity: particle.opacity,
              }}
            />
          ))}
        </div>
      </div>

      {/* ========== HERO IMAGE QUI CHANGE SOUS NAVBAR ========== */}
      <ServicesHeroSlider />

      {/* ========== HEADER TEXTE ========== */}
      <section
        ref={headerRef}
        className="relative z-10 pb-16 pt-16"
      >
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            style={{ y: headerY, opacity: headerOpacity }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="
                mb-8 inline-flex items-center gap-2 rounded-full px-5 py-2
                border border-amber-500/30 bg-white/70 text-amber-700
                shadow-lg shadow-amber-500/10 backdrop-blur-md
                dark:bg-white/5 dark:text-amber-400
              "
            >
              <Sparkles
                size={14}
                className="text-amber-500 dark:text-amber-400"
              />

              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                L&apos;Art de la Distinction
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif text-6xl font-light leading-[0.95] tracking-tighter md:text-8xl"
            >
              <span className={goldText}>Nos Services</span>
              <br />
              <span className={`${goldText} font-extralight italic`}>
                Signature
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-8 flex items-start gap-4"
            >
              <div className="h-20 w-px bg-gradient-to-b from-amber-500/80 to-transparent" />

              <p className="max-w-xl text-xl font-light leading-relaxed text-slate-600 dark:text-gray-300">
                Des prestations d&apos;exception, pensées pour révéler votre
                élégance. Chaque détail est une œuvre d&apos;art.
              </p>
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 100 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 h-[2px] bg-gradient-to-r from-amber-500 to-transparent"
            />
          </motion.div>
        </div>
      </section>

      {/* ========== FILTRES ========== */}
      {!loading && services.length > 0 && (
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="
            sticky top-20 z-30 mx-auto max-w-7xl px-6 py-4 backdrop-blur-xl
            border-b border-slate-200 bg-white/70
            dark:border-white/5 dark:bg-black/50
          "
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-8 w-8 items-center justify-center rounded-full
                  bg-amber-500/10
                "
              >
                <Scissors
                  size={16}
                  className="text-amber-500 dark:text-amber-400"
                />
              </div>

              <span className="text-sm font-light text-slate-600 dark:text-gray-400">
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {filteredServices.length}
                </span>{" "}
                prestations d&apos;exception
              </span>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat}
                  type="button"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/30"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-amber-500/60 hover:bg-amber-50 hover:text-amber-700 dark:border-white/10 dark:bg-transparent dark:text-gray-400 dark:hover:border-amber-500/60 dark:hover:bg-white/5 dark:hover:text-amber-400"
                  }`}
                >
                  {cat === "all" ? "Tous les services" : cat}
                </motion.button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="
                flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition md:hidden
                border border-slate-300 bg-white text-slate-700 hover:border-amber-500
                dark:border-white/20 dark:bg-transparent dark:text-gray-300
              "
            >
              <Filter size={14} /> Filtrer
            </button>
          </div>
        </motion.div>
      )}

      {/* ========== GRILLE SERVICES ========== */}
      <section id="services-list" className="mx-auto max-w-7xl px-6 py-20 pb-32">
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="
                  relative h-[480px] overflow-hidden rounded-[40px] shadow-2xl
                  border border-slate-200 bg-white
                  dark:border-white/10 dark:bg-white/5
                "
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-transparent dark:from-white/5" />
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-200/70 to-transparent dark:via-white/10" />

                <div className="space-y-4 p-6">
                  <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
                  <div className="h-6 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                  <div className="h-20 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />

                  <div className="flex justify-between">
                    <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                    <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="
              flex flex-col items-center justify-center rounded-[60px] py-40 text-center backdrop-blur-sm
              border border-slate-200 bg-white/70
              dark:border-white/10 dark:bg-white/5
            "
          >
            <Diamond size={60} className="mb-6 text-amber-500/70" />

            <h3 className="mb-2 font-serif text-3xl text-slate-950 dark:text-white">
              Aucun service pour le moment
            </h3>

            <p className="max-w-md text-slate-600 dark:text-gray-400">
              Notre équipe prépare de nouvelles expériences exclusives. Revenez
              bientôt.
            </p>

            <Link
              href="/"
              className="
                mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 transition
                border border-amber-500/40 text-amber-700 hover:bg-amber-500/10
                dark:text-amber-400
              "
            >
              Retour à l&apos;accueil <ChevronRight size={16} />
            </Link>
          </motion.div>
        ) : filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-32 text-center"
          >
            <p className="text-lg text-slate-600 dark:text-gray-400">
              Aucun résultat pour la catégorie{" "}
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {selectedCategory}
              </span>
              .
            </p>

            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="mt-4 text-amber-600 underline-offset-4 hover:underline dark:text-amber-500"
            >
              Voir tous les services
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service) => (
                <motion.div
                  key={service.id}
                  variants={cardVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ y: -8 }}
                  className="group cursor-pointer"
                >
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* ========== CTA ========== */}
      {!loading && services.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-6 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="
              relative overflow-hidden rounded-[60px] p-12 text-center shadow-2xl
              border border-amber-500/20 bg-gradient-to-br from-amber-50 to-white
              dark:from-[#1a120b] dark:to-black
            "
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(251,191,36,0.12),transparent)]" />

            <Zap className="mx-auto mb-6 h-12 w-12 text-amber-500" />

            <h2 className="font-serif text-4xl font-light text-slate-950 dark:text-white md:text-6xl">
              Offrez-vous <span className={goldText}>l&apos;excellence</span>
            </h2>

            <p className="mx-auto mt-4 max-w-md text-slate-600 dark:text-gray-400">
              Réservation recommandée. Places limitées pour une expérience
              sur-mesure.
            </p>

            <Link
              href="/reservation"
              className={`mt-8 inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 hover:shadow-xl ${goldBg}`}
            >
              Réserver mon fauteuil <ChevronRight size={16} />
            </Link>
          </motion.div>
        </section>
      )}

      {/* ========== DRAWER MOBILE ========== */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-50 backdrop-blur-md md:hidden
              bg-white/80
              dark:bg-black/90
            "
            onClick={() => setFilterOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="
                absolute right-0 top-0 h-full w-80 p-6 shadow-2xl
                border-l border-slate-200 bg-white
                dark:border-amber-500/30 dark:bg-[#0a0a0a]
              "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Catégories
                </h3>

                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="
                    rounded-full p-2
                    bg-slate-100 text-slate-700 hover:bg-slate-200
                    dark:bg-white/5 dark:text-white dark:hover:bg-white/10
                  "
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setFilterOpen(false);
                    }}
                    className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                      selectedCategory === cat
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                    }`}
                  >
                    {cat === "all" ? "Tous les services" : cat}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}