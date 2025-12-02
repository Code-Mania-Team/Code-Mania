import { useState, useEffect } from "react";
import { getProfile } from "../services/getProfile";

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data || null);
      setIsAuthenticated(!!data);
    } catch (err) {
      if (err.response?.status === 401) {
        setProfile(null);
        setIsAuthenticated(false);
      } else {
        console.error("Unexpected error fetching profile:", err);
        setProfile(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (!localStorage.getItem("token")) {
    setLoading(false);
    return;
  }
  fetchProfile();
}, []);

  return { profile, loading, isAuthenticated, refreshProfile: fetchProfile };
};
