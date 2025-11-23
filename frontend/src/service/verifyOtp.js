import axios from 'axios';

const verifyOtp = async (email, otp) => {

  try {
    const response = await axios.post(
      "http://localhost:3000/v1/account/verify-otp",
      { email, otp },
      {
        headers: {
          apikey: "hotdog",
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

export { verifyOtp };