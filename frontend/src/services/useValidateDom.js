import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useValidateDom = () => {
  const axiosPrivate = useAxiosPrivate();

  const validateDom = async (sessionId, requirements) => {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const response = await axiosPrivate.post(
      `/v1/dom/validate/${sessionId}`,
      {
        requirements: requirements
      }
    );

    return response.data;
  };

  return validateDom;
};

export default useValidateDom;