import type { Activity, Effect, Place } from '../model/content';
import { T } from '../engine/text';

/**
 * v0.3 additions to the places: education from study, service from duties, a child's day,
 * a commoner's work, a host's banquet and the business of a reigning monarch.
 */
const edu = (field: string, d: number): Effect => ({ kind: 'edu', field, d });
const attr = (a: string, d: number): Effect => ({ kind: 'attr', a, d });

const EXTRA_EFFECTS: Record<string, Effect[]> = {
  study: [edu('classics', 3)],
  read: [edu('classics', 2)],
  embroider: [edu('culture', 2)],
  archery: [edu('military', 3)],
  accounts: [edu('practical', 3)],
  'exam-study': [edu('classics', 4)],
  debate: [edu('classics', 2), edu('admin', 1)],
  poetry: [edu('culture', 2)],
  news: [edu('practical', 1)],
  duties: [{ kind: 'service', d: 3 }, edu('admin', 2)],
  secretariat: [{ kind: 'service', d: 2 }, edu('admin', 2)],
};

const A = (id: string, en: string, ko: string, ten: string, tko: string, effects: Effect[], more: Partial<Activity> = {}): Activity => ({
  id, title: T(en, ko), text: T(ten, tko), effects, ...more,
});

const NEW: Record<string, Activity[]> = {
  residence: [
    A('child-classics', 'Recite the Thousand Character Classic', '천자문 외기', 'Classics and memory grow.', '경학과 기억력이 는다.', [edu('classics', 3), attr('memory', 1)], { only: 'child' }),
    A('child-brush', 'Practise brush strokes', '붓글씨 연습', 'Arts and patience grow.', '예악과 인내심이 는다.', [edu('culture', 3), attr('patience', 1)], { only: 'child' }),
    A('child-play', 'Play in the courtyard', '마당에서 뛰놀기', 'Health and agility grow.', '건강과 민첩성이 는다.', [{ kind: 'stat', stat: 'health', d: 2 }, attr('agility', 1)], { only: 'child' }),
    A('child-bow', 'Shoot a child’s bow with the servants', '하인들과 작은 활 쏘기', 'Military arts grow.', '병학이 는다.', [edu('military', 3), attr('strength', 1)], { only: 'child' }),
    A('child-house', 'Follow your mother through the household', '어머니를 따라 살림 배우기', 'Household knowledge and empathy grow.', '살림 지식과 공감력이 는다.', [edu('practical', 3), attr('empathy', 1), { kind: 'regard', npc: 'mother', d: 2 }], { only: 'child', when: { alive: ['mother'] } }),
    A('child-tales', 'Listen to your grandfather’s stories', '할아버지 옛이야기 듣기', 'Judgement grows; the family’s past becomes yours.', '판단력이 자라고 집안의 내력이 몸에 밴다.', [edu('classics', 1), attr('judgement', 1)], { only: 'child' }),
    A('banquet', 'Host a banquet for the family’s friends', '집안 벗들을 위한 연회', 'Costs 60 nyang. Reputation and standing rise.', '60냥이 든다. 평판과 당내 입지가 오른다.', [{ kind: 'money', d: -60 }, { kind: 'stat', stat: 'reputation', d: 3 }, { kind: 'standing', d: 3 }, attr('charisma', 1)], { when: { keys: true, mourning: false }, result: T('Lanterns in the courtyard, a gayageum in the pavilion, and the right people at the right table.', '마당엔 등불, 정자엔 가야금, 그리고 알맞은 자리에 알맞은 손님들.') }),
    A('copy', 'Copy books for a bookseller', '책방 필사 일', 'Earns 8 nyang. Scholarship holds.', '8냥을 번다. 학식이 녹슬지 않는다.', [{ kind: 'money', d: 8 }, attr('scholarship', 1)], { only: 'commoner' }),
    A('teach', 'Teach the neighbours’ children their letters', '동네 아이들 글 가르치기', 'Earns 6 nyang. Empathy and honour grow.', '6냥을 번다. 공감력과 명예가 는다.', [{ kind: 'money', d: 6 }, attr('empathy', 1), { kind: 'honour', d: 1 }], { only: 'commoner' }),
    A('labour', 'Carry loads at the Mapo docks', '마포 나루에서 짐 나르기', 'Earns 10 nyang. Hard on the body.', '10냥을 번다. 몸이 고되다.', [{ kind: 'money', d: 10 }, { kind: 'stat', stat: 'health', d: -3 }, attr('strength', 1)], { only: 'commoner' }),
    A('commoner-rest', 'Rest in your rented room', '셋방에서 쉬기', 'Health rises.', '건강이 오른다.', [{ kind: 'stat', stat: 'health', d: 3 }], { only: 'commoner' }),
  ],
  academy: [
    A('seodang', 'Sit with the other children at the village school', '서당에서 아이들과 공부하기', 'Classics and charisma grow.', '경학과 매력이 는다.', [edu('classics', 3), attr('charisma', 1)], { only: 'child' }),
    A('lecture', 'Attend a lecture at the National Academy', '성균관 강론 듣기', 'Classics and administration grow.', '경학과 행정이 는다.', [edu('classics', 3), edu('admin', 1)], { when: { qual: 'sogwa' } }),
  ],
  market: [
    A('child-market', 'Go to the market with a servant', '하인을 따라 저자 구경', 'Household knowledge grows.', '살림 지식이 는다.', [edu('practical', 2)], { only: 'child' }),
    A('scribe', 'Write letters for those who cannot', '글 모르는 이들의 편지 대필', 'Earns 5 nyang. Persuasion grows.', '5냥을 번다. 설득력이 는다.', [{ kind: 'money', d: 5 }, attr('persuasion', 1)], { only: 'commoner' }),
  ],
  'throne-hall': [
    A('hold-court', 'Hold court with the ministers', '조회를 열기', 'Royal authority and cooperation rise.', '왕권과 조정 협조가 오른다.', [{ kind: 'state', key: 'authority', d: 2 }, { kind: 'state', key: 'cooperation', d: 2 }, attr('judgement', 1)], { when: { monarch: true } }),
    A('royal-lecture', 'Attend the royal lecture on the classics', '경연에 나가기', 'Classics and cooperation grow.', '경학과 조정 협조가 오른다.', [edu('classics', 3), { kind: 'state', key: 'cooperation', d: 1 }], { when: { monarch: true } }),
    A('petitions', 'Read the petitions from the provinces', '지방 상소 읽기', 'Stability rises a little; administration grows.', '민심이 조금 오르고 행정이 는다.', [{ kind: 'state', key: 'stability', d: 1 }, edu('admin', 2)], { when: { monarch: true } }),
  ],
  'queens-hall': [
    A('inner-court', 'Preside over the ladies of the inner court', '내명부를 다스리기', 'Reputation and etiquette rise.', '평판과 예법이 오른다.', [{ kind: 'stat', stat: 'reputation', d: 2 }, attr('etiquette', 1)], { when: { royal: ['queen', 'crownPrincess', 'queenDowager', 'regent'] } }),
  ],
};

/** Who may go where: children keep to home, lessons and the market; commoners to the lower city. */
const OPEN: Record<string, { child?: boolean; commoner?: boolean }> = {
  residence: { child: true, commoner: true },
  academy: { child: true },
  market: { child: true, commoner: true },
  tribunal: { commoner: true },
  temple: { child: true, commoner: true },
};
const COMMONER_OK = new Set(['temple-bows', 'temple-path', 'news', 'buy-paper', 'buy-poems', 'rest', 'ask-prisoner', 'petition', 'sibling']);

export function extendPlaces(places: Place[]) {
  for (const p of places) {
    Object.assign(p, OPEN[p.id] ?? {});
    for (const a of p.activities) {
      const more = EXTRA_EFFECTS[a.id];
      if (more && !a.effects.some((e) => e.kind === 'edu' || e.kind === 'service')) a.effects.push(...more);
      if (COMMONER_OK.has(a.id)) a.commoner = true;
    }
    const add = NEW[p.id];
    if (add) for (const a of add) if (!p.activities.some((x) => x.id === a.id)) p.activities.push(a);
  }
}
