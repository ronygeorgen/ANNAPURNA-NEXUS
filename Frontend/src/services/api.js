import axios from 'axios'

const api = axios.create({
    baseURL:'http://localhost:8005',
    withCredentials: true,
});


export default api;