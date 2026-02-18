import axios from "axios";

const BASE_URL = "https://code-mania-production.up.railway.app";

const DEFAULT_HEADERS = {
    apikey: import.meta.env.VITE_API_KEY,
    'Content-Type': 'application/json',
};

export const axiosPublic = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: DEFAULT_HEADERS,
});

export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: DEFAULT_HEADERS,
    withCredentials: true,
});
