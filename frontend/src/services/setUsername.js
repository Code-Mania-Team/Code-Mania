import axios from 'axios';

const onBoardUsername = async (username, characterId) => {
  if (username === '' || username.length < 3) {
    throw new Error("Please enter a valid username.");
  }
  

  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token found. Please log in again.');
    }

    const response = await axios.post(
      "http://localhost:3000/v1/account/setOnboarding",
      { username, character_id: characterId },
      { 
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        // withCredentials: true,
      }
    );
    console.log("Username set response:", response.data);

    if (response.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data;
  } catch (error) {
    console.error("Error during set userame:", error);
    throw error;
  }
};

export { onBoardUsername };