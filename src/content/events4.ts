import type { Condition, Effect, GameEvent, Line } from '../model/content';
import type { Text } from '../model/schemas';
import { T } from '../engine/text';

/*
 * v0.4 scenes for GSDD Part IV: moments where a player in the right place may try to turn recorded history,
 * as far as the campaign's continuity setting allows. The situations are documented; the scenes around
 * them are reconstructions, and no historical figure is given invented words.
 */

const L = (who: string, en: string, ko: string, when?: Condition): Line => ({ who, text: T(en, ko), ...(when ? { when } : {}) });
const note = (en: string, ko: string, when?: Condition): Effect => ({ kind: 'note', text: T(en, ko), ...(when ? { when } : {}) });
const rec = (en: string, ko: string, when?: Condition): Effect => ({ kind: 'record', text: T(en, ko), ...(when ? { when } : {}) });
const stat = (s: 'health' | 'reputation' | 'favour' | 'prestige', d: number, when?: Condition): Effect => ({ kind: 'stat', stat: s, d, ...(when ? { when } : {}) });
const attr = (a: string, d: number, when?: Condition): Effect => ({ kind: 'attr', a, d, ...(when ? { when } : {}) });
const honour = (d: number, when?: Condition): Effect => ({ kind: 'honour', d, ...(when ? { when } : {}) });
const money = (d: number, when?: Condition): Effect => ({ kind: 'money', d, ...(when ? { when } : {}) });
const tag = (en: string, ko: string): Text => T(en, ko);
type C = GameEvent['choices'][number];
const choice = (id: string, label: [string, string], say: [string, string], tags: Text[], reaction: Line[], effects: Effect[], more: Partial<C> = {}): C => ({
  id, label: T(label[0], label[1]), say: T(say[0], say[1]), tags, reaction, effects, ...more,
});
const diverge = (cls: 'minor' | 'moderate' | 'major' | 'structural', flag: string, recorded: [string, string], instead: [string, string], when?: Condition): Effect => ({
  kind: 'diverge', cls, flag, recorded: T(...recorded), instead: T(...instead), ...(when ? { when } : {}),
});

export const HISTORY_EVENTS: GameEvent[] = [
  {
    id: 'iv-envoys-1591', title: T('Two reports from Japan', '엇갈린 통신사의 보고'), delivery: 'season', place: 'throne-hall', time: 'day', cast: 'chief-councillor', basis: 'verified',
    when: { mode: 'historical', year: { from: 1591, to: 1591 }, office: true, bends: 'moderate', legal: ['yangban', 'royal'] },
    lines: [
      L('narr', 'The embassy has come back from Japan with two answers. The chief envoy warns that Toyotomi Hideyoshi means to make war. His deputy reports that there is nothing to fear.', '일본에 갔던 통신사가 두 가지 답을 가지고 돌아왔다. 정사는 도요토미 히데요시가 반드시 쳐들어올 것이라 하고, 부사는 걱정할 것 없다고 한다.'),
      L('narr', 'The envoys belong to opposite factions, and the court is listening as much to the factions as to the reports. Officials of your rank are asked for their view.', '두 사신은 서로 다른 당에 속해 있어, 조정은 보고만큼이나 당파의 소리를 듣고 있다. 당신 품계의 관원들에게도 의견을 묻는다.'),
    ],
    prompt: L('narr', 'What do you advise? (A historical situation; the scene is a reconstruction.)', '무엇을 아뢰겠는가? (역사적 상황을 바탕으로 재구성한 장면)'),
    choices: [
      choice('prepare', ['Urge the court to prepare for war.', '전쟁에 대비하자고 아뢴다.'], ['If we are wrong to prepare, we lose some rice. If we are wrong not to, we lose the kingdom.', '대비했다가 틀리면 쌀을 잃을 뿐이나, 대비하지 않았다가 틀리면 나라를 잃습니다.'], [tag('Needs strategy 50', '전략 50 필요'), tag('Moderate divergence', '중간 변화')],
        [L('narr', 'The memorial is read twice. Some ministers look at you as if you had broken a window.', '상소가 두 번 읽혔다. 몇몇 대신은 당신이 창문이라도 깬 듯 쳐다본다.')],
        [diverge('moderate', 'iv-1592-prepared', ['The court accepted the reassuring report and made few preparations.', '조정은 안심하라는 보고를 받아들이고 대비를 소홀히 했다.'], ['On your urging, forts in the south are repaired and garrisons strengthened before the invasion.', '당신의 건의로 침략 전에 남쪽 진보가 보수되고 군사가 늘었다.'], { minAttr: { a: 'strategy', min: 50 } }),
          note('The court hears you out, then accepts the reassuring report. History keeps its course.', '조정은 당신의 말을 끝까지 들었으나 결국 안심하라는 보고를 받아들였다. 역사는 제 길을 간다.', { not: { minAttr: { a: 'strategy', min: 50 } } }),
          { kind: 'standing', d: -4 }, attr('strategy', 1), stat('reputation', 2)]),
      choice('factional', ['Back your own faction’s envoy.', '같은 당 사신의 말을 편든다.'], ['The envoy of our side has the better judgement.', '우리 편 사신의 판단이 옳습니다.'], [tag('Standing', '당내 입지'), tag('As recorded', '기록대로')],
        [L('narr', 'Your faction is pleased. The question of Japan is settled the way the record says it was.', '당은 흡족해한다. 일본 문제는 기록대로 결론이 났다.')], [{ kind: 'standing', d: 6 }]),
      choice('silent', ['Keep your counsel.', '말을 아낀다.'], ['(You say nothing.)', '(아무 말도 하지 않는다.)'], [tag('As recorded', '기록대로')],
        [L('narr', 'Others decide.', '다른 이들이 결정한다.')], []),
    ],
  },
  {
    id: 'iv-qing-1636', title: T('The Qing demand an answer', '청의 요구'), delivery: 'season', place: 'throne-hall', time: 'day', cast: 'chief-councillor', basis: 'verified',
    when: { mode: 'historical', year: { from: 1636, to: 1636 }, season: 3, office: true, minTier: 2, bends: 'major', legal: ['yangban', 'royal'] },
    lines: [
      L('narr', 'Hong Taiji has proclaimed himself emperor of the Qing and demands that Joseon acknowledge him. The court is split: Choe Myeong-gil argues for negotiation, Kim Sang-heon for refusal.', '홍타이지가 청의 황제를 칭하며 조선에 신하의 예를 요구했다. 조정이 갈라졌다. 최명길은 화친을, 김상헌은 척화를 주장한다.'),
      L('narr', 'The answer will be sent before winter. Every official who can reach the king is pressed to speak.', '겨울이 오기 전에 답서를 보내야 한다. 임금께 닿을 수 있는 관원이라면 누구든 의견을 내라는 압박을 받는다.'),
    ],
    prompt: L('narr', 'What do you advise? (A historical situation; the scene is a reconstruction.)', '무엇을 아뢰겠는가? (역사적 상황을 바탕으로 재구성한 장면)'),
    choices: [
      choice('negotiate', ['Argue for a careful answer that buys time.', '시간을 벌 신중한 답서를 주장한다.'], ['An answer that refuses nothing and promises nothing gives them no pretext.', '거절도 약속도 하지 않는 답이라야 저들에게 구실을 주지 않습니다.'], [tag('Needs diplomacy 60', '외교술 60 필요'), tag('Major divergence', '중대한 변화')],
        [L('narr', 'You are called a coward in the corridors. You are also, for once, listened to.', '복도에서는 겁쟁이라는 소리를 듣는다. 그러나 이번만은 당신 말이 먹혔다.')],
        [diverge('major', 'iv-1636-averted', ['The court refused the Qing; the invasion came that winter and ended in surrender at Samjeondo.', '조정은 청을 거부했고 그해 겨울 침략을 받아 삼전도에서 항복했다.'], ['A temporising answer gives the Qing no pretext; the second Manchu invasion does not come.', '시간을 끄는 답서로 청에 구실을 주지 않아 병자호란이 일어나지 않았다.'], { minAttr: { a: 'diplomacy', min: 60 } }),
          note('The hardliners carry the day. The refusal is sent.', '척화론이 이겼다. 거절의 답서가 떠났다.', { not: { minAttr: { a: 'diplomacy', min: 60 } } }),
          honour(-3), { kind: 'standing', d: -6 }, attr('diplomacy', 1)]),
      choice('refuse', ['Stand with those who refuse.', '척화에 힘을 보탠다.'], ['We cannot call a barbarian khan our emperor.', '오랑캐의 칸을 황제라 부를 수는 없습니다.'], [tag('Honour', '명예'), tag('As recorded', '기록대로')],
        [L('narr', 'The refusal is sent. Your name is on the list of the righteous.', '거절의 답서가 떠났다. 당신의 이름이 척화의 명단에 올랐다.')], [honour(4), stat('reputation', 2)]),
      choice('silent', ['Say nothing.', '침묵한다.'], ['(You keep your head down.)', '(고개를 숙이고 있는다.)'], [tag('As recorded', '기록대로')], [L('narr', 'Others decide.', '다른 이들이 결정한다.')], []),
    ],
  },
  {
    id: 'iv-sado-1762', title: T('The king’s anger', '진노하신 임금'), delivery: 'season', place: 'throne-hall', time: 'day', cast: 'king', basis: 'verified',
    when: { mode: 'historical', year: { from: 1762, to: 1762 }, season: 1, minFavour: 45, bends: 'major', any: [{ office: true }, { legal: ['royal'] }] },
    lines: [
      L('narr', 'A memorial has accused the crown prince of crimes. The king is in a fury no one has seen before, and the palace has gone silent.', '세자의 비행을 고하는 글이 올라왔다. 임금께서 전에 없이 진노하셨고 궁궐은 숨을 죽였다.'),
      L('narr', 'Those who know the court say this will not end with a reprimand. Few dare to speak.', '조정 사정을 아는 이들은 이번에는 꾸지람으로 끝나지 않으리라 한다. 감히 입을 여는 이가 드물다.'),
    ],
    prompt: L('narr', 'Will you speak? (A historical situation; the scene is a reconstruction.)', '나서겠는가? (역사적 상황을 바탕으로 재구성한 장면)'),
    choices: [
      choice('plead', ['Kneel and plead for the crown prince’s life.', '엎드려 세자의 목숨을 빈다.'], ['Punish him as Your Majesty sees fit, but let him live.', '전하의 뜻대로 벌하시되, 목숨만은 거두지 마소서.'], [tag('Needs favour 60 and etiquette 55', '총애 60, 예법 55 필요'), tag('Major divergence', '중대한 변화'), tag('Risky', '위험')],
        [L('narr', 'For a long time the king says nothing. Then he waves you out.', '임금께서 오래도록 말이 없으시다. 이윽고 손을 저어 물러가라 하신다.')],
        [diverge('major', 'iv-1762-saved', ['Crown Prince Sado was shut in a rice chest by his father’s order and died after eight days.', '사도세자는 부왕의 명으로 뒤주에 갇혀 여드레 만에 숨졌다.'], ['The king relents: the crown prince is confined and stripped of his duties, but lives.', '임금이 마음을 돌려, 세자는 연금되고 직무를 잃었으나 목숨을 건졌다.'], { minFavour: 60, minAttr: { a: 'etiquette', min: 55 } }),
          note('The king does not relent. Your plea is remembered, and not kindly.', '임금께서는 마음을 돌리지 않으셨다. 당신의 간청은 기억되었으나, 좋게는 아니다.', { not: { minFavour: 60, minAttr: { a: 'etiquette', min: 55 } } }),
          stat('favour', -12, { not: { minFavour: 60, minAttr: { a: 'etiquette', min: 55 } } }), honour(6)]),
      choice('silent', ['Keep silent.', '입을 다문다.'], ['(You stand with the others and say nothing.)', '(다른 이들과 함께 서서 아무 말도 하지 않는다.)'], [tag('As recorded', '기록대로')],
        [L('narr', 'Silence, too, is a choice. You will think about it for years.', '침묵도 선택이다. 당신은 몇 해 동안 이 일을 곱씹을 것이다.')], [rec('Kept silent in the crisis of 1762.', '1762년의 위기에 침묵했다.')]),
    ],
  },
  {
    id: 'foreign-envoy', title: T('An embassy at the Mohwagwan', '모화관의 사신'), delivery: 'season', place: 'offices', time: 'day', cast: 'royal-secretary', yearly: true,
    when: { office: true, minTier: 2, minAge: 22 },
    lines: [
      L('narr', 'An embassy has arrived and is lodged outside the West Gate. You are named to the reception party.', '사신단이 도착해 서대문 밖에 묵고 있다. 당신이 영접 일행에 이름을 올렸다.'),
      L('royal-secretary', 'Protocol is everything. One misplaced bow becomes a letter of complaint to the throne.', '예법이 전부요. 절 한 번 잘못하면 조정에 항의서가 날아온다오.'),
    ],
    prompt: L('narr', 'How do you conduct the reception? (Fictional story)', '영접을 어떻게 하겠는가? (허구의 이야기)'),
    choices: [
      choice('protocol', ['Follow every rite to the letter.', '의례를 한 치 어긋남 없이 따른다.'], ['Welcome. The court has prepared your lodging.', '먼 길 오셨습니다. 조정에서 처소를 마련했습니다.'], [tag('Etiquette', '예법'), tag('Favour', '총애')],
        [L('narr', 'Nothing goes wrong, which is the highest praise a reception can earn.', '아무 탈이 없었다. 영접이 받을 수 있는 최고의 칭찬이다.')], [attr('etiquette', 2), stat('favour', 2)]),
      choice('banquet', ['Host a generous banquet (40 nyang).', '넉넉한 연회를 연다 (40냥).'], ['Tonight you are our guests, not our envoys.', '오늘 밤은 사신이 아니라 손님이십니다.'], [tag('−40 nyang', '−40냥'), tag('Reputation', '평판')],
        [L('narr', 'The envoys drink, sing and go home with a good word for you.', '사신들이 마시고 노래하고, 당신에 대해 좋은 말을 안고 돌아갔다.')], [money(-40), stat('reputation', 3)], { when: { minMoney: 40 } }),
      choice('listen', ['Listen for news of their country.', '그 나라 소식에 귀를 기울인다.'], ['Tell me, how are things at your court?', '귀국 조정의 형편은 어떠합니까?'], [tag('Diplomacy', '외교술'), tag('Strategy', '전략')],
        [L('narr', 'Between toasts you learn who is rising there, and what they want from Joseon.', '건배 사이사이에 그쪽에서 누가 떠오르고 조선에게 무엇을 원하는지 알게 되었다.')], [attr('diplomacy', 2), attr('strategy', 1)]),
    ],
  },
];
