import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
});

// Auth dev fallback: x-user-id | Prod: Bearer JWT
api.interceptors.request.use((cfg) => {
    const token = import.meta.env.VITE_ACCESS_TOKEN;
    const devUserId = import.meta.env.VITE_DEV_USER_ID;
    if(token) cfg.headers.Authorization = `Bearer ${token}`;
    if(!token && devUserId) cfg.headers['x-user-id'] = devUserId;
    return cfg;
})

export default api;