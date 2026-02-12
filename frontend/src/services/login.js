import axios from "axios";

const login = async (email, password) => {

  try {

    const response = await axios.post(

      "http://localhost:3000/v1/account/login",

      { email, password },

      {

        headers: {

          apikey: import.meta.env.VITE_API_KEY,

          "Content-Type": "application/json",

          

        },

        withCredentials: true,

      }

    );

    console.log("Login response:", response.data);

    console.log("access token:", response.data.accessToken)

    if (response.data.success === false) {

      console.log(response.data.message);

      throw new Error(response.data.message || "Login failed");

    }

 

    // returns the accessToken and user info from backend

    return response.data;

  } catch (error) {

    const backendMessage =

      error?.response?.data?.message ||

      error?.response?.data?.error;



    if (backendMessage) {

      throw new Error(backendMessage);

    }

    console.error("Login error:", error.message);

    throw error;

  }

};



const loginWithGoogle = async () => {

  await window.open("http://localhost:3000/v1/account/login/google", "_self")

}



export { login, loginWithGoogle };

