"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Navbar from "@/components/Navbar";
import ServiceCard from "@/components/ServiceCard";
import { serviceService } from "@/lib/serviceService";
import type { Service } from "@/lib/types";
import {
  Sparkles,
  Scissors,
  ChevronRight,
  Filter,
  X,
  Diamond,
  Star,
  Zap,
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const categories = useMemo(() => {
    const cats = new Set(services.map((s) => s.categorie).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return services;
    return services.filter((s) => s.categorie === selectedCategory);
  }, [services, selectedCategory]);

  const goldText =
    "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";
  const goldBg =
    "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";

  async function loadServices() {
    setLoading(true);
    try {
      const res = await serviceService.getAll();
      if (res.success && res.data) setServices(res.data);
    } catch (error) {
      console.error("Erreur chargement services:", error);
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
  const headerY = useTransform(scrollYProgress, [0, 0.5], [0, -120]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.2]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", damping: 20, stiffness: 100 },
    },
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-amber-500/30 overflow-x-hidden">
      <Navbar />

      {/* Arrière-plan animé avec particules et lumières */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Dégradé de fond profond */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#1a0a00]" />
        
        {/* Lumières mouvantes */}
        <motion.div
          animate={{
            x: ["0%", "100%", "0%"],
            y: ["0%", "50%", "0%"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[80%] h-[80%] bg-amber-500/10 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            x: ["100%", "0%", "100%"],
            y: ["100%", "0%", "100%"],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[130px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-amber-400/5 rounded-full blur-[100px]"
        />

        {/* Points de lumière statiques (effet étoiles) */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {/* ========== HEADER AVEC EFFET DE PARALLAXE ========== */}
      <section ref={headerRef} className="relative pt-48 pb-24 z-10">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            style={{ y: headerY, opacity: headerOpacity }}
            className="max-w-3xl"
          >
            {/* Badge luxueux */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-amber-500/30 backdrop-blur-md mb-8 shadow-lg shadow-amber-500/10"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
                L'Art de la Distinction
              </span>
            </motion.div>

            {/* Titre principal avec doré sur toute la ligne */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-7xl md:text-9xl font-serif font-light tracking-tighter leading-[0.9]"
            >
              <span className={goldText}>Nos Services</span>
              <br />
              <span className={`${goldText} italic font-extralight`}>
                Signature
              </span>
            </motion.h1>

            {/* Description avec barre décorative */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-8 flex items-start gap-4"
            >
              <div className="h-20 w-px bg-gradient-to-b from-amber-500/80 to-transparent" />
              <p className="text-xl text-gray-300 leading-relaxed font-light max-w-xl">
                Des prestations d'exception, pensées pour révéler votre élégance.
                Chaque détail est une œuvre d'art.
              </p>
            </motion.div>

            {/* Indicateur de défilement décoratif */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 100 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 h-[2px] bg-gradient-to-r from-amber-500 to-transparent"
            />
          </motion.div>
        </div>
      </section>

      {/* ========== FILTRES COLLANTS AVEC DESIGN RAFFINÉ ========== */}
      {!loading && services.length > 0 && (
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="sticky top-20 z-30 mx-auto max-w-7xl px-6 py-4 backdrop-blur-xl bg-black/50 border-b border-white/5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Scissors size={16} className="text-amber-400" />
              </div>
              <span className="text-sm font-light text-gray-400">
                <span className="text-amber-400 font-bold">{filteredServices.length}</span>{" "}
                prestations d'exception
              </span>
            </div>

            {/* Filtres desktop */}
            <div className="hidden md:flex items-center gap-3">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/30"
                      : "border border-white/10 text-gray-400 hover:border-amber-500/60 hover:text-amber-400 hover:bg-white/5"
                  }`}
                >
                  {cat === "all" ? "Tous les services" : cat}
                </motion.button>
              ))}
            </div>

            {/* Filtre mobile */}
            <button
              onClick={() => setFilterOpen(true)}
              className="md:hidden flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-sm text-gray-300 hover:border-amber-500 transition"
            >
              <Filter size={14} /> Filtrer
            </button>
          </div>
        </motion.div>
      )}

      {/* ========== GRILLE DES SERVICES ========== */}
      <section className="mx-auto max-w-7xl px-6 py-20 pb-32">
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative h-[480px] rounded-[40px] bg-white/5 border border-white/10 overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                <div className="p-6 space-y-4">
                  <div className="h-40 rounded-2xl bg-white/10 animate-pulse" />
                  <div className="h-6 w-2/3 bg-white/10 rounded-full animate-pulse" />
                  <div className="h-20 w-full bg-white/10 rounded-xl animate-pulse" />
                  <div className="flex justify-between">
                    <div className="h-8 w-24 bg-white/10 rounded-full animate-pulse" />
                    <div className="h-8 w-24 bg-white/10 rounded-full animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-40 rounded-[60px] bg-white/5 border border-white/10 backdrop-blur-sm text-center"
          >
            <Diamond size={60} className="text-amber-500/50 mb-6" />
            <h3 className="text-3xl font-serif text-white mb-2">Aucun service pour le moment</h3>
            <p className="text-gray-400 max-w-md">
              Notre équipe prépare de nouvelles expériences exclusives. Revenez bientôt.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition"
            >
              Retour à l'accueil <ChevronRight size={16} />
            </Link>
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

        {!loading && services.length > 0 && filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <p className="text-gray-400 text-lg">
              Aucun résultat pour la catégorie{" "}
              <span className="text-amber-400 font-bold">{selectedCategory}</span>.
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="mt-4 text-amber-500 underline-offset-4 hover:underline"
            >
              Voir tous les services
            </button>
          </motion.div>
        )}
      </section>

      {/* ========== CALL TO ACTION LUXUEUX ========== */}
      {!loading && services.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-6 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-[60px] bg-gradient-to-br from-[#1a120b] to-black border border-amber-500/20 p-12 text-center shadow-2xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(251,191,36,0.12),transparent)]" />
            <Zap className="mx-auto mb-6 h-12 w-12 text-amber-500" />
            <h2 className="font-serif text-4xl md:text-6xl font-light text-white">
              Offrez-vous <span className={goldText}>l'excellence</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-gray-400">
              Réservation recommandée. Places limitées pour une expérience sur-mesure.
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

      {/* ========== DRAWER FILTRES MOBILE ========== */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md md:hidden"
            onClick={() => setFilterOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute right-0 top-0 h-full w-80 bg-[#0a0a0a] border-l border-amber-500/30 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Catégories
                </h3>
                <button className="p-2 rounded-full bg-white/5 hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setFilterOpen(false);
                    }}
                    className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition ${
                      selectedCategory === cat
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
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

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </main>
  );
}