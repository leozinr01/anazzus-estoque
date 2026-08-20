import { useEffect, useState } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("anazzus-theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("anazzus-theme", isDark ? "dark" : "light");
    } catch {
      /* noop */
    }
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return { isDark, setIsDark, toggle: () => setIsDark((v) => !v) };
}
