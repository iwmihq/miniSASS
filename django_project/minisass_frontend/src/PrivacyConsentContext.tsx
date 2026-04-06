/**
 * PrivacyConsentContext — backward-compatible wrapper around useUIStore (Zustand).
 *
 * Existing components import { usePrivacyConsent, OPEN_PRIVACY_MODAL, ... } from this file.
 * This bridges the old reducer API to the new Zustand UI store.
 *
 * New code should import from 'stores/ui-store' directly.
 */
import React, { ReactNode } from "react";
import { useUIStore } from "./stores/ui-store";

// Action types (kept for backward compat)
export const OPEN_PRIVACY_MODAL = "OPEN_PRIVACY_MODAL";
export const CLOSE_PRIVACY_MODAL = "CLOSE_PRIVACY_MODAL";

type PrivacyConsentAction =
  | { type: typeof OPEN_PRIVACY_MODAL }
  | { type: typeof CLOSE_PRIVACY_MODAL };

// ── usePrivacyConsent hook (backward-compatible) ──
export const usePrivacyConsent = () => {
  const { isPrivacyModalOpen, openPrivacyModal, closePrivacyModal } = useUIStore();

  const dispatch = (action: PrivacyConsentAction) => {
    switch (action.type) {
      case OPEN_PRIVACY_MODAL:
        openPrivacyModal();
        break;
      case CLOSE_PRIVACY_MODAL:
        closePrivacyModal();
        break;
    }
  };

  return {
    state: { isPrivacyModalOpen },
    dispatch,
  };
};

// ── PrivacyConsentProvider (no-op wrapper for backward compat) ──
export const PrivacyConsentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
