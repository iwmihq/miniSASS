import { create } from "zustand";
import axios from "axios";
import apiClient, { baseUrl } from "../lib/api-client";

type User = {
  username: string;
  email: string;
  access_token?: string;
  refresh_token?: string;
  is_staff?: boolean;
  is_profile_updated?: boolean;
  is_agreed_to_privacy_policy?: boolean;
  [key: string]: unknown;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  openLoginModal: boolean;

  // Actions
  login: (userData: User) => void;
  logout: () => void;
  setLoginModal: (open: boolean) => void;
  refreshToken: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  startTokenRefreshInterval: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  openLoginModal: false,

  login: (userData) => {
    localStorage.setItem("authState", JSON.stringify({ userData }));
    axios.defaults.headers.common.Authorization = `Bearer ${userData.access_token}`;
    apiClient.defaults.headers.common.Authorization = `Bearer ${userData.access_token}`;
    set({
      user: userData,
      isAuthenticated: true,
      isAdmin: !!userData.is_staff,
    });
  },

  logout: () => {
    axios.post(`${baseUrl}/authentication/api/logout/`).catch(() => {});
    localStorage.removeItem("authState");
    delete axios.defaults.headers.common.Authorization;
    delete apiClient.defaults.headers.common.Authorization;
    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  },

  setLoginModal: (open) => set({ openLoginModal: open }),

  refreshToken: async () => {
    try {
      const storedState = localStorage.getItem("authState");
      if (!storedState) return;

      const parsed = JSON.parse(storedState);
      const refreshTok = parsed.userData?.refresh_token;
      if (!refreshTok) return;

      const response = await axios.post(`${baseUrl}/token/refresh/`, {
        refresh: refreshTok,
      });

      const newAccessToken = response.data.access;
      axios.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      // Update stored state
      parsed.userData.access_token = newAccessToken;
      localStorage.setItem("authState", JSON.stringify(parsed));
    } catch (error) {
      console.error("Token refresh error:", error);
    }
  },

  checkAuthStatus: async () => {
    try {
      const storedState = localStorage.getItem("authState");
      if (!storedState) return;

      const parsed = JSON.parse(storedState);
      const accessToken = parsed.userData?.access_token || "dummy-token";

      const response = await apiClient.get(
        "/authentication/api/check-auth-status/",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200) {
        get().login(response.data);
      }
    } catch (error) {
      console.error("Check auth status error:", error);
    }
  },

  startTokenRefreshInterval: () => {
    const intervalMs = 10 * 60 * 1000; // 10 minutes
    const intervalId = setInterval(async () => {
      const storedState = localStorage.getItem("authState");
      if (storedState) {
        const parsed = JSON.parse(storedState);
        if (parsed.userData?.refresh_token) {
          await get().refreshToken();
        }
      }
    }, intervalMs);
    return () => clearInterval(intervalId);
  },
}));
