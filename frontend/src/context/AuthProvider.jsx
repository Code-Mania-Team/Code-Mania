import { createContext, useEffect, useMemo, useState } from "react";
import { axiosPublic } from "../api/axios";
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const res = await axiosPublic.get("/v1/account");
        if (!mounted) return;
        const ok = res?.data?.success === true;
        const profile = res?.data?.data;
        const hasUserId = Boolean(profile && profile.user_id);
        if (ok && hasUserId) {
          setUser(profile);
          setIsAuthenticated(true);
          return;
        }
        setUser(null);
        setIsAuthenticated(false);
      } catch (err) {
        if (!mounted) return;
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };
    bootstrap();
    const handleAuthChange = () => {
      bootstrap();
    };
    window.addEventListener("authchange", handleAuthChange);
    return () => {
      window.removeEventListener("authchange", handleAuthChange);
      mounted = false;
    };
  }, []);
  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated,
      setIsAuthenticated,
      isLoading,
      setIsLoading,
    }),
    [user, isAuthenticated, isLoading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export default AuthContext;
