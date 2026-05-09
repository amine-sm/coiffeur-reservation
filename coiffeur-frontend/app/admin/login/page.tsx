"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/authService";
import ThemeToggle from "@/components/ThemeToggle";
import { Scissors, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const goldText =
    "bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent";

  const goldBg =
    "bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const res = await authService.login(form);

      if (res.success && res.token) {
        authService.saveToken(res.token);
        router.replace("/admin/dashboard");
      } else {
        setMessage(res.message || "Identifiants incorrects");
      }
    } catch (error) {
      console.error("Erreur login :", error);
      setMessage("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="
        relative flex min-h-screen items-center justify-center overflow-hidden px-5
        bg-slate-50 text-slate-950
        dark:bg-[#050505] dark:text-white
      "
    >
      {/* Bouton mode sombre / clair */}
      <div className="fixed right-5 top-5 z-50">
        <ThemeToggle />
      </div>

      {/* Effets arrière-plan */}
      <div className="absolute left-1/2 top-0 -z-10 h-full w-full -translate-x-1/2">
        <div className="absolute right-[-10%] top-[-10%] h-[60%] w-[50%] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[50%] w-[40%] rounded-full bg-black/[0.03] blur-[100px] dark:bg-white/[0.02]" />
      </div>

      {/* Carte de connexion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
        }}
        className="relative w-full max-w-md"
      >
        <div
          className="
            group overflow-hidden rounded-[40px] border p-8 shadow-2xl backdrop-blur-2xl sm:p-10
            border-slate-200 bg-white/80 shadow-slate-200/70
            dark:border-white/10 dark:bg-neutral-900/50 dark:shadow-black/40
          "
        >
          {/* Logo animé */}
          <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-[spin_8s_linear_infinite] rounded-3xl border border-amber-500/30" />

            <div
              className="
                flex h-16 w-16 items-center justify-center rounded-2xl border text-amber-500 shadow-xl
                border-slate-200 bg-gradient-to-br from-white to-slate-100
                dark:border-white/10 dark:from-neutral-800 dark:to-black dark:text-amber-400
              "
            >
              <Scissors size={32} />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-serif font-light tracking-tight text-slate-950 dark:text-white">
              Espace <span className={goldText}>Premium</span>
            </h1>

            <p className="mt-3 text-sm font-light uppercase tracking-widest text-slate-500 dark:text-neutral-500">
              Administration Privée
            </p>
          </div>

          {/* Message d'erreur */}
          {message && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="
                mt-6 rounded-2xl border border-red-500/20 bg-red-500/10
                p-4 text-center text-xs font-medium text-red-500 dark:text-red-400
              "
            >
              {message}
            </motion.div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div className="space-y-2">
              <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-neutral-500">
                Identifiant
              </label>

              <div className="relative">
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="
                    w-full rounded-2xl border px-5 py-4 text-sm outline-none transition-all
                    border-slate-200 bg-slate-50 text-slate-950 placeholder-slate-400
                    focus:border-amber-500/50 focus:bg-white focus:ring-2 focus:ring-amber-500/10
                    dark:border-white/5 dark:bg-white/5 dark:text-white dark:placeholder-neutral-600
                    dark:focus:bg-white/[0.08]
                  "
                  placeholder="nom@prestige.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-neutral-500">
                Mot de passe
              </label>

              <div className="relative">
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="
                    w-full rounded-2xl border px-5 py-4 text-sm outline-none transition-all
                    border-slate-200 bg-slate-50 text-slate-950 placeholder-slate-400
                    focus:border-amber-500/50 focus:bg-white focus:ring-2 focus:ring-amber-500/10
                    dark:border-white/5 dark:bg-white/5 dark:text-white dark:placeholder-neutral-600
                    dark:focus:bg-white/[0.08]
                  "
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`
                group relative flex w-full items-center justify-center gap-3 overflow-hidden
                rounded-2xl py-4 font-black uppercase tracking-widest text-black
                transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50
                ${goldBg}
              `}
              style={{
                height: "60px",
              }}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <ShieldCheck size={18} />

                  <span>Accéder au Salon</span>

                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}

              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] uppercase tracking-widest text-slate-500 dark:text-neutral-600">
            Accès sécurisé • Prestige v2.0
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-8 text-slate-500 opacity-60 transition-opacity hover:opacity-100 dark:text-neutral-500">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[10px] font-bold uppercase tracking-widest hover:text-amber-500"
          >
            Retour au site
          </button>

          <span className="text-slate-300 dark:text-neutral-800">|</span>

          <span className="text-[10px] font-bold uppercase tracking-widest">
            Support technique
          </span>
        </div>
      </motion.div>
    </main>
  );
}