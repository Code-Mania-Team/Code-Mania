import { useCallback } from "react";

import { axiosPublic } from "../api/axios";

const useGetPublicProfile = () => {
  const getPublicProfile = useCallback(async (username) => {
    const handle = String(username || "").trim();
    if (!handle) return null;

    const res = await axiosPublic.get(`/v1/account/public/${encodeURIComponent(handle)}`);
    return res.data;
  }, []);

  return getPublicProfile;
};

export default useGetPublicProfile;
