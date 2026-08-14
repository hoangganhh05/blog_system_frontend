import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, KeyRound, Mail, ShieldCheck } from "lucide-react";
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
  const [error, setError] = useState("");
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
    e?.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập Email của bạn!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await userService.requestResetOtp(email.trim());
      showToast?.(`Mã OTP khôi phục mật khẩu đã được gửi tới ${email}!`, "success");
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch {
      setError("Không thể gửi mã OTP tới Email này!");
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác minh OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số mã OTP!");
      return;
    }
    setError("");
    setStep(3);
  };

  // Bước 3: Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const otpCode = otp.join("");
      await userService.resetPasswordWithOtp(email.trim(), otpCode, newPassword);
      showToast?.("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.", "success");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Mã OTP không chính xác hoặc không thể đặt lại mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F0F2F5] dark:bg-[#121212] px-4 py-12 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
        {/* Header Form */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-3">
            {step === 1 ? <KeyRound className="w-6 h-6" /> : step === 2 ? <Mail className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {step === 1 ? "Quên mật khẩu" : step === 2 ? "Xác minh mã OTP" : "Đặt lại mật khẩu mới"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
            {step === 1 && "Nhập Email tài khoản của bạn để nhận mã xác minh OTP 6 chữ số."}
            {step === 2 && `Mã xác minh đã được gửi về email ${email}`}
            {step === 3 && "Tạo mật khẩu mới an toàn cho tài khoản của bạn."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs p-3 rounded-lg border border-red-200 dark:border-red-900/50 mb-4 animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* Bước 1: Nhập Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Địa chỉ Email
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi mã OTP...</span>
                </>
              ) : (
                "Gửi mã OTP về Email"
              )}
            </button>
          </form>
        )}

        {/* Bước 2: Nhập OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div className="flex gap-2 justify-center my-2">
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
                  className="w-11 h-13 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xl font-bold text-center focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full py-2.5 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang kiểm tra...</span>
                </>
              ) : (
                "Xác minh mã OTP"
              )}
            </button>

            <div className="text-center text-xs text-zinc-500">
              Chưa nhận được mã?{" "}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="font-bold text-black dark:text-white underline cursor-pointer"
                >
                  Gửi lại ngay
                </button>
              ) : (
                <span>Gửi lại sau {resendTimer}s</span>
              )}
            </div>
          </form>
        )}

        {/* Bước 3: Đặt mật khẩu mới */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                placeholder="Ít nhất 6 ký tự..."
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu mật khẩu...</span>
                </>
              ) : (
                "Lưu mật khẩu mới"
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-white transition"
          >
            ← Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
