import { axiosPublic } from "../api/axios";
const signUp = async (email, password) => {
  console.log("SIGNUP FUNCTION ENTERED");
  console.log("EMAIL:", email);
  console.log("PASSWORD:", password);
  try {
    console.log("ABOUT TO CALL AXIOS");
    const response = await axiosPublic.post(
      "/v1/account/signup/request-otp",
      { email, password },
      {
        withCredentials: true,
      },
    );
    console.log("Sign-up response:", response.data);
    console.log("SIGNUP SERVICE CALLED", email);
    return response.data;
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    console.log("AXIOS ");
    throw error;
  }
};
export { signUp };
