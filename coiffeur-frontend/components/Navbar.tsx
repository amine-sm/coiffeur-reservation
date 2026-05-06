"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Menu,
  X,
  Home,
  Scissors,
  Image,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Accueil", href: "/", icon: <Home size={18} /> },
    { label: "Services", href: "/services", icon: <Scissors size={18} /> },
    { label: "Galerie", href: "/galerie", icon: <Image size={18} /> },
    { label: "Contact", href: "/contact", icon: <Phone size={18} /> },
    { label: "Admin", href: "/admin/login", icon: <ShieldCheck size={18} /> },
  ];

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-slate-200/80 bg-white/92 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-2xl"
          : "bg-white/75 py-5 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E7D8A] text-white shadow-lg shadow-[#1B4F59]/20 transition-all duration-300 group-hover:-rotate-3 group-hover:scale-105">
            <Scissors size={22} />
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-black leading-none tracking-tight text-slate-950">
              Coiffeur Prestige
            </span>
            <span className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#FE5737]">
              Salon privé
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/75 p-1.5 shadow-sm backdrop-blur-xl md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-[#1B4F59] text-white shadow-md shadow-[#1B4F59]/20"
                    : "text-slate-600 hover:bg-[#1B4F59]/8 hover:text-[#1B4F59]"
                }`}
              >
                <span
                  className={`transition-transform duration-300 group-hover:-translate-y-0.5 ${
                    isActive ? "text-white" : "text-slate-500 group-hover:text-[#1B4F59]"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/reservation"
            className="group flex items-center gap-2 rounded-2xl bg-[#FE5737] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#FE5737]/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e94c2f] hover:shadow-xl hover:shadow-[#FE5737]/30 active:scale-95"
          >
            <CalendarDays size={18} className="transition-transform duration-300 group-hover:rotate-12" />
            Réserver
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Ouvrir le menu"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 hover:border-[#1B4F59]/30 hover:text-[#1B4F59] active:scale-90 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className={`absolute inset-x-0 top-full mx-4 mt-3 overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl transition-all duration-500 md:hidden ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-4 rounded-2xl px-4 py-4 text-base font-extrabold transition-all duration-300 ${
                  isActive
                    ? "bg-[#1B4F59] text-white"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#1B4F59]"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-[#1B4F59]/8 text-[#1B4F59]"
                  }`}
                >
                  {item.icon}
                </div>
                {item.label}
              </Link>
            );
          })}

          <div className="mt-3 border-t border-slate-100 pt-3">
            <Link
              href="/reservation"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-3 rounded-[22px] bg-[#FE5737] py-4 text-center font-black text-white shadow-xl shadow-[#FE5737]/20 transition-all active:scale-95"
            >
              <CalendarDays size={20} />
              Prendre rendez-vous
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}