import { create } from "zustand";

interface MapState {
  center: [number, number];
  zoom: number;
  selectedSiteId: string | null;
  activeFilters: Record<string, unknown>;
  activeLayers: string[];

  // Actions
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setView: (center: [number, number], zoom: number) => void;
  selectSite: (siteId: string | null) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  toggleLayer: (layerId: string) => void;
  resetMap: () => void;
}

const DEFAULT_CENTER: [number, number] = [-28.5, 24.5]; // South Africa
const DEFAULT_ZOOM = 5;

export const useMapStore = create<MapState>((set) => ({
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  selectedSiteId: null,
  activeFilters: {},
  activeLayers: [],

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setView: (center, zoom) => set({ center, zoom }),
  selectSite: (siteId) => set({ selectedSiteId: siteId }),
  setFilters: (filters) => set({ activeFilters: filters }),
  toggleLayer: (layerId) =>
    set((s) => ({
      activeLayers: s.activeLayers.includes(layerId)
        ? s.activeLayers.filter((id) => id !== layerId)
        : [...s.activeLayers, layerId],
    })),
  resetMap: () =>
    set({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      selectedSiteId: null,
      activeFilters: {},
    }),
}));
