import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      return setError("Vui lòng nhập đầy đủ thông tin!");
    }
    setLoading(true);
    try {
      // userService.login() giờ gọi POST /auth/login
      // trả về { token, userId, username, fullName, role }
      const res = await userService.login(form.username.trim(), form.password);
      login(res.data); // AuthContext.login() tự lưu token và user
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data || err.message || "Đăng nhập thất bại!");
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
            Nền tảng chia sẻ kiến thức, kết nối đam mê và truyền cảm hứng cho cộng đồng.
          </div>
        </div>

        {/* Card đăng nhập */}
        <div className="auth-card">
          <h1 className="auth-card-title">Đăng nhập</h1>
          <p className="auth-card-subtitle">Chào mừng trở lại! 👋</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

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
                autoFocus
              />
            </div>

            <div className="form-group">
              <input
                id="password"
                className="form-input"
                type="password"
                name="password"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginBottom: 16 }}
            >
              {loading ? "⏳ Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="divider-text">hoặc</div>

          <Link to="/register" style={{ display: "block" }}>
            <button
              id="go-register-btn"
              className="btn btn-success btn-full btn-lg"
            >
              Tạo tài khoản mới
            </button>
          </Link>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link to="/" style={{ color: "var(--text-muted)", fontSize: 14 }}>
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
