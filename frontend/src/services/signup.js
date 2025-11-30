import axios from 'axios';

const signUp = async (email, password) => {

  try {
    const response = await axios.post(
      "http://localhost:3000/v1/account/request-otp",
      { email, password },
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
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