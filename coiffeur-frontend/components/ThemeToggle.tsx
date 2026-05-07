"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Changer le thème"
        className="
          flex h-11 w-11 items-center justify-center rounded-full border
          border-black/10 bg-white text-black shadow-sm
          dark:border-white/10 dark:bg-white/10 dark:text-white
        "
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Changer le thème"
      title={isDark ? "Mode clair" : "Mode sombre"}
      className="
        group flex h-11 w-11 items-center justify-center rounded-full border
        border-black/10 bg-white text-black shadow-sm
        hover:border-amber-400 hover:bg-amber-400 hover:text-black
        dark:border-white/10 dark:bg-white/10 dark:text-white
      "
    >
      {isDark ? (
        <Sun size={18} className="transition-transform group-hover:rotate-90" />
      ) : (
        <Moon size={18} className="transition-transform group-hover:-rotate-12" />
      )}
    </button>
  );
}