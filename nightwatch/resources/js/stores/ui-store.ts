import { create } from 'zustand';

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';

type UIState = {
    selectedProjectId: number | null;
    timeRange: TimeRange;
    environment: string | null;
    isCommandPaletteOpen: boolean;
};

type UIActions = {
    setSelectedProject: (projectId: number | null) => void;
    setTimeRange: (range: TimeRange) => void;
    setEnvironment: (env: string | null) => void;
    toggleCommandPalette: () => void;
};

export const useUIStore = create<UIState & UIActions>((set) => ({
    selectedProjectId: null,
    timeRange: '24h',
    environment: null,
    isCommandPaletteOpen: false,

    setSelectedProject: (projectId) =>
        set({ selectedProjectId: projectId }),
    setTimeRange: (range) =>
        set({ timeRange: range }),
    setEnvironment: (env) =>
        set({ environment: env }),
    toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
}));
