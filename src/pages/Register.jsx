import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

function Register() {
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

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Vui lòng nhập họ tên!";
    if (!form.username.trim()) return "Vui lòng nhập tên đăng nhập!";
    if (form.username.length < 3) return "Tên đăng nhập phải có ít nhất 3 ký tự!";
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
    <div className="auth-page">
      <div className="auth-container">
        {/* Brand */}
        <div className="auth-brand">
          <div style={{ marginBottom: 12 }}>
            <div style={{
              width: 64, height: 64,
              background: "linear-gradient(135deg, #ffffff33, #ffffff55)",
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(10px)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9"/>
                <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
          </div>
          <div className="auth-brand-title">BlogViet</div>
          <div className="auth-brand-subtitle">
            Tham gia cùng hàng nghìn người đang chia sẻ kiến thức và kinh nghiệm mỗi ngày.
          </div>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            {["📝 Tạo và chia sẻ bài viết", "💬 Tương tác bình luận", "📂 Phân loại theo danh mục"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card đăng ký */}
        <div className="auth-card">
          <h1 className="auth-card-title">Tạo tài khoản</h1>
          <p className="auth-card-subtitle">Hoàn toàn miễn phí. Chỉ vài giây! ⚡</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <input
                id="fullName"
                className="form-input"
                type="text"
                name="fullName"
                placeholder="Họ và tên"
                value={form.fullName}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="form-group">
              <input
                id="username"
                className="form-input"
                type="text"
                name="username"
                placeholder="Tên đăng nhập"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <input
                id="email"
                className="form-input"
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <input
                id="password"
                className="form-input"
                type="password"
                name="password"
                placeholder="Mật khẩu (ít nhất 8 ký tự)"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <input
                id="confirmPassword"
                className="form-input"
                type="password"
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button
              id="register-btn"
              type="submit"
              className="btn btn-success btn-full btn-lg"
              disabled={loading}
              style={{ marginBottom: 12 }}
            >
              {loading ? "⏳ Đang tạo tài khoản..." : "🚀 Đăng ký ngay"}
            </button>
          </form>

          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            Đã có tài khoản?{" "}
            <Link to="/login" style={{ fontWeight: 700, color: "var(--primary)" }}>
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
