import { create } from 'zustand';
import { z } from 'zod';

const SettingsSchema = z.object({
  lang: z.enum(['en', 'ko']),
  speed: z.enum(['slow', 'normal', 'fast']),
  music: z.number().min(0).max(100),
  sfx: z.number().min(0).max(100),
  calm: z.boolean(),
  /** v0.4 accessibility and display (GSDD Part V Â§29, Part VI Â§10). */
  textSize: z.enum(['normal', 'large', 'larger']),
  contrast: z.boolean(),
  tips: z.boolean(),
  /** v0.6: the colour theme of the interface. */
  theme: z.enum(['hanji', 'dancheong', 'celadon', 'night']),
  ambience: z.number().min(0).max(100),
});
export type Settings = z.infer<typeof SettingsSchema>;

const KEY = 'joseon:settings';
export const DEFAULTS: Settings = { lang: 'en', speed: 'normal', music: 70, sfx: 80, calm: false, textSize: 'normal', contrast: false, tips: true, theme: 'hanji', ambience: 50 };

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    // Field by field, so one bad value does not throw away the rest.
    const got = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, unknown> = { ...DEFAULTS };
    for (const k of Object.keys(DEFAULTS)) {
      const f = (SettingsSchema.shape as Record<string, z.ZodType>)[k];
      const r = f.safeParse(got[k]);
      if (r.success) out[k] = r.data;
    }
    return out as Settings;
  } catch {
    return DEFAULTS;
  }
}

type SettingsStore = Settings & { update: (patch: Partial<Settings>) => void };

export const useSettings = create<SettingsStore>()((set) => ({
  ...load(),
  update: (patch) => set(patch),
}));

useSettings.subscribe((s) => {
  try {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(DEFAULTS)) out[k] = (s as unknown as Record<string, unknown>)[k];
    localStorage.setItem(KEY, JSON.stringify(out));
  } catch {
    // Storage can be unavailable in private windows; settings then last for the session.
  }
});

