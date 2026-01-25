
import axios from "axios";
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
    console.log("Login response:", response.data);  

    // returns the accessToken and user info from backend
    return response.data;
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
};

export { login };
