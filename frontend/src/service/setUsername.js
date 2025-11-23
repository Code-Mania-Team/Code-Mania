import axios from 'axios';

const signUp = async (email, password, token) => {

  try {
    const response = await axios.post(
      "http://localhost:3000/v1/account/request-otp",
      { email, password },
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

export { signUp };