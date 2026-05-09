"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Moon,
  Scissors,
  Sun,
} from "lucide-react";
import { authService } from "@/lib/authService";

const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

function ThemeModeButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 sm:w-auto sm:px-4"
      >
        <Moon size={18} />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-0 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white sm:w-auto sm:gap-2 sm:px-4"
      title={isDark ? "Passer en mode normal" : "Passer en mode sombre"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}

      <span className="hidden sm:inline">
        {isDark ? "Mode normal" : "Mode sombre"}
      </span>
    </button>
  );
}

function AdminNavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
        active
          ? "border-amber-400 bg-amber-400 text-black shadow-lg shadow-amber-500/20"
          : "border-slate-200 bg-white text-slate-700 hover:border-amber-400/50 hover:bg-amber-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setCheckingAuth(false);
      return;
    }

    const isConnected = authService.isAuthenticated();

    if (!isConnected) {
      router.replace("/admin/login");
      return;
    }

    setCheckingAuth(false);
  }, [pathname, router]);

  function logout() {
    authService.logout();
    router.replace("/admin/login");
  }

  if (checkingAuth) {
    return (
      <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md dark:border-white/10 dark:bg-[#050505]/90">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-lg shadow-amber-500/20">
            <Scissors size={20} />
          </div>

          <p className="text-sm font-bold text-slate-600 dark:text-gray-300">
            Vérification de la session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md dark:border-white/10 dark:bg-[#050505]/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-lg shadow-amber-500/20">
            <Scissors size={20} />
          </div>

          <div className="min-w-0">
            <h1
              className={`truncate text-xl font-serif font-bold sm:text-2xl ${goldText}`}
            >
              Dashboard Admin
            </h1>

            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-gray-400 sm:text-xs">
              Services, créneaux, rendez-vous et analyse intelligente
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeModeButton />

          <button
            type="button"
            onClick={logout}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
            title="Déconnexion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white/90 p-3 shadow-lg shadow-slate-200/50 dark:border-white/10 dark:bg-[#0D0D0D]/90 dark:shadow-black/30 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
              Navigation admin
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-gray-400">
              Gérez chaque module dans une page séparée.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <AdminNavLink
              href="/admin/dashboard"
              icon={<LayoutDashboard size={17} />}
              label="Dashboard"
            />

            <AdminNavLink
              href="/admin/services"
              icon={<Scissors size={17} />}
              label="Services"
            />

            <AdminNavLink
              href="/admin/creneaux"
              icon={<CalendarDays size={17} />}
              label="Créneaux"
            />

            <AdminNavLink
              href="/admin/analytics"
              icon={<BarChart3 size={17} />}
              label="Analyse"
            />
          </div>
        </div>
      </div>
    </div>
  );
}