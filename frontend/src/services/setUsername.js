import useAxiosPrivate from "../hooks/useAxiosPrivate";
const useOnBoardUsername = () => {
  const axiosPrivate = useAxiosPrivate();
  const onBoardUsername = async (username, characterId, fullName) => {
    if (username === "" || username.length < 3) {
      throw new Error("Please enter a valid username.");
    }
    try {
      const response = await axiosPrivate.post("/v1/account/setOnboarding", {
        username,
        character_id: characterId,
        full_name: fullName,
      });
      console.log("Username set response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error during set userame:", error);
      throw error;
    }
  };
  return onBoardUsername;
};
export { useOnBoardUsername };
