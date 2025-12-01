import { useState, useEffect } from "react";
import { getProfile } from "../services/getProfile";

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile(); // should send cookie automatically
        if (res.success) {
          setProfile(res.data); 
          setIsAuthenticated(true); 
        } else {
          setProfile(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error(err);
        setProfile(null); 
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, isAuthenticated };
};
