import { z } from 'zod';
import {
  BackgroundZ, BondZ, GenderZ, PhaseZ, PremiseZ, QualityZ, TextZ,
  type Background, type Bond, type Gender, type Phase, type Premise, type Quality,
} from './schemas';

/** When something can happen. Every field that is set must hold. */
export type Condition = {
  phase?: Phase;
  place?: string;
  gender?: Gender;
  mode?: 'historical' | 'alternative';
  /** Historical campaign that started in this year. */
  era?: number;
  premise?: Premise;
  background?: Background;
  generation?: number;
  flags?: Record<string, boolean>;
  /** A flag that has been set for at least this many days. */
  since?: { flag: string; days: number };
  regard?: { npc: string; min?: number; max?: number }[];
  bond?: { npc: string; is: Bond[] };
  minAge?: number;
  maxAge?: number;
  /** Has the player ever married? */
  married?: boolean;
  office?: boolean;
  year?: { from?: number; to?: number };
  /** 0 spring, 1 summer, 2 autumn, 3 winter. */
  season?: number;
  minFavour?: number;
  minReputation?: number;
  /** Has at least this many nyang. */
  minMoney?: number;
  quality?: { q: Quality; min: number };
  alive?: string[];
  met?: string[];
  minDay?: number;
  /** v0.3: status, education, office, court and the economy. */
  legal?: ('royal' | 'yangban' | 'commoner')[];
  royal?: string[];
  lineage?: boolean;
  examYear?: boolean;
  canExam?: boolean;
  qual?: string;
  noQual?: string;
  side?: ('A' | 'B' | 'neutral')[];
  war?: boolean;
  track?: 'civil' | 'military';
  minTier?: number;
  heirEligible?: boolean;
  heirSeat?: boolean;
  /** A royal bride is being sought: for the crown prince, or for a widowed king. */
  selection?: boolean;
  minLegitimacy?: number;
  exiled?: boolean;
  keys?: boolean;
  minAttr?: { a: string; min: number };
  minEdu?: { field: string; min: number };
  monarch?: boolean;
  /** The player's faction is out of power. */
  losingSide?: boolean;
  /** v0.4: history may bend this far in the campaign (GSDD Part IV §17). */
  bends?: 'minor' | 'moderate' | 'major' | 'structural';
  /** A period rule is in force (content/annals.ts RULES). */
  rule?: string;
  /** v0.5: the player is in mourning. */
  mourning?: boolean;
  /** v0.6: the player's way of belief (engine/culture.ts pathOf), a pastime level, a companion animal. */
  path?: string;
  minSkill?: { id: string; min: number };
  pet?: boolean;
  any?: Condition[];
  not?: Condition;
};

export const ConditionZ: z.ZodType<Condition> = z.lazy(() =>
  z.object({
    phase: PhaseZ.optional(),
    place: z.string().optional(),
    gender: GenderZ.optional(),
    mode: z.enum(['historical', 'alternative']).optional(),
    era: z.number().optional(),
    premise: PremiseZ.optional(),
    background: BackgroundZ.optional(),
    generation: z.number().optional(),
    flags: z.record(z.string(), z.boolean()).optional(),
    since: z.object({ flag: z.string(), days: z.number() }).optional(),
    regard: z.array(z.object({ npc: z.string(), min: z.number().optional(), max: z.number().optional() })).optional(),
    bond: z.object({ npc: z.string(), is: z.array(BondZ) }).optional(),
    minAge: z.number().optional(),
    maxAge: z.number().optional(),
    married: z.boolean().optional(),
    office: z.boolean().optional(),
    year: z.object({ from: z.number().optional(), to: z.number().optional() }).optional(),
    season: z.number().optional(),
    minFavour: z.number().optional(),
    minReputation: z.number().optional(),
    minMoney: z.number().optional(),
    quality: z.object({ q: QualityZ, min: z.number() }).optional(),
    alive: z.array(z.string()).optional(),
    met: z.array(z.string()).optional(),
    minDay: z.number().optional(),
    legal: z.array(z.enum(['royal', 'yangban', 'commoner'])).optional(),
    royal: z.array(z.string()).optional(),
    lineage: z.boolean().optional(),
    examYear: z.boolean().optional(),
    canExam: z.boolean().optional(),
    qual: z.string().optional(),
    noQual: z.string().optional(),
    side: z.array(z.enum(['A', 'B', 'neutral'])).optional(),
    war: z.boolean().optional(),
    track: z.enum(['civil', 'military']).optional(),
    minTier: z.number().optional(),
    heirEligible: z.boolean().optional(),
    heirSeat: z.boolean().optional(),
    selection: z.boolean().optional(),
    minLegitimacy: z.number().optional(),
    exiled: z.boolean().optional(),
    keys: z.boolean().optional(),
    minAttr: z.object({ a: z.string(), min: z.number() }).optional(),
    minEdu: z.object({ field: z.string(), min: z.number() }).optional(),
    monarch: z.boolean().optional(),
    losingSide: z.boolean().optional(),
    bends: z.enum(['minor', 'moderate', 'major', 'structural']).optional(),
    rule: z.string().optional(),
    mourning: z.boolean().optional(),
    path: z.string().optional(),
    minSkill: z.object({ id: z.string(), min: z.number() }).optional(),
    pet: z.boolean().optional(),
    any: z.array(ConditionZ).optional(),
    not: ConditionZ.optional(),
  }).strict(),
);

const W = { when: ConditionZ.optional() };
/** Everything that changes the game goes through one of these. */
export const EffectZ = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('quality'), q: QualityZ, d: z.number(), ...W }),
  z.object({ kind: z.literal('stat'), stat: z.enum(['health', 'reputation', 'favour', 'prestige']), d: z.number(), ...W }),
  z.object({ kind: z.literal('regard'), npc: z.string(), d: z.number(), ...W }),
  z.object({ kind: z.literal('bond'), npc: z.string(), to: BondZ, ...W }),
  z.object({ kind: z.literal('meet'), npc: z.string(), ...W }),
  z.object({ kind: z.literal('flag'), flag: z.string(), v: z.boolean(), ...W }),
  z.object({ kind: z.literal('record'), text: TextZ, ...W }),
  z.object({ kind: z.literal('moment'), npc: z.string(), text: TextZ, ...W }),
  z.object({ kind: z.literal('trait'), id: z.string(), ...W }),
  z.object({ kind: z.literal('gift'), id: z.string(), ...W }),
  z.object({ kind: z.literal('proposals'), ...W }),
  z.object({ kind: z.literal('exam'), style: z.enum(['safe', 'bold', 'faction', 'military']), ...W }),
  z.object({ kind: z.literal('end'), ending: z.string(), inYears: z.number(), ...W }),
  z.object({ kind: z.literal('fate'), npc: z.string(), fate: z.enum(['exiled', 'dead']), ...W }),
  z.object({ kind: z.literal('note'), text: TextZ, ...W }),
  /** Nyang gained or spent. */
  z.object({ kind: z.literal('money'), d: z.number(), ...W }),
  /** A silk shipment that pays back, or doesn't, next season. */
  z.object({ kind: z.literal('invest'), amount: z.number(), ...W }),
  // v0.3
  z.object({ kind: z.literal('edu'), field: z.string(), d: z.number(), ...W }),
  z.object({ kind: z.literal('attr'), a: z.string(), d: z.number(), ...W }),
  z.object({ kind: z.literal('honour'), d: z.number(), ...W }),
  z.object({ kind: z.literal('legitimacy'), d: z.number(), ...W }),
  z.object({ kind: z.literal('service'), d: z.number(), ...W }),
  z.object({ kind: z.literal('standing'), d: z.number(), ...W }),
  z.object({ kind: z.literal('influence'), side: z.enum(['A', 'B', 'mine']), d: z.number(), ...W }),
  z.object({ kind: z.literal('qual'), id: z.string(), ...W }),
  z.object({ kind: z.literal('treasury'), d: z.number(), ...W }),
  z.object({ kind: z.literal('state'), key: z.enum(['authority', 'stability', 'loyalty', 'cooperation', 'treasury']), d: z.number(), ...W }),
  z.object({ kind: z.literal('punish'), level: z.enum(['reprimand', 'demotion', 'dismissal', 'exile', 'confiscation', 'revocation', 'death']), cause: TextZ, ...W }),
  /** Places the player in the royal household: named heir, chosen as a royal bride, or as regent. */
  z.object({ kind: z.literal('royal'), role: z.enum(['crownPrince', 'crownPrincess', 'queen', 'regent']), ...W }),
  z.object({ kind: z.literal('inquiry'), inq: z.enum(['corruption', 'treason', 'accounts', 'scandal']), ...W }),
  z.object({ kind: z.literal('battle'), style: z.enum(['hold', 'attack', 'reinforce', 'flank', 'ambush']), ...W }),
  // v0.6: feelings, pastimes, belief, illness and companions from scenes.
  z.object({ kind: z.literal('happy'), d: z.number(), mood: z.string().optional(), ...W }),
  z.object({ kind: z.literal('stress'), d: z.number(), ...W }),
  z.object({ kind: z.literal('skill'), id: z.string(), d: z.number(), ...W }),
  z.object({ kind: z.literal('practice'), id: z.string(), d: z.number(), ...W }),
  z.object({ kind: z.literal('ail'), id: z.string(), ...W }),
  z.object({ kind: z.literal('pet'), pet: z.string(), ...W }),
  z.object({ kind: z.literal('mission'), ...W }),
  z.object({ kind: z.literal('restore'), full: z.boolean(), ...W }),
  /** Evidence toward clearing the player's name after a downfall. */
  z.object({ kind: z.literal('proof'), d: z.number(), ...W }),
  /** v0.4: the player's action turns history from its recorded course. */
  z.object({ kind: z.literal('diverge'), cls: z.enum(['minor', 'moderate', 'major', 'structural']), flag: z.string(), recorded: TextZ, instead: TextZ, ...W }),
]);
export type Effect = z.infer<typeof EffectZ>;

/** `who` is 'narr', 'player' or an NPC id. */
export const LineZ = z.object({ who: z.string(), text: TextZ, aside: TextZ.optional(), when: ConditionZ.optional() });
export type Line = z.infer<typeof LineZ>;

export const ChoiceZ = z.object({
  id: z.string(),
  label: TextZ,
  say: TextZ,
  tags: z.array(TextZ),
  reaction: z.array(LineZ),
  effects: z.array(EffectZ),
  /** Heading on the result card. */
  title: TextZ.optional(),
  /** Asking returns to the remaining choices instead of ending the scene. */
  again: z.boolean().optional(),
  when: ConditionZ.optional(),
});
export type Choice = z.infer<typeof ChoiceZ>;

export const LetterZ = z.object({
  from: TextZ,
  seal: z.string(),
  intro: TextZ,
  body: TextZ,
  note: TextZ.optional(),
  go: TextZ,
  goEffects: z.array(EffectZ).optional(),
  goToast: TextZ.optional(),
  decline: TextZ.optional(),
  declineEffects: z.array(EffectZ).optional(),
  declineToast: TextZ.optional(),
});
export type Letter = z.infer<typeof LetterZ>;

export const EventZ = z.object({
  id: z.string(),
  title: TextZ,
  /**
   * arrive: starts when the player is at `place` (in `arrivePhase` if set).
   * evening: starts when the evening begins. letter: a letter arrives at evening.
   * season: starts after a season passes.
   */
  delivery: z.enum(['arrive', 'evening', 'letter', 'season']),
  arrivePhase: PhaseZ.optional(),
  /** An arrive event that also starts at evening if the player never came. */
  fallbackEvening: z.boolean().optional(),
  /** Can happen once a year instead of once a life. */
  yearly: z.boolean().optional(),
  /** Who it can happen to besides adult nobles: children, commoners, or (only) a reigning monarch or regent. */
  child: z.boolean().optional(),
  commoner: z.boolean().optional(),
  monarch: z.boolean().optional(),
  /** v0.4: a scene set in a documented event. Its framing is reconstruction; scenes without it are labelled fiction. */
  basis: z.enum(['verified', 'well-supported', 'reconstructed']).optional(),
  when: ConditionZ,
  letter: LetterZ.optional(),
  place: z.string(),
  time: z.enum(['day', 'night']),
  cast: z.string(),
  lines: z.array(LineZ),
  prompt: LineZ.optional(),
  choices: z.array(ChoiceZ),
});
export type GameEvent = z.infer<typeof EventZ>;

export const ActivityZ = z.object({
  id: z.string(),
  title: TextZ,
  text: TextZ,
  effects: z.array(EffectZ),
  when: ConditionZ.optional(),
  /** Shown after the activity, before the effect notes. */
  result: TextZ.optional(),
  /** Open to children (under fifteen) and to commoners. Adult nobles' activities are hidden from both. */
  child: z.boolean().optional(),
  commoner: z.boolean().optional(),
  /** Only for children or only for commoners. */
  only: z.enum(['child', 'commoner']).optional(),
});
export type Activity = z.infer<typeof ActivityZ>;

export const SceneKindZ = z.enum(['garden', 'queen', 'throne', 'residence', 'academy', 'market', 'tribunal', 'offices', 'temple']);
export type SceneKind = z.infer<typeof SceneKindZ>;

export const PlaceZ = z.object({
  id: z.string(),
  name: TextZ,
  area: TextZ,
  zone: z.enum(['palace', 'city']),
  scene: SceneKindZ,
  desc: TextZ,
  /** Where the pin sits on the map, in percent, for Changdeokgung years. */
  map: z.object({ x: z.number(), y: z.number(), side: z.enum(['l', 'r', 'b']) }),
  /** Name, area and pin when the court is at Gyeongbokgung instead. */
  gbg: z.object({ name: TextZ, area: TextZ, x: z.number(), y: z.number(), side: z.enum(['l', 'r', 'b']) }).optional(),
  requires: ConditionZ.optional(),
  locked: TextZ.optional(),
  /** Children and commoners may go here. */
  child: z.boolean().optional(),
  commoner: z.boolean().optional(),
  aside: TextZ.optional(),
  activities: z.array(ActivityZ),
  /** Where people stand in the scene, in percent. */
  slots: z.array(z.object({ x: z.number(), y: z.number() })),
});
export type Place = z.infer<typeof PlaceZ>;
