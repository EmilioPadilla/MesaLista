import axios from 'axios';
// Create an axios instance with default config
const apiClient = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false // Set to true if using cookies for auth
});
// Request interceptor for API calls
apiClient.interceptors.request.use((config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Response interceptor for API calls
apiClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    // Handle errors globally
    console.error('API Error:', error);
    return Promise.reject(error);
});
export default apiClient;
