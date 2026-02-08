import { axiosPublic } from "../api/axios";

const useRefreshToken = () => {
    const refresh = async () => {
        await axiosPublic.get("/v1/refresh");
    };

    return refresh;
};

export default useRefreshToken;
