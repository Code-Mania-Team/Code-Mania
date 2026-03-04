import { axiosPublic } from "../api/axios";

const verifyOtp = async (email, otp) => {

  try {
    const response = await axiosPublic.post(
      "/v1/account/signup/verify-otp",
      { email, otp },
      { withCredentials: true }
    );

    console.log("Sign-up response:", response.data);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || "Invalid OTP",
    };
  }
};

export { verifyOtp };
