"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import ContactFooter from "@/components/ContactFooter";
import ServiceCard from "@/components/ServiceCard";
import { serviceService } from "@/lib/serviceService";
import type { Service } from "@/lib/types";

const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

const goldBg =
  "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=75&w=1600",
    title: "Nos Services Signature",
    subtitle:
      "Des prestations d’exception pensées pour révéler votre élégance avec précision, confort et raffinement.",
  },
  {
    src: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=75&w=1600",
    title: "L’Art de la Coupe",
    subtitle:
      "Chaque détail est travaillé avec soin pour offrir une expérience premium digne d’un salon privé.",
  },
  {
    src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=75&w=1600",
    title: "Prestige & Savoir-faire",
    subtitle:
      "Coiffure, barbe et soins réalisés avec des produits sélectionnés pour un résultat élégant et durable.",
  },
  {
    src: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&q=75&w=1600",
    title: "Votre Moment Premium",
    subtitle:
      "Choisissez votre service et réservez votre fauteuil dans un espace luxueux, calme et professionnel.",
  },
];

function ServicesHeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = heroImages[activeIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroImages.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative z-10 overflow-hidden px-4 pt-28 sm:px-6 md:pt-36">
      <div
        className="
          relative mx-auto min-h-[430px] max-w-7xl overflow-hidden rounded-[34px]
          border border-slate-200 bg-white shadow-xl
          dark:border-white/10 dark:bg-black
          md:min-h-[520px] md:rounded-[52px]
        "
      >
        <img
          key={current.src}
          src={current.src}
          alt={current.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10 dark:from-black dark:via-black/75 dark:to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-black" />

        <div className="relative z-10 flex min-h-[430px] items-center md:min-h-[520px]">
          <div className="max-w-4xl px-6 py-12 md:px-14 lg:px-16">
            <div
              className="
                mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px]
                font-black uppercase tracking-[0.22em] backdrop-blur-md
                border-amber-500/30 bg-white/75 text-amber-700
                dark:bg-black/40 dark:text-amber-400
              "
            >
              <Crown size={14} />
              L&apos;Art de la Distinction
            </div>

            <h1 className="font-serif text-4xl font-light leading-[1.05] text-slate-950 dark:text-white sm:text-5xl md:text-7xl lg:text-8xl">
              {current.title.split(" ").slice(0, -1).join(" ")} <br />
              <span className={`italic ${goldText}`}>
                {current.title.split(" ").slice(-1)}
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-gray-300 md:text-lg">
              {current.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="#services-list"
                className={`inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-[11px] font-black uppercase tracking-widest text-black shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 ${goldBg}`}
              >
                Voir les prestations
                <ChevronRight size={16} />
              </a>

              <Link
                href="/reservation"
                className="
                  inline-flex items-center justify-center gap-3 rounded-full border px-8 py-4 text-[11px]
                  font-black uppercase tracking-widest transition
                  border-slate-300 bg-white/60 text-slate-950 backdrop-blur-md hover:border-amber-500 hover:text-amber-700
                  dark:border-white/20 dark:bg-black/30 dark:text-white dark:hover:border-amber-400 dark:hover:text-amber-400
                "
              >
                <ShieldCheck size={16} />
                Réserver
              </Link>
            </div>
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

        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 md:left-14">
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

  const categories = useMemo(() => {
    const cats = new Set(
      services
        .map((service) => service.categorie)
        .filter((value): value is string => Boolean(value))
    );

    return ["all", ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return services;

    return services.filter((service) => service.categorie === selectedCategory);
  }, [services, selectedCategory]);

  useEffect(() => {
    let mounted = true;

    async function loadServices() {
      try {
        setLoading(true);

        const res = await serviceService.getAll();

        if (!mounted) return;

        if (res.success && Array.isArray(res.data)) {
          setServices(res.data);
        } else {
          setServices([]);
        }
      } catch (error) {
        console.error("Erreur chargement services:", error);

        if (mounted) {
          setServices([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main
      className="
        min-h-screen overflow-x-hidden selection:bg-amber-500/30
        bg-white text-slate-950
        dark:bg-black dark:text-white
      "
    >
      <Navbar />

      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className="
            absolute inset-0
            bg-gradient-to-br from-white via-slate-50 to-amber-50
            dark:from-black dark:via-[#0a0a0a] dark:to-[#1a0a00]
          "
        />

        <div
          className="
            absolute left-[-20%] top-[-20%] h-[420px] w-[420px] rounded-full blur-[90px]
            bg-amber-400/20 dark:bg-amber-500/10
          "
        />

        <div
          className="
            absolute bottom-[-20%] right-[-20%] h-[420px] w-[420px] rounded-full blur-[90px]
            bg-orange-300/20 dark:bg-purple-600/10
          "
        />
      </div>

      <ServicesHeroSlider />

      {/* HEADER */}
      <section className="relative z-10 pb-14 pt-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div
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
            </div>

            <h1 className="font-serif text-5xl font-light leading-[1] tracking-tighter md:text-8xl">
              <span className={goldText}>Nos Services</span>
              <br />
              <span className={`${goldText} font-extralight italic`}>
                Signature
              </span>
            </h1>

            <div className="mt-8 flex items-start gap-4">
              <div className="h-20 w-px bg-gradient-to-b from-amber-500/80 to-transparent" />

              <p className="max-w-xl text-lg font-light leading-relaxed text-slate-600 dark:text-gray-300 md:text-xl">
                Des prestations d&apos;exception, pensées pour révéler votre
                élégance. Chaque détail est une œuvre d&apos;art.
              </p>
            </div>

            <div className="mt-12 h-[2px] w-24 bg-gradient-to-r from-amber-500 to-transparent" />
          </div>
        </div>
      </section>

      {/* FILTRES */}
      {!loading && services.length > 0 && (
        <div
          className="
            sticky top-20 z-30 mx-auto max-w-7xl px-6 py-4 backdrop-blur-xl
            border-b border-slate-200 bg-white/80
            dark:border-white/5 dark:bg-black/70
          "
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
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
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-amber-500/60 hover:bg-amber-50 hover:text-amber-700 dark:border-white/10 dark:bg-transparent dark:text-gray-400 dark:hover:border-amber-500/60 dark:hover:bg-white/5 dark:hover:text-amber-400"
                  }`}
                >
                  {cat === "all" ? "Tous les services" : cat}
                </button>
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
        </div>
      )}

      {/* SERVICES */}
      <section id="services-list" className="mx-auto max-w-7xl px-6 py-16 pb-28">
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="
                  relative h-[430px] overflow-hidden rounded-[36px] shadow-xl
                  border border-slate-200 bg-white
                  dark:border-white/10 dark:bg-white/5
                "
              >
                <div className="space-y-4 p-6">
                  <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
                  <div className="h-6 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                  <div className="h-20 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />

                  <div className="flex justify-between">
                    <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                    <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div
            className="
              flex flex-col items-center justify-center rounded-[50px] py-32 text-center backdrop-blur-sm
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
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-32 text-center">
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
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="group cursor-pointer transition duration-200 hover:-translate-y-1"
              >
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      {!loading && services.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-6 pb-28">
          <div
            className="
              relative overflow-hidden rounded-[50px] p-10 text-center shadow-xl
              border border-amber-500/20 bg-gradient-to-br from-amber-50 to-white
              dark:from-[#1a120b] dark:to-black
              md:p-12
            "
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(251,191,36,0.12),transparent)]" />

            <div className="relative z-10">
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
                className={`mt-8 inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition hover:scale-[1.02] hover:shadow-xl ${goldBg}`}
              >
                Réserver mon fauteuil <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CONTACT DANS LA MÊME PAGE */}
      <ContactFooter />

      {/* DRAWER MOBILE */}
      {filterOpen && (
        <div
          className="
            fixed inset-0 z-50 backdrop-blur-md md:hidden
            bg-white/80 dark:bg-black/90
          "
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="
              absolute right-0 top-0 h-full w-80 p-6 shadow-2xl
              border-l border-slate-200 bg-white
              dark:border-amber-500/30 dark:bg-[#0a0a0a]
            "
            onClick={(event) => event.stopPropagation()}
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
          </div>
        </div>
      )}
    </main>
  );
}