import { useEffect, useState } from "react";
import { getProfile } from "../services/getProfile";

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      if (res.success) {
        setProfile(res.data);  // <-- Use the actual profile object
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);      // <-- Always set loading to false
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { profile, loading };
};
