import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useAuth();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Bước 1: Gửi mã OTP khôi phục mật khẩu
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast("Vui lòng nhập Email của bạn!", "error");
      return;
    }
    setLoading(true);
    try {
      await userService.requestResetOtp(email.trim());
      showToast(`Mã OTP khôi phục mật khẩu đã được gửi tới ${email}!`, "success");
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch {
      showToast("Không thể gửi mã OTP tới Email này!", "error");
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác minh OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      showToast("Vui lòng nhập đủ 6 chữ số mã OTP!", "error");
      return;
    }
    setLoading(true);
    try {
      showToast("Mã OTP hợp lệ! Hãy nhập mật khẩu mới của bạn.", "success");
      setStep(3);
    } catch {
      showToast("Mã OTP không chính xác!", "error");
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast("Mật khẩu mới phải có ít nhất 6 ký tự!", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp!", "error");
      return;
    }
    setLoading(true);
    try {
      const otpCode = otp.join("");
      await userService.resetPasswordWithOtp(email.trim(), otpCode, newPassword);
      showToast("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.", "success");
      navigate("/login");
    } catch (err) {
      showToast(err.message || "Không thể đặt lại mật khẩu!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 460, padding: "36px 28px", textAlign: "center" }}>
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
          {step === 1 ? "🔑" : step === 2 ? "✉️" : "🛡️"}
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
          {step === 1 ? "Quên mật khẩu?" : step === 2 ? "Nhập mã OTP xác minh" : "Đặt mật khẩu mới"}
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 24 }}>
          {step === 1 && "Nhập Email tài khoản của bạn để nhận mã xác minh OTP 6 chữ số."}
          {step === 2 && `Mã OTP xác minh đã được gửi tới email ${email}`}
          {step === 3 && "Tạo mật khẩu mới an toàn cho tài khoản của bạn."}
        </p>

        {/* BƯỚC 1: NHẬP EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <div style={{ marginBottom: 20, textAlign: "left" }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                Địa chỉ Email
              </label>
              <input
                type="email"
                placeholder="nhapemail@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: "12px 0", borderRadius: 10, fontWeight: 700 }}>
              {loading ? "⏳ Đang gửi mã OTP..." : "📩 Gửi mã OTP về Email"}
            </button>
          </form>
        )}

        {/* BƯỚC 2: NHẬP OTP 6 CHỮ SỐ */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
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
                  }}
                />
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || otp.join("").length < 6} style={{ padding: "12px 0", borderRadius: 10, fontWeight: 700 }}>
              {loading ? "⏳ Đang xác minh..." : "✓ Xác minh OTP"}
            </button>
            <div style={{ marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
              Chưa nhận được mã?{" "}
              {canResend ? (
                <span onClick={handleSendOTP} style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}>Gửi lại ngay</span>
              ) : (
                <span>Gửi lại sau {resendTimer}s</span>
              )}
            </div>
          </form>
        )}

        {/* BƯỚC 3: ĐẶT MẬT KHẨU MỚI */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: 16, textAlign: "left" }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                Mật khẩu mới
              </label>
              <input
                type="password"
                placeholder="Ít nhất 6 ký tự..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ marginBottom: 20, textAlign: "left" }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: "12px 0", borderRadius: 10, fontWeight: 700 }}>
              {loading ? "⏳ Đang lưu..." : "💾 Lưu mật khẩu mới"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 24 }}>
          <Link to="/login" style={{ fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none" }}>
            ← Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
