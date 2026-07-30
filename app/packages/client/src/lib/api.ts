import axios from 'axios';

const api = axios.create({
   baseURL: '/api',
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
   const token = localStorage.getItem('accessToken');
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
   (response) => response,
   async (error) => {
      const originalRequest = error.config;

      // If 401 and not already retried
      if (error.response?.status === 401 && !originalRequest._retry) {
         originalRequest._retry = true;

         const refreshToken = localStorage.getItem('refreshToken');
         if (refreshToken) {
            try {
               const { data } = await axios.post('/api/auth/refresh', {
                  refreshToken,
               });

               localStorage.setItem('accessToken', data.accessToken);
               localStorage.setItem('refreshToken', data.refreshToken);

               originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
               return api(originalRequest);
            } catch {
               // Refresh failed — clear tokens and redirect to login
               localStorage.removeItem('accessToken');
               localStorage.removeItem('refreshToken');
               // Only redirect if not already on login page
               if (!window.location.pathname.includes('/login')) {
                  window.location.href = '/login';
               }
            }
         } else {
            // No refresh token — only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
               window.location.href = '/login';
            }
         }
      }

      return Promise.reject(error);
   }
);

export default api;
