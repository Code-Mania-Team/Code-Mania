import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useUpdateDomSession = () => {
  const axiosPrivate = useAxiosPrivate();

  const updateDomSession = async (sessionId, code) => {
    const response = await axiosPrivate.post(
      `/v1/dom/session/${sessionId}`,
      { code }
    );


    return response.data;
  };

  return updateDomSession;
};

export default useUpdateDomSession;
