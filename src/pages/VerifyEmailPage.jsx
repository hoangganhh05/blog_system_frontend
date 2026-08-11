import { Link } from "react-router-dom";

// Email verification needs a dedicated, server-verified token flow.  It must
// never reuse the password-reset endpoint.
export default function VerifyEmailPage() {
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 460, padding: "36px 28px", textAlign: "center" }}>
        <div style={{ fontSize: 42, marginBottom: 16 }}>📧</div>
        <h1 className="auth-card-title">Xác minh email</h1>
        <p className="auth-card-subtitle" style={{ lineHeight: 1.6 }}>
          Tính năng xác minh email đang được triển khai an toàn. Tài khoản không bị thay đổi mật khẩu qua trang này.
        </p>
        <Link to="/login" className="btn btn-primary btn-full btn-lg" style={{ display: "block", marginTop: 24 }}>
          Về trang đăng nhập
        </Link>
      </div>
    </div>
  );
}
