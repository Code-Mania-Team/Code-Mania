import axios from 'axios';

const EditAccount = async ( full_name ) => {

  const normalizedFullName = (full_name || '').trim();
  if (!normalizedFullName || normalizedFullName.length < 3) {
    throw new Error("Please enter a valid Full Name.");
  }

  try {
    const response = await axios.patch(
      "http://localhost:3000/v1/account",
      { full_name: normalizedFullName },
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    
    console.log("Edit Account response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};


export { EditAccount };

