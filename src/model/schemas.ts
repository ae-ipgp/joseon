import { z } from 'zod';

/** Player-facing words. Korean falls back to English until it is written. */
export const TextZ = z.object({ en: z.string(), ko: z.string().optional() });
export type Text = z.infer<typeof TextZ>;

export const PhaseZ = z.enum(['morning', 'afternoon', 'evening']);
export type Phase = z.infer<typeof PhaseZ>;
export const GameDateZ = z.object({
  year: z.number().int(),
  moon: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(30),
  phase: PhaseZ,
});
export type GameDate = z.infer<typeof GameDateZ>;

export const GenderZ = z.enum(['woman', 'man']);
export type Gender = z.infer<typeof GenderZ>;
export const QualityZ = z.enum(['wit', 'grace', 'resolve']);
export type Quality = z.infer<typeof QualityZ>;
export const BackgroundZ = z.enum(['noble', 'military', 'political', 'royal', 'collateral', 'scholarly', 'landed', 'declining']);
export type Background = z.infer<typeof BackgroundZ>;
export const BondZ = z.enum(['none', 'romance', 'lover', 'betrothed', 'spouse']);
export type Bond = z.infer<typeof BondZ>;
export const FactionZ = z.enum(['A', 'B', 'crown', 'none']);
export type Faction = z.infer<typeof FactionZ>;
export const StatusZ = z.enum([
  'stranger', 'acquaintance', 'friend', 'closeFriend', 'romanticInterest',
  'lover', 'betrothed', 'spouse', 'rival', 'enemy',
]);
export type Status = z.infer<typeof StatusZ>;

export const PortraitKindZ = z.enum(['lady', 'noblewoman', 'courtlady', 'queen', 'scholar', 'guard', 'minister', 'king', 'youth', 'boy', 'commoner']);
export type PortraitKind = z.infer<typeof PortraitKindZ>;
export const PortraitZ = z.object({
  kind: PortraitKindZ,
  robe: z.string().optional(),
  under: z.string().optional(),
  accent: z.string().optional(),
  beard: z.enum(['auto', 'none', 'short', 'long']).optional(),
  grey: z.boolean().optional(),
  /** v0.5: the face shown (GSDD Part VII §2.6). Drawn, never saved by the game. */
  expr: z.enum(['calm', 'smile', 'sad', 'stern', 'worried']).optional(),
});
export type PortraitSpec = z.infer<typeof PortraitZ>;

export const LifeEntryZ = z.object({
  year: z.number().int(),
  moon: z.number().int().min(1).max(12),
  text: TextZ,
  historical: z.boolean().optional(),
  /** Chronicle heading: edu, career, family, politics, wealth, downfall, court. */
  tag: z.string().optional(),
});
export type LifeEntry = z.infer<typeof LifeEntryZ>;

export const OfficeZ = z.object({
  track: z.enum(['civil', 'military']),
  /** Tier: 1 junior official, 2 mid-ranking, 3 senior, 4 minister, 5 state councillor (or general). */
  rank: z.number().int().min(1).max(5),
  /** The post held, from content/government.ts. Missing means the tier's usual post. */
  post: z.string().optional(),
});
export type Office = z.infer<typeof OfficeZ>;

export const PlayerZ = z.object({
  surname: TextZ,
  given: TextZ,
  gender: GenderZ,
  birthYear: z.number().int(),
  birthMoon: z.number().int().min(1).max(12),
  colors: z.object({ top: z.string(), bottom: z.string() }),
  qualities: z.object({ wit: z.number(), grace: z.number(), resolve: z.number() }),
  health: z.number(),
  reputation: z.number(),
  favour: z.number(),
  office: OfficeZ.nullable(),
  traits: z.array(z.string()),
  gifts: z.array(z.string()),
  /** Coins in nyang (냥). */
  money: z.number().int(),
  alive: z.boolean(),
  diedYear: z.number().int().nullable(),
  /** The 25 attributes (0–100), in five groups. wit, grace and resolve are their group averages. */
  attrs: z.record(z.string(), z.number()),
  /** Seven tendencies from −2 to +2, e.g. introverted (−) to outgoing (+). */
  temper: z.record(z.string(), z.number()),
  /** Education by field, 0–100. */
  edu: z.record(z.string(), z.number()),
  /** Examinations passed and other qualifications. */
  quals: z.array(z.string()),
  /** Status at birth and status now: they can differ. */
  born: z.enum(['royal', 'yangban']),
  legal: z.enum(['royal', 'yangban', 'commoner']),
  /** Royal descent: none, a prince or princess of the blood, a descendant of a former king, a disputed claim. */
  lineage: z.enum(['none', 'prince', 'descendant', 'disputed']),
  /** Place in the royal household, if any. */
  royal: z.enum(['none', 'crownPrince', 'crownPrincess', 'queen', 'queenDowager', 'king', 'regent']),
  honour: z.number(),
  legitimacy: z.number(),
  /** Service record in office this season: duties done, mistakes made. */
  service: z.number(),
  /** GSDD Part V §8.3: a balanced pair of condition measures, 0–100. */
  fatigue: z.number(),
  stress: z.number(),
  // v0.5: the personal life layer (GSDD Part IX, at BitLife depth).
  /** How the player feels about their life, 0–100. */
  happiness: z.number(),
  /** Illnesses and injuries: which, since when, how often treated. */
  conditions: z.array(z.object({ id: z.string(), since: z.number().int(), treated: z.number().int() })),
  /** Pastimes, 0–100, and the day each was last practised (skills fade when left alone). */
  skills: z.record(z.string(), z.number()),
  practised: z.record(z.string(), z.number()),
  /** Mourning for a parent or spouse: until which day, and whether it took the player from office. */
  mourning: z.object({ for: TextZ, kin: z.string(), until: z.number().int(), leave: z.boolean() }).nullable(),
  /** A passing feeling set by an event, until a day. */
  moodEvent: z.object({ kind: z.string(), until: z.number().int() }).nullable(),
  // v0.6: culture and belief (GSDD Parts XIII and XVI, at life-sim depth).
  /** How often each practice has been kept, and how firmly the player holds to their way, 0–100. */
  belief: z.object({ practice: z.record(z.string(), z.number()), conviction: z.number() }),
  /** Things the player has written or painted. */
  works: z.array(z.object({ id: z.string(), kind: z.string(), title: TextZ, year: z.number().int(), quality: z.number() })),
  /** A companion animal. */
  pet: z.object({ kind: z.string(), name: TextZ, born: z.number().int(), span: z.number() }).nullable(),
});
export type Player = z.infer<typeof PlayerZ>;

export const HouseRefZ = z.object({ surname: TextZ, prestige: z.number().int().min(1).max(5), faction: FactionZ, background: BackgroundZ });
export type HouseRef = z.infer<typeof HouseRefZ>;

export const NpcZ = z.object({
  id: z.string(),
  name: TextZ,
  given: TextZ.nullable(),
  role: TextZ,
  gender: GenderZ,
  birthYear: z.number().int(),
  portrait: PortraitZ,
  faction: FactionZ,
  likes: z.array(z.string()),
  places: z.array(z.string()),
  romance: z.boolean(),
  giftable: z.boolean(),
  kin: z.string().nullable(),
  parents: z.array(z.string()),
  spouse: z.string().nullable(),
  house: HouseRefZ.nullable(),
  alive: z.boolean(),
  diedYear: z.number().int().nullable(),
  away: z.boolean(),
  sees: TextZ.nullable(),
  wants: TextZ.nullable(),
  talk: z.array(TextZ),
  /** Can be met by finding them at one of their places, without an introduction. */
  meet: z.boolean().optional(),
  /** A post at court or in the household. When the holder dies, someone new takes it. */
  post: z.string().optional(),
  /** v0.5: how the player is raising this child (GSDD Part IX §11.3). */
  upbringing: z.object({ focus: z.string(), style: z.enum(['gentle', 'balanced', 'strict']), progress: z.number(), trait: z.string().nullable() }).optional(),
  /** v0.5: news of a life lived beside the player's (GSDD Part VIII §5.6). */
  life: z.object({ married: TextZ.nullable(), children: z.number().int() }).optional(),
});
export type Npc = z.infer<typeof NpcZ>;

/** Feelings beyond regard (which is affection). Missing values count as neutral. */
export const DimsZ = z.object({
  trust: z.number(), respect: z.number(), fear: z.number(), resentment: z.number(), gratitude: z.number(), rivalry: z.number(),
}).partial();
export type Dims = z.infer<typeof DimsZ>;

export const RelZ = z.object({
  regard: z.number(),
  dims: DimsZ.optional(),
  bond: BondZ,
  met: z.boolean(),
  moments: z.array(LifeEntryZ),
  talked: z.number().int(),
  gifted: z.number().int(),
});
export type Rel = z.infer<typeof RelZ>;

export const HouseZ = z.object({
  background: BackgroundZ,
  surname: TextZ,
  prestige: z.number().int().min(1).max(5),
  wealth: z.enum(['poor', 'modest', 'comfortable', 'rich']),
  faction: FactionZ,
});
export type House = z.infer<typeof HouseZ>;

export const ApprovalZ = z.enum(['for', 'against', 'undecided']);
export type Approval = z.infer<typeof ApprovalZ>;
export const ProposalZ = z.object({ npc: z.string(), father: ApprovalZ, mother: ApprovalZ, note: TextZ });
export type Proposal = z.infer<typeof ProposalZ>;

export const PremiseZ = z.enum(['queen', 'heirs', 'peace']);
export type Premise = z.infer<typeof PremiseZ>;
/** Alternative Joseon: rules that apply to the whole kingdom, not just the player. */
export const RulesZ = z.object({
  /** Women may sit the examinations and hold office. */
  womenOffice: z.boolean(),
  /** male: eldest legitimate son; designated: the monarch names anyone of the blood; absolute: eldest child of either sex. */
  succession: z.enum(['male', 'designated', 'absolute']),
  /** How hard it is to fall from, or climb back into, the aristocracy. */
  mobility: z.enum(['rigid', 'open']),
  /** Strength of the throne against the ministers, 1–5. */
  authority: z.number().int().min(1).max(5),
  /** How often the court turns on itself, 1–5. */
  strife: z.number().int().min(1).max(5),
  /** Nobles may trade openly without losing face. */
  commerce: z.boolean(),
  /** GSDD Part IV §18: further sandbox settings. */
  preset: z.string().optional(),
  dynasty: z.enum(['yi', 'wang', 'new']).optional(),
  military: z.number().int().min(1).max(5).optional(),
  foreign: z.enum(['peace', 'tension', 'war']).optional(),
  tax: z.number().int().min(1).max(5).optional(),
});
export type Rules = z.infer<typeof RulesZ>;

export const CampaignZ = z.object({
  mode: z.enum(['historical', 'alternative']),
  /** Start year. For the alternative campaign the calendar is fictional but counts from 1724. */
  era: z.number().int(),
  premise: PremiseZ.nullable(),
  rules: RulesZ.optional(),
  /** GSDD Part IV §17: how far recorded history may bend. */
  continuity: z.enum(['strict', 'limited', 'dynamic']).optional(),
  /** GSDD Part V §27.2: simulation settings. */
  difficulty: z.object({
    mortality: z.enum(['gentle', 'normal', 'harsh']),
    economy: z.enum(['gentle', 'normal', 'harsh']),
    politics: z.enum(['gentle', 'normal', 'harsh']),
    /** The steward handles routine estate business each season. */
    automation: z.boolean(),
  }).optional(),
});
export type Campaign = z.infer<typeof CampaignZ>;

export const ReportZ = z.object({ title: TextZ, entries: z.array(TextZ) });
export type Report = z.infer<typeof ReportZ>;

export const AncestorZ = z.object({ name: TextZ, gender: GenderZ, born: z.number().int(), died: z.number().int(), ending: z.string() });
export type Ancestor = z.infer<typeof AncestorZ>;

// ---------------------------------------------------------------- economy (GSDD Part III)

export const LedgerZ = z.object({ year: z.number().int(), moon: z.number().int(), lines: z.array(z.object({ text: TextZ, d: z.number(), acct: z.enum(['purse', 'house', 'state']) })) });
export type Ledger = z.infer<typeof LedgerZ>;
export const EstateZ = z.object({
  id: z.string(),
  kind: z.string(),
  name: TextZ,
  province: z.string(),
  value: z.number(),
  /** Land area in gyeol (결). */
  area: z.number(),
  condition: z.number(),
  productivity: z.number(),
  security: z.number(),
  /** Building ids from content/economy.ts. */
  buildings: z.array(z.string()),
  /** A building going up: id and the season count left. */
  works: z.object({ id: z.string(), left: z.number().int() }).nullable(),
  /** Maintenance spending: 0 none, 1 usual, 2 generous. */
  care: z.number().int().min(0).max(2),
  manager: z.string().nullable(),
  /** Inspected in person this year. */
  seen: z.number().int().optional(),
});
export type Estate = z.infer<typeof EstateZ>;
export const StaffZ = z.object({
  id: z.string(),
  role: z.string(),
  name: TextZ,
  skill: z.number(),
  loyalty: z.number(),
  wage: z.number(),
  /** An NPC in the cast who holds this post, if any. */
  npc: z.string().optional(),
  /** For the servants: how many. */
  count: z.number().int().optional(),
});
export type Staff = z.infer<typeof StaffZ>;
export const BusinessZ = z.object({
  id: z.string(),
  kind: z.string(),
  name: TextZ,
  province: z.string(),
  capital: z.number(),
  /** steady, growth or quality. */
  aim: z.enum(['steady', 'growth', 'quality']),
  manager: z.number(),
  repute: z.number(),
  /** Profit or loss last season. */
  last: z.number(),
  opened: z.number().int(),
  /** Whose money: the player's purse or the family's. */
  owner: z.enum(['purse', 'house']),
});
export type Business = z.infer<typeof BusinessZ>;
export const DebtZ = z.object({ id: z.string(), lender: TextZ, principal: z.number(), rate: z.number(), since: z.number().int(), acct: z.enum(['purse', 'house']) });
export type Debt = z.infer<typeof DebtZ>;
export const ConsignmentZ = z.object({ good: z.string(), qty: z.number(), from: z.string(), to: z.string(), paid: z.number(), owner: z.enum(['purse', 'house']) });
export type Consignment = z.infer<typeof ConsignmentZ>;
export const ProvinceStateZ = z.object({
  weather: z.string(),
  /** A disaster striking this season, and one foretold for next season. */
  disaster: z.string().nullable(),
  warn: z.string().nullable(),
  prices: z.record(z.string(), z.number()),
  stability: z.number(),
});
export type ProvinceState = z.infer<typeof ProvinceStateZ>;
export const EconZ = z.object({
  /** The family treasury, separate from the player's purse. */
  treasury: z.number(),
  /** head: the player runs the household; admin: as its mistress; member: an allowance only. */
  role: z.enum(['head', 'admin', 'member', 'none']),
  estates: z.array(EstateZ),
  staff: z.array(StaffZ),
  businesses: z.array(BusinessZ),
  debts: z.array(DebtZ),
  cargo: z.array(ConsignmentZ),
  provinces: z.record(z.string(), ProvinceStateZ),
  ledger: z.array(LedgerZ),
  /** Grain laid by against a bad year, in seasons of household use. */
  stores: z.number(),
});
export type Econ = z.infer<typeof EconZ>;

// ---------------------------------------------------------------- politics (GSDD Part II)

export const ClueZ = z.object({ id: z.string(), text: TextZ, weight: z.number(), against: z.string().nullable(), source: z.string() });
export type Clue = z.infer<typeof ClueZ>;
export const InquiryZ = z.object({
  id: z.string(),
  kind: z.enum(['corruption', 'treason', 'accounts', 'scandal', 'downfall']),
  title: TextZ,
  /** People who might be behind it. */
  suspects: z.array(z.string()),
  /** Who really did it; 'none' when the charge is false. Hidden from the player. */
  truth: z.string(),
  clues: z.array(ClueZ),
  /** Lines of inquiry already used. */
  used: z.array(z.string()),
  opened: z.number().int(),
  /** Day count by which findings are due. */
  due: z.number().int(),
  /** Set when closed: the outcome key. */
  outcome: z.string().nullable(),
});
export type Inquiry = z.infer<typeof InquiryZ>;
export const VacancyZ = z.object({ post: z.string(), until: z.number().int() });
export const StateZ = z.object({
  treasury: z.number(),
  privy: z.number(),
  tax: z.enum(['light', 'usual', 'heavy']),
  /** Royal authority and its parts, 0–100. */
  authority: z.number(),
  stability: z.number(),
  loyalty: z.number(),
  cooperation: z.number(),
  decrees: z.array(z.object({ id: z.string(), year: z.number().int() })),
  /** Regency ends when the young monarch reaches this year. */
  regencyUntil: z.number().int().nullable(),
  heir: z.string().nullable(),
  /** v0.5: memorials from the ministers awaiting the throne's decision (GSDD Part X §13). */
  memos: z.array(z.object({ id: z.string(), def: z.string(), opened: z.number().int(), delayed: z.boolean() })).optional(),
});
export type StateGov = z.infer<typeof StateZ>;
export const RulerZ = z.object({ from: z.number().int(), title: TextZ, born: z.number().int(), player: z.boolean() });
export const PolZ = z.object({
  /** Influence at court of the two great factions, 0–100. */
  inf: z.object({ A: z.number(), B: z.number() }),
  /** The player's own alignment, which can differ from the family's. */
  side: z.enum(['A', 'B', 'neutral']),
  /** Standing within the side, 0–100. */
  standing: z.number(),
  vacancies: z.array(VacancyZ),
  inquiries: z.array(InquiryZ),
  /** Exile: day count it ends and the province. */
  exile: z.object({ until: z.number().int(), province: z.string() }).nullable(),
  /** Formal loss of status: when, why, how it may end. */
  downfall: z.object({
    day: z.number().int(),
    cause: TextZ,
    /** Evidence gathered toward vindication, 0–100. */
    proof: z.number(),
    appeals: z.number().int(),
    /** Set when the player chose to go on living as a commoner. */
    continued: z.boolean(),
    /** What was lost with the status. */
    was: z.object({ office: OfficeZ.nullable(), royal: z.string(), legal: z.string() }),
  }).nullable(),
  /** Records where this campaign has left recorded history. */
  divergence: z.array(LifeEntryZ),
  /** Rulers who were not in the history books, from the day history changed. */
  rulers: z.array(RulerZ),
  state: StateZ.nullable(),
  /** Diplomatic mission under way: where to and the day it returns. */
  mission: z.object({ to: z.string(), back: z.number().int() }).nullable(),
});
export type Pol = z.infer<typeof PolZ>;

// ---------------------------------------------------------------- v0.4: notifications, missions, documents, letters

export const NoteZ = z.object({ id: z.string(), day: z.number().int(), cat: z.string(), pri: z.enum(['critical', 'high', 'normal', 'info']), text: TextZ, read: z.boolean() });
export type Note = z.infer<typeof NoteZ>;
export const MissionZ = z.object({
  id: z.string(),
  def: z.string(),
  /** The person the mission concerns, if any. */
  npc: z.string().nullable(),
  opened: z.number().int(),
  due: z.number().int(),
  status: z.enum(['open', 'done', 'failed']),
  outcome: TextZ.nullable(),
});
export type Mission = z.infer<typeof MissionZ>;
export const DocZ = z.object({ id: z.string(), kind: z.string(), year: z.number().int(), moon: z.number().int(), title: TextZ, body: TextZ, seal: z.string() });
export type Doc = z.infer<typeof DocZ>;
export const MailZ = z.object({ id: z.string(), day: z.number().int(), dir: z.enum(['in', 'out']), who: TextZ, title: TextZ, body: TextZ });
export type Mail = z.infer<typeof MailZ>;
export const RoutineZ = z.object({ place: z.string(), morning: z.string().nullable(), afternoon: z.string().nullable(), evening: z.string().nullable() });
export type Routine = z.infer<typeof RoutineZ>;
export const PastLifeZ = z.object({ name: TextZ, born: z.number().int(), died: z.number().int().nullable(), ending: z.string().nullable(), summary: TextZ, ribbon: z.string().nullable().optional() });
export type PastLife = z.infer<typeof PastLifeZ>;

export const GameZ = z.object({
  campaign: CampaignZ,
  date: GameDateZ,
  dayCount: z.number().int(),
  seed: z.number().int(),
  generation: z.number().int(),
  player: PlayerZ,
  house: HouseZ,
  /** For a married woman: the house she married into, where her children belong. */
  marriedInto: HouseRefZ.nullable(),
  startPrestige: z.number().int(),
  npcs: z.record(z.string(), NpcZ),
  rel: z.record(z.string(), RelZ),
  flags: z.record(z.string(), z.boolean()),
  flagDays: z.record(z.string(), z.number()),
  place: z.string(),
  done: z.array(z.string()),
  log: z.array(LifeEntryZ),
  proposals: z.array(ProposalZ),
  favoured: z.string().nullable(),
  /** Event id of a letter waiting to be read. */
  letter: z.string().nullable(),
  active: z.object({ id: z.string(), asked: z.array(z.string()) }).nullable(),
  report: ReportZ.nullable(),
  /** A season event that starts once the season report is closed. */
  queued: z.string().nullable(),
  /** Event id → year it last happened. */
  seen: z.record(z.string(), z.number()),
  ancestors: z.array(AncestorZ),
  /** Set when this life has ended; the key of the ending. */
  ending: z.string().nullable(),
  /** Achievements earned in this life. */
  achieved: z.array(z.string()),
  /** Running totals for achievements: gifts given, people met and so on. */
  counts: z.record(z.string(), z.number()),
  econ: EconZ,
  pol: PolZ,
  // v0.4 (GSDD Parts IV–VI)
  notes: z.array(NoteZ),
  missions: z.array(MissionZ),
  docs: z.array(DocZ),
  mail: z.array(MailZ),
  routine: RoutineZ.nullable(),
  /** Earlier generations of this family, for the campaign archive. */
  lives: z.array(PastLifeZ),
  // v0.5
  /** Life milestones reached, each once (GSDD Part IX §15.4). */
  milestones: z.array(z.object({ id: z.string(), year: z.number().int(), moon: z.number().int() })),
  // v0.6
  /** A scenario: a life begun with a goal (content/scenarios.ts). */
  scenario: z.object({ id: z.string(), status: z.enum(['open', 'won', 'lost']), day: z.number().int().nullable() }).nullable(),
});
export type Game = z.infer<typeof GameZ>;
