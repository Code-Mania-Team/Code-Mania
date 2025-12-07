import axios from 'axios';

const login = async (email, password) => {

  try {
    const response = await axios.post(
      "http://localhost:3000/v1/account/login",
      { email, password },
      {
        headers: {
          apikey:  import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
        },
        withCredentials: true 
      }
    );
    return response.data;
  
  } catch (error) {
    console.error("Error message:", error.message);
    throw error;
  }
};

export { login };