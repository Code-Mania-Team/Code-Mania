import axios from 'axios';

const DeleteAccount = async () => {

  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('No access token found. Please log in again.');
  }

  try {
    const response = await axios.delete(
      "http://localhost:3000/v1/account",
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
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

