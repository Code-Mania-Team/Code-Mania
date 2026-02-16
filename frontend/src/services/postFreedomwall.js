import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useUserPost = () => {
  const axiosPrivate = useAxiosPrivate();

  const userPost = async (content) => {
    try {
      console.log("Post content:", content);
      const response = await axiosPrivate.post(
        "/v1/freedom-wall/",
        { content },
        { headers: {} }
      );
      console.log("Post response:", response.data);
      if (response.data.success === false) {
        console.log(response.data.message);
        throw new Error(response.data.message || "Post failed");
      }

      // relies on cookies for auth
      return response.data;
    } catch (error) {
      console.error("post error:", error.message);
      throw error;
    }
  };

  return userPost;
};

export default useUserPost;