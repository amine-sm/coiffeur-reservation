import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  BadgeCheck,
  Crown,
  Gem,
  Sparkle,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFB] text-slate-900 selection:bg-[#1B4F59] selection:text-white">
      <Navbar />

      {/* ----- HERO ----- */}
      <section className="relative overflow-hidden px-5 pb-24 pt-40 lg:pb-32 lg:pt-52">
        {/* Fond décoratif sophistiqué */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#1B4F59]/20 via-[#1B4F59]/5 to-transparent blur-3xl" />
          <div className="absolute -right-32 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#FE5737]/15 via-[#FE5737]/5 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#D4AF37]/10 to-transparent blur-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxQjRGNTkiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#1B4F59]/20 bg-white/90 px-5 py-2.5 shadow-lg shadow-[#1B4F59]/5 backdrop-blur-md animate-fade-up">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FE5737] opacity-70" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#FE5737]" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[#1B4F59]">
                Salon de coiffure d'exception
              </span>
              <Crown size={14} className="ml-1 text-[#D4AF37]" />
            </div>

            <h1 className="animate-fade-up-delay text-6xl font-black tracking-[-0.04em] text-slate-950 sm:text-7xl lg:text-8xl">
              Votre style,{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-[#1B4F59] via-[#2E7D8A] to-[#FE5737] bg-clip-text text-transparent">
                  une signature.
                </span>
                <span className="absolute -bottom-2 left-0 h-1.5 w-full rounded-full bg-gradient-to-r from-[#1B4F59] via-[#2E7D8A] to-[#FE5737] opacity-30 blur-sm" />
              </span>
            </h1>

            <p className="animate-fade-up-delay-2 mt-8 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Coupe, barbe, soins et bien plus encore dans un cadre pensé pour
              votre confort. Réservation fluide, service soigné et ambiance
              moderne.
            </p>

            <div className="animate-fade-up-delay-3 mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/reservation"
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#FE5737] to-[#FF7F5C] px-9 py-4.5 text-sm font-black text-white shadow-2xl shadow-[#FE5737]/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[#FE5737]/40 hover:scale-[1.02] active:scale-95"
              >
                <span className="absolute inset-0 -z-0 bg-gradient-to-r from-[#FF7F5C] to-[#FE5737] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="relative z-10 flex items-center gap-2">
                  Réserver maintenant
                  <CalendarDays size={18} className="transition-transform duration-500 group-hover:rotate-12" />
                </span>
              </Link>

              <Link
                href="/services"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-9 py-4.5 text-sm font-black text-slate-800 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:border-[#1B4F59]/40 hover:text-[#1B4F59] hover:shadow-xl"
              >
                Nos services
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <HeroBadge icon={<ShieldCheck size={16} />} text="Hygiène irréprochable" />
              <HeroBadge icon={<Clock3 size={16} />} text="RDV express" />
              <HeroBadge icon={<Gem size={16} />} text="Service haut de gamme" />
            </div>
          </div>

          <div className="relative animate-fade-up-delay-2 lg:translate-x-8">
            <div className="absolute -left-10 -top-10 hidden h-36 w-36 rounded-[48px] bg-gradient-to-br from-[#FE5737]/15 to-[#1B4F59]/15 blur-2xl lg:block" />
            <div className="absolute -bottom-10 -right-10 hidden h-48 w-48 rounded-[48px] bg-gradient-to-br from-[#1B4F59]/20 to-[#D4AF37]/10 blur-2xl lg:block" />

            <div className="group relative overflow-hidden rounded-[48px] border border-white/80 bg-white p-3 shadow-[0_35px_100px_rgba(27,79,89,0.15)] backdrop-blur-sm transition-all duration-700 hover:shadow-[0_45px_120px_rgba(27,79,89,0.2)]">
              <div className="relative h-[520px] overflow-hidden rounded-[38px]">
                <img
                  src="https://images.unsplash.com/photo-1621605815841-aa8975485d49?auto=format&fit=crop&q=80&w=1200"
                  alt="Salon de coiffure Prestige"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />

                {/* Badge ouverture */}
                <div className="absolute left-6 top-6 rounded-2xl border border-white/40 bg-white/90 px-5 py-3 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:scale-105">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FE5737]">
                    Ouvert
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-950">
                    Aujourd’hui 09h - 18h
                  </p>
                </div>

                {/* Carte info */}
                <div className="absolute bottom-6 left-6 right-6 rounded-[32px] border border-white/60 bg-white/85 p-5 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:bg-white/95">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-slate-950">
                        Coiffeur Prestige
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                        <MapPin size={16} className="text-[#1B4F59]" />
                        Alger, Algérie
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FE5737]/15 to-[#FE5737]/10 px-4 py-2 shadow-inner">
                      <Star size={16} className="fill-[#FE5737] text-[#FE5737]" />
                      <span className="text-base font-black text-[#FE5737]">4.9</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----- SERVICES ----- */}
      <section className="relative px-5 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-[#FE5737]">
                <Sparkle size={14} className="fill-[#FE5737]" />
                Nos expertises
              </p>
              <h2 className="mt-3 text-5xl font-black tracking-tight text-slate-950 lg:text-6xl">
                Des prestations pensées pour vous.
              </h2>
            </div>

            <p className="max-w-md text-base leading-7 text-slate-500">
              Chaque service est décrit simplement pour vous aider à choisir le
              créneau idéal, sans surprise.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ServiceCard
              icon={<Scissors size={26} />}
              title="Coupe homme"
              description="Moderne, classique ou dégradé, selon votre morphologie."
              price="800 DA"
            />

            <ServiceCard
              icon={<UserCheck size={26} />}
              title="Barbe"
              description="Traçage précis, rasage traditionnel et soin de la peau."
              price="500 DA"
            />

            <ServiceCard
              icon={<Sparkles size={26} />}
              title="Coupe + barbe"
              description="Le duo gagnant pour un look impeccable et durable."
              price="1200 DA"
              highlight
            />

            <ServiceCard
              icon={<BadgeCheck size={26} />}
              title="Soin capillaire"
              description="Hydratation, brillance et vigueur pour vos cheveux."
              price="1000 DA"
            />
          </div>
        </div>
      </section>

      {/* ----- À PROPOS ----- */}
      <section className="border-y border-slate-200/70 bg-gradient-to-b from-white to-[#F8FAFB] px-5 py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div className="group relative overflow-hidden rounded-[44px] border border-white bg-slate-50/50 p-3 shadow-2xl shadow-slate-200/50 transition-all duration-700 hover:shadow-2xl hover:shadow-slate-200/80">
            <div className="absolute inset-0 rounded-[44px] bg-gradient-to-tr from-[#1B4F59]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <img
              src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200"
              alt="Intérieur salon"
              className="relative h-[480px] w-full rounded-[34px] object-cover shadow-inner"
            />
            {/* Badge flottant */}
            <div className="absolute bottom-6 left-6 rounded-2xl border border-white/70 bg-white/80 px-5 py-3 backdrop-blur-xl shadow-lg">
              <p className="text-sm font-black text-slate-900">⭐ 4.9/5 sur +200 avis</p>
            </div>
          </div>

          <div>
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-[#FE5737]">
              <Crown size={14} className="text-[#D4AF37]" />
              Notre philosophie
            </p>

            <h2 className="mt-4 text-5xl font-black tracking-tight text-slate-950 lg:text-6xl">
              L’art du détail, <br /> la culture du soin.
            </h2>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Dans notre salon, chaque geste compte. Nous avons pensé un espace
              où le style rencontre le bien‑être : matériel stérilisé, fauteuils
              ergonomiques, et un savoir‑faire transmis avec passion.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              <AdvantageCard
                title="Respect du temps"
                text="Créneaux optimisés, sans attente inutile."
              />
              <AdvantageCard
                title="Confort maximal"
                text="Ambiance tamisée, boissons offertes."
              />
              <AdvantageCard
                title="Résultat durable"
                text="Produits professionnels et gestes techniques."
              />
              <AdvantageCard
                title="Réservation 24/7"
                text="Prenez rendez-vous depuis votre téléphone."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ----- INFOS PRATIQUES ----- */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            <InfoBox
              icon={<MapPin size={22} />}
              title="Adresse"
              text="45, rue Didouche Mourad, Alger"
            />

            <InfoBox
              icon={<Clock3 size={22} />}
              title="Horaires"
              text="Sam - Jeu : 09h00 - 18h00"
            />

            <InfoBox
              icon={<Phone size={22} />}
              title="Contact"
              text="+213 555 12 34 56"
            />
          </div>
        </div>
      </section>

      {/* ----- CTA ----- */}
      <section className="px-5 pb-28">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[44px] border border-[#1B4F59]/10 bg-gradient-to-br from-[#0F2A30] via-[#1B4F59] to-[#0F2A30] p-10 shadow-[0_30px_100px_rgba(15,42,48,0.3)] md:p-16">
          <div className="grid items-center gap-12 md:grid-cols-[1.3fr_0.7fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
                <CalendarDays size={15} />
                Réservation prioritaire
              </div>

              <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
                Prêt à sublimer votre style ?
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
                Choisissez votre service, créez un compte en 30 secondes et
                verrouillez votre créneau. Aucun appel nécessaire.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/reservation"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-9 py-4.5 text-sm font-black text-[#1B4F59] shadow-2xl shadow-white/10 transition-all duration-500 hover:-translate-y-1 hover:bg-[#F8FAFB] hover:shadow-white/20"
                >
                  Prendre rendez-vous
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-white/30 px-9 py-4.5 text-sm font-black text-white backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-white/60 hover:bg-white/10"
                >
                  Nous contacter
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatBox value="4.9" label="Avis clients" />
              <StatBox value="20+" label="Services / jour" />
              <StatBox value="09h" label="Ouverture" />
              <StatBox value="100%" label="Sur RDV" />
            </div>
          </div>
        </div>
      </section>

      {/* ----- FOOTER ----- */}
      <footer className="border-t border-slate-200 bg-white px-5 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E7D8A] text-white shadow-lg shadow-[#1B4F59]/20">
              <Scissors size={22} />
            </div>

            <div>
              <p className="text-xl font-black text-slate-950">Coiffeur Prestige</p>
              <p className="text-sm font-medium text-slate-400">
                L’excellence à chaque coupe
              </p>
            </div>
          </div>

          <p className="text-center text-sm font-medium text-slate-400">
            © {new Date().getFullYear()} Coiffeur Prestige. Tous droits réservés.
          </p>

          <div className="flex gap-8 text-sm font-bold text-slate-600">
            <Link href="/services" className="transition-colors hover:text-[#1B4F59]">
              Services
            </Link>
            <Link href="/reservation" className="transition-colors hover:text-[#1B4F59]">
              Réservation
            </Link>
            <Link href="/contact" className="transition-colors hover:text-[#1B4F59]">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─── Composants réutilisables ────────────────────────────────────────────────

function HeroBadge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/95 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1B4F59]/30 hover:text-[#1B4F59] hover:shadow-xl">
      <span className="text-[#1B4F59]">{icon}</span>
      {text}
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  description,
  price,
  highlight = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  price: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group relative rounded-[34px] border p-7 transition-all duration-500 hover:-translate-y-3 ${
        highlight
          ? "border-[#FE5737] bg-gradient-to-br from-[#FE5737] to-[#FF7F5C] text-white shadow-2xl shadow-[#FE5737]/25"
          : "border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-200/50 hover:border-[#1B4F59]/30 hover:shadow-2xl hover:shadow-[#1B4F59]/5"
      }`}
    >
      {/* Effet de brillance */}
      {highlight && (
        <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl transition-all duration-700 group-hover:bg-white/20" />
      )}

      <div
        className={`mb-7 flex h-15 w-15 items-center justify-center rounded-2xl transition-all duration-500 ${
          highlight
            ? "bg-white/20 text-white"
            : "bg-[#1B4F59]/8 text-[#1B4F59] group-hover:bg-[#1B4F59] group-hover:text-white"
        }`}
      >
        {icon}
      </div>

      <h3 className="text-2xl font-black">{title}</h3>

      <p
        className={`mt-3 text-sm leading-7 ${
          highlight ? "text-white/85" : "text-slate-500"
        }`}
      >
        {description}
      </p>

      <div className="mt-7 flex items-center justify-between">
        <p
          className={`text-lg font-black ${
            highlight ? "text-white" : "text-[#FE5737]"
          }`}
        >
          {price}
        </p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            highlight
              ? "bg-white/20 text-white"
              : "bg-[#1B4F59]/10 text-[#1B4F59] group-hover:bg-[#1B4F59] group-hover:text-white"
          }`}
        >
          ≈ 30 min
        </span>
      </div>
    </div>
  );
}

function AdvantageCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-500 hover:-translate-y-1.5 hover:border-[#1B4F59]/30 hover:shadow-xl">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1B4F59]/10 to-[#1B4F59]/5 text-[#1B4F59] transition-colors group-hover:bg-[#1B4F59] group-hover:text-white">
        <CheckCircle2 size={20} />
      </div>

      <h3 className="font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function InfoBox({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-[32px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 hover:border-[#1B4F59]/30 hover:shadow-2xl hover:shadow-[#1B4F59]/10">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59]/10 to-[#1B4F59]/5 text-[#1B4F59] transition-all group-hover:bg-[#1B4F59] group-hover:text-white group-hover:shadow-lg">
        {icon}
      </div>

      <h3 className="text-2xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-base font-semibold leading-7 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[28px] border border-white/20 bg-white/10 p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:bg-white/20 hover:shadow-2xl">
      <p className="text-4xl font-black tracking-tight text-white drop-shadow-lg">
        {value}
      </p>
      <p className="mt-2 text-sm font-bold text-white/70">{label}</p>
    </div>
  );
}