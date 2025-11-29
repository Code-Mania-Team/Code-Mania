import axios from 'axios';

const login = async (email, password) => {

  try {
    const response = await axios.post(
      "http://localhost:3000/v1/account/login",
      { email, password },
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Sign-up response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export { login };