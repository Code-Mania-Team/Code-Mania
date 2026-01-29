import axios from "axios";
const userPost = async (content) => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token found. Please log in again.');
    }
    const response = await axios.post(
      "http://localhost:3000/v1/freedom-wall/",
      { content },
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
          
        },
      }
    );
    console.log("Post response:", response.data);
    console.log("access token:", response.data.accessToken)
    if (response.data.success === false) {
      console.log(response.data.message);
      throw new Error(response.data.message || "Post failed");
    }
    
 
    // returns the accessToken and user info from backend
    return response.data;
  } catch (error) {
    console.error("post error:", error.message);
    throw error;
  }
}

export { userPost };