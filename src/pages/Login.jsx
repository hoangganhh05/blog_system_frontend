import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      const serverMsg = typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message;
      setError(serverMsg || "Đăng nhập thất bại. Vui lòng kiểm tra lại Email và Mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F0F2F5] dark:bg-[#121212] px-4 py-12 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
        {/* Header Form */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link to="/" className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center font-black text-white dark:text-black text-base tracking-tighter shadow-xs hover:opacity-90 transition">
            BV
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-3 tracking-tight">
            Đăng nhập BlogViet
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Chào mừng trở lại! Vui lòng nhập thông tin tài khoản của bạn.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs p-3 rounded-lg border border-red-200 dark:border-red-900/50 mb-4 animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email hoặc Tên đăng nhập
            </label>
            <input
              id="email"
              type="text"
              name="email"
              placeholder="name@example.com hoặc username"
              value={form.email}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end mt-1.5">
              <Link
                to="/forgot-password"
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:underline transition"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-6">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-semibold text-black dark:text-white underline hover:opacity-80 transition"
          >
            Đăng ký ngay
          </Link>
        </p>

        <div className="text-center mt-3">
          <Link
            to="/"
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
          >
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
