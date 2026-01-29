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
    console.log("access token:", response.data.accessToken)
    if (response.data.success === false) {
      console.log(response.data.message);
      throw new Error(response.data.message || "Login failed");
    }
    if (response.data?.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
    }
 
    // returns the accessToken and user info from backend
    return response.data;
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
};

export { login };
