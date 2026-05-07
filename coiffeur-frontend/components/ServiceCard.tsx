"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Scissors,
  Sparkles,
  Plus,
  Crown,
} from "lucide-react";
import type { Service } from "@/lib/types";
import { motion } from "framer-motion";

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

export default function ServiceCard({ service }: { service: Service }) {
  const goldText =
    "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

  const serviceImage = getServiceImage(service);

  const shineVariants = {
    initial: { x: "-100%" },
    hover: {
      x: "100%",
      transition: {
        duration: 0.8,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      className="
        group relative flex h-[620px] w-full flex-col overflow-hidden rounded-[48px]
        border transition-all duration-700
        border-slate-200 bg-gradient-to-br from-white via-amber-50/40 to-slate-100
        shadow-xl shadow-slate-200/70 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/20
        dark:border-white/10 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-black
        dark:shadow-none dark:hover:border-amber-500/40 dark:hover:shadow-amber-500/10
      "
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* ========== ZONE IMAGE ========== */}
      <div className="relative h-[65%] w-full overflow-hidden">
        <div
          className="
            absolute inset-0 z-10
            bg-gradient-to-t from-white via-transparent to-white/40
            dark:from-neutral-900 dark:to-black/60
          "
        />

        <div
          className="
            absolute inset-0 z-10
            bg-gradient-to-b from-white/30 via-transparent to-transparent
            dark:from-black/40
          "
        />

        {serviceImage ? (
          <motion.img
            src={serviceImage}
            alt={service.nom}
            className="h-full w-full object-cover"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6 }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div
            className="
              flex h-full w-full items-center justify-center
              bg-gradient-to-br from-slate-100 to-amber-50
              dark:from-neutral-800 dark:to-neutral-900
            "
          >
            <Scissors
              size={56}
              className="
                text-slate-300 transition-colors group-hover:text-amber-500/50
                dark:text-neutral-700 dark:group-hover:text-amber-500/40
              "
            />
          </div>
        )}

        {/* Badge Prestige */}
        <div
          className="
            absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-lg backdrop-blur-md
            border-amber-500/30 bg-white/75
            dark:bg-black/60
          "
        >
          <Crown size={12} className="text-amber-500 dark:text-amber-400" />

          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            Prestige
          </span>
        </div>

        {/* Badge durée */}
        <div
          className="
            absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm
            bg-white/75 shadow-sm
            dark:bg-black/50
          "
        >
          <Clock size={12} className="text-amber-500 dark:text-amber-400" />

          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-white/90">
            {service.duree || 45} min
          </span>
        </div>

        {/* Effet de brillance image */}
        <motion.div
          variants={shineVariants}
          initial="initial"
          whileHover="hover"
          className="
            pointer-events-none absolute inset-0 z-20 h-full w-full skew-x-[-15deg]
            bg-gradient-to-r from-transparent via-white/40 to-transparent
            dark:via-white/15
          "
        />

        {/* Cercle plus animé */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="
              flex h-16 w-16 items-center justify-center rounded-full
              bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-xl
            "
          >
            <Plus size={28} strokeWidth={2.5} />
          </motion.div>
        </div>
      </div>

      {/* ========== CONTENU ========== */}
      <div className="relative flex flex-1 flex-col justify-between p-6 pt-5">
        <div className="absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />

            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400/90">
              Soin Signature
            </span>
          </div>

          <h3
            className="
              font-serif text-2xl font-light tracking-tight transition-all duration-300
              text-slate-950 group-hover:text-amber-700
              dark:text-white dark:group-hover:text-amber-400
            "
          >
            {service.nom}
          </h3>

          <p className="mt-3 line-clamp-2 text-sm font-light leading-relaxed text-slate-600 dark:text-gray-400">
            {service.description ||
              "Une expérience immersive alliant précision technique et rituels de soin exclusifs."}
          </p>
        </div>

        {/* Prix + CTA */}
        <div className="mt-5 flex items-end justify-between border-t border-slate-200 pt-4 dark:border-white/5">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-500">
              À partir de
            </span>

            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black ${goldText}`}>
                {Number(service.prix || 0).toLocaleString("fr-DZ")}
              </span>

              <span className="text-xs font-medium text-slate-500 dark:text-gray-400">
                DA
              </span>
            </div>
          </div>

          <Link
            href={`/reservation?service=${service.id}`}
            className="
              group/btn relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border
              border-amber-500/40 bg-white text-amber-600 shadow-sm transition-all duration-500
              hover:w-28 hover:bg-amber-500 hover:text-black
              dark:bg-black/40 dark:text-amber-500
            "
          >
            <motion.div
              className="absolute flex items-center gap-1 text-black opacity-0 transition-all duration-300 group-hover/btn:opacity-100"
              initial={{ x: 10 }}
              whileHover={{ x: 0 }}
            >
              <span className="text-[9px] font-black uppercase tracking-tight">
                Réserver
              </span>
            </motion.div>

            <ArrowRight
              size={18}
              className="transition-all duration-300 group-hover/btn:translate-x-8 group-hover/btn:opacity-0"
            />
          </Link>
        </div>
      </div>

      {/* Glow hover */}
      <div className="pointer-events-none absolute inset-0 z-30 rounded-[48px] opacity-0 transition-opacity duration-700 group-hover:opacity-100">
        <div
          className="
            absolute inset-0 rounded-[48px]
            shadow-[inset_0_0_50px_rgba(245,158,11,0.14)]
            dark:shadow-[inset_0_0_50px_rgba(251,191,36,0.2)]
          "
        />
      </div>
    </motion.div>
  );
}