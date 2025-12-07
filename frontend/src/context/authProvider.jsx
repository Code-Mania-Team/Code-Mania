import { createContext, useContext, useState, useEffect } from "react";
import { SessionOut as signOutService } from "../services/signOut";
import { getProfile } from "../services/getProfile";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // start as true

  

  // Restore session on app load
  const restoreSession = async () => {
    setLoading(true);
    try {
      const profileData = await getProfile(); // returns null if 401
      setIsAuthenticated(!!profileData);
      // console.log("Restored profile data:", !!profileData);
      // console.log("labas User is authenticated", !!profileData, isAuthenticated);
      // if (!!profileData) {
      //   setIsAuthenticated(!!profileData);
      //   console.log("User is authenticated", !!profileData, isAuthenticated);
      // } else {
      //   setIsAuthenticated(false);
      // }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // if (isAuthenticated === true)
      restoreSession(); // run once on mount

  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await signOutService();
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        signOut,
        refreshProfile: restoreSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
