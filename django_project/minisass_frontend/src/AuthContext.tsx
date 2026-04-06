/**
 * AuthContext — backward-compatible wrapper around useAuthStore (Zustand).
 *
 * Existing components import { useAuth, login, logout, ... } from this file.
 * This module bridges the old reducer-based API to the new Zustand store
 * so we can migrate consumers incrementally.
 *
 * New code should import from 'stores/auth-store' directly.
 */
import React, { ReactNode, useEffect } from "react";
import { useAuthStore } from "./stores/auth-store";

export type ActionTypes = "OPEN_LOGIN_MODAL";
export const OPEN_LOGIN_MODAL: ActionTypes = "OPEN_LOGIN_MODAL";

// ── Legacy types (kept for backward compat) ──

type User = {
  username: string;
  email: string;
  [key: string]: unknown;
};

type AuthAction =
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" }
  | { type: "REGISTER" }
  | { type: "RESET_PASSWORD" }
  | { type: "TOKEN_REFRESH"; payload: string }
  | { type: ActionTypes; payload: boolean };

// ── Legacy dispatch adapter ──
// Translates the old dispatch({ type, payload }) calls to Zustand actions
function createDispatchAdapter(): React.Dispatch<AuthAction> {
  return (action: AuthAction) => {
    const store = useAuthStore.getState();
    switch (action.type) {
      case "LOGIN":
        store.login(action.payload as User);
        break;
      case "LOGOUT":
        store.logout();
        break;
      case OPEN_LOGIN_MODAL:
        store.setLoginModal(action.payload as boolean);
        break;
      case "TOKEN_REFRESH":
        // Token refresh is handled internally by the store
        break;
      case "REGISTER":
      case "RESET_PASSWORD":
        // No-ops in the old code too
        break;
    }
  };
}

const dispatchAdapter = createDispatchAdapter();

// ── useAuth hook (backward-compatible) ──
export const useAuth = () => {
  const { user, isAuthenticated, isAdmin, openLoginModal } = useAuthStore();

  return {
    state: {
      user,
      isAuthenticated,
      refreshToken: null,
      openLoginModal,
      isAdmin,
      isPasswordEnforced: false,
    },
    dispatch: dispatchAdapter,
  };
};

// ── Legacy action creators ──
export const login = (_dispatch: unknown, user: User) => {
  useAuthStore.getState().login(user);
};

export const logout = (_dispatch?: unknown) => {
  useAuthStore.getState().logout();
};

export const register = (_dispatch?: unknown) => {
  // No-op placeholder
};

export const resetPassword = (_dispatch?: unknown) => {
  // No-op placeholder
};

export const tokenRefresh = async (_dispatch?: unknown, _refreshToken?: string) => {
  await useAuthStore.getState().refreshToken();
};

// ── AuthProvider (backward-compatible wrapper) ──
// Initializes auth check and token refresh on mount
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    const store = useAuthStore.getState();
    store.checkAuthStatus();
    const cleanup = store.startTokenRefreshInterval();
    return cleanup;
  }, []);

  return <>{children}</>;
};
