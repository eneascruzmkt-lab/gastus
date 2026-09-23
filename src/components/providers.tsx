"use client";

import { SessionProvider } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";

const DarkModeContext = createContext({
  dark: false,
  toggle: () => {},
});

export function useDarkMode() {
  return useContext(DarkModeContext);
}

function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("gastus-dark-mode");
    // Dark por padrão: só desliga se explicitamente "false"
    if (stored === "false") {
      setDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
    // Sync with DB preference
    fetch("/api/configuracoes")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && typeof data.darkMode === "boolean") {
          setDark(data.darkMode);
          localStorage.setItem("gastus-dark-mode", String(data.darkMode));
          if (data.darkMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      })
      .catch(() => {});
  }, []);

  function toggle() {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("gastus-dark-mode", String(next));
      fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ darkMode: next }),
      }).catch(() => {});
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  }

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DarkModeProvider>{children}</DarkModeProvider>
    </SessionProvider>
  );
}
