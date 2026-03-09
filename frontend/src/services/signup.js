import { axiosPublic } from "../api/axios";

const signUp = async (email, password) => {
  try {

    const response = await axiosPublic.post(
      "/v1/account/signup/request-otp",
      { email, password },
      {
        withCredentials: true,
      }
    );


    return response.data;
  } catch (error) {
    throw error;
  }
};

export { signUp };
