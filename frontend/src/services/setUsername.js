import axios from 'axios';

const onBoardUsername = async (username, characterId) => {
  if (username === '' || username.length < 3) {
    throw new Error("Please enter a valid username.");
  }
  

  try {
    const response = await axios.post(
      "http://localhost:3000/v1/account/setOnboarding",
      { username, character_id: characterId },
      { 
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    console.log("Username set response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error during set userame:", error);
    throw error;
  }
};

export { onBoardUsername };