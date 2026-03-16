import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { containsProfanity } from "../utils/profanityFilter";

const useOnBoardUsername = () => {
  const axiosPrivate = useAxiosPrivate();

  const onBoardUsername = async (username, characterId, fullName) => {
    if (username === '' || username.length < 3) {
      throw new Error("Username must be at least 3 characters long.");
    }
    
    if (username.length > 10) {
      throw new Error("Username must be 10 characters or less.");
    }
    
    // Username validation: only letters, numbers, and _, ., @
    const usernameRegex = /^[a-zA-Z0-9_.@]+$/;
    if (!usernameRegex.test(username)) {
      throw new Error("Username can only contain letters, numbers, and _, ., @");
    }
    
    // Full name validation: only letters and spaces
    const fullNameRegex = /^[a-zA-Z\s]+$/;
    if (!fullNameRegex.test(fullName)) {
      throw new Error("Full name can only contain letters and spaces");
    }
    
    if (containsProfanity(username)) {
      throw new Error("Username contains inappropriate language.");
    }
    

    try {
      const response = await axiosPrivate.post("/v1/account/setOnboarding", {
        username,
        character_id: characterId,
        full_name: fullName
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return onBoardUsername;
};

export { useOnBoardUsername };
