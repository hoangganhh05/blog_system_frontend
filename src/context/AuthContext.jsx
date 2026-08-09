import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục user từ localStorage khi load trang và chuẩn hóa ID (id = userId || id)
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
      }
    }
    setLoading(false);
  }, []);

  // userData = { token, userId, username, fullName, role }
  const login = (userData) => {
    const { token, ...user } = userData;
    // Chuẩn hóa id để luôn có currentUser.id
    const normalizedUser = {
      ...user,
      id: user.id || user.userId,
    };

    setCurrentUser(normalizedUser);
    localStorage.setItem("blog_user", JSON.stringify(normalizedUser));
    localStorage.setItem("blog_token", token);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("blog_user");
    localStorage.removeItem("blog_token");
  };

  const updateUser = (updatedUser) => {
    const normalizedUser = {
      ...updatedUser,
      id: updatedUser.id || updatedUser.userId,
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
