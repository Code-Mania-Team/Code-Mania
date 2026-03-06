import { axiosPublic } from "../api/axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const login = async (email, password) => {
  try {
    const response = await axiosPublic.post(
      "/v1/account/login",
      { email, password },
      {
        headers: {},
      },
    );


    if (response.data.success === false) {
      throw new Error(response.data.message || "Login failed");
    }
    // cookies are set by the backend; frontend should not persist tokens
    return response.data;
  } catch (error) {
    const backendMessage =
      error?.response?.data?.message || error?.response?.data?.error;
    if (backendMessage) {
      throw new Error(backendMessage);
    }
    console.error("Login error:", error.message);
    throw error;
  }
};

const loginWithGoogle = async () => {
  window.location.href = `${API_BASE_URL}/v1/account/login/google`;
}

export { login, loginWithGoogle };
