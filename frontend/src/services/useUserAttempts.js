import { useCallback } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

export default function useUserAttempts() {
  const axiosPrivate = useAxiosPrivate();

  return useCallback(
    async ({ limit = 30 } = {}) => {
      const res = await axiosPrivate.get("/v1/account/attempts", { params: { limit } });
      return res.data;
    },
    [axiosPrivate]
  );
}
