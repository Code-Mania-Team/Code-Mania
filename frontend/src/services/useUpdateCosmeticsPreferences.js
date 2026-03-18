import { useCallback } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

export default function useUpdateCosmeticsPreferences() {
  const axiosPrivate = useAxiosPrivate();

  return useCallback(
    async ({ avatar_frame_key, terminal_skin_id }) => {
      const res = await axiosPrivate.patch("/v1/cosmetics/preferences", {
        avatar_frame_key,
        terminal_skin_id,
      });
      return res.data;
    },
    [axiosPrivate]
  );
}
