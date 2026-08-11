import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
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
import MobileBottomNav from "./components/MobileBottomNav";
import "./index.css";
import "./App.css";

// Wrapper để ẩn Navbar trên trang auth
function AppContent() {
  const location = useLocation();
  const isAuthPage = ["/login", "/register", "/verify-email", "/forgot-password"].includes(location.pathname);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("blog_theme") === "dark";
  });
  const [search, setSearch] = useState("");

  // Áp dụng theme & màu chủ đề
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("blog_theme", isDark ? "dark" : "light");

    let savedAccent = localStorage.getItem("blog_accent_color") || "#4f46e5";
    if (["#f7971e", "#f39c12", "#ff9800", "#1877f2"].includes(savedAccent)) {
      savedAccent = "#4f46e5";
      localStorage.setItem("blog_accent_color", "#4f46e5");
    }
    document.documentElement.style.setProperty("--primary", savedAccent);
    document.documentElement.style.setProperty("--primary-light", `${savedAccent}1a`);
    document.documentElement.style.setProperty("--primary-hover", `${savedAccent}dd`);
    document.documentElement.style.setProperty("--text-link", savedAccent);
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);

  return (
    <>
      {!isAuthPage && (
        <Navbar
          isDark={isDark}
          onToggleTheme={toggleTheme}
          searchValue={search}
          onSearchChange={setSearch}
        />
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* BẮT BUỘC ĐĂNG NHẬP (PROTECTED ROUTES) DÀNH CHO KHÁCH VẮNG LAI */}
        <Route path="/" element={<ProtectedRoute><Home searchValue={search} /></ProtectedRoute>} />
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
            <div className="app-layout" style={{ display: "flex", justifyContent: "center", padding: "60px 16px" }}>
              <div className="card empty-state" style={{ maxWidth: 400 }}>
                <div className="empty-state-icon">🤔</div>
                <h3>404 - Trang không tồn tại</h3>
                <p>Trang bạn đang tìm không có ở đây.</p>
                <Link to="/" style={{ marginTop: 16, display: "block" }}>
                  <button className="btn btn-primary btn-full">← Về trang chủ</button>
                </Link>
              </div>
            </div>
          }
        />
      </Routes>

      {/* Floating Messenger Chat Window ở góc phải màn hình */}
      {!isAuthPage && <FloatingChatWidget />}
      {!isAuthPage && <MobileBottomNav />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
