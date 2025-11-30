import axios from 'axios';

const verifyOtp = async (email, otp) => {

  try {
    const response = await axios.post(
      "http://localhost:3000/v1/account/verify-otp",
      { email, otp },
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    console.log("Sign-up response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export { verifyOtp };