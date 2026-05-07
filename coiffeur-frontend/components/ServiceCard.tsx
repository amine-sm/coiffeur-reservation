"use client";

import Link from "next/link";
import { ArrowRight, Clock, Scissors, Sparkles, Plus, Crown, Star } from "lucide-react";
import type { Service } from "@/lib/types";
import { motion } from "framer-motion";

export default function ServiceCard({ service }: { service: Service }) {
  // Dégradés Or de Prestige
  const goldText = "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";
  const goldBg = "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";
  const goldBorder = "border-amber-500/40";

  // Effet de brillance au survol
  const shineVariants = {
    initial: { x: "-100%" },
    hover: { x: "100%", transition: { duration: 0.8, ease: "easeInOut" } },
  };

  return (
    <motion.div
      className="group relative flex flex-col h-[620px] w-full overflow-hidden rounded-[48px] bg-gradient-to-br from-neutral-900 via-neutral-900 to-black border border-white/10 transition-all duration-700 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10"
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* ========== ZONE IMAGE AVEC OVERLAY LUXUEUX ========== */}
      <div className="relative h-[65%] w-full overflow-hidden">
        {/* Overlay dégradé premium */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-neutral-900 via-transparent to-black/60" />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Image avec zoom fluide */}
        {service.image ? (
          <motion.img
            src={service.image}
            alt={service.nom}
            className="h-full w-full object-cover"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6 }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
            <Scissors size={56} className="text-neutral-700 transition-colors group-hover:text-amber-500/40" />
          </div>
        )}

        {/* Badge "Exclusivité" flottant */}
        <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/60 px-3 py-1.5 backdrop-blur-md shadow-lg">
          <Crown size={12} className="text-amber-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">
            Prestige
          </span>
        </div>

        {/* Badge durée (en haut à droite) */}
        <div className="absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
          <Clock size={12} className="text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
            {service.duree || 45} min
          </span>
        </div>

        {/* Effet de brillance traversante sur l'image */}
        <motion.div
          variants={shineVariants}
          initial="initial"
          whileHover="hover"
          className="absolute inset-0 z-20 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-15deg] pointer-events-none"
        />

        {/* Cercle plus animé au centre */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-xl"
          >
            <Plus size={28} strokeWidth={2.5} />
          </motion.div>
        </div>
      </div>

      {/* ========== ZONE CONTENU ========== */}
      <div className="relative flex flex-1 flex-col justify-between p-6 pt-5">
        {/* Ligne décorative dorée */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        {/* En-tête avec icône sparkle */}
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-amber-500" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400/90">
            Soin Signature
          </span>
        </div>

        {/* Titre avec animation au survol */}
        <h3 className="font-serif text-2xl font-light tracking-tight text-white transition-all duration-300 group-hover:text-amber-400">
          {service.nom}
        </h3>

        {/* Description avec limitation de lignes */}
        <p className="mt-3 line-clamp-2 text-sm font-light leading-relaxed text-gray-400">
          {service.description ||
            "Une expérience immersive alliant précision technique et rituels de soin exclusifs."}
        </p>

        {/* ========== PRIX ET CTA ========== */}
        <div className="mt-5 flex items-end justify-between border-t border-white/5 pt-4">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">À partir de</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black ${goldText}`}>
                {Number(service.prix || 0).toLocaleString("fr-DZ")}
              </span>
              <span className="text-xs font-medium text-gray-400">DA</span>
            </div>
          </div>

          {/* Bouton avec animation d'expansion */}
          <Link
            href={`/reservation?service=${service.id}`}
            className="group/btn relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-amber-500/40 bg-black/40 transition-all duration-500 hover:w-28 hover:bg-amber-500"
          >
            <motion.div
              className="absolute flex items-center gap-1 text-black opacity-0 transition-all duration-300 group-hover/btn:opacity-100"
              initial={{ x: 10 }}
              whileHover={{ x: 0 }}
            >
              <span className="text-[9px] font-black uppercase tracking-tight">Réserver</span>
            </motion.div>
            <ArrowRight
              size={18}
              className="text-amber-500 transition-all duration-300 group-hover/btn:translate-x-8 group-hover/btn:opacity-0"
            />
          </Link>
        </div>
      </div>

      {/* Effet de brillance globale sur la carte */}
      <div className="pointer-events-none absolute inset-0 z-30 rounded-[48px] opacity-0 transition-opacity duration-700 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-[48px] shadow-[inset_0_0_50px_rgba(251,191,36,0.2)]" />
      </div>
    </motion.div>
  );
}