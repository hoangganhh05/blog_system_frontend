import { useState } from "react";
import { Shield, Key, Mail, CheckCircle2, Monitor, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

export default function SecuritySettingsPage() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại!");
      return;
    }
    if (!formData.newPassword || formData.newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự!");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không trùng khớp!");
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(
        currentUserId,
        formData.currentPassword,
        formData.newPassword
      );
      toast.success("Đã đổi mật khẩu thành công!");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const serverMsg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.message;
      toast.error(serverMsg || "Mật khẩu hiện tại không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-black text-zinc-900 dark:text-zinc-100 py-8 px-4 transition-colors">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header trang */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 tracking-tight">
            🛡️ Cài đặt bảo mật tài khoản
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Quản lý mật khẩu cá nhân, trạng thái xác thực Gmail và thông tin phiên làm việc bảo mật.
          </p>
        </div>

        {/* CARD 1: THAY ĐỔI MẬT KHẨU */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            🔑 Thay đổi mật khẩu
          </h2>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            {/* Mật khẩu hiện tại */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu hiện tại..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                required
              />
            </div>

            {/* Mật khẩu mới */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Mật khẩu mới
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Ít nhất 8 ký tự..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                required
              />
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                required
              />
            </div>

            {/* Nút Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  "Cập nhật mật khẩu"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2: BẢO MẬT GMAIL & THIẾT BỊ */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            📧 Bảo mật Gmail &amp; Thiết bị
          </h2>

          {/* Item 1: Khôi phục Gmail OTP */}
          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Khôi phục mật khẩu qua Gmail OTP
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Mã OTP xác thực sẽ gửi về Gmail chính chủ của bạn
              </span>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Đã bật</span>
            </span>
          </div>

          {/* Item 2: Phiên làm việc */}
          <div className="flex items-center justify-between py-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Phiên làm việc hiện tại
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Đang đăng nhập trên Trình duyệt Web (Windows / Mobile)
              </span>
            </div>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" />
              <span>Trình duyệt Web</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
