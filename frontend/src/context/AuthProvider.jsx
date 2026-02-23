import { createContext, useEffect, useMemo, useState } from "react";
import { axiosPrivate } from "../api/axios";

// Prevent duplicate auth bootstrap requests in React StrictMode dev.
let authBootstrapPromise = null;

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

    const checkAuth = async () => {
      try {
        if (!authBootstrapPromise) {
          authBootstrapPromise = (async () => {
            const response = await axiosPrivate.get("/v1/account");
            if (response?.data?.success) return response.data.data;
            return null;
          })();
        }

        const profile = await authBootstrapPromise;
        applyProfile(profile);
      } catch (error) {
        // Keep boot quiet; axios interceptor handles refresh.
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
