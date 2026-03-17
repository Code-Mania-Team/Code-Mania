import { useCallback } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

export default function useCosmeticsMe() {
  const axiosPrivate = useAxiosPrivate();

  return useCallback(async () => {
    const res = await axiosPrivate.get("/v1/cosmetics/me");
    return res.data;
  }, [axiosPrivate]);
}
