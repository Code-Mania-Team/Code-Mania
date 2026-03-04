import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useDeleteDomSession = () => {
  const axiosPrivate = useAxiosPrivate();

  const deleteDomSession = async (sessionId) => {
    const response = await axiosPrivate.delete(
      `/v1/dom/session/${sessionId}`
    );

    console.log("🗑 DOM session deleted");

    return response.data;
  };

  return deleteDomSession;
};

export default useDeleteDomSession;