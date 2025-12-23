import axios from "axios";

const BASE_URL = "http://localhost:3000";

export const axiosPublic = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});
