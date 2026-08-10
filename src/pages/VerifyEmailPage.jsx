import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useAuth();

  const registeredEmail = location.state?.email || localStorage.getItem("blog_pending_verify_email") || "bạn";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer cho nút Gửi lại mã
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Tự động chuyển con trỏ sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = () => {
    if (!canResend) return;
    setResendTimer(60);
    setCanResend(false);
    showToast(`Đã gửi lại mã OTP mới về email ${registeredEmail}!`, "success");
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      showToast("Vui lòng nhập đủ 6 chữ số mã OTP!", "error");
      return;
    }

    setLoading(true);
    try {
      // Giả lập / Gọi API xác minh OTP từ Backend
      await new Promise((resolve) => setTimeout(resolve, 800));
      showToast("Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay.", "success");
      localStorage.removeItem("blog_pending_verify_email");
      navigate("/login");
    } catch {
      showToast("Mã OTP không chính xác hoặc đã hết hạn!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 460, padding: "36px 28px", textAlign: "center" }}>
        {/* Header Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--primary-light)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            margin: "0 auto 16px",
          }}
        >
          ✉️
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
          Xác minh Email của bạn
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 24 }}>
          Mã xác minh OTP 6 chữ số đã được gửi tới email <br />
          <strong style={{ color: "var(--primary)" }}>{registeredEmail}</strong>
        </p>

        <form onSubmit={handleVerify}>
          {/* 6-Digit OTP Inputs */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: 12,
                  border: digit ? "2px solid var(--primary)" : "1.5px solid var(--border-light)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: 22,
                  fontWeight: 800,
                  textAlign: "center",
                  outline: "none",
                  boxShadow: digit ? "0 4px 12px rgba(24,119,242,0.15)" : "none",
                  transition: "all 0.15s ease",
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || otp.join("").length < 6}
            style={{
              padding: "12px 0",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(24,119,242,0.35)",
            }}
          >
            {loading ? "⏳ Đang xác minh..." : "✓ Xác minh & Kích hoạt"}
          </button>
        </form>

        {/* Resend Timer & Links */}
        <div style={{ marginTop: 24, fontSize: 14, color: "var(--text-muted)" }}>
          Chưa nhận được mã?{" "}
          {canResend ? (
            <span
              onClick={handleResendOTP}
              style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}
            >
              Gửi lại ngay
            </span>
          ) : (
            <span style={{ fontWeight: 600 }}>Gửi lại sau {resendTimer}s</span>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <Link to="/login" style={{ fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none" }}>
            ← Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
