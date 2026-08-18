import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

function getEffectiveTheme(themeMode) {
  if (themeMode === "dark") return true;
  if (themeMode === "light") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("blog_theme_mode") || (localStorage.getItem("theme") ? localStorage.getItem("theme") : "system");
  });
  const [isDark, setIsDark] = useState(() => getEffectiveTheme(themeMode));

  useEffect(() => {
    const updateTheme = () => {
      const effectiveDark = getEffectiveTheme(themeMode);
      setIsDark(effectiveDark);
      document.documentElement.setAttribute("data-theme", effectiveDark ? "dark" : "light");
      if (effectiveDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        localStorage.setItem("blog_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        localStorage.setItem("blog_theme", "light");
      }
      localStorage.setItem("blog_theme_mode", themeMode);
    };

    updateTheme();

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => updateTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (mode) => {
    setThemeMode(mode);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme, themeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
