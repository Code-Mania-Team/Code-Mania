import { createContext, useEffect, useMemo, useState } from "react";
import { axiosPrivate } from "../api/axios";
import useRefreshToken from "../hooks/useRefreshToken";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refresh = useRefreshToken();

  useEffect(() => {
    let mounted = true;

    const setSignedOut = () => {
      if (!mounted) return;
      setUser(null);
      setIsAuthenticated(false);
    };

    const applyProfile = (profile) => {
      if (!mounted) return;
      if (profile?.user_id) {
        setUser(profile);
        setIsAuthenticated(true);
      } else {
        setSignedOut();
      }
    };

    const checkAuth = async () => {
      try {
        await refresh(); 
        console.log("Checking authentication status...");
        const response = await axiosPrivate.get("/v1/account");
        console.log("Auth check response:", response);
        if (response?.data?.success) {
          applyProfile(response.data.data);
        } else {
          console.log("Auth check failed - no success flag");
          setSignedOut();
        }
      } catch (error) {
        console.error("catch auth check error:", error);
        setSignedOut();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    const path = (typeof window !== 'undefined' && window.location && typeof window.location.pathname === 'string')
      ? window.location.pathname
      : '/';
    const isLandingPath = path === '/' || path.includes('landing') || path.includes('home');
    if (!isLandingPath) {
      checkAuth();
    } else {
      if (mounted) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    }

    return () => {
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

export default AuthProvider;
