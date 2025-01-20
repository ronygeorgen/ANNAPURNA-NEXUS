// api.js
import axios from 'axios'
import { store } from '../app/store'
import { logoutUser } from '../features/auth/authSlice'

const api = axios.create({
    baseURL: 'http://annapoornanexus.ronygeorge.online/api/',
    withCredentials: true,
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        console.log('here no error')
        console.log('respon error:',error)
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
        else{
            console.l
        }

        return Promise.reject(error)
    }
)

export default api


