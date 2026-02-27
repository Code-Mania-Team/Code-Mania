import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useMarkTutorialSeen = () => {
  const axiosPrivate = useAxiosPrivate();

  const markTutorialSeen = async () => {
    const response = await axiosPrivate.patch("/v1/account", {
      hasSeen_tutorial: true,
    });

    return response?.data || null;
  };

  return markTutorialSeen;
};

export default useMarkTutorialSeen;
