import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

const VALID_MODES = ["dark", "light", "system"];

function getEffectiveTheme(themeMode) {
  if (themeMode === "dark") return true;
  if (themeMode === "light") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readSavedThemeMode() {
  const saved = localStorage.getItem("blog_theme_mode");
  if (saved && VALID_MODES.includes(saved)) return saved;
  // Fallback: nếu blog_theme_mode chưa tồn tại, thử đọc key "theme" cũ
  const legacy = localStorage.getItem("theme");
  if (legacy === "dark" || legacy === "light") return legacy;
  return "system";
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => readSavedThemeMode());
  const [isDark, setIsDark] = useState(() => getEffectiveTheme(themeMode));

  useEffect(() => {
    const updateTheme = (mode) => {
      const effectiveDark = getEffectiveTheme(mode);
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
      localStorage.setItem("blog_theme_mode", mode);
    };

    updateTheme(themeMode);

    let mediaQuery;
    let mediaHandler;
    if (themeMode === "system") {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaHandler = () => updateTheme("system");
      mediaQuery.addEventListener("change", mediaHandler);
    }

    // Lắng nghe event từ SecuritySettingsPage (và bất kỳ nơi nào dispatch "theme_mode_changed")
    const handleExternalThemeChange = (e) => {
      const mode = e?.detail?.mode;
      if (mode && VALID_MODES.includes(mode)) {
        setThemeMode(mode);
      }
    };
    window.addEventListener("theme_mode_changed", handleExternalThemeChange);

    return () => {
      if (mediaQuery && mediaHandler) {
        mediaQuery.removeEventListener("change", mediaHandler);
      }
      window.removeEventListener("theme_mode_changed", handleExternalThemeChange);
    };
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
