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
    if (error.response?.status === 401) {
      // Not logged in — this is expected on first load
      return null;
    }
    console.error("Error fetching profile:", error);
    throw error;
  }
};
export { getProfile };