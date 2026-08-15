import { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Mail,
  CheckCircle2,
  Monitor,
  Loader2,
  Lock,
  Eye,
  Users,
  Globe,
  UserCheck,
  Activity,
  Save,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

export default function SecuritySettingsPage() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [activeTab, setActiveTab] = useState("security"); // "security" | "privacy" | "display"

  // Display & Accessibility States
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("blog_theme_mode") || "system");
  const [isCompact, setIsCompact] = useState(() => localStorage.getItem("blog_compact_mode") === "true");

  const handleSelectTheme = (mode) => {
    setThemeMode(mode);
    localStorage.setItem("blog_theme_mode", mode);
    window.dispatchEvent(new CustomEvent("theme_mode_changed", { detail: { mode } }));
    toast.success(
      mode === "dark"
        ? "Đã chuyển sang chế độ Tối (Dark Mode)"
        : mode === "light"
        ? "Đã chuyển sang chế độ Sáng (Light Mode)"
        : "Đã bật chế độ Tự động theo hệ thống thiết bị"
    );
  };

  const handleToggleCompact = () => {
    const nextVal = !isCompact;
    setIsCompact(nextVal);
    localStorage.setItem("blog_compact_mode", String(nextVal));
    window.dispatchEvent(new CustomEvent("compact_mode_changed", { detail: { isCompact: nextVal } }));
    toast.success(nextVal ? "Đã bật chế độ thu gọn (Compact Mode)" : "Đã tắt chế độ thu gọn (Cozy Mode)");
  };

  // Password Form State
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  // Privacy Settings State (with sensible defaults)
  const [privacySettings, setPrivacySettings] = useState({
    postVisibility: "PUBLIC", // "PUBLIC" | "FRIENDS" | "ONLY_ME"
    friendRequestScope: "EVERYONE", // "EVERYONE" | "FRIENDS_OF_FRIENDS"
    messageScope: "EVERYONE", // "EVERYONE" | "FRIENDS"
    showActiveStatus: true,
    showFollowingList: true,
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Load privacy settings directly from Backend Database on mount
  useEffect(() => {
    if (currentUserId) {
      userService
        .getById(currentUserId)
        .then((res) => {
          const u = res.data;
          if (u) {
            setPrivacySettings({
              postVisibility: u.postVisibility || "PUBLIC",
              friendRequestScope: u.friendRequestScope || "EVERYONE",
              messageScope: u.messageScope || "EVERYONE",
              showActiveStatus: u.showActiveStatus !== false,
              showFollowingList: u.showFollowingList !== false,
            });
          }
        })
        .catch(() => {});
    }
  }, [currentUserId]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePrivacyChange = (field, value) => {
    setPrivacySettings((prev) => ({ ...prev, [field]: value }));
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
          : err.response?.data?.message;
      toast.error(serverMsg || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại!");
    } finally {
      setLoading(false);
    }
  };

  // Save Privacy Settings permanently to Database via Backend API
  const handleSavePrivacy = async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    setSavingPrivacy(true);
    try {
      await userService.update(currentUserId, {
        postVisibility: privacySettings.postVisibility,
        friendRequestScope: privacySettings.friendRequestScope,
        messageScope: privacySettings.messageScope,
        showActiveStatus: privacySettings.showActiveStatus,
        showFollowingList: privacySettings.showFollowingList,
      });
      toast.success("Đã lưu thiết lập quyền riêng tư vào cơ sở dữ liệu!");
    } catch {
      toast.error("Không thể lưu cài đặt quyền riêng tư lúc này!");
    } finally {
      setSavingPrivacy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-zinc-900 dark:text-[#f1f5f9] py-8 px-4 transition-colors">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header trang */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 tracking-tight">
            <Shield className="w-5 h-5 text-indigo-500" />
            Cài đặt &amp; Trợ năng
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Quản lý bảo mật tài khoản, quyền riêng tư và tùy chỉnh chế độ hiển thị màn hình trên BlogViet.
          </p>
        </div>

        {/* Segmented Tab Switcher (Bảo mật, Quyền riêng tư & Màn hình) */}
        <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-2xl shadow-xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-2.5 text-center text-xs rounded-xl font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "security"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Bảo mật</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 py-2.5 text-center text-xs rounded-xl font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "privacy"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Quyền riêng tư</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("display")}
            className={`flex-1 py-2.5 text-center text-xs rounded-xl font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "display"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Màn hình &amp; Trợ năng</span>
          </button>
        </div>

        {/* ======================================================================
            TAB 1: MẬT KHẨU & BẢO MẬT
            ====================================================================== */}
        {activeTab === "security" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            {/* CARD 1: THAY ĐỔI MẬT KHẨU */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <Key className="w-4 h-4 text-amber-500" />
                Thay đổi mật khẩu
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
                <Mail className="w-4 h-4 text-indigo-500" />
                Bảo mật Gmail &amp; Thiết bị
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
        )}

        {/* ======================================================================
            TAB 2: QUYỀN RIÊNG TƯ (PRIVACY SETTINGS)
            ====================================================================== */}
        {activeTab === "privacy" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            {/* KHỐI 1: ĐỐI TƯỢNG XEM BÀI VIẾT */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <Eye className="w-4 h-4 text-emerald-500" />
                Ai có thể xem bài viết của tôi?
              </h2>

              <div className="flex flex-col gap-3">
                {[
                  {
                    value: "PUBLIC",
                    title: "Mọi người (Công khai)",
                    desc: "Tất cả mọi người trên BlogViet và ngoài Internet đều có thể xem bài viết của bạn.",
                    icon: Globe,
                  },
                  {
                    value: "FRIENDS",
                    title: "Bạn bè & Người theo dõi",
                    desc: "Chỉ những người đã kết bạn hoặc đang theo dõi bạn mới có thể đọc bài viết.",
                    icon: Users,
                  },
                  {
                    value: "ONLY_ME",
                    title: "Chỉ mình tôi (Riêng tư)",
                    desc: "Chỉ bạn mới có quyền xem bài viết được chia sẻ.",
                    icon: Lock,
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = privacySettings.postVisibility === option.value;
                  return (
                    <label
                      key={option.value}
                      onClick={() => handlePrivacyChange("postVisibility", option.value)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-800/80 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="postVisibility"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 accent-black dark:accent-white"
                      />
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" />
                          {option.title}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {option.desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* KHỐI 2: KẾT NỐI & TIN NHẮN */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                Kết nối, Kết bạn &amp; Tin nhắn
              </h2>

              <div className="flex flex-col gap-4">
                {/* Lời mời kết bạn */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Ai có thể gửi lời mời kết bạn cho bạn?
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Kiểm soát người có thể kết nối với bạn trên nền tảng
                    </span>
                  </div>

                  <select
                    value={privacySettings.friendRequestScope}
                    onChange={(e) => handlePrivacyChange("friendRequestScope", e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="EVERYONE">Mọi người</option>
                    <option value="FRIENDS_OF_FRIENDS">Bạn của bạn bè</option>
                  </select>
                </div>

                {/* Nhắn tin trực tiếp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Ai có thể nhắn tin trực tiếp cho bạn?
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Cho phép trò chuyện qua hộp chat nổi hoặc giới hạn bạn bè
                    </span>
                  </div>

                  <select
                    value={privacySettings.messageScope}
                    onChange={(e) => handlePrivacyChange("messageScope", e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="EVERYONE">Tất cả mọi người</option>
                    <option value="FRIENDS">Chỉ bạn bè</option>
                  </select>
                </div>
              </div>
            </div>

            {/* KHỐI 3: TRẠNG THÁI HOẠT ĐỘNG */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <Activity className="w-4 h-4 text-rose-500" />
                Trạng thái hoạt động &amp; Hiển thị
              </h2>

              <div className="flex flex-col gap-4">
                {/* Trạng thái hoạt động */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col pr-4">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Hiển thị trạng thái hoạt động (Online status)
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Bạn bè và người đang chat có thể thấy khi bạn đang online trên BlogViet
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handlePrivacyChange("showActiveStatus", !privacySettings.showActiveStatus)
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      privacySettings.showActiveStatus ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        privacySettings.showActiveStatus ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Danh sách Following trên Profile */}
                <div className="flex items-center justify-between py-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex flex-col pr-4">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Hiển thị danh sách người bạn đang theo dõi trên trang cá nhân
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Cho phép người khác xem các tác giả mà bạn đang follow
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handlePrivacyChange("showFollowingList", !privacySettings.showFollowingList)
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      privacySettings.showFollowingList ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        privacySettings.showFollowingList ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Nút lưu Quyền riêng tư */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePrivacy}
                  disabled={savingPrivacy}
                  className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {savingPrivacy ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu cài đặt quyền riêng tư</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 3: MÀN HÌNH & TRỢ NĂNG
            ====================================================================== */}
        {activeTab === "display" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">

            {/* CARD: CHẾ ĐỘ GIAO DIỆN */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-start gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Chế độ hiển thị (Dark Mode)</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Chọn giao diện sáng, tối hoặc tự động theo thiết lập của thiết bị.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* LIGHT */}
                <button
                  type="button"
                  onClick={() => handleSelectTheme("light")}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                    themeMode === "light"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50"
                  }`}
                >
                  {/* Preview mockup */}
                  <div className="w-full h-14 rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-sm flex flex-col gap-1 p-1.5">
                    <div className="h-2 rounded bg-zinc-100 w-3/4"></div>
                    <div className="h-1.5 rounded bg-zinc-100 w-full"></div>
                    <div className="h-1.5 rounded bg-zinc-100 w-5/6"></div>
                    <div className="h-1.5 rounded bg-indigo-100 w-2/3 mt-0.5"></div>
                  </div>
                  <Sun className={`w-4 h-4 ${themeMode === "light" ? "text-amber-500" : "text-zinc-400"}`} />
                  <span className={`text-xs font-bold ${themeMode === "light" ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500"}`}>
                    Sáng
                  </span>
                  {themeMode === "light" && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* DARK */}
                <button
                  type="button"
                  onClick={() => handleSelectTheme("dark")}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                    themeMode === "dark"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50"
                  }`}
                >
                  <div className="w-full h-14 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden shadow-sm flex flex-col gap-1 p-1.5">
                    <div className="h-2 rounded bg-zinc-700 w-3/4"></div>
                    <div className="h-1.5 rounded bg-zinc-700 w-full"></div>
                    <div className="h-1.5 rounded bg-zinc-700 w-5/6"></div>
                    <div className="h-1.5 rounded bg-indigo-800 w-2/3 mt-0.5"></div>
                  </div>
                  <Moon className={`w-4 h-4 ${themeMode === "dark" ? "text-indigo-400" : "text-zinc-400"}`} />
                  <span className={`text-xs font-bold ${themeMode === "dark" ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500"}`}>
                    Tối
                  </span>
                  {themeMode === "dark" && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* SYSTEM */}
                <button
                  type="button"
                  onClick={() => handleSelectTheme("system")}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                    themeMode === "system"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50"
                  }`}
                >
                  <div className="w-full h-14 rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700 flex">
                    <div className="w-1/2 bg-white flex flex-col gap-1 p-1.5">
                      <div className="h-2 rounded bg-zinc-100 w-3/4"></div>
                      <div className="h-1.5 rounded bg-zinc-100 w-full"></div>
                    </div>
                    <div className="w-1/2 bg-zinc-900 flex flex-col gap-1 p-1.5">
                      <div className="h-2 rounded bg-zinc-700 w-3/4"></div>
                      <div className="h-1.5 rounded bg-zinc-700 w-full"></div>
                    </div>
                  </div>
                  <Monitor className={`w-4 h-4 ${themeMode === "system" ? "text-indigo-500" : "text-zinc-400"}`} />
                  <span className={`text-xs font-bold ${themeMode === "system" ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500"}`}>
                    Tự động
                  </span>
                  {themeMode === "system" && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>

              {themeMode === "system" && (
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-2 rounded-xl flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 shrink-0" />
                  Giao diện sẽ tự động chuyển sang Tối/Sáng dựa theo cài đặt hệ thống của thiết bị bạn.
                </p>
              )}
            </div>

            {/* CARD: CHẾ ĐỘ THU GỌN */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-start gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                  <Maximize2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Mật độ hiển thị (Compact Mode)</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Thu gọn khoảng cách và cỡ chữ để hiển thị nhiều nội dung hơn trên màn hình.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {isCompact ? "Chế độ Thu gọn đang BẬT" : "Chế độ Thoải mái đang BẬT"}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isCompact
                      ? "Khoảng cách nhỏ hơn, cỡ chữ nhỏ hơn — hiển thị nhiều nội dung hơn."
                      : "Khoảng cách đầy đủ, dễ đọc — phù hợp với màn hình lớn."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleCompact}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer shrink-0 ${
                    isCompact ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                  aria-label="Toggle compact mode"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                      isCompact ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Density preview side-by-side */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div
                  onClick={() => !isCompact && handleToggleCompact()}
                  className={`rounded-xl border p-3 flex flex-col gap-1.5 cursor-pointer transition-all ${
                    isCompact
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-zinc-200 dark:border-zinc-700 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Minimize2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Thu gọn</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 w-full"></div>
                  <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 w-5/6"></div>
                  <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 w-full"></div>
                  <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 w-4/6"></div>
                  <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 w-full"></div>
                </div>

                <div
                  onClick={() => isCompact && handleToggleCompact()}
                  className={`rounded-xl border p-3 flex flex-col gap-2.5 cursor-pointer transition-all ${
                    !isCompact
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-zinc-200 dark:border-zinc-700 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Maximize2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Thoải mái</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 w-full"></div>
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 w-5/6"></div>
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 w-full"></div>
                </div>
              </div>
            </div>

            {/* CARD: GỢI Ý TRUY CẬP NHANH */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-sky-500" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Mẹo truy cập nhanh</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Bạn cũng có thể chuyển đổi chế độ Tối/Sáng ngay trên thanh điều hướng chính bằng nút biểu tượng mặt trăng/mặt trời. Thay đổi sẽ được lưu tự động.
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
