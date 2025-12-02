import axios from 'axios';

const SessionOut = async () => {

  try {
    const response = await axios.post(
      "http://localhost:3000/v1/account/logout",
      {},
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    
    console.log("Sign-out response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export { SessionOut };

