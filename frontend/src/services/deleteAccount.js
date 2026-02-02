import axios from 'axios';

const DeleteAccount = async () => {

  try {
    const response = await axios.delete(
      "http://localhost:3000/v1/account",
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    
    console.log("Delete Account response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};


export { DeleteAccount };

