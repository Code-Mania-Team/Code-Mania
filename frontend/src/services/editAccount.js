import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useEditAccount = () => {
  const axiosPrivate = useAxiosPrivate();

  const EditAccount = async (full_name) => {
    const normalizedFullName = (full_name || "").trim();
    if (!normalizedFullName || normalizedFullName.length < 3) {
      throw new Error("Please enter a valid Full Name.");
    }

    try {
      const response = await axiosPrivate.patch("/v1/account", {
        full_name: normalizedFullName,
      });

      console.log("Edit Account response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  return EditAccount;
};

export { useEditAccount };
