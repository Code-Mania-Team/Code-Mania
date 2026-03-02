import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useCreateDomSession = () => {
  const axiosPrivate = useAxiosPrivate();

  const createDomSession = async ({ questId, baseHtml }) => {
    const response = await axiosPrivate.post(
      "/v1/dom/session",
      {
        questId,
        baseHtml
      }
    );

    console.log("✅ DOM session created", response.data);

    return response.data;
  };

  return createDomSession;
};

export default useCreateDomSession;