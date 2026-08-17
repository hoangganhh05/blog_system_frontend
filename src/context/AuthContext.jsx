import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionKicked, setSessionKicked] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  // Khôi phục user từ localStorage khi load trang và lắng nghe sự thay đổi thiết bị đăng nhập
  useEffect(() => {
    const savedUser = localStorage.getItem("blog_user");

    // Dọn sạch user rác nếu có
    if (!savedUser || savedUser === "undefined" || savedUser === "null") {
      localStorage.removeItem("blog_user");
      localStorage.removeItem("blog_session_id");
      setCurrentUser(null);
    } else {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === "object") {
          const normalizedUser = {
            ...parsed,
            id: parsed.id || parsed.userId,
          };
          setCurrentUser(normalizedUser);

          // Tự động đồng bộ profile mới nhất (avatarUrl, fullName, avatarColor) từ backend
          import("../services/userService").then(({ default: userService }) => {
            userService.getMe().then((res) => {
              if (res.data) {
                const refreshed = {
                  ...normalizedUser,
                  ...res.data,
                  id: res.data.id || normalizedUser.id,
                };
                setCurrentUser(refreshed);
                localStorage.setItem("blog_user", JSON.stringify(refreshed));
              }
            }).catch(() => {});
          });
        } else {
          throw new Error("Invalid user json");
        }
      } catch {
        localStorage.removeItem("blog_user");
        localStorage.removeItem("blog_session_id");
        setCurrentUser(null);
      }
    }
    setLoading(false);

    // Lắng nghe sự thay đổi của session từ các tab / thiết bị khác (Single Device Session Check)
    const handleStorageChange = (e) => {
      if (e.key === "blog_session_id" || e.key === "blog_user") {
        const currentSaved = localStorage.getItem("blog_user");
        const currentSession = localStorage.getItem("blog_session_id");
        if (currentSaved && currentSession) {
          try {
            const currentParsed = JSON.parse(currentSaved);
            if (currentParsed && typeof currentParsed.sessionToken === "string" && currentSession !== currentParsed.sessionToken) {
              setSessionKicked(true);
              logout();
            }
          } catch {}
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // userData = { userId, username, fullName, role }
  const login = (userData) => {
    if (!userData || typeof userData !== "object") {
      console.error("[AUTH LOGIN ERROR] Dữ liệu người dùng không hợp lệ:", userData);
      return;
    }

    const sessionToken = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    const normalizedUser = {
      ...userData,
      id: userData.id || userData.userId,
      sessionToken,
    };

    setCurrentUser(normalizedUser);
    setSessionKicked(false);
    localStorage.setItem("blog_user", JSON.stringify(normalizedUser));
    localStorage.setItem("blog_session_id", sessionToken);
  };

  // Heartbeat định kỳ duy trì trạng thái Online thời gian thực
  useEffect(() => {
    if (!currentUser?.id) return;

    const performHeartbeat = () => {
      import("../utils/statusUtils").then(({ isUserActiveStatusEnabled }) => {
        const isEnabled = isUserActiveStatusEnabled(currentUser.id);
        import("../services/userService").then(({ default: uService }) => {
          if (isEnabled) {
            uService.heartbeat().catch(() => {});
          } else {
            uService.setOffline().catch(() => {});
          }
        });
      });
    };

    performHeartbeat();

    const interval = setInterval(performHeartbeat, 60000);

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const logout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } catch {}

    import("../services/userService").then(({ default: uService }) => {
      uService.setOffline().catch(() => {});
    });
    setCurrentUser(null);
    localStorage.removeItem("blog_user");
    localStorage.removeItem("blog_session_id");
  };

  const updateUser = (updatedUser) => {
    const sessionToken = localStorage.getItem("blog_session_id");
    const normalizedUser = {
      ...updatedUser,
      id: updatedUser.id || updatedUser.userId,
      sessionToken: sessionToken || updatedUser.sessionToken,
    };
    setCurrentUser(normalizedUser);
    localStorage.setItem("blog_user", JSON.stringify(normalizedUser));
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, login, logout, updateUser, loading, showToast }}
    >
      {children}

      {/* Security Modal Alert khi bị đăng nhập ở thiết bị khác */}
      {sessionKicked && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderRadius: 20,
              maxWidth: 420,
              width: "100%",
              padding: "32px 24px",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
              animation: "slideUp 0.25s ease",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                margin: "0 auto 16px",
              }}
            >
              ⚠️
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
              Phát hiện Đăng nhập trên Thiết bị mới
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 24 }}>
              Tài khoản của bạn vừa được đăng nhập thành công từ một trình duyệt/thiết bị khác. Thiết bị này đã tự động đăng xuất để bảo vệ an toàn cho tài khoản.
            </p>
            <button
              onClick={() => {
                setSessionKicked(false);
                window.location.href = "/login";
              }}
              className="btn btn-primary btn-full"
              style={{ padding: "12px 0", borderRadius: 12, fontWeight: 700, fontSize: 15 }}
            >
              Đã hiểu & Đăng nhập lại
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div
          role="status"
          style={{ position: "fixed", right: 20, bottom: 20, zIndex: 10000000, maxWidth: 420, padding: "12px 16px", borderRadius: 12, color: "#fff", background: toast.type === "error" ? "#dc2626" : "#059669", boxShadow: "0 10px 30px rgba(0,0,0,.25)" }}
        >
          {toast.message}
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
