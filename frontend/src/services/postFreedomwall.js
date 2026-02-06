import axios from "axios";
const userPost = async (content) => {
  try {
    const response = await axios.post(
      "http://localhost:3000/v1/freedom-wall/",
      { content },
      {
        headers: {
          apikey: import.meta.env.VITE_API_KEY,
          "Content-Type": "application/json",
        },
        withCredentials: true,
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