"use client";

import { Clock, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";

const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

export default function ContactFooter() {
  return (
    <footer
      id="contact"
      className="
        border-t pb-12 pt-24
        border-slate-200 bg-slate-950 text-white
        dark:border-[#F59E0B]/20 dark:bg-black
      "
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <span
              className={`font-serif text-3xl font-bold tracking-tighter ${goldText}`}
            >
              PRESTIGE.
            </span>

            <p className="mt-6 max-w-sm text-sm leading-relaxed text-gray-400">
              L'adresse de référence pour l'homme d'influence à Alger. Un
              espace confidentiel pour une image impeccable.
            </p>

            <div className="mt-8 flex gap-4">
              <a
                href="https://www.instagram.com/prestige_salon"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-gray-400 transition-all hover:border-[#FBBF24] hover:text-[#FBBF24]"
                aria-label="Instagram"
              >
                <FaInstagram size={18} />
              </a>

              <a
                href="https://www.facebook.com/prestige_salon"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-gray-400 transition-all hover:border-[#FBBF24] hover:text-[#FBBF24]"
                aria-label="Facebook"
              >
                <FaFacebookF size={18} />
              </a>

              <a
                href="https://wa.me/213555000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-gray-400 transition-all hover:border-[#FBBF24] hover:text-[#FBBF24]"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 text-[11px] font-black uppercase tracking-widest text-[#FBBF24]">
              Contact
            </h4>

            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-3">
                <MapPin size={16} className="text-[#FBBF24]" />
                12 Rue des Jardins, Hydra, Alger
              </li>

              <li>
                <a
                  href="tel:+213555000000"
                  className="flex items-center gap-3 transition-colors hover:text-[#FBBF24]"
                >
                  <Phone size={16} className="text-[#FBBF24]" />
                  +213 (0) 555 00 00 00
                </a>
              </li>

              <li>
                <a
                  href="https://wa.me/213555000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-colors hover:text-[#FBBF24]"
                >
                  <FaWhatsapp size={16} className="text-[#FBBF24]" />
                  WhatsApp
                </a>
              </li>

              <li>
                <a
                  href="https://www.instagram.com/prestige_salon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-colors hover:text-[#FBBF24]"
                >
                  <FaInstagram size={16} className="text-[#FBBF24]" />
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[11px] font-black uppercase tracking-widest text-[#FBBF24]">
              Horaires
            </h4>

            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-3 text-white">
                <Clock size={16} className="text-[#FBBF24]" />
                Sam - Jeu : 09:00 - 20:00
              </li>

              <li className="pl-7 text-xs italic opacity-50">
                Vendredi : Service VIP sur demande
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-24 border-t border-white/5 pt-8 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
          © 2026 PRESTIGE SALON PRIVÉ - ÉLÉGANCE ABSOLUE
        </div>
      </div>
    </footer>
  );
}