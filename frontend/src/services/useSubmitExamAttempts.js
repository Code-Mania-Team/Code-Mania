import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useSubmitExamAttempt = () => {
  const axiosPrivate = useAxiosPrivate();

  const submitExamAttempt = async (attemptId, code) => {
    const response = await axiosPrivate.post(
      `/v1/exam/attempts/${attemptId}/submit`,
      { code }
    );

    return response.data.data;
  };

  return submitExamAttempt;
};

export default useSubmitExamAttempt;