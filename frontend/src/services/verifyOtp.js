import { axiosPublic } from "../api/axios";
const verifyOtp = async (email, otp) => {
  try {
    const response = await axiosPublic.post(
      "/v1/account/signup/verify-otp",
      { email, otp },
      { withCredentials: true },
    );
    console.log("Sign-up response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
export { verifyOtp };
