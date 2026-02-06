import { axiosPublic } from "../api/axios";
import useAuth from "./useAxios";

const useRefreshToken = () => {
    const { setAuth } = useAuth();

    const refresh = async () => {
        const response = await axiosPublic.get("/v1/refresh");

        setAuth(prev => ({
            ...prev,
            accessToken: response.data.accessToken,
        }));

        return response.data.accessToken;
    };

    return refresh;
};

export default useRefreshToken;
