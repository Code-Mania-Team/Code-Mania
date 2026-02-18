import { createContext, useEffect, useMemo, useState } from "react";
import { axiosPrivate } from "../api/axios";

const characterIcon0 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character_kwtv10.png';
const characterIcon1 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character1_a6sw9d.png';
const characterIcon2 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character3_bavsbw.png';
const characterIcon3 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character4_y9owfi.png';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const response = await axiosPrivate.get("/v1/account");
        if (mounted && response?.data?.success) {
          const profile = response.data.data;
          if (profile?.user_id) {
            const nextUsername = profile?.username || '';
            const nextFullName = profile?.full_name || '';
            if (nextUsername) localStorage.setItem('username', nextUsername);
            if (nextFullName) localStorage.setItem('fullName', nextFullName);

            const nextCharacterId =
              profile?.character_id === null || profile?.character_id === undefined
                ? null
                : Number(profile.character_id);

            if (nextCharacterId !== null && !Number.isNaN(nextCharacterId)) {
              localStorage.setItem('selectedCharacter', String(nextCharacterId));
              const expectedIcon = {
                0: characterIcon1,
                1: characterIcon0,
                2: characterIcon2,
                3: characterIcon3,
              }[nextCharacterId] || null;

              if (expectedIcon) {
                localStorage.setItem('selectedCharacterIcon', expectedIcon);
              } else {
                localStorage.removeItem('selectedCharacterIcon');
              }
            }

            window.dispatchEvent(new Event('characterUpdated'));
            setUser(profile);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
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
