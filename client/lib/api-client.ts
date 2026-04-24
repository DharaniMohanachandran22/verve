import axios from 'axios';

const api = axios.create({
    baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Paths that should never trigger a login redirect on auth failure
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/boards/join'];

const isPublicPage = () => {
    if (typeof window === 'undefined') return false;
    return PUBLIC_PATHS.some(p => window.location.pathname.startsWith(p));
};

// Response interceptor — handle 401 with a single token refresh attempt
api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl: string = originalRequest?.url || '';
        const isAuthCheck = requestUrl.includes('/auth/me');
        const isRefresh = requestUrl.includes('/auth/refresh');
        const isLogout = requestUrl.includes('/auth/logout');
        const isInvitationPreview = requestUrl.includes('/invitations/') && requestUrl.includes('/preview');

        // Don't retry refresh calls, auth checks, logout, invitation previews, or already-retried requests
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isRefresh &&
            !isAuthCheck &&
            !isLogout &&
            !isInvitationPreview
        ) {
            originalRequest._retry = true;

            try {
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/refresh`,
                    {},
                    { withCredentials: true },
                );

                const { success, data } = response.data;
                if (success && data?.accessToken) {
                    return api(originalRequest);
                }
                throw new Error('Refresh failed');
            } catch {
                if (!isPublicPage()) {
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(new Error('Session expired. Please log in again.'));
            }
        }

        if (error.response?.status === 403 && !isPublicPage()) {
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }

        const message = error.response?.data?.message || 'Something went wrong';
        return Promise.reject(new Error(message));
    },
);

export default api;
