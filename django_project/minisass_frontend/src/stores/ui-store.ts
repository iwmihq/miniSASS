import { create } from "zustand";

interface UIState {
  isPrivacyModalOpen: boolean;
  isMobileMenuOpen: boolean;

  // Actions
  openPrivacyModal: () => void;
  closePrivacyModal: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPrivacyModalOpen: false,
  isMobileMenuOpen: false,

  openPrivacyModal: () => set({ isPrivacyModalOpen: true }),
  closePrivacyModal: () => set({ isPrivacyModalOpen: false }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));
