import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
import "./index.css";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const isAuthPage = ["/login", "/register", "/verify-email", "/forgot-password"].includes(location.pathname);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("blog_theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("blog_theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);

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

      {/* Floating Messenger Widget */}
      <FloatingChatWidget />
    </MainLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
