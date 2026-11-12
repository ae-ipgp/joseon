import { create } from 'zustand';
import type { Campaign, Text } from '../model/schemas';

export type Screen =
  | 'menu' | 'campaign' | 'create' | 'play' | 'map' | 'scene'
  | 'profile' | 'people' | 'family' | 'saves' | 'legacy' | 'honours'
  | 'affairs' | 'estate' | 'archive' | 'missions' | 'life' | 'culture' | 'scenarios' | 'handbook' | 'credits';
export type SheetId = 'load' | 'settings' | null;

type UiStore = {
  screen: Screen;
  sheet: SheetId;
  toast: { id: number; text: string } | null;
  draftCampaign: Campaign;
  focusNpc: string | null;
  /** Which section the Matters screen opens on. */
  missionsTab: 'missions' | 'letters' | 'notes' | null;
  goMatters: (tab: 'missions' | 'letters' | 'notes') => void;
  /** Achievements waiting to be announced, oldest first. */
  honours: { id: string; notes: Text[] }[];
  go: (screen: Screen) => void;
  openSheet: (sheet: SheetId) => void;
  showToast: (text: string) => void;
  clearToast: () => void;
  setDraftCampaign: (c: Campaign) => void;
  setFocusNpc: (id: string | null) => void;
  pushHonours: (list: { id: string; notes: Text[] }[]) => void;
  shiftHonour: () => void;
};

let toastId = 0;

export const useUi = create<UiStore>()((set) => ({
  screen: 'menu',
  sheet: null,
  toast: null,
  draftCampaign: { mode: 'historical', era: 1724, premise: null },
  focusNpc: null,
  missionsTab: null,
  honours: [],
  goMatters: (missionsTab) => {
    set({ missionsTab, screen: 'missions', sheet: null, toast: null });
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  },
  go: (screen) => {
    set({ screen, sheet: null, toast: null });
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  },
  openSheet: (sheet) => set({ sheet }),
  showToast: (text) => set({ toast: { id: ++toastId, text } }),
  clearToast: () => set({ toast: null }),
  setDraftCampaign: (draftCampaign) => set({ draftCampaign }),
  setFocusNpc: (focusNpc) => set({ focusNpc }),
  pushHonours: (list) => set((s) => ({ honours: [...s.honours, ...list] })),
  shiftHonour: () => set((s) => ({ honours: s.honours.slice(1) })),
}));
