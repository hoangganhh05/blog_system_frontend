import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, Eye, EyeOff, Sparkles, ArrowRight, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

import Logo from "../components/Logo";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  const rotatingWords = ["Đam mê", "Cảm xúc", "Ý tưởng", "Tri thức"];

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginInput = (form.email || "").trim();
    if (!loginInput || !form.password.trim()) {
      return setError("Vui lòng nhập đầy đủ thông tin Email / Tên đăng nhập và Mật khẩu!");
    }
    setLoading(true);
    try {
      const res = await userService.login(loginInput, form.password);
      login(res.data);
      navigate(from, { replace: true });
    } catch (err) {
      const serverMsg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message;
      setError(
        serverMsg || "Đăng nhập thất bại. Vui lòng kiểm tra lại Email và Mật khẩu!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b0f19] transition-colors duration-200 relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full">
        {/* Left Column - Hero Introduction */}
        <div className="hidden lg:flex flex-col justify-center p-12 lg:p-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 relative overflow-hidden animate-slide-in-left">
          {/* Background patterns with glow animation */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl animate-glow" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-white rounded-full blur-3xl animate-glow" style={{ animationDelay: '2s' }} />
          </div>
          
          <div className="relative z-10 text-white animate-float">
            <div className="mb-8">
              <Logo size="xl" showGlow={true} />
              <h1 className="text-4xl lg:text-5xl font-black mt-6 tracking-tight">
                BlogViet
              </h1>
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-black mb-4 leading-tight drop-shadow-md">
              Kết nối câu chuyện.
            </h2>
            
            <p className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent mb-6">
              Chia sẻ <span className="inline-block transition-all duration-500">{rotatingWords[rotatingIndex]}</span>
            </p>
            
            <p className="text-lg text-white/80 leading-relaxed">
              Không gian sáng tạo dành riêng cho bạn.
            </p>
          </div>
        </div>

        {/* Right Column - Login Form */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 p-7 sm:p-9 shadow-xl animate-slide-in-right">
            {/* Header Form */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="lg:hidden mb-4">
                <Logo size="xl" showGlow={true} />
              </div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Đăng nhập BlogViet
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-xs">
                Chào mừng trở lại! Đăng nhập để chia sẻ câu chuyện và kết nối cùng cộng đồng.
              </p>
            </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 mb-5 animate-in fade-in duration-150 flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Email hoặc Tên đăng nhập
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="email"
                type="text"
                name="email"
                placeholder="name@example.com hoặc username"
                value={form.email}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-zinc-500 hover:text-black dark:hover:text-white transition"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer p-1"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-bold text-xs sm:text-sm transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Prompt */}
        <div className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline transition"
            >
              Đăng ký tài khoản mới
            </Link>
          </p>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
