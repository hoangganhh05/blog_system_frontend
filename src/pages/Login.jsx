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

  // Trạng thái Quên mật khẩu & Gửi mã OTP Gmail
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ text: "", type: "" });
  const [demoOtpCode, setDemoOtpCode] = useState("");

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
      const res = await userService.login(form.username.trim(), form.password);
      login(res.data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data || err.message || "Đăng nhập thất bại!");
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
      const res = await userService.requestResetOtp(forgotEmail.trim());
      const otpCode = res.data.otp || Math.floor(100000 + Math.random() * 900000).toString();
      setDemoOtpCode(otpCode);
      setForgotStep(2);
      setForgotMsg({
        text: `Mã OTP đã được gửi thành công về Gmail (${forgotEmail}). Vui lòng kiểm tra hộp thư Inbox / Spam trong Gmail của bạn để lấy mã! 📧`,
        type: "success",
      });
    } catch {
      setForgotMsg({ text: "Không thể gửi mã OTP tới Gmail này!", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };

  // 2. Xác nhận OTP & Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !newPassword.trim()) {
      setForgotMsg({ text: "Vui lòng nhập đầy đủ Mã OTP và Mật khẩu mới!", type: "error" });
      return;
    }
    if (newPassword.trim().length < 6) {
      setForgotMsg({ text: "Mật khẩu mới phải có ít nhất 6 ký tự!", type: "error" });
      return;
    }
    setForgotLoading(true);
    setForgotMsg({ text: "", type: "" });
    try {
      await userService.resetPasswordWithOtp(forgotEmail.trim(), forgotOtp.trim(), newPassword.trim());
      setForgotMsg({ text: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.", type: "success" });
      setTimeout(() => {
        setShowForgotModal(false);
        setForm((f) => ({ ...f, password: newPassword }));
        setForgotStep(1);
      }, 1500);
    } catch (err) {
      setForgotMsg({ text: err.message || "Mã OTP không chính xác!", type: "error" });
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

            <div className="form-group" style={{ marginBottom: 8 }}>
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

            {/* Nút Quên mật khẩu */}
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotStep(1);
                  setForgotMsg({ text: "", type: "" });
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                🔑 Quên mật khẩu?
              </button>
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

      {/* Modal Quên mật khẩu & Gửi mã OTP Gmail */}
      {showForgotModal && (
        <div
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
          onClick={() => setShowForgotModal(false)}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                🔑 Quên mật khẩu tài khoản
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>

            {forgotMsg.text && (
              <div className={`alert ${forgotMsg.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: 16, fontSize: 13.5 }}>
                {forgotMsg.text}
              </div>
            )}

            {/* Bước 1: Nhập Gmail */}
            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp}>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
                  Vui lòng nhập địa chỉ Gmail đăng ký của bạn. Hệ thống sẽ gửi <b>Mã OTP xác minh (6 chữ số)</b> về Gmail của bạn.
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
                  {forgotLoading ? "⏳ Đang gửi mã..." : "📧 Gửi mã OTP về Gmail"}
                </button>
              </form>
            ) : (
              /* Bước 2: Nhập OTP & Đặt mật khẩu mới */
              <form onSubmit={handleResetPassword}>
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 16 }}>
                  Đã gửi mã OTP tới: <b>{forgotEmail}</b>. Vui lòng kiểm tra hộp thư Gmail và nhập mã OTP bên dưới.
                </p>

                <div className="form-group">
                  <label className="form-label">Mã OTP xác minh (6 chữ số)</label>
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
                  {forgotLoading ? "⏳ Đang đặt lại..." : "✅ Đặt lại mật khẩu mới"}
                </button>

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}
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
