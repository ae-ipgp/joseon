import type { Condition, Effect, GameEvent, Line } from '../model/content';
import type { Text } from '../model/schemas';
import { T } from '../engine/text';

/*
 * v0.6 scenes from GSDD Parts XI–XVI at life-sim depth: a trial, a lawsuit's temptation, belief and its
 * risks, the arts, a foreign castaway, a frontier night and a few small pleasures. All fictional stories
 * set in the period; none puts words in a historical person's mouth.
 */

const L = (who: string, en: string, ko: string, when?: Condition): Line => ({ who, text: T(en, ko), ...(when ? { when } : {}) });
const note = (en: string, ko: string, when?: Condition): Effect => ({ kind: 'note', text: T(en, ko), ...(when ? { when } : {}) });
const rec = (en: string, ko: string, when?: Condition): Effect => ({ kind: 'record', text: T(en, ko), ...(when ? { when } : {}) });
const stat = (s: 'health' | 'reputation' | 'favour' | 'prestige', d: number, when?: Condition): Effect => ({ kind: 'stat', stat: s, d, ...(when ? { when } : {}) });
const attr = (a: string, d: number, when?: Condition): Effect => ({ kind: 'attr', a, d, ...(when ? { when } : {}) });
const honour = (d: number, when?: Condition): Effect => ({ kind: 'honour', d, ...(when ? { when } : {}) });
const money = (d: number, when?: Condition): Effect => ({ kind: 'money', d, ...(when ? { when } : {}) });
const happy = (d: number, mood?: string, when?: Condition): Effect => ({ kind: 'happy', d, ...(mood ? { mood } : {}), ...(when ? { when } : {}) });
const stress = (d: number, when?: Condition): Effect => ({ kind: 'stress', d, ...(when ? { when } : {}) });
const skill = (id: string, d: number, when?: Condition): Effect => ({ kind: 'skill', id, d, ...(when ? { when } : {}) });
const practice = (id: string, d = 1): Effect => ({ kind: 'practice', id, d });
const tag = (en: string, ko: string): Text => T(en, ko);
type C = GameEvent['choices'][number];
const choice = (id: string, label: [string, string], say: [string, string], tags: Text[], reaction: Line[], effects: Effect[], more: Partial<C> = {}): C => ({
  id, label: T(label[0], label[1]), say: T(say[0], say[1]), tags, reaction, effects, ...more,
});

export const CULTURE_EVENTS: GameEvent[] = [
  // ------------------------------------------------------------ law (Part XV)
  {
    id: 'v6-bribery-trial', title: T('Before the State Tribunal', '의금부 뜰에서'), delivery: 'season', place: 'tribunal', time: 'day', cast: 'inspector',
    when: { office: true, minTier: 2, minDay: 900, legal: ['yangban'], not: { minFavour: 50 }, flags: { 'v6-tried': false } },
    lines: [
      L('narr', 'A clerk dismissed from your office has sworn that you took silver to settle a land case. You are summoned to answer.', '당신의 관아에서 쫓겨난 서리가, 당신이 은을 받고 전답 송사를 처리했다고 고변했다. 답하라는 소환이 왔다.'),
      L('inspector', 'The accusation is written and sealed. What do you say to it?', '고변은 글로 적혀 봉해졌소. 무어라 답하겠소?'),
    ],
    prompt: L('narr', 'How do you answer the charge? (Fictional story)', '혐의에 어떻게 답하겠는가? (허구의 이야기)'),
    choices: [
      choice('ledgers', ['Lay your ledgers on the table.', '장부를 내놓는다.'], ['Every case I have heard is in these books. Read them.', '제가 다룬 송사는 모두 이 장부에 있습니다. 읽어 보십시오.'], [tag('Needs administration 50', '행정력 50 필요'), tag('Honour', '명예')],
        [L('narr', 'The inspectors read for two days.', '감찰들이 이틀 동안 장부를 읽었다.')],
        [{ kind: 'flag', flag: 'v6-tried', v: true }, note('The books are clean, and the clerk is found to have a grudge. You are cleared.', '장부는 깨끗했고 서리에게 원한이 있었음이 드러났다. 혐의를 벗었다.', { minAttr: { a: 'administration', min: 50 } }), honour(4, { minAttr: { a: 'administration', min: 50 } }), stat('reputation', 3, { minAttr: { a: 'administration', min: 50 } }),
          note('The books are honest but careless. Nothing is proved; nothing is forgotten either.', '장부는 정직하나 허술했다. 증명된 것은 없지만 잊힌 것도 없다.', { not: { minAttr: { a: 'administration', min: 50 } } }), stat('reputation', -3, { not: { minAttr: { a: 'administration', min: 50 } } }), stress(8)]),
      choice('witness', ['Call the parties to the land case.', '그 송사의 당사자들을 부른다.'], ['Ask the men whose land it was.', '그 땅의 주인들에게 물으십시오.'], [tag('Reputation decides', '평판에 달림')],
        [L('narr', 'Three farmers kneel in the courtyard and are asked one question each.', '농부 셋이 뜰에 꿇어앉아 한 가지씩 질문을 받았다.')],
        [{ kind: 'flag', flag: 'v6-tried', v: true }, note('They say you heard both sides and took nothing. The charge falls.', '그들은 당신이 양쪽 말을 다 듣고 아무것도 받지 않았다고 했다. 혐의가 풀렸다.', { minReputation: 50 }), stat('reputation', 4, { minReputation: 50 }),
          note('They are frightened and say little. The tribunal reprimands you for the appearance of the thing.', '겁먹은 그들은 말을 아꼈다. 의금부는 의심받을 일을 했다 하여 당신을 견책했다.', { not: { minReputation: 50 } }), { kind: 'punish', level: 'reprimand', cause: T('Reprimanded after an accusation of bribery', '뇌물 혐의 끝에 견책'), when: { not: { minReputation: 50 } } }]),
      choice('patron', ['Ask your faction’s elders to speak for you.', '당의 어른들에게 구명을 청한다.'], ['I have served the cause. Now I ask the cause to serve me.', '저는 당을 위해 일했습니다. 이제 당이 저를 위해 나서 주십시오.'], [tag('Standing', '당내 입지'), tag('Honour −3', '명예 −3')],
        [L('narr', 'The matter is quietly dropped. You owe a debt that will be called in.', '일은 조용히 덮였다. 언젠가 갚아야 할 빚을 졌다.')],
        [{ kind: 'flag', flag: 'v6-tried', v: true }, honour(-3), { kind: 'standing', d: -6 }], { when: { side: ['A', 'B'] } }),
    ],
  },
  {
    id: 'v6-forged-deed', title: T('A forged deed', '위조 문기'), delivery: 'season', place: 'residence', time: 'night', cast: 'steward',
    when: { keys: true, minAge: 22, legal: ['yangban', 'royal'], minDay: 400, flags: { 'v6-deed': false } },
    lines: [
      L('steward', 'Master, the field by the stream. Old Pak has no heir and no papers. A clever hand could write a deed tonight.', '나리, 개울가 논 말씀입니다. 박 노인은 후사도 문서도 없습니다. 솜씨 좋은 손이면 오늘 밤에라도 문기를 쓸 수 있지요.'),
      L('narr', 'He does not say whose hand. The lamp burns low.', '누구의 손인지는 말하지 않는다. 등잔불이 가물거린다.'),
    ],
    prompt: L('narr', 'What do you tell him? (Fictional story)', '무어라 답하겠는가? (허구의 이야기)'),
    choices: [
      choice('refuse', ['“We do not take what is not ours.”', '“우리 것이 아닌 것은 취하지 않는다.”'], ['Say nothing of this again.', '다시는 입 밖에 내지 마라.'], [tag('Honour', '명예')],
        [L('steward', 'As you say, master.', '분부대로 하겠습니다.')], [{ kind: 'flag', flag: 'v6-deed', v: true }, honour(3), attr('integrity', 1)]),
      choice('buy', ['Buy the field from the old man, fairly.', '노인에게 제값을 주고 논을 산다.'], ['Offer him eighty nyang and a place at our table.', '여든 냥과 우리 집 밥상 한 자리를 드리겠다고 해라.'], [tag('−80 nyang from the treasury', '곳간에서 −80냥'), tag('Reputation', '평판')],
        [L('narr', 'Old Pak weeps, signs with his thumb, and eats with your household until he dies.', '박 노인은 울며 손도장을 찍었고, 죽는 날까지 당신 집에서 밥을 먹었다.')],
        [{ kind: 'flag', flag: 'v6-deed', v: true }, { kind: 'treasury', d: -80 }, stat('reputation', 3), honour(2), happy(3)], { when: { minMoney: 0 } }),
      choice('forge', ['“Write it.”', '“써라.”'], ['Use the old paper from the storehouse.', '곳간의 묵은 종이를 써라.'], [tag('+120 nyang to the treasury', '곳간에 +120냥'), tag('Honour −6', '명예 −6'), tag('Risky', '위험')],
        [L('narr', 'By morning the field is yours on paper. Paper can be read by others.', '아침이면 그 논은 문서상 당신 것이다. 문서는 남도 읽을 수 있다.')],
        [{ kind: 'flag', flag: 'v6-deed', v: true }, { kind: 'flag', flag: 'v6-forger', v: true }, { kind: 'treasury', d: 120 }, honour(-6), attr('integrity', -2), stress(6)]),
    ],
  },
  {
    id: 'v6-forgery-found', title: T('The deed is questioned', '문기가 의심받다'), delivery: 'season', place: 'tribunal', time: 'day', cast: 'inspector',
    when: { flags: { 'v6-forger': true, 'v6-forger-done': false }, minDay: 700 },
    lines: [L('inspector', 'This deed is dated ten years ago and written on paper from last year’s mill. Explain it.', '이 문기는 십 년 전 날짜인데 종이는 지난해 조지서에서 뜬 것이오. 설명해 보시오.')],
    prompt: L('narr', 'What do you say?', '무어라 답하겠는가?'),
    choices: [
      choice('confess', ['Confess and return the field.', '자백하고 논을 돌려준다.'], ['The fault is mine alone.', '허물은 오로지 제게 있습니다.'], [tag('−200 nyang', '−200냥'), tag('Reputation −5', '평판 −5')],
        [L('narr', 'The fine is heavy and the gossip heavier, but it ends here.', '벌금은 무겁고 소문은 더 무겁지만, 일은 여기서 끝났다.')],
        [{ kind: 'flag', flag: 'v6-forger-done', v: true }, { kind: 'treasury', d: -200 }, stat('reputation', -5), honour(2)]),
      choice('blame', ['Blame the steward.', '집사에게 떠넘긴다.'], ['I knew nothing of it.', '저는 전혀 몰랐던 일입니다.'], [tag('Honour −5', '명예 −5'), tag('Risky', '위험')],
        [L('narr', 'The steward is flogged and dismissed. He looks at you once on his way out.', '집사는 매를 맞고 쫓겨났다. 나가는 길에 그가 당신을 한 번 돌아보았다.')],
        [{ kind: 'flag', flag: 'v6-forger-done', v: true }, honour(-5), stress(10), happy(-5), { kind: 'punish', level: 'reprimand', cause: T('A forged deed was traced to the household', '위조 문기가 집안에서 나왔다') }]),
    ],
  },
  // ------------------------------------------------------------ belief (Part XVI)
  {
    id: 'v6-monk-at-gate', title: T('A monk at the gate', '대문 앞의 스님'), delivery: 'season', place: 'residence', time: 'day', cast: 'narr', yearly: true,
    when: { minAge: 14, season: 2 },
    lines: [L('narr', 'A mountain monk stands at the gate with his bowl, chanting. The servants look to you: scholars’ houses usually send him on.', '산승이 바리때를 들고 대문 앞에서 염불을 왼다. 하인들이 당신을 본다. 선비 집에서는 대개 그냥 보낸다.')],
    prompt: L('narr', 'What do you do?', '어떻게 하겠는가?'),
    choices: [
      choice('rice', ['Fill his bowl with rice.', '바리때에 쌀을 채워 준다.'], ['Winter is coming up the mountain. Take two measures.', '산에는 겨울이 일찍 옵니다. 두 되 가져가십시오.'], [tag('−2 nyang', '−2냥'), tag('Happiness', '행복')],
        [L('narr', 'He bows and says a blessing for the house. The cook pretends not to listen.', '스님이 합장하고 집안에 축원을 했다. 찬모는 못 들은 척한다.')], [money(-2), happy(3), practice('lantern'), stress(-3)]),
      choice('talk', ['Ask him in to talk about the sutras.', '안으로 청해 불경 이야기를 듣는다.'], ['What does the Diamond Sutra mean by “no abiding”?', '금강경의 “머무는 바 없이”란 무슨 뜻입니까?'], [tag('Judgement', '판단력'), tag('Colleagues may talk', '동료들의 입방아')],
        [L('narr', 'You disagree about everything and part friends.', '모든 것에 의견이 달랐으나 벗이 되어 헤어졌다.')], [attr('judgement', 1), practice('lantern', 2), stress(-5), stat('reputation', -1, { office: true })]),
      choice('send', ['Send him on politely.', '정중히 돌려보낸다.'], ['This is a house of the sages. Go well.', '이곳은 유가의 집입니다. 살펴 가십시오.'], [tag('As a scholar should', '선비답게')],
        [L('narr', 'The chanting fades down the lane.', '염불 소리가 골목 아래로 멀어진다.')], [practice('sitting')]),
    ],
  },
  {
    id: 'v6-book-from-beijing', title: T('A book from Beijing', '북경에서 온 책'), delivery: 'season', place: 'market', time: 'day', cast: 'narr',
    when: { mode: 'historical', year: { from: 1784, to: 1865 }, minAge: 17, legal: ['yangban', 'royal'], flags: { 'v6-seohak-offer': false } },
    lines: [
      L('narr', 'An interpreter back from the embassy unwraps something behind his stall: a book of star charts and geometry, and under it a thin volume with a cross on the first page.', '사행에서 돌아온 역관이 좌판 뒤에서 무언가를 푼다. 별자리와 기하를 담은 책, 그리고 그 밑에 첫 장에 십자가 그려진 얇은 책.'),
      L('narr', 'He names a price for both and looks over your shoulder as he says it.', '그가 두 권의 값을 부르며 당신 어깨 너머를 살핀다.'),
    ],
    prompt: L('narr', 'Do you buy? (Fictional story in a historical setting)', '사겠는가? (역사를 배경으로 한 허구의 이야기)'),
    choices: [
      choice('charts', ['Buy the star charts only.', '천문서만 산다.'], ['The mathematics. Keep the other.', '산학서만 주시오. 다른 것은 넣어 두고.'], [tag('−12 nyang', '−12냥'), tag('Practical learning', '실용 학문')],
        [L('narr', 'You read until the lamp gives out.', '등잔 기름이 다하도록 읽었다.')], [{ kind: 'flag', flag: 'v6-seohak-offer', v: true }, money(-12), { kind: 'edu', field: 'practical', d: 4 }, attr('intelligence', 1)], { when: { minMoney: 12 } }),
      choice('both', ['Buy both.', '둘 다 산다.'], ['Wrap them in something dull.', '눈에 안 띄는 것으로 싸 주시오.'], [tag('−20 nyang', '−20냥'), tag('Dangerous in a persecution', '박해 때는 위험')],
        [L('narr', 'You carry them home under a sack of beans.', '콩 자루 밑에 넣어 집으로 가져왔다.')], [{ kind: 'flag', flag: 'v6-seohak-offer', v: true }, { kind: 'flag', flag: 'seohak', v: true }, money(-20), { kind: 'edu', field: 'practical', d: 4 }, practice('western', 2), stress(4)], { when: { minMoney: 20 } }),
      choice('leave', ['Walk on.', '그냥 지나친다.'], ['I saw nothing.', '나는 아무것도 못 보았소.'], [tag('Safe', '안전')],
        [L('narr', 'He wraps them again without a word.', '그는 말없이 책을 다시 쌌다.')], [{ kind: 'flag', flag: 'v6-seohak-offer', v: true }]),
    ],
  },
  // ------------------------------------------------------------ culture (Part XIII)
  {
    id: 'v6-poetry-rival', title: T('The moon-viewing party', '달맞이 시회'), delivery: 'season', place: 'rear-garden', time: 'night', cast: 'narr', yearly: true,
    when: { minAge: 16, season: 2, minSkill: { id: 'poetry', min: 20 }, legal: ['yangban', 'royal'], mourning: false },
    lines: [
      L('narr', 'Chuseok moon, a pavilion, a jar of wine and a rhyme set by the host. A young man from a rival house finishes first and reads his verse to applause.', '한가위 달, 정자, 술 한 동이, 그리고 주인이 낸 운자. 맞수 집안의 젊은이가 먼저 붓을 놓고 박수 속에 시를 읊었다.'),
      L('narr', 'Every face turns to you.', '모든 얼굴이 당신을 향한다.'),
    ],
    prompt: L('narr', 'What do you offer?', '무엇으로 답하겠는가?'),
    choices: [
      choice('answer', ['Answer his verse with a better one.', '더 나은 시로 답한다.'], ['The same rhyme, then. Listen.', '같은 운으로 가겠소. 들어 보시오.'], [tag('Poetry 45 to win', '시작 45면 이긴다'), tag('Reputation', '평판')],
        [L('narr', 'Brushes are set down. The host refills your cup himself.', '사람들이 붓을 내려놓았다. 주인이 손수 당신 잔을 채웠다.', { minSkill: { id: 'poetry', min: 45 } }), L('narr', 'A decent verse, politely received. His was better.', '무난한 시였고 사람들은 점잖게 들었다. 그의 것이 더 나았다.', { not: { minSkill: { id: 'poetry', min: 45 } } })],
        [skill('poetry', 2), stat('reputation', 4, { minSkill: { id: 'poetry', min: 45 } }), happy(6, 'proud', { minSkill: { id: 'poetry', min: 45 } }), happy(-2, undefined, { not: { minSkill: { id: 'poetry', min: 45 } } })]),
      choice('praise', ['Praise his verse and drink to it.', '그의 시를 칭찬하고 잔을 든다.'], ['I have nothing to add to that moon.', '그 달에 더 보탤 말이 없소.'], [tag('Honour', '명예'), tag('A friend, perhaps', '어쩌면 벗 하나')],
        [L('narr', 'He looks surprised, then pleased. You talk until the wine is gone.', '그가 놀랐다가 이내 기뻐한다. 술이 떨어질 때까지 이야기를 나눴다.')], [honour(2), happy(4), attr('empathy', 1)]),
      choice('zither', ['Ask for the zither instead.', '시 대신 거문고를 청한다.'], ['Poems enough. Let the strings speak.', '시는 넉넉하니 줄이 말하게 합시다.'], [tag('Zither 30', '거문고 30 필요')],
        [L('narr', 'The party goes quiet, in the good way.', '자리가 조용해졌다. 좋은 쪽으로.')], [skill('music', 2), stat('reputation', 3), happy(5)], { when: { minSkill: { id: 'music', min: 30 } } }),
    ],
  },
  {
    id: 'v6-stray-dog', title: T('Something at the kitchen door', '부엌문 앞의 손님'), delivery: 'season', place: 'residence', time: 'day', cast: 'narr',
    when: { minAge: 8, pet: false, flags: { 'v6-stray': false }, minDay: 120 },
    lines: [L('narr', 'A shaggy half-grown dog has slept by the kitchen door three nights running. The cook has been feeding it and denies everything.', '털북숭이 강아지가 사흘째 부엌문 앞에서 잤다. 찬모가 먹이를 주고는 시치미를 뗀다.')],
    prompt: L('narr', 'What happens to the dog?', '강아지를 어찌할 것인가?'),
    choices: [
      choice('keep', ['Keep it.', '기른다.'], ['It has chosen the house. Give it a name.', '제 발로 온 식구다. 이름을 지어 주자.'], [tag('A companion', '벗 삼을 짐승'), tag('Happiness', '행복')],
        [L('narr', 'It follows you to the gate every morning from then on.', '그날부터 아침마다 대문까지 당신을 따라 나온다.')], [{ kind: 'flag', flag: 'v6-stray', v: true }, { kind: 'pet', pet: 'sapsali' }]),
      choice('village', ['Find it a home in the village.', '마을에 맡길 집을 찾아 준다.'], ['The miller wants a watchdog.', '방앗간 집에서 집 지킬 개를 찾더구나.'], [tag('Kind', '인정')],
        [L('narr', 'The miller’s children are delighted.', '방앗간 아이들이 뛸 듯이 기뻐했다.')], [{ kind: 'flag', flag: 'v6-stray', v: true }, happy(2), attr('empathy', 1)]),
    ],
  },
  {
    id: 'v6-lantern-night', title: T('The night of lanterns', '연등 밝힌 밤'), delivery: 'season', place: 'market', time: 'night', cast: 'narr',
    when: { minAge: 15, season: 1, mourning: false, flags: { 'v6-lanterns': false } },
    lines: [L('narr', 'The eighth of the fourth moon. Every stall on Unjongga has hung lanterns: lotus, carp, turtle, a tiger with a candle for a heart. The whole city is out walking.', '사월 초파일. 운종가 좌판마다 연등이 걸렸다. 연꽃등, 잉어등, 거북등, 가슴에 촛불을 품은 호랑이등. 온 도성이 거리로 나왔다.')],
    prompt: L('narr', 'How do you spend the night?', '이 밤을 어떻게 보내겠는가?'),
    choices: [
      choice('walk', ['Walk the whole street, end to end.', '거리 끝에서 끝까지 걷는다.'], ['One of each sweet. No, two.', '엿은 종류마다 하나씩. 아니, 둘씩.'], [tag('−3 nyang', '−3냥'), tag('Happiness', '행복')],
        [L('narr', 'You come home late with sticky fingers and a paper carp.', '끈적한 손가락과 종이 잉어를 들고 늦게 돌아왔다.')], [{ kind: 'flag', flag: 'v6-lanterns', v: true }, money(-3), happy(7, 'happy'), stress(-6)]),
      choice('paint', ['Sit and paint the lanterns.', '앉아서 연등을 그린다.'], ['Hold the light still a moment.', '불빛을 잠깐만 그대로 두시오.'], [tag('Ink painting', '서화')],
        [L('narr', 'A crowd gathers behind your shoulder. Someone offers to buy the sketch.', '어깨 너머로 사람들이 모여들었다. 누군가 그 그림을 사겠다고 한다.')], [{ kind: 'flag', flag: 'v6-lanterns', v: true }, skill('painting', 3), happy(4), money(4)]),
      choice('wish', ['Hang a lantern with a wish.', '소원을 적어 등을 단다.'], ['For the health of the house.', '집안의 평안을 빕니다.'], [tag('−2 nyang', '−2냥'), tag('Calm', '평온')],
        [L('narr', 'Yours is one light among thousands, which is rather the point.', '당신의 등은 수천 개 가운데 하나다. 그것이 바로 이 밤의 뜻이다.')], [{ kind: 'flag', flag: 'v6-lanterns', v: true }, money(-2), practice('lantern'), stress(-8), happy(3)]),
    ],
  },
  // ------------------------------------------------------------ diplomacy and the frontier (Parts XI–XII)
  {
    id: 'v6-interpreter', title: T('The interpreter is ill', '역관이 앓아눕다'), delivery: 'season', place: 'offices', time: 'day', cast: 'royal-secretary',
    when: { office: true, minAge: 20, minSkill: { id: 'language', min: 25 }, flags: { 'v6-interp': false } },
    lines: [
      L('royal-secretary', 'The envoys are at the gate and the interpreter has a fever. They tell me you have some of the language.', '사신이 문 앞에 왔는데 역관이 열병이오. 그대가 한어를 좀 한다고 들었소.'),
      L('narr', 'Some. Enough to be dangerous.', '조금 한다. 딱 위험할 만큼.'),
    ],
    prompt: L('narr', 'Do you step in? (Fictional story)', '나서겠는가? (허구의 이야기)'),
    choices: [
      choice('step', ['Step in and interpret.', '나서서 통역한다.'], ['Slowly, if you please, honoured envoy.', '사신께서는 천천히 말씀해 주십시오.'], [tag('Spoken Chinese 50 to shine', '한어 50이면 빛난다'), tag('Favour', '총애')],
        [L('narr', 'You miss one idiom and catch a mistake in the written list of gifts. The second matters more.', '관용구 하나를 놓쳤지만 예물 목록의 잘못 하나를 잡아냈다. 뒤의 것이 더 중요했다.', { minSkill: { id: 'language', min: 50 } }), L('narr', 'You get through it, red to the ears, with much pointing.', '귀까지 빨개져 손짓을 섞어 가며 어떻게든 해냈다.', { not: { minSkill: { id: 'language', min: 50 } } })],
        [{ kind: 'flag', flag: 'v6-interp', v: true }, skill('language', 3), stat('favour', 5, { minSkill: { id: 'language', min: 50 } }), stat('reputation', 3, { minSkill: { id: 'language', min: 50 } }), stat('favour', 1, { not: { minSkill: { id: 'language', min: 50 } } }), attr('diplomacy', 1)]),
      choice('decline', ['Say your Chinese is for books only.', '글로만 아는 한어라고 사양한다.'], ['I would shame the court. Send to the Translation Office.', '조정에 누가 될 것입니다. 사역원에 사람을 보내십시오.'], [tag('Safe', '안전')],
        [L('narr', 'The envoys wait an hour for a junior interpreter.', '사신들은 어린 역관이 올 때까지 한 시간을 기다렸다.')], [{ kind: 'flag', flag: 'v6-interp', v: true }]),
    ],
  },
  {
    id: 'v6-night-patrol', title: T('Fires across the river', '강 건너의 불빛'), delivery: 'season', place: 'offices', time: 'night', cast: 'narr',
    when: { track: 'military', office: true, minAge: 20, flags: { 'v6-patrol': false } },
    lines: [
      L('narr', 'A rider from the border: camp fires on the far bank, more each night. The garrison commander asks the capital what it wishes him to see.', '변방에서 온 파발. 강 건너에 모닥불이 밤마다 늘어난다. 진장이 도성에 묻는다. 무엇을 보았다고 하면 좋겠느냐고.'),
      L('narr', 'The report has come to your desk.', '보고가 당신 책상에 올라왔다.'),
    ],
    prompt: L('narr', 'What do you order? (Fictional story)', '무엇을 명하겠는가? (허구의 이야기)'),
    choices: [
      choice('scouts', ['Send scouts across by night.', '밤에 척후를 건너보낸다.'], ['Three men who know the ford. Count the horses, not the fires.', '여울을 아는 자 셋. 불이 아니라 말을 세어 오라.'], [tag('Strategy', '전략'), tag('Military learning', '무학')],
        [L('narr', 'They come back with a number, and the number is smaller than the fires. Someone over there wants to be seen.', '그들이 숫자를 세어 돌아왔다. 숫자는 불빛보다 적었다. 저쪽의 누군가는 보이고 싶어 한다.')], [{ kind: 'flag', flag: 'v6-patrol', v: true }, attr('strategy', 2), { kind: 'edu', field: 'military', d: 4 }, stat('favour', 2), { kind: 'service', d: 4 }]),
      choice('drill', ['Double the watch and drill the garrison.', '파수를 배로 늘리고 군사를 조련한다.'], ['Let them hear our drums every dawn.', '새벽마다 우리 북소리를 들려주어라.'], [tag('Leadership', '통솔력'), tag('Safe', '안전')],
        [L('narr', 'The fires thin out within the month.', '한 달 안에 불빛이 줄었다.')], [{ kind: 'flag', flag: 'v6-patrol', v: true }, attr('leadership', 1), { kind: 'service', d: 5 }]),
      choice('report', ['Report it upward and wait for orders.', '위에 보고하고 명을 기다린다.'], ['Copy this to the Board of War.', '병조에 그대로 올려라.'], [tag('Nothing ventured', '무리하지 않는다')],
        [L('narr', 'The reply comes in six weeks and says to remain vigilant.', '여섯 주 뒤에 답이 왔다. 경계를 늦추지 말라고.')], [{ kind: 'flag', flag: 'v6-patrol', v: true }, { kind: 'service', d: 1 }]),
    ],
  },
  {
    id: 'v6-archery-day', title: T('The village archery meet', '향사례'), delivery: 'season', place: 'residence', time: 'day', cast: 'narr', yearly: true,
    when: { gender: 'man', minAge: 16, season: 0, minSkill: { id: 'archery', min: 15 }, mourning: false },
    lines: [L('narr', 'The district’s spring archery rite: bows, wine, and old men who remember exactly how well your father shot.', '고을의 봄 향사례. 활과 술, 그리고 당신 아버지가 얼마나 잘 쏘았는지 정확히 기억하는 노인들.')],
    prompt: L('narr', 'How do you shoot?', '어떻게 쏘겠는가?'),
    choices: [
      choice('steady', ['Shoot steadily, by the form.', '법도대로 차분히 쏜다.'], ['Breathe out. Loose.', '숨을 내쉬고, 놓는다.'], [tag('Archery', '궁술')],
        [L('narr', 'Three of five in the black. The old men nod, which from them is a speech.', '다섯 발에 세 발이 관중. 노인들이 고개를 끄덕였다. 그들로서는 긴 칭찬이다.')], [skill('archery', 3), stat('reputation', 1), happy(3)]),
      choice('show', ['Shoot fast, to impress.', '보란 듯이 빠르게 쏜다.'], ['Five arrows before the cup is empty.', '잔이 비기 전에 다섯 발.'], [tag('Archery 50 to carry it off', '궁술 50이면 해낸다')],
        [L('narr', 'Five in the black. Someone’s daughter, behind a screen, is heard to ask your name.', '다섯 발 모두 관중. 병풍 뒤에서 어느 집 따님이 당신 이름을 묻는 소리가 들렸다.', { minSkill: { id: 'archery', min: 50 } }), L('narr', 'One in the black and one in the miller’s roof.', '한 발은 과녁에, 한 발은 방앗간 지붕에.', { not: { minSkill: { id: 'archery', min: 50 } } })],
        [skill('archery', 2), stat('reputation', 4, { minSkill: { id: 'archery', min: 50 } }), happy(5, 'proud', { minSkill: { id: 'archery', min: 50 } }), stat('reputation', -1, { not: { minSkill: { id: 'archery', min: 50 } } })]),
    ],
  },
];
// Kept so the helpers above stay available to future scenes.
export const _helpers = { rec };
