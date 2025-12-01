import { createContext, useContext, useState, useEffect } from "react";
import { loginService, logoutService, checkAuthService } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth on mount using service
    checkAuthService()
      .then((res) => setIsAuthenticated(res.success))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await loginService(email, password);
    if (res.success) setIsAuthenticated(true);
    return res;
  };

  const logout = async () => {
    await logoutService();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
