import { create } from 'zustand';
import type { Choice } from '../model/content';
import type { Game, Text } from '../model/schemas';
import * as day from '../engine/day';
import * as ev from '../engine/events';
import { passTime } from '../engine/season';
import { continueAs } from '../engine/legacy';
import { newGame, type NewLife } from '../engine/newGame';
import { writeSlot, type SlotId, type WriteResult } from '../save/storage';
import { recordHonours } from '../save/honours';
import { checkAchievements } from '../engine/achieve';
import { ensureCourt } from '../engine/royals';
import { playerName, clone } from '../engine/world';
import { useUi } from './ui';
import { syncNotes } from '../engine/bus';
import { ribbonFor, syncMilestones } from '../engine/life';
import { scenarioCheck } from '../engine/culture';
import { addCheckpoint } from '../save/checkpoints';
import { seasonOf } from '../engine/time';
import { sfx } from '../audio/sound';

export type Outcome = { ok: boolean; notes: Text[]; text?: Text | null };
export type SceneResult = { choice: Choice; notes: Text[] };

type GameStore = {
  game: Game | null;
  /** The choice just sealed in the current scene, kept until the scene closes. */
  sceneResult: SceneResult | null;
  /** False when the last autosave could not be written. */
  autosaveOk: boolean;
  start: (o: NewLife) => void;
  load: (g: Game) => void;
  quit: () => void;
  act: (id: string) => Outcome;
  travel: (place: string) => void;
  skip: () => void;
  rest: () => void;
  pass: (seasons: number) => void;
  talk: (npc: string) => Outcome;
  gift: (npc: string, giftId: string) => Outcome;
  read: (go: boolean) => Outcome;
  choose: (id: string) => Outcome;
  finishScene: () => void;
  closeReport: () => void;
  favour: (npc: string | null) => void;
  heir: (id: string) => boolean;
  saveTo: (slot: SlotId) => WriteResult;
  /** Runs any engine decision of the shape (game) → { game, note }: estates, offices, inquiries, decrees. */
  apply: (fn: (g: Game) => { game: Game; note: Text | null }, save?: boolean) => Text | null;
  /** Replaces the game outright: the downfall choices. */
  replace: (g: Game) => void;
};

export const useGame = create<GameStore>()((set, get) => {
  const autosave = (g: Game) => {
    const r = writeSlot('auto', g);
    set({ autosaveOk: r.ok });
  };
  /** Every change to the game passes here: achievements are checked and paid, then the game is stored. */
  const settle = (g: Game): Game => {
    // New lines in the life record and new season reports become notifications (GSDD Part V §25).
    const prev = get().game;
    if (prev !== g) syncNotes(prev, g);
    // Milestones as they are reached, and the life's ribbon when it ends (GSDD Part IX §15.4, §17.5).
    const sameLife = !!prev && prev.seed === g.seed && prev.generation === g.generation;
    if (prev !== g) syncMilestones(g, sameLife);
    // A scenario won is kept across lives, like a ribbon.
    if (prev !== g) scenarioCheck(g);
    if (g.scenario?.status === 'won' && prev && prev.seed === g.seed && prev.scenario?.status === 'open') recordHonours([`scenario:${g.scenario.id}`], playerName(g), g.date.year);
    if (sameLife && prev!.player.alive && !g.player.alive) recordHonours([`ribbon:${ribbonFor(g)}`], playerName(g), g.date.year);
    // A checkpoint at each new season and each new generation (GSDD Part VI §7.3), kept apart from the slots.
    if (prev && prev.seed === g.seed && g.player.alive && (prev.generation !== g.generation || prev.date.year !== g.date.year || seasonOf(prev.date.moon) !== seasonOf(g.date.moon))) {
      void addCheckpoint(g, prev.generation !== g.generation ? 'generation' : 'season');
    }
    const r = checkAchievements(g);
    if (r.earned.length) {
      recordHonours(r.earned.map((e) => e.def.id), playerName(r.game), r.game.date.year);
      useUi.getState().pushHonours(r.earned.map((e) => ({ id: e.def.id, notes: e.notes })));
      sfx('honour');
    }
    return r.game;
  };
  const update = (g0: Game, save = false) => {
    const g = settle(g0);
    set({ game: g });
    if (save) autosave(g);
    return g;
  };
  const none: Outcome = { ok: false, notes: [] };

  return {
    apply: (fn, save = false) => {
      const g = get().game;
      if (!g) return null;
      const r = fn(g);
      if (r.game !== g) update(r.game, save);
      return r.note;
    },
    replace: (g) => update(g, true),
    game: null,
    sceneResult: null,
    autosaveOk: true,

    start: (o) => {
      useUi.setState({ honours: [] });
      const g = settle(newGame(o));
      set({ game: g, sceneResult: null });
      autosave(g);
    },
    load: (g0) => {
      // Saves from before the wider court get its people.
      const g = clone(g0);
      ensureCourt(g);
      set({ game: settle(g), sceneResult: null });
    },
    quit: () => {
      useUi.setState({ honours: [] });
      set({ game: null, sceneResult: null });
    },

    act: (id) => {
      const g = get().game;
      if (!g) return none;
      const r = day.doActivity(g, id);
      if (r.game === g) return none;
      update(r.game);
      return { ok: true, notes: r.notes, text: r.result };
    },
    travel: (place) => {
      const g = get().game;
      if (g) update(day.travel(g, place));
    },
    skip: () => {
      const g = get().game;
      if (g) update(day.skipPhase(g));
    },
    rest: () => {
      const g = get().game;
      if (!g) return;
      const next = day.endDay(g);
      if (next !== g) update(next, true);
    },
    pass: (seasons) => {
      const g = get().game;
      if (!g) return;
      const next = passTime(g, seasons);
      if (next !== g) update(next, true);
    },
    talk: (npc) => {
      const g = get().game;
      if (!g) return none;
      const r = day.talk(g, npc);
      if (!r.line) return none;
      update(r.game);
      return { ok: true, notes: [], text: r.line };
    },
    gift: (npc, giftId) => {
      const g = get().game;
      if (!g) return none;
      const r = day.giveGift(g, npc, giftId);
      if (!r.text) return none;
      update(r.game);
      return { ok: true, notes: [], text: r.text };
    },
    read: (go) => {
      const g = get().game;
      if (!g) return none;
      const r = ev.readLetter(g, go);
      update(r.game, true);
      return { ok: true, notes: r.notes, text: r.toast };
    },
    choose: (id) => {
      const g = get().game;
      if (!g) return none;
      const r = ev.choose(g, id);
      if (!r.choice) return none;
      const next = settle(r.game);
      set({ game: next, sceneResult: { choice: r.choice, notes: r.notes } });
      if (!r.choice.again) autosave(next);
      return { ok: true, notes: r.notes };
    },
    finishScene: () => {
      const g = get().game;
      if (!g) return;
      const next = settle(ev.finish(g));
      set({ game: next, sceneResult: null });
      autosave(next);
    },
    closeReport: () => {
      const g = get().game;
      if (g) update(day.dismissReport(g));
    },
    favour: (npc) => {
      const g = get().game;
      if (!g) return;
      update({ ...g, favoured: npc }, true);
    },
    heir: (id) => {
      const g = get().game;
      if (!g) return false;
      const next = continueAs(g, id);
      if (!next) return false;
      // Notices from the life that ended stay on its legacy page.
      useUi.setState({ honours: [] });
      update(next, true);
      return true;
    },
    saveTo: (slot) => {
      const g = get().game;
      if (!g) return { ok: false, reason: 'unavailable' };
      return writeSlot(slot, g);
    },
  };
});
