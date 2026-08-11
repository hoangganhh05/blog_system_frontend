import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

function SecuritySettingsPage() {
  const { currentUser } = useAuth();
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ text: "", type: "" });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ text: "", type: "" });

    if (!passForm.oldPassword) {
      return setPassMsg({ text: "Vui lòng nhập mật khẩu hiện tại!", type: "error" });
    }
    if (!passForm.newPassword || passForm.newPassword.length < 8) {
      return setPassMsg({ text: "Mật khẩu mới phải có ít nhất 8 ký tự!", type: "error" });
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      return setPassMsg({ text: "Xác nhận mật khẩu mới không trùng khớp!", type: "error" });
    }

    setPassLoading(true);
    try {
      await userService.changePassword(currentUser.id, passForm.oldPassword, passForm.newPassword);
      setPassMsg({ text: "Đổi mật khẩu thành công!", type: "success" });
      setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPassMsg({ text: err.response?.data || "Mật khẩu hiện tại không đúng!", type: "error" });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="app-layout" style={{ background: "var(--bg-secondary)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px 16px" }}>
        
        {/* Header Title */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px 0" }}>
            🛡️ Cài đặt bảo mật tài khoản
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
            Quản lý mật khẩu cá nhân, trạng thái xác thực Gmail và thông tin phiên làm việc bảo mật.
          </p>
        </div>

        {/* Form 1: Thay đổi mật khẩu */}
        <div className="card" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            🔑 Thay đổi mật khẩu
          </h2>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Mật khẩu hiện tại</label>
              <input
                type="password"
                className="form-input"
                value={passForm.oldPassword}
                onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                placeholder="Nhập mật khẩu hiện tại..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu mới</label>
              <input
                type="password"
                className="form-input"
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                placeholder="Ít nhất 8 ký tự..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                className="form-input"
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu mới..."
              />
            </div>

            {passMsg.text && (
              <div
                className={`alert ${passMsg.type === "success" ? "alert-success" : "alert-error"}`}
                style={{ marginBottom: 16 }}
              >
                {passMsg.text}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={passLoading}
              style={{ padding: "10px 24px", borderRadius: 12, fontWeight: 700 }}
            >
              {passLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </button>
          </form>
        </div>

        {/* Card 2: Bảo mật Gmail & Thiết bị */}
        <div className="card" style={{ padding: 24, borderRadius: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            📧 Bảo mật Gmail & Thiết bị
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 14,
                borderRadius: 14,
                background: "var(--bg-input)",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  Khôi phục mật khẩu qua Gmail OTP
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
                  Mã OTP xác thực sẽ gửi về Gmail chính chủ của bạn
                </div>
              </div>
              <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 700 }}>
                🟢 Đã bật
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 14,
                borderRadius: 14,
                background: "var(--bg-input)",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  Phiên làm việc hiện tại
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
                  Đang đăng nhập trên Trình duyệt Web (Windows / Mobile)
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
                Trình duyệt Web
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecuritySettingsPage;
