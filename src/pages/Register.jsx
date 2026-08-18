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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4 lg:p-8">
      {/* Background Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      
      {/* Glassmorphism Container */}
      <div className="w-full max-w-5xl bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-slide-in-left">
        {/* Left Column - Hero & Branding */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-between relative">
          {/* Badge */}
          <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium w-fit flex items-center gap-1.5 mb-8">
            <span>✨</span>
            <span>Nền tảng chia sẻ thế hệ mới</span>
          </div>
          
          {/* Hero Content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-6">
              <Logo size="xl" showGlow={true} />
              <h1 className="text-4xl lg:text-5xl font-black mt-6 tracking-tight text-white">
                BlogViet
              </h1>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight text-white">
              Bắt đầu hành trình
            </h2>
            
            <p className="text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent mb-6">
              Chia sẻ <span className="inline-block transition-all duration-500">{rotatingWords[rotatingIndex]}</span>
            </p>
            
            <p className="text-lg text-slate-400 leading-relaxed">
              Không gian sáng tạo dành riêng cho bạn.
            </p>
          </div>
          
          {/* Quote/Review Box */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-8 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                BV
              </div>
              <div>
                <p className="text-sm text-slate-300 italic leading-relaxed">
                  "Tham gia cộng đồng và bắt đầu chia sẻ câu chuyện của bạn với thế giới."
                </p>
                <p className="text-xs text-slate-500 mt-2 font-medium">— Cộng đồng BlogViet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Register Form */}
        <div className="lg:col-span-5 p-8 lg:p-12 bg-white/[0.02] border-l border-white/5 flex flex-col justify-center animate-slide-in-right">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Tạo tài khoản mới
            </h1>
            <p className="text-sm text-slate-400">
              Gia nhập cộng đồng và bắt đầu sáng tạo
            </p>
          </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3.5 rounded-2xl mb-5 animate-in fade-in duration-150 flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">
              Họ và tên
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={handleChange}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="nguyenvana"
                value={form.username}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer p-1"
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
            <label className="block text-xs font-bold text-slate-300">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer p-1"
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
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
        <div className="mt-7 pt-5 border-t border-white/10 text-center">
          <p className="text-xs text-slate-400">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-bold text-white hover:text-indigo-400 transition"
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
