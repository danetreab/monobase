import dataProviderSimpleRest from "@refinedev/simple-rest";
import axios from "axios";

const apiUrl = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/v1`;

const axiosInstance = axios.create({ withCredentials: true });

export const dataProvider = dataProviderSimpleRest(apiUrl, axiosInstance);
