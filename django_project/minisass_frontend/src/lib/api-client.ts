import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const currentURL = window.location.href;
const parts = currentURL.split("/");
const baseUrl = parts[0] + "//" + parts[2];

const apiClient = axios.create({
  baseURL: baseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach JWT ──
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const storedState = localStorage.getItem("authState");
    if (storedState) {
      try {
        const parsed = JSON.parse(storedState);
        const token = parsed.userData?.access_token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401, retry with refresh ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedState = localStorage.getItem("authState");
        if (storedState) {
          const parsed = JSON.parse(storedState);
          const refreshToken = parsed.userData?.refresh_token;

          if (refreshToken) {
            const response = await axios.post(`${baseUrl}/token/refresh/`, {
              refresh: refreshToken,
            });

            const newAccessToken = response.data.access;

            // Update stored state
            parsed.userData.access_token = newAccessToken;
            localStorage.setItem("authState", JSON.stringify(parsed));

            // Update default headers
            apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
            axios.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth state on refresh failure
        localStorage.removeItem("authState");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient, baseUrl };
export default apiClient;
