import axios from 'axios';

const onBoardUsername = async (username) => {
  if (username === '' || username.length < 3) {
    throw new Error("Please enter a valid username.");
  }
  

  try {
    const response = await axios.post(
      "http://localhost:3000/v1/account/username",
      { username },
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
    console.log("Username set response:", response.data);
  } catch (error) {
    console.error("Error during top-up:", error);
    throw error;
  }
};

export { onBoardUsername };