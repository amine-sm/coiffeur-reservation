"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Menu,
  X,
  Crown,
  MapPin,
  Clock,
  Phone,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 3c.35 2.7 1.9 4.35 4.4 4.55v3.1c-1.45.15-2.75-.35-4.25-1.25v5.75c0 7.3-7.95 9.55-11.15 4.35-2.05-3.35-.8-9.25 5.8-9.5v3.3c-.48.08-.98.2-1.45.38-1.38.52-2.15 1.48-1.95 3.15.38 3.2 6.3 4.15 5.82-2.1V3h2.78Z" />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const phoneNumber = "+213 555 00 00 00";

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "L'Atelier", href: "/services" },
  ];

  const socialLinks = [
    {
      label: "Instagram",
      href: "https://www.instagram.com/prestige_salon",
      icon: InstagramIcon,
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@prestige_salon",
      icon: TikTokIcon,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* TOP BAR */}
      <div
        className="
          fixed top-0 z-[60] hidden w-full border-b border-black/[0.06]
          bg-white py-2.5 lg:block
          dark:border-white/[0.03] dark:bg-black
        "
      >
        <div
          className="
            mx-auto flex max-w-7xl justify-between px-10
            text-[10px] font-medium uppercase tracking-[0.25em]
            text-zinc-600 dark:text-zinc-500
          "
        >
          <div className="flex items-center gap-10">
            <span className="group flex cursor-default items-center gap-2 transition-colors hover:text-amber-500">
              <MapPin size={11} className="text-amber-600" />
              Alger • Hydra
            </span>

            <span className="group flex cursor-default items-center gap-2 transition-colors hover:text-amber-500">
              <Clock size={11} className="text-amber-600" />
              Sam - Jeu : 09h - 20h
            </span>

            <a
              href={`tel:${phoneNumber.replaceAll(" ", "")}`}
              className="group flex items-center gap-2 transition-colors hover:text-amber-500"
            >
              <Phone size={11} className="text-amber-600" />
              {phoneNumber}
            </a>
          </div>

          <div className="flex items-center gap-5">
            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-amber-500"
                >
                  <span className="text-amber-600">
                    <Icon size={12} />
                  </span>
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? "top-0 border-b border-black/[0.06] py-3 glass-effect dark:border-white/[0.05]"
            : "top-0 bg-transparent py-7 lg:top-10"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 lg:px-12">
          {/* LOGO */}
          <Link href="/" className="group flex items-center gap-5">
            <div
              className="
                relative flex h-14 w-14 items-center justify-center
                border border-amber-500/30 transition-all duration-1000
                group-hover:rotate-[135deg] group-hover:border-amber-500/70
              "
            >
              <div className="transition-transform duration-1000 group-hover:rotate-[-135deg]">
                <Crown
                  size={22}
                  strokeWidth={1}
                  className="text-amber-500 transition-all duration-500 group-hover:scale-110"
                />
              </div>

              <span className="absolute -left-[1px] -top-[1px] h-3 w-3 scale-0 border-l border-t border-amber-500 transition-transform duration-500 group-hover:scale-100" />
              <span className="absolute -bottom-[1px] -right-[1px] h-3 w-3 scale-0 border-b border-r border-amber-500 transition-transform duration-500 group-hover:scale-100" />
            </div>

            <div className="flex flex-col">
              <h1 className="font-brand text-2xl leading-none tracking-[0.2em] text-black dark:text-white">
                PRESTIGE
              </h1>

              <p className="font-luxury mt-1.5 text-[13px] italic tracking-[0.2em] text-amber-600 dark:text-amber-500/70">
                L&apos;Art de la Coupe
              </p>
            </div>
          </Link>

          {/* NAV DESKTOP */}
          <nav className="hidden items-center gap-12 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition-all duration-500 ${
                    isActive
                      ? "text-black dark:text-white"
                      : "text-zinc-500 hover:text-black dark:text-zinc-500 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>

                  <span
                    className={`absolute bottom-[-2px] left-1/2 h-[1.5px] -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-500 to-transparent transition-all duration-500 ${
                      isActive
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                    }`}
                  />

                  {isActive && (
                    <motion.span
                      layoutId="activeDot"
                      className="absolute -bottom-[6px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-amber-400"
                    />
                  )}
                </Link>
              );
            })}

            {/* CONTACT RESTE DANS LA PAGE ACTUELLE */}
            <a
              href="#contact"
              className="
                group relative py-2 text-[11px] font-semibold uppercase tracking-[0.3em]
                text-zinc-500 transition-all duration-500
                hover:text-black dark:text-zinc-500 dark:hover:text-zinc-200
              "
            >
              <span className="relative z-10">Contact</span>

              <span
                className="
                  absolute bottom-[-2px] left-1/2 h-[1.5px] w-0 -translate-x-1/2
                  bg-gradient-to-r from-transparent via-amber-500 to-transparent
                  opacity-0 transition-all duration-500
                  group-hover:w-full group-hover:opacity-100
                "
              />
            </a>
          </nav>

          {/* RIGHT ACTIONS DESKTOP */}
          <div className="hidden items-center gap-4 md:flex">
            <a
              href={`tel:${phoneNumber.replaceAll(" ", "")}`}
              className="
                flex h-11 w-11 items-center justify-center rounded-full
                border border-black/10 bg-black/5 text-black transition-all
                hover:border-amber-500 hover:bg-amber-500 hover:text-black
                dark:border-white/10 dark:bg-white/10 dark:text-white
              "
              aria-label="Téléphone"
            >
              <Phone size={17} />
            </a>

            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex h-11 w-11 items-center justify-center rounded-full
                    border border-black/10 bg-black/5 text-black transition-all
                    hover:border-amber-500 hover:bg-amber-500 hover:text-black
                    dark:border-white/10 dark:bg-white/10 dark:text-white
                  "
                  aria-label={item.label}
                >
                  <Icon size={17} />
                </a>
              );
            })}

            <ThemeToggle />

            <Link
              href="/reservation"
              className="
                group relative overflow-hidden px-9 py-4 text-[10px]
                font-black uppercase tracking-[0.3em] transition-all duration-500
                bg-black text-white hover:bg-amber-500 hover:text-black
                dark:bg-white dark:text-black dark:hover:bg-amber-500
              "
            >
              <span className="relative z-10 flex items-center gap-2">
                <CalendarDays size={14} />
                Réserver
              </span>
            </Link>
          </div>

          {/* MOBILE ACTIONS */}
          <div className="flex items-center gap-4 md:hidden">
            <ThemeToggle />

            <button
              onClick={() => setIsOpen(true)}
              className="text-black transition-colors dark:text-white"
              aria-label="Ouvrir le menu"
              type="button"
            >
              <Menu size={28} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.25 }}
              className="
                fixed inset-0 z-[70] flex flex-col p-10 lg:hidden
                bg-white text-black dark:bg-black dark:text-white
              "
            >
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center gap-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center border border-amber-500/30">
                    <Crown
                      size={20}
                      strokeWidth={1}
                      className="text-amber-500"
                    />
                  </div>

                  <div>
                    <h2 className="font-brand text-xl tracking-[0.2em]">
                      PRESTIGE
                    </h2>

                    <p className="font-luxury text-xs italic tracking-[0.2em] text-amber-600">
                      L&apos;Art de la Coupe
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => setIsOpen(false)}
                  className="text-amber-500"
                  aria-label="Fermer le menu"
                  type="button"
                >
                  <X size={35} strokeWidth={1.5} />
                </button>
              </div>

              <div className="mt-20 flex flex-col gap-10">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`font-brand text-5xl transition-colors ${
                      pathname === item.href
                        ? "text-amber-500"
                        : "text-black hover:text-amber-500 dark:text-white dark:hover:text-amber-500"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* CONTACT MOBILE RESTE DANS LA PAGE ACTUELLE */}
                <a
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className="
                    font-brand text-5xl text-black transition-colors
                    hover:text-amber-500 dark:text-white dark:hover:text-amber-500
                  "
                >
                  Contact
                </a>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-3">
                <a
                  href={`tel:${phoneNumber.replaceAll(" ", "")}`}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-sm font-semibold dark:border-white/10"
                >
                  <Phone size={20} className="text-amber-500" />
                  Appel
                </a>

                {socialLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-sm font-semibold dark:border-white/10"
                    >
                      <span className="text-amber-500">
                        <Icon size={20} />
                      </span>
                      {item.label}
                    </a>
                  );
                })}
              </div>

              <div className="mt-auto border-t border-black/10 pt-10 dark:border-white/10">
                <p className="font-luxury mb-3 text-2xl italic text-amber-500">
                  Luxe & Confidentialité.
                </p>

                <a
                  href={`tel:${phoneNumber.replaceAll(" ", "")}`}
                  className="mb-6 flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-400"
                >
                  <Phone size={16} className="text-amber-500" />
                  {phoneNumber}
                </a>

                <Link
                  href="/reservation"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-amber-600 py-6 text-center font-bold uppercase tracking-widest text-black transition-colors hover:bg-amber-500"
                >
                  Réserver mon instant
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}