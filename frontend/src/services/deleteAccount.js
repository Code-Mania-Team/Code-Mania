import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useDeleteAccount = () => {
  const axiosPrivate = useAxiosPrivate();

  const DeleteAccount = async () => {
    try {
      const response = await axiosPrivate.delete("/v1/account");

      console.log("Delete Account response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  return DeleteAccount;
};

export { useDeleteAccount };
