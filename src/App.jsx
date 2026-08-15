import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { MusicProvider } from "./context/MusicContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PostDetail from "./pages/PostDetail";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SavedPosts from "./pages/SavedPosts";
import RadioPage from "./pages/RadioPage";
import TrendingPage from "./pages/TrendingPage";
import GamesPage from "./pages/GamesPage";
import AiCreatorPage from "./pages/AiCreatorPage";
import VideosPage from "./pages/VideosPage";
import NotificationsPage from "./pages/NotificationsPage";
import SecuritySettingsPage from "./pages/SecuritySettingsPage";
import FriendsPage from "./pages/FriendsPage";
import SearchPage from "./pages/SearchPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import FloatingChatWidget from "./components/FloatingChatWidget";

function getEffectiveTheme(themeMode) {
  if (themeMode === "dark") return true;
  if (themeMode === "light") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = ["/login", "/register", "/verify-email", "/forgot-password"].includes(location.pathname);

  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("blog_theme_mode") || (localStorage.getItem("theme") ? localStorage.getItem("theme") : "system");
  });

  const [isCompact, setIsCompact] = useState(() => {
    return localStorage.getItem("blog_compact_mode") === "true";
  });

  const [isDark, setIsDark] = useState(() => getEffectiveTheme(themeMode));

  // Sync theme mode changes & system prefers-color-scheme listener
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

  // Sync compact mode
  useEffect(() => {
    if (isCompact) {
      document.documentElement.classList.add("compact");
      localStorage.setItem("blog_compact_mode", "true");
    } else {
      document.documentElement.classList.remove("compact");
      localStorage.setItem("blog_compact_mode", "false");
    }
  }, [isCompact]);

  // Listen to custom window events from settings page
  useEffect(() => {
    const handleThemeEvent = (e) => {
      if (e.detail?.mode) {
        setThemeMode(e.detail.mode);
      }
    };
    const handleCompactEvent = (e) => {
      if (typeof e.detail?.isCompact === "boolean") {
        setIsCompact(e.detail.isCompact);
      }
    };

    window.addEventListener("theme_mode_changed", handleThemeEvent);
    window.addEventListener("compact_mode_changed", handleCompactEvent);
    return () => {
      window.removeEventListener("theme_mode_changed", handleThemeEvent);
      window.removeEventListener("compact_mode_changed", handleCompactEvent);
    };
  }, []);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        richColors={false}
        theme={isDark ? "dark" : "light"}
        toastOptions={{
          className:
            "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-2xl shadow-xl text-xs font-medium px-4 py-3",
        }}
      />
      <MainLayout isDark={isDark} onToggleTheme={toggleTheme}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/posts/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><VideosPage /></ProtectedRoute>} />
          <Route path="/radio" element={<ProtectedRoute><RadioPage /></ProtectedRoute>} />
          <Route path="/trending" element={<ProtectedRoute><TrendingPage /></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
          <Route path="/ai-creator" element={<ProtectedRoute><AiCreatorPage /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute><SecuritySettingsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SecuritySettingsPage /></ProtectedRoute>} />
          <Route path="/settings/privacy" element={<ProtectedRoute><SecuritySettingsPage /></ProtectedRoute>} />
          <Route path="/security-settings" element={<ProtectedRoute><SecuritySettingsPage /></ProtectedRoute>} />
          <Route path="/privacy" element={<ProtectedRoute><SecuritySettingsPage /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="p-12 text-center text-zinc-500 flex flex-col items-center gap-3">
                <span className="text-4xl">🤔</span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">404 - Trang không tồn tại</h3>
                <p className="text-xs text-zinc-400">Trang bạn đang tìm không có ở đây.</p>
                <Link to="/" className="px-5 py-2 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold mt-2">
                  ← Về trang chủ
                </Link>
              </div>
            }
          />
        </Routes>
      </MainLayout>

      {/* Floating Messenger Widget — OUTSIDE MainLayout, always fixed on screen */}
      <FloatingChatWidget />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MusicProvider>
          <AppContent />
        </MusicProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
