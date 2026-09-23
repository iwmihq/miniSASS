import { create } from "zustand";
import axios from "axios";
import type { AxiosError } from "axios";
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

      const response = await axios.post(`${baseUrl}/authentication/api/token/refresh/`, {
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
      // Ask the server even when localStorage is empty.
      //
      // This is what makes YOMA single sign-on work. The callback at
      // /authentication/api/yoma/callback/ establishes a Django *session* and
      // redirects home; it never hands the SPA a token. A YOMA user therefore
      // arrives here with empty localStorage, and returning early meant the SPA
      // never discovered the session: you came back from yoma.world and were
      // still logged out, with no error shown anywhere.
      //
      // check-auth-status accepts a JWT or the session cookie
      // (CustomJWTAuthentication, then CustomSessionAuthentication) and mints a
      // fresh access/refresh pair on success, so this call is precisely what
      // converts a YOMA session into the tokens the rest of the app uses.
      //
      // The placeholder token below is deliberate: it lets JWT authentication
      // fail cleanly so the session authenticator gets its turn. The pre-2026
      // AuthContext did the same thing by accident, by coercing missing state to
      // {} (truthy) and falling back to "dummy-token". Tidying that into a null
      // check is what broke SSO.
      const storedState = localStorage.getItem("authState");
      let accessToken = "dummy-token";

      if (storedState) {
        try {
          accessToken =
            JSON.parse(storedState)?.userData?.access_token || "dummy-token";
        } catch {
          // Corrupt entry; fall through with the placeholder rather than
          // throwing, so a bad localStorage value cannot lock someone out.
        }
      }

      const response = await apiClient.get(
        "/authentication/api/check-auth-status/",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200 && response.data?.is_authenticated) {
        get().login(response.data);
      }
    } catch (error) {
      // 401 is the ordinary answer for a visitor who simply is not logged in,
      // which is now every anonymous page load. Only report anything else.
      const status = (error as AxiosError)?.response?.status;
      if (status !== 401) {
        console.error("Check auth status error:", error);
      }
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
