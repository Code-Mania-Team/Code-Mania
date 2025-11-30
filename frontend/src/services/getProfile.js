import axios from 'axios';

const getProfile = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3000/v1/account",
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export { getProfile };