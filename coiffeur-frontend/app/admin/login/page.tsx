"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/authService";
import { Lock, Scissors, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Styles réutilisables
  const goldText = "bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent";
  const goldBg = "bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600";

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

    const res = await authService.login(form);

    if (res.success && res.token) {
      authService.saveToken(res.token);
      router.push("/admin/dashboard");
    } else {
      setMessage(res.message || "Identifiants incorrects");
    }

    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#050505] px-5 overflow-hidden">
      {/* ========== EFFETS D'ARRIÈRE-PLAN ========== */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[60%] bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] bg-white/[0.02] blur-[100px] rounded-full" />
      </div>

      {/* ========== CARTE DE CONNEXION ========== */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="group overflow-hidden rounded-[40px] border border-white/10 bg-neutral-900/50 p-10 shadow-2xl backdrop-blur-2xl">
          
          {/* Logo animé */}
          <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-spin-slow rounded-3xl border border-amber-500/30" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-800 to-black border border-white/10 text-amber-400 shadow-xl">
              <Scissors size={32} />
            </div>
          </div>

          <div className="text-center">
            <h1 className={`text-3xl font-serif font-light tracking-tight text-white`}>
              Espace <span className={goldText}>Premium</span>
            </h1>
            <p className="mt-3 text-sm font-light tracking-widest text-neutral-500 uppercase">
              Administration Privée
            </p>
          </div>

          {/* Message d'erreur */}
          {message && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-xs font-medium text-red-400"
            >
              {message}
            </motion.div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div className="space-y-2">
              <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                Identifiant
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-sm text-white outline-none transition-all focus:border-amber-500/50 focus:bg-white/[0.08]"
                  placeholder="nom@prestige.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-sm text-white outline-none transition-all focus:border-amber-500/50 focus:bg-white/[0.08]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl py-4.5 font-black uppercase tracking-widest text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${goldBg}`}
              style={{ height: '60px' }}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Accéder au Salon</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
              
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </button>
          </form>

          {/* Footer discret */}
          <p className="mt-10 text-center text-[10px] uppercase tracking-widest text-neutral-600">
            Accès sécurisé • Prestige v2.0
          </p>
        </div>

        {/* Décoration extérieure */}
        <div className="mt-8 flex justify-center gap-8 text-neutral-500 transition-opacity hover:opacity-100 opacity-40">
           <button onClick={() => router.push('/')} className="text-[10px] font-bold uppercase tracking-widest hover:text-amber-500">Retour au site</button>
           <span className="text-neutral-800">|</span>
           <span className="text-[10px] font-bold uppercase tracking-widest">Support technique</span>
        </div>
      </motion.div>

      {/* Animation Spin pour le logo */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </main>
  );
}