import { axiosPublic } from "../api/axios";
import useAuth from "./useAuth";

const useRefreshToken = () => {
    const { setAuth } = useAuth();

    const refresh = async () => {
        const response = await axiosPublic.post("/v1/refresh");

        setAuth(prev => ({
            ...prev,
            accessToken: response.data.accessToken,
        }));

        return response.data.accessToken;
    };

    return refresh;
};

export default useRefreshToken;
