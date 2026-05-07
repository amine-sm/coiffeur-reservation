"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Scissors,
  Crown,
  ChevronRight,
  Sparkles,
  MapPin,
  Phone,
  Clock,
  Loader2,
  AlertCircle,
  Diamond,
  Award,
  Users,
  Star,
  Quote,
  Eye,
  Instagram,
  Facebook,
  MessageCircle,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import Navbar from "@/components/Navbar";
import { serviceService } from "@/lib/serviceService";
import type { Service } from "@/lib/types";

// ========== STYLES & ANIMATIONS ==========
const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";
const goldBg =
  "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";
const goldBorder = "border-[#F59E0B]/30";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.21, 0.45, 0.32, 0.9] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const scaleOnHover = {
  whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 },
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

// ========== COMPOSANT CARD VALEUR ==========
const ValueCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{ y: -8 }}
    className="group rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-[#F59E0B]/40 hover:bg-white/10"
  >
    <div className="mb-6 inline-flex rounded-2xl bg-[#F59E0B]/10 p-4 text-[#FBBF24] transition-transform group-hover:scale-110">
      {icon}
    </div>
    <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
    <p className="text-sm leading-relaxed text-gray-400">{description}</p>
  </motion.div>
);

// ========== COMPOSANT TÉMOIGNAGE ==========
const TestimonialCard = ({ name, role, content, rating, image }: { name: string; role: string; content: string; rating: number; image: string }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{ y: -5 }}
    className="relative rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-8 backdrop-blur-sm"
  >
    <Quote className="absolute right-6 top-6 h-12 w-12 text-[#F59E0B]/20" />
    <div className="mb-6 flex items-center gap-4">
      <img src={image} alt={name} className="h-14 w-14 rounded-full object-cover ring-2 ring-[#F59E0B]/30" />
      <div>
        <h4 className="font-bold text-white">{name}</h4>
        <p className="text-xs text-gray-400">{role}</p>
      </div>
    </div>
    <div className="mb-4 flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className={i < rating ? "fill-[#FBBF24] text-[#FBBF24]" : "text-gray-600"} />
      ))}
    </div>
    <p className="relative z-10 text-sm italic leading-relaxed text-gray-300">"{content}"</p>
  </motion.div>
);

// ========== COMPOSANT IMAGE GALERIE ==========
const GalleryImage = ({ src, alt, index }: { src: string; alt: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02 }}
    className="group relative overflow-hidden rounded-2xl"
  >
    <img src={src} alt={alt} className="h-80 w-full object-cover transition duration-700 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
    <Eye className="absolute bottom-4 right-4 h-6 w-6 text-white opacity-0 transition duration-300 group-hover:opacity-100" />
  </motion.div>
);

export default function LuxuryGoldBarber() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    let isMounted = true;
    async function loadServices() {
      try {
        setLoadingServices(true);
        setServicesError(null);
        const response = await serviceService.getAll();
        if (!isMounted) return;
        if (!response.success) {
          setServicesError(response.message || response.error || "Impossible de charger les services.");
          setServices([]);
          return;
        }
        const activeServices = (response.data || []).filter((service) => service.statut !== "inactif");
        setServices(activeServices);
      } catch (error) {
        if (!isMounted) return;
        console.error("Erreur chargement services:", error);
        setServicesError("Erreur de connexion avec le serveur.");
        setServices([]);
      } finally {
        if (isMounted) setLoadingServices(false);
      }
    }
    loadServices();
    return () => { isMounted = false; };
  }, []);

  const featuredServices = useMemo(() => services.slice(0, 6), [services]);

  // Données statiques pour les sections supplémentaires
  const values = [
    { icon: <Diamond size={24} />, title: "Savoir-faire d'exception", description: "Des barbiers formés aux techniques françaises et italiennes, maîtrisant l'art de la coupe et du rasage." },
    { icon: <Award size={24} />, title: "Produits haut de gamme", description: "Sélection rigoureuse des meilleurs produits de coiffure et barbier, sans compromis sur la qualité." },
    { icon: <Users size={24} />, title: "Service personnalisé", description: "Chaque client reçoit une attention unique, de l'accueil à la fin de la prestation." },
  ];

  const testimonials = [
    { name: "Karim B.", role: "Chef d'entreprise", content: "Un lieu d'exception où le souci du détail est poussé à l'extrême. Je n'ai jamais eu une coupe aussi parfaite.", rating: 5, image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Mehdi L.", role: "Avocat", content: "L'ambiance est feutrée, le personnel attentif. Le résultat est toujours à la hauteur de mes attentes.", rating: 5, image: "https://randomuser.me/api/portraits/men/45.jpg" },
    { name: "Sofia R.", role: "Cliente régulière", content: "Je viens pour les soins du cuir chevelu. Un moment de détente absolu dans un cadre magnifique.", rating: 4, image: "https://randomuser.me/api/portraits/women/68.jpg" },
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
    <main className="min-h-screen bg-[#050505] selection:bg-[#FBBF24] selection:text-black overflow-x-hidden">
      <Navbar />

      {/* ========== HERO AVEC PARALLAXE ========== */}
      <section ref={heroRef} className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <motion.div className="absolute inset-0 -z-10" style={{ opacity: heroOpacity, scale: heroScale }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,119,6,0.15)_0%,rgba(0,0,0,1)_80%)] z-10" />
          <img
            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2000"
            className="h-full w-full object-cover grayscale opacity-40"
            alt="Luxury Barber"
          />
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>

        <div className="max-w-7xl text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F59E0B]/30 bg-black/30 px-4 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FBBF24] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FBBF24]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">Ouvert à Hydra • Alger</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="font-serif text-6xl font-light leading-[1.1] text-white sm:text-8xl lg:text-[9rem]">
              L'Éclat du <br />
              <span className={`font-extralight italic ${goldText}`}>Prestige.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="mx-auto mt-8 max-w-2xl text-base font-light leading-relaxed text-gray-400 sm:text-xl">
              Plus qu'une coupe, une distinction. Découvrez l'excellence de la coiffure masculine dans un cadre où l'or noir rencontre le savoir-faire artisanal.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Link href="/reservation" className={`group flex items-center gap-4 rounded-full px-10 py-5 text-[11px] font-black uppercase tracking-widest text-black transition-all hover:-translate-y-1 active:scale-95 shadow-2xl shadow-[#F59E0B]/20 ${goldBg}`}>
                Réserver mon fauteuil <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="#services" className="rounded-full border border-white/20 px-8 py-5 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:border-[#FBBF24] hover:text-[#FBBF24]">
                Découvrir
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Indicateur de scroll */}
        <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <div className="h-12 w-6 rounded-full border-2 border-white/30 flex justify-center">
            <div className="mt-2 h-2 w-1 rounded-full bg-white/60" />
          </div>
        </motion.div>
      </section>

      {/* ========== NOS VALEURS ========== */}
      <section className="relative z-10 -mt-24 px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid gap-6 md:grid-cols-3">
            {values.map((value, i) => (
              <ValueCard key={i} {...value} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== SERVICES API ========== */}
      <section id="services" className="bg-[#0A0A0A] py-32 lg:py-48">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-24 grid items-end gap-16 lg:grid-cols-2">
            <div>
              <span className="mb-4 block text-[11px] font-black uppercase tracking-[0.3em] text-[#FBBF24]">Le Menu Privé</span>
              <h2 className="font-serif text-5xl font-light text-white sm:text-7xl">
                Expériences <br />
                <span className={`font-extralight italic ${goldText}`}>Sur-mesure</span>
              </h2>
            </div>
            <p className="max-w-md pb-2 text-gray-500">Chaque détail est pensé pour l'homme moderne. Nos services sont chargés directement depuis votre système de réservation.</p>
          </div>

          {loadingServices && (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[40px] border border-white/5 bg-white/[0.03] p-10 text-center">
              <Loader2 className="mb-5 h-10 w-10 animate-spin text-[#FBBF24]" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Chargement des services...</p>
            </div>
          )}

          {!loadingServices && servicesError && (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[40px] border border-red-500/20 bg-red-500/5 p-10 text-center">
              <AlertCircle className="mb-5 h-10 w-10 text-red-400" />
              <h3 className="mb-2 text-xl font-bold text-white">Services indisponibles</h3>
              <p className="max-w-md text-sm text-gray-400">{servicesError}</p>
            </div>
          )}

          {!loadingServices && !servicesError && featuredServices.length === 0 && (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[40px] border border-white/5 bg-white/[0.03] p-10 text-center">
              <Scissors className="mb-5 h-10 w-10 text-[#FBBF24]" />
              <h3 className="mb-2 text-xl font-bold text-white">Aucun service disponible</h3>
              <p className="max-w-md text-sm text-gray-400">Ajoutez vos services depuis l'administration pour les afficher ici.</p>
            </div>
          )}

          {!loadingServices && !servicesError && featuredServices.length > 0 && (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group relative overflow-hidden rounded-[40px] border border-white/5 bg-white/5 p-8 transition-all hover:border-[#F59E0B]/50 hover:bg-white/[0.08] hover:shadow-2xl"
                >
                  {service.image && (
                    <div className="mb-6 h-44 overflow-hidden rounded-2xl border border-white/10 bg-black">
                      <img src={service.image} alt={service.nom} className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
                    </div>
                  )}
                  {!service.image && (
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F59E0B]/30 bg-gradient-to-br from-gray-800 to-black text-[#FBBF24] transition-transform group-hover:scale-110">
                      {getServiceIcon(index)}
                    </div>
                  )}
                  <h3 className="mb-3 font-serif text-2xl font-bold text-white">{service.nom}</h3>
                  <p className="mb-6 min-h-[70px] text-sm leading-relaxed text-gray-400">{service.description || "Service premium réalisé avec soin et précision."}</p>
                  <div className="flex items-center justify-between border-t border-white/10 pt-6">
                    <div>
                      <span className={`block text-xl font-bold ${goldText}`}>{Number(service.prix || 0).toLocaleString("fr-DZ")} DA</span>
                      <span className="mt-1 block text-xs text-gray-500">Durée : {service.duree} min</span>
                    </div>
                    <Link href={`/reservation?service=${service.id}`} className="rounded-full border border-[#FBBF24]/30 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#FBBF24] transition-colors hover:bg-[#FBBF24] hover:text-black">
                      Réserver
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loadingServices && !servicesError && services.length > 6 && (
            <div className="mt-14 flex justify-center">
              <Link href="/services" className="rounded-full border border-white/10 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:border-[#FBBF24] hover:text-[#FBBF24]">
                Voir tous les services
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ========== GALERIE ========== */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
            <span className="mb-4 block text-[11px] font-black uppercase tracking-[0.3em] text-[#FBBF24]">Notre Art en Images</span>
            <h2 className="font-serif text-4xl font-light text-white sm:text-6xl">L'Élégance <span className={goldText}>capturée</span></h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((src, i) => (
              <GalleryImage key={i} src={src} alt={`Galerie ${i + 1}`} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ========== TÉMOIGNAGES ========== */}
      <section className="bg-[#0A0A0A] py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
            <span className="mb-4 block text-[11px] font-black uppercase tracking-[0.3em] text-[#FBBF24]">Ils parlent de nous</span>
            <h2 className="font-serif text-4xl font-light text-white sm:text-6xl">Ce que nos <span className={goldText}>clients</span> disent</h2>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ========== CALL TO ACTION FINAL ========== */}
      <section className="relative overflow-hidden py-32">
        <div className="absolute inset-0 -z-10">
          <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=2000" className="h-full w-full object-cover opacity-20 blur-sm" alt="" />
        </div>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <Sparkles className="mx-auto mb-6 h-12 w-12 text-[#FBBF24]" />
            <h2 className="font-serif text-4xl font-light text-white sm:text-6xl">Prêt à rejoindre l'excellence ?</h2>
            <p className="mx-auto mt-6 max-w-2xl text-gray-400">Offrez-vous une expérience unique dans notre salon privé. Réservation recommandée.</p>
            <Link href="/reservation" className={`mt-10 inline-flex items-center gap-3 rounded-full px-10 py-5 text-[11px] font-black uppercase tracking-widest text-black transition-all hover:-translate-y-1 ${goldBg}`}>
              Réserver ma place <ChevronRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer id="contact" className="border-t border-[#F59E0B]/20 bg-black pb-12 pt-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <span className={`font-serif text-3xl font-bold tracking-tighter ${goldText}`}>PRESTIGE.</span>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-gray-400">L'adresse de référence pour l'homme d'influence à Alger. Un espace confidentiel pour une image impeccable.</p>
              <div className="mt-8 flex gap-4">
                {[FaInstagram, FaFacebookF, FaWhatsapp].map((Icon, i) => (
                  <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-gray-400 transition-all hover:border-[#FBBF24] hover:text-[#FBBF24]" aria-label="Réseau social">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-6 text-[11px] font-black uppercase tracking-widest text-[#FBBF24]">Contact</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-center gap-3"><MapPin size={16} className="text-[#FBBF24]" />12 Rue des Jardins, Hydra, Alger</li>
                <li className="flex items-center gap-3"><Phone size={16} className="text-[#FBBF24]" />+213 (0) 555 00 00 00</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-[11px] font-black uppercase tracking-widest text-[#FBBF24]">Horaires</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-center gap-3 text-white"><Clock size={16} className="text-[#FBBF24]" />Sam - Jeu : 09:00 - 20:00</li>
                <li className="pl-7 text-xs italic opacity-50">Vendredi : Service VIP sur demande</li>
              </ul>
            </div>
          </div>
          <div className="mt-24 border-t border-white/5 pt-8 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">© 2026 PRESTIGE SALON PRIVÉ - ÉLÉGANCE ABSOLUE</div>
        </div>
      </footer>
    </main>
  );
}