import { axiosPublic } from "../api/axios"; // adjust the path if needed

const login = async (email, password) => {
  try {
    const response = await axiosPublic.post(
      "/v1/account/login",
      { email, password },
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // returns the accessToken and user info from backend
    return response.data;
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
};

export { login };
