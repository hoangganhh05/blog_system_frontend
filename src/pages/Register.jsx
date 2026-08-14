import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
    if (!form.fullName.trim()) return "Vui lòng nhập họ và tên!";
    if (!form.username.trim()) return "Vui lòng nhập tên đăng nhập!";
    if (form.username.trim().length < 3) return "Tên đăng nhập phải có ít nhất 3 ký tự!";
    if (!form.email.trim() || !form.email.includes("@")) return "Email không hợp lệ!";
    if (form.password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự!";
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
      const serverMsg = typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message;
      setError(serverMsg || "Đăng ký thất bại. Tên đăng nhập hoặc Email có thể đã được sử dụng!");
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
            Tạo tài khoản BlogViet
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Gia nhập cộng đồng chia sẻ kiến thức, nghệ thuật và giải trí.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs p-3 rounded-lg border border-red-200 dark:border-red-900/50 mb-4 animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Họ và tên
            </label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={handleChange}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="nguyenvana"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Địa chỉ Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Mật khẩu (ít nhất 8 ký tự)
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="register-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tạo tài khoản...</span>
              </>
            ) : (
              "Đăng ký tài khoản"
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-6">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-semibold text-black dark:text-white underline hover:opacity-80 transition"
          >
            Đăng nhập ngay
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
