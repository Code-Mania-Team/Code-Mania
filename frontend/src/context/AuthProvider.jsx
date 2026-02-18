import { createContext, useEffect, useMemo, useState } from "react";
import { axiosPrivate } from "../api/axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        console.log(" AUTH: Checking authentication status...");
        const response = await axiosPrivate.get("/v1/account");
        console.log(" AUTH: Auth check response:", response?.data?.success ? "success" : "failed");
        
        if (mounted && response?.data?.success) {
          const profile = response.data.data;
          if (profile?.user_id) {
            console.log(" AUTH: User authenticated:", profile.user_id);
            setUser(profile);
            setIsAuthenticated(true);
          } else {
            console.log(" AUTH: No user_id in response");
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log(" AUTH: Auth check failed - no success response");
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log("Auth check failed:", error.response?.status);
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
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
