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


    return response.data;
  };

  return createDomSession;
};

export default useCreateDomSession;
