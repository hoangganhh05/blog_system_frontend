import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục user từ localStorage khi load trang và lắng nghe sự thay đổi thiết bị đăng nhập
  useEffect(() => {
    const savedUser = localStorage.getItem("blog_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const normalizedUser = {
          ...parsed,
          id: parsed.id || parsed.userId,
        };
        setCurrentUser(normalizedUser);
      } catch {
        localStorage.removeItem("blog_user");
        localStorage.removeItem("blog_token");
        localStorage.removeItem("blog_session_id");
      }
    }
    setLoading(false);

    // Lắng nghe sự thay đổi của session từ các tab / thiết bị khác (Single Device Session Check)
    const handleStorageChange = (e) => {
      if (e.key === "blog_session_id" || e.key === "blog_user") {
        const currentSaved = localStorage.getItem("blog_user");
        if (!currentSaved) {
          setCurrentUser(null);
          return;
        }
        try {
          const currentParsed = JSON.parse(currentSaved);
          const currentSession = localStorage.getItem("blog_session_id");
          if (currentParsed && currentSession && currentParsed.sessionToken && currentSession !== currentParsed.sessionToken) {
            setCurrentUser(null);
            localStorage.removeItem("blog_user");
            localStorage.removeItem("blog_token");
            localStorage.removeItem("blog_session_id");
            alert("Tài khoản của bạn vừa được đăng nhập trên một thiết bị khác. Phiên này đã tự động đăng xuất!");
            window.location.href = "/login";
          }
        } catch {
          // Fail silently
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // userData = { token, userId, username, fullName, role }
  const login = (userData) => {
    const { token, ...user } = userData;
    const sessionToken = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    const normalizedUser = {
      ...user,
      id: user.id || user.userId,
      sessionToken,
    };

    setCurrentUser(normalizedUser);
    localStorage.setItem("blog_user", JSON.stringify(normalizedUser));
    localStorage.setItem("blog_token", token);
    localStorage.setItem("blog_session_id", sessionToken);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("blog_user");
    localStorage.removeItem("blog_token");
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
      value={{ currentUser, login, logout, updateUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
