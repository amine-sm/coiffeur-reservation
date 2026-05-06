"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/authService";
import { Lock, Scissors } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      setMessage(res.message || "Connexion impossible");
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B4F59] text-white">
          <Scissors size={32} />
        </div>

        <h1 className="mt-6 text-center text-3xl font-black text-[#1B4F59]">
          Connexion Admin
        </h1>

        <p className="mt-2 text-center text-sm text-slate-500">
          Accédez au dashboard du salon
        </p>

        {message && (
          <div className="mt-6 rounded-xl bg-red-50 p-3 text-center text-sm font-black text-red-600">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Email
            </label>

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
              placeholder="admin@salon.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Mot de passe
            </label>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FE5737] px-6 py-4 font-black text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            <Lock size={18} />
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}