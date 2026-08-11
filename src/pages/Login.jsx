import { useState, useEffect } from "react";
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
  const [showPassword, setShowPassword] = useState(false);

  // Trạng thái Quên mật khẩu & Gửi mã OTP Gmail
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    if (!showForgotModal) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowForgotModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForgotModal]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginInput = (form.email || form.username || "").trim();
    if (!loginInput || !form.password.trim()) {
      return setError("Vui lòng nhập đầy đủ thông tin Email và mật khẩu!");
    }
    setLoading(true);
    try {
      const res = await userService.login(loginInput, form.password);
      login(res.data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data || err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại Email và Mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  // 1. Gửi mã OTP về Gmail
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotMsg({ text: "Vui lòng nhập Gmail của bạn!", type: "error" });
      return;
    }
    setForgotLoading(true);
    setForgotMsg({ text: "", type: "" });
    try {
      await userService.requestResetOtp(forgotEmail.trim());
      setForgotStep(2);
      setForgotMsg({
        text: `Mã OTP đã được gửi thành công về Gmail (${forgotEmail}). Vui lòng kiểm tra hộp thư Inbox / Spam trong Gmail của bạn để lấy mã! 📧`,
        type: "success",
      });
    } catch {
      setForgotMsg({
        text: "Không thể gửi mã OTP tới Gmail này!",
        type: "error",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  // 2. Xác nhận OTP & Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !newPassword.trim()) {
      setForgotMsg({
        text: "Vui lòng nhập đầy đủ Mã OTP và Mật khẩu mới!",
        type: "error",
      });
      return;
    }
    if (newPassword.trim().length < 6) {
      setForgotMsg({
        text: "Mật khẩu mới phải có ít nhất 6 ký tự!",
        type: "error",
      });
      return;
    }
    setForgotLoading(true);
    setForgotMsg({ text: "", type: "" });
    try {
      await userService.resetPasswordWithOtp(
        forgotEmail.trim(),
        forgotOtp.trim(),
        newPassword.trim(),
      );
      setForgotMsg({
        text: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.",
        type: "success",
      });
      setTimeout(() => {
        setShowForgotModal(false);
        setForm((f) => ({ ...f, password: newPassword }));
        setForgotStep(1);
      }, 1500);
    } catch (err) {
      setForgotMsg({
        text: err.message || "Mã OTP không chính xác!",
        type: "error",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Brand */}
        <div className="auth-brand">
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: "linear-gradient(135deg, #ffffff33, #ffffff55)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
                border: "1.5px solid rgba(255,255,255,0.3)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5z"
                  fill="white"
                  opacity="0.9"
                />
                <path
                  d="M2 17l10 5 10-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />
                <path
                  d="M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>
          <div className="auth-brand-title">BlogViet</div>
          <div className="auth-brand-subtitle">
            Nền tảng chia sẻ kiến thức, kết nối đam mê và truyền cảm hứng cho
            cộng đồng.
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
                id="email"
                className="form-input"
                type="text"
                name="email"
                placeholder="Địa chỉ Email đăng ký..."
                value={form.email || form.username}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 8, position: "relative" }}>
              <input
                id="password"
                className="form-input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>

            {/* Nút Quên mật khẩu */}
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <Link
                to="/forgot-password"
                style={{
                  color: "var(--primary)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                🔑 Quên mật khẩu?
              </Link>
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

          {/* OAuth is disabled until it is backed by a real server-side OAuth flow. */}
          <button
            type="button"
            disabled
            className="btn btn-full btn-lg"
            style={{
              marginBottom: 12,
              background: "#ffffff",
              color: "#3c4043",
              border: "1px solid #dadce0",
              fontWeight: 600,
              fontSize: 14.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              cursor: "not-allowed",
              opacity: 0.65,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Đăng nhập bằng Google (sắp hỗ trợ)
          </button>

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

      {/* Modal Quên mật khẩu & Gửi mã OTP Gmail */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 440,
              padding: 24,
              borderRadius: 20,
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                🔑 Quên mật khẩu tài khoản
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                ✕
              </button>
            </div>

            {forgotMsg.text && (
              <div
                className={`alert ${forgotMsg.type === "success" ? "alert-success" : "alert-error"}`}
                style={{ marginBottom: 16, fontSize: 13.5 }}
              >
                {forgotMsg.text}
              </div>
            )}

            {/* Bước 1: Nhập Gmail */}
            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp}>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    marginBottom: 16,
                  }}
                >
                  Vui lòng nhập địa chỉ Gmail đăng ký của bạn. Hệ thống sẽ gửi{" "}
                  <b>Mã OTP xác minh (6 chữ số)</b> về Gmail của bạn.
                </p>

                <div className="form-group">
                  <label className="form-label">Địa chỉ Gmail</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="ví dụ: user@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={forgotLoading}
                  style={{ marginTop: 8 }}
                >
                  {forgotLoading
                    ? "⏳ Đang gửi mã..."
                    : "📧 Gửi mã OTP về Gmail"}
                </button>
              </form>
            ) : (
              /* Bước 2: Nhập OTP & Đặt mật khẩu mới */
              <form onSubmit={handleResetPassword}>
                <p
                  style={{
                    fontSize: 13.5,
                    color: "var(--text-secondary)",
                    marginBottom: 16,
                  }}
                >
                  Đã gửi mã OTP tới: <b>{forgotEmail}</b>. Vui lòng kiểm tra hộp
                  thư Gmail và nhập mã OTP bên dưới.
                </p>

                <div className="form-group">
                  <label className="form-label">
                    Mã OTP xác minh (6 chữ số)
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Nhập mã OTP (VD: 849201)"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={forgotLoading}
                  style={{ marginTop: 8, marginBottom: 12 }}
                >
                  {forgotLoading
                    ? "⏳ Đang đặt lại..."
                    : "✅ Đặt lại mật khẩu mới"}
                </button>

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    ← Gửi lại mã OTP qua Gmail khác
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
