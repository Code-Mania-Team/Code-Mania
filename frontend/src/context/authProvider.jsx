import { createContext, useContext, useState, useEffect } from "react";
import { useProfile } from "../hooks/useProfile";
import { SessionOut } from "../services/signOut";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { profile, loading, refreshProfile } = useProfile();
  

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );;

  const login = async (email, password) => {
    try {
      const data = await loginApi(email, password); // Axios call with { withCredentials: true }
      if (data?.success) {
        localStorage.setItem("isAuthenticated", "true");
        setIsAuthenticated(true);
        // Optional: fetch profile info after login
        await fetchProfile();
      }
      return data;
    } catch (err) {
      setIsAuthenticated(false);
      localStorage.setItem("isAuthenticated", "false");
      throw err;
    } finally {
    }
  };

  // Sync internal state whenever profile changes
  useEffect(() => {
    console.log("profile:", profile);
    console.log("loading:", loading);
    console.log("isAuthenticated:", isAuthenticated);
    if (!loading) {
      if (profile) {
        setUser(profile.data);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [profile, loading]);

  const signOut = async () => {
    try {
      await SessionOut();           // <-- calls your backend properly
      setUser(null);                   // update auth state instantly
      setIsAuthenticated(false);           // fetch fresh auth state from server
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
