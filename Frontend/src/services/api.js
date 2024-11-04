// api.js
import axios from 'axios'
import { store } from '../app/store'
import { logoutUser } from '../features/auth/authSlice'

const api = axios.create({
    baseURL: 'http://localhost:8005',
    withCredentials: true,
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response.status === 401 && error.response.data.error === 'Token expired' && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                // Call the refresh endpoint
                const refreshResponse = await api.post('/refresh-token/')

                // Check if the refresh was successful
                if (refreshResponse.status === 200) {
                    // Retry the original request
                    return api(originalRequest)
                }
            } catch (refreshError) {
                // Handle logout if the refresh fails
                await store.dispatch(logoutUser()).unwrap()
                // window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api































// import axios from 'axios'
// import {store} from '../app/store'
// import { logoutUser } from '../features/auth/authSlice';

// const api = axios.create({
//     baseURL:'http://localhost:8005',
//     withCredentials: true,
// });

// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         // If the error is due to an expired access token
//         if (error.response.status === 401 && error.response.data.error === 'Token expired' && !originalRequest._retry) {
//             originalRequest._retry = true;

//             try {
//                 // Call the refresh endpoint
//                 await api.post('/refresh-token/');
                
//                 // Retry the original request
//                 return api(originalRequest);
//             } catch (refreshError) {
//                 try {
//                     await store.dispatch(logoutUser()).unwrap();
//                     window.location.href = '/login';  // or your login route
//                 } catch (logoutError) {
//                     console.error("Logout failed:", logoutError);
//                     window.location.href = '/login';  // Redirect anyway for security
//                 }
//                 return Promise.reject(refreshError);
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default api;