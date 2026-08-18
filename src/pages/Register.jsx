import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, ArrowRight, User, Mail, Lock, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

import Logo from "../components/Logo";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const validate = () => {
    if (!form.fullName.trim()) return "Vui lòng nhập họ và tên của bạn!";
    if (!form.username.trim()) return "Vui lòng nhập tên đăng nhập!";
    if (form.username.trim().length < 3) return "Tên đăng nhập phải có ít nhất 3 ký tự!";
    if (!form.email.trim() || !form.email.includes("@")) return "Địa chỉ Email không hợp lệ!";
    if (form.password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự!";
    if (form.password !== form.confirmPassword) return "Mật khẩu xác nhận không khớp!";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);

    setLoading(true);
    try {
      const response = await userService.register({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "USER",
      });
      login(response.data);
      navigate("/", { replace: true });
    } catch (err) {
      const serverMsg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message;
      setError(
        serverMsg || "Đăng ký thất bại. Tên đăng nhập hoặc Email có thể đã được sử dụng!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Subtle Dot Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] pointer-events-none opacity-50" />
      
      {/* Clean Card Container */}
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 animate-slide-in-left">
        {/* Left Column - Hero Introduction */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white dark:from-zinc-900 dark:to-zinc-950 p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-zinc-800">
          {/* Top Section - Branding */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Logo size="xl" showGlow={false} />
              <span className="text-2xl font-bold text-slate-900 dark:text-white">BlogViet</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold mt-4">
              <span>✨</span>
              <span>Nền tảng kết nối</span>
            </div>
          </div>
          
          {/* Middle Section - Slogan & Rotating Text */}
          <div className="flex-1 flex flex-col justify-center py-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
              Bắt đầu hành trình sáng tạo.
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-2">
              Cùng viết tiếp{" "}
              <span className="text-blue-600 dark:text-blue-400 font-bold transition-all duration-500">
                {rotatingWords[rotatingIndex]}
              </span>
            </p>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Đọc, viết và gắn kết cùng bạn bè mỗi ngày.
            </p>
          </div>
          
          {/* Bottom Section - Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
              © 2026 BlogViet. Nền tảng chia sẻ và kết nối cộng đồng.
            </p>
          </div>
        </div>

        {/* Right Column - Register Form */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-white dark:bg-zinc-900 animate-slide-in-right">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Đăng ký
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tạo tài khoản và bắt đầu chia sẻ câu chuyện
            </p>
          </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs p-3.5 rounded-xl mb-5 animate-in fade-in duration-150 flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Họ và tên
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={handleChange}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="nguyenvana"
                value={form.username}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer p-1"
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

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer p-1"
                title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang khởi tạo tài khoản...</span>
              </>
            ) : (
              <>
                <span>Đăng ký ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Prompt */}
        <div className="mt-7 pt-5 border-t border-slate-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
