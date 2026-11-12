import type { Doc, Game, LifeEntry, Note, Text } from '../model/schemas';
import { T } from './text';
import { feel } from './life';
import type { Emotion } from '../content/life';

/** How the player feels when something happens (GSDD Part IX §3.3). */
const FEELINGS: Partial<Record<GameEventType, [Emotion | null, number, number]>> = {
  OFFICIAL_APPOINTED: ['proud', 8, 60], OFFICIAL_DISMISSED: ['angry', -10, 60], EXAM_PASSED: ['proud', 12, 90],
  PROPERTY_ACQUIRED: [null, 4, 0], BUSINESS_ESTABLISHED: [null, 3, 0], CORONATION: ['proud', 15, 120],
  SOCIAL_STATUS_REVOKED: ['fearful', -22, 120], STATUS_RESTORED: ['joyful', 22, 120], MARRIAGE_REGISTERED: ['joyful', 12, 90],
  CHILD_BORN: ['joyful', 10, 60], MISSION_FAILED: [null, -3, 0], COMMENDATION: ['proud', 6, 45], LETTER_RECEIVED: [null, 1, 0],
};

/** The date line on an official document. */
export const issued = (g: Game): Text => T(`Issued in the year ${g.date.year}, moon ${g.date.moon}.`, `${g.date.year}년 ${g.date.moon}월 발급.`);
const who = (g: Game): Text => T(`${g.player.surname.en} ${g.player.given.en}`, `${g.player.surname.ko ?? g.player.surname.en}${g.player.given.ko ?? g.player.given.en}`);
/** Builds the text of a certificate: who, what, when. */
export function certificate(g: Game, what: Text): Text {
  const w = who(g);
  const d = issued(g);
  return T(`${w.en}: ${what.en} ${d.en}`, `${w.ko}: ${what.ko} ${d.ko}`);
}

/**
 * GSDD Part VI §4.3: structured game events. Systems announce what happened; listeners turn it into
 * notifications, official documents and memories, without the systems knowing about each other.
 */
export type GameEventType =
  | 'OFFICIAL_APPOINTED' | 'OFFICIAL_DISMISSED' | 'EXAM_PASSED' | 'PROPERTY_ACQUIRED' | 'BUSINESS_ESTABLISHED'
  | 'FACTION_CHANGED' | 'ROYAL_SUCCESSION' | 'CORONATION' | 'SOCIAL_STATUS_REVOKED' | 'STATUS_RESTORED'
  | 'MARRIAGE_REGISTERED' | 'CHILD_BORN' | 'HISTORICAL_EVENT_TRIGGERED' | 'DIVERGENCE' | 'MISSION_OPENED'
  | 'MISSION_DONE' | 'MISSION_FAILED' | 'LETTER_RECEIVED' | 'COMMENDATION';
export type GameEvent = { type: GameEventType; text: Text; npc?: string; doc?: { title: Text; body: Text } };

type Pri = Note['pri'];
const ROUTE: Record<GameEventType, [string, Pri, string | null]> = {
  OFFICIAL_APPOINTED: ['government', 'high', 'appointment'],
  OFFICIAL_DISMISSED: ['government', 'high', null],
  EXAM_PASSED: ['education', 'high', 'exam'],
  PROPERTY_ACQUIRED: ['estate', 'normal', 'deed'],
  BUSINESS_ESTABLISHED: ['economic', 'normal', null],
  FACTION_CHANGED: ['political', 'normal', null],
  ROYAL_SUCCESSION: ['royal', 'high', null],
  CORONATION: ['royal', 'critical', 'coronation'],
  SOCIAL_STATUS_REVOKED: ['emergency', 'critical', null],
  STATUS_RESTORED: ['political', 'critical', 'restoration'],
  MARRIAGE_REGISTERED: ['family', 'high', 'marriage'],
  CHILD_BORN: ['family', 'high', null],
  HISTORICAL_EVENT_TRIGGERED: ['historical', 'normal', null],
  DIVERGENCE: ['historical', 'high', null],
  MISSION_OPENED: ['mission', 'high', null],
  MISSION_DONE: ['mission', 'normal', null],
  MISSION_FAILED: ['mission', 'high', null],
  LETTER_RECEIVED: ['letters', 'normal', null],
  COMMENDATION: ['royal', 'high', 'commendation'],
};
const SEALS: Record<string, string> = { appointment: '敎旨', exam: '紅牌', deed: '文記', coronation: '敎書', restoration: '伸寃', marriage: '婚書', commendation: '褒賞' };

export function notify(g: Game, cat: string, pri: Pri, text: Text) {
  const seq = (g.counts['note-seq'] = (g.counts['note-seq'] ?? 0) + 1);
  g.notes.push({ id: `n${seq}`, day: g.dayCount, cat, pri, text, read: false });
  if (g.notes.length > 150) g.notes.splice(0, g.notes.length - 150);
}

export function issueDoc(g: Game, kind: string, title: Text, body: Text) {
  const doc: Doc = { id: `d${g.dayCount}-${g.docs.length}`, kind, year: g.date.year, moon: g.date.moon, title, body, seal: SEALS[kind] ?? '印' };
  g.docs.push(doc);
}

export function remember(g: Game, npc: string, text: Text) {
  const r = g.rel[npc];
  if (!r) return;
  r.moments.push({ year: g.date.year, moon: g.date.moon, text });
  if (r.moments.length > 12) r.moments.splice(0, r.moments.length - 12);
}

/** Announce an event: every listener reacts. */
export function emit(g: Game, e: GameEvent) {
  if (!g.notes) return;
  const [cat, pri, doc] = ROUTE[e.type];
  const f = FEELINGS[e.type];
  if (f && g.player?.happiness !== undefined) feel(g, f[0], f[1], f[2]);
  notify(g, cat, pri, e.text);
  if (doc && e.doc) issueDoc(g, doc, e.doc.title, e.doc.body);
  if (e.npc) remember(g, e.npc, e.text);
}

const TAG_CAT: Record<string, string> = { edu: 'education', career: 'government', family: 'family', politics: 'political', court: 'royal', wealth: 'economic', downfall: 'emergency' };

/** Called after every change: new life-record lines become notifications, and a new season report is filed. */
export function syncNotes(prev: Game | null, g: Game) {
  if (!g.notes) return;
  const same = !!prev && prev.seed === g.seed && prev.generation === g.generation;
  if (!same) return;
  const before = prev.log.length;
  const fresh: LifeEntry[] = g.log.slice(before);
  // Events already announced through emit() in this change are not announced twice.
  const said = g.notes.slice(Math.max(0, prev.notes.length - (g.notes.length >= 150 ? 30 : 0))).map((n) => n.text.en);
  const dup = (en: string) => said.some((x) => x === en || en.includes(x) || x.includes(en));
  for (const l of fresh) {
    if (dup(l.text.en)) continue;
    notify(g, l.historical ? 'historical' : TAG_CAT[l.tag ?? ''] ?? guessCat(l.text.en), l.tag === 'downfall' ? 'high' : 'info', l.text);
  }
  if (g.report && g.report.entries.length && JSON.stringify(prev.report) !== JSON.stringify(g.report)) {
    notify(g, 'season', 'normal', T(`Season report: ${g.report.title.en} (${g.report.entries.length} entries)`, `철 보고: ${g.report.title.ko ?? g.report.title.en} (${g.report.entries.length}건)`));
  }
}
/** Untagged lines from older content, filed by a few telling words. */
function guessCat(en: string): string {
  const t = en.toLowerCase();
  if (/married|betroth|born|died|son|daughter|wife|husband|widow/.test(t)) return 'family';
  if (/faction|court has turned|purge|great offices|memorial/.test(t)) return 'political';
  if (/appointed|promoted|dismissed|office|post/.test(t)) return 'government';
  if (/nyang|estate|harvest|business|cargo|treasury/.test(t)) return 'economic';
  if (/mission/.test(t)) return 'mission';
  return 'personal';
}
export const unread = (g: Game) => g.notes.filter((n) => !n.read).length;
export const NOTE_CATS: [string, Text][] = [
  ['all', T('All', '전체')], ['emergency', T('Emergency', '긴급')], ['mission', T('Missions', '과업')], ['royal', T('Royal', '왕실')],
  ['government', T('Government', '관직')], ['political', T('Political', '정치')], ['family', T('Family', '가족')], ['education', T('Education', '학업')],
  ['economic', T('Economic', '경제')], ['estate', T('Estates', '전장')], ['historical', T('Historical', '역사')], ['letters', T('Letters', '서신')],
  ['season', T('Seasons', '철 보고')], ['health', T('Health', '건강')], ['personal', T('Personal', '개인')],
];
