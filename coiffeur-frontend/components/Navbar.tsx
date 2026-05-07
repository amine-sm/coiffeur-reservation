"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Menu,
  X,
  ChevronRight,
  Crown,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "L'Atelier", href: "/services" },
    { label: "Tarifs", href: "/tarifs" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Cinzel:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,500;1,400&display=swap');

        .font-brand { font-family: 'Cinzel', serif; }
        .font-body { font-family: 'Montserrat', sans-serif; }
        .font-luxury { font-family: 'Cormorant Garamond', serif; }

        .glass-effect {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
        }
      `}</style>

      {/* ========== TOP BAR ========== */}
      <div className="fixed top-0 z-[60] w-full border-b border-white/[0.03] bg-black py-2.5 hidden lg:block">
        <div className="mx-auto flex max-w-7xl justify-between px-10 text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-500">
          <div className="flex items-center gap-10">
            <span className="flex items-center gap-2 group cursor-default transition-colors hover:text-amber-500">
              <MapPin size={11} className="text-amber-600 group-hover:animate-pulse" />
              Paris • 8ème Arrondissement
            </span>
            <span className="flex items-center gap-2 group cursor-default transition-colors hover:text-amber-500">
              <Clock size={11} className="text-amber-600" />
              Mar - Sam : 10h - 20h
            </span>
          </div>
          <div className="relative group cursor-pointer overflow-hidden">
            <span className="inline-block transition-transform duration-500 group-hover:-translate-y-full">Devenir Membre Privilège</span>
            <span className="absolute left-0 top-full inline-block text-amber-500 transition-transform duration-500 group-hover:-translate-y-full">Accès Exclusif</span>
          </div>
        </div>
      </div>

      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? "top-0 py-3 glass-effect border-b border-white/[0.05]"
            : "top-0 lg:top-10 py-7 bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 lg:px-12">
          
          {/* ========== LOGO ========== */}
          <Link href="/" className="group flex items-center gap-5">
            <div className="relative flex h-14 w-14 items-center justify-center border border-amber-500/20 transition-all duration-1000 group-hover:border-amber-500/60 group-hover:rotate-[135deg]">
              <div className="transition-transform duration-1000 group-hover:rotate-[-135deg]">
                <Crown size={22} strokeWidth={1} className="text-amber-500 transition-all duration-500 group-hover:scale-110 group-hover:text-amber-400" />
              </div>
              <span className="absolute -top-[1px] -left-[1px] h-3 w-3 border-t border-l border-amber-500 scale-0 group-hover:scale-100 transition-transform duration-500" />
              <span className="absolute -bottom-[1px] -right-[1px] h-3 w-3 border-b border-r border-amber-500 scale-0 group-hover:scale-100 transition-transform duration-500" />
            </div>

            <div className="flex flex-col">
              <h1 className="font-brand text-2xl tracking-[0.2em] text-white leading-none">PRESTIGE</h1>
              <p className="font-luxury text-[13px] italic tracking-[0.2em] text-amber-500/70 mt-1.5">L'Art de la Coupe</p>
            </div>
          </Link>

          {/* ========== NAV ITEMS (UNDERLINE POSITIONNÉ ICI) ========== */}
          <nav className="hidden items-center gap-12 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition-all duration-500 group ${
                    isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  
                  {/* Underline de précision */}
                  <span
                    className={`absolute bottom-[-2px] left-1/2 h-[1.5px] -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-500 to-transparent transition-all duration-500 ease-in-out ${
                      isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                    }`}
                  />
                  
                  {/* Point lumineux pour l'actif */}
                  {isActive && (
                    <motion.span 
                      layoutId="activeDot"
                      className="absolute -bottom-[6px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ========== CTA ========== */}
          <div className="hidden items-center gap-10 md:flex">
            <Link
              href="/reservation"
              className="group relative overflow-hidden bg-white px-9 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-black transition-all duration-500 hover:bg-amber-500"
            >
              <span className="relative z-10 flex items-center gap-2">
                <CalendarDays size={14} />
                Réserver
              </span>
              <div className="absolute inset-0 z-0 translate-y-full bg-amber-500 transition-transform duration-500 group-hover:translate-y-0" />
            </Link>
          </div>

          {/* Mobile Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="text-white lg:hidden">
            {isOpen ? <X size={26} strokeWidth={1.5} /> : <Menu size={26} strokeWidth={1.5} />}
          </button>
        </div>

        {/* ========== MOBILE MENU ========== */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="fixed inset-0 z-[70] flex flex-col bg-black p-10 lg:hidden"
            >
              <div className="flex justify-end">
                <button onClick={() => setIsOpen(false)} className="text-amber-500"><X size={35} /></button>
              </div>
              <div className="mt-20 flex flex-col gap-10">
                {navItems.map((item, i) => (
                  <Link 
                    key={item.label} 
                    href={item.href} 
                    onClick={() => setIsOpen(false)}
                    className={`font-brand text-5xl transition-colors ${pathname === item.href ? "text-amber-500" : "text-white"}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-auto border-t border-white/10 pt-10">
                <p className="font-luxury text-2xl text-amber-500 italic mb-6">Luxe & Confidentialité.</p>
                <Link href="/reservation" className="block w-full bg-amber-600 py-6 text-center font-bold uppercase tracking-widest text-black">Réserver mon instant</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}