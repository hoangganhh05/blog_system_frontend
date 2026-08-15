import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, ArrowRight, User, Mail, Lock, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b0f19] px-4 py-12 transition-colors duration-200 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 p-7 sm:p-9 shadow-xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Form */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link
            to="/"
            className="w-13 h-13 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-xl tracking-tighter shadow-md hover:scale-105 active:scale-95 transition select-none"
          >
            BV
          </Link>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
            Tạo tài khoản BlogViet
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-xs">
            Gia nhập cộng đồng chia sẻ tri thức, âm nhạc và kết nối cùng bạn bè.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 mb-5 animate-in fade-in duration-150 flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Họ và tên
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={handleChange}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="nguyenvana"
                value={form.username}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={handleChange}
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

          <div className="space-y-1">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer p-1"
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
            className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-bold text-xs sm:text-sm transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
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
        <div className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline transition"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
