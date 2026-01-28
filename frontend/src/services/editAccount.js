import axios from 'axios';

const EditAccount = async ( full_name ) => {

  const normalizedFullName = (full_name || '').trim();
  if (!normalizedFullName || normalizedFullName.length < 3) {
    throw new Error("Please enter a valid Full Name.");
  }
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('No access token found. Please log in again.');
  }

  try {
    const response = await axios.patch(
      "http://localhost:3000/v1/account",
      { full_name: normalizedFullName },
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    console.log("Edit Account response:", response.data);
    if (response.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};


export { EditAccount };

