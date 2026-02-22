import { createContext, useEffect, useMemo, useState } from "react";
import { axiosPrivate } from "../api/axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

    const fetchProfile = async () => {
      const response = await axiosPrivate.get("/v1/account");
      if (response?.data?.success) {
        return response.data.data;
      }
      return null;
    };

    const checkAuth = async () => {
      try {
        const profile = await fetchProfile();
        applyProfile(profile);
      } catch (error) {
        const status = error?.response?.status;

        if (status === 401) {
          try {
            const refreshRes = await axiosPrivate.get("/v1/refresh");
            if (refreshRes?.data?.accessToken) {
              const profile = await fetchProfile();
              applyProfile(profile);
              return;
            }
          } catch {
            // ignore and sign out below
          }
        }

        console.log("Auth check failed:", status);
        setSignedOut();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkAuth();

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
