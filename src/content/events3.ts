import type { Condition, Effect, GameEvent, Line } from '../model/content';
import type { Text } from '../model/schemas';
import { T } from '../engine/text';

/*
 * v0.3 story events for the GSDD systems: coming of age, the lesser examination, the royal selection,
 * the naming of an heir, regency, a monarch's court, bribes, embassies, war, festivals, childhood,
 * downfall and the long road back. English with a Korean working draft for review.
 */

const L = (who: string, en: string, ko: string, when?: Condition): Line => ({ who, text: T(en, ko), ...(when ? { when } : {}) });
const note = (en: string, ko: string, when?: Condition): Effect => ({ kind: 'note', text: T(en, ko), ...(when ? { when } : {}) });
const rec = (en: string, ko: string, when?: Condition): Effect => ({ kind: 'record', text: T(en, ko), ...(when ? { when } : {}) });
const stat = (s: 'health' | 'reputation' | 'favour' | 'prestige', d: number, when?: Condition): Effect => ({ kind: 'stat', stat: s, d, ...(when ? { when } : {}) });
const edu = (field: string, d: number, when?: Condition): Effect => ({ kind: 'edu', field, d, ...(when ? { when } : {}) });
const attr = (a: string, d: number, when?: Condition): Effect => ({ kind: 'attr', a, d, ...(when ? { when } : {}) });
const honour = (d: number, when?: Condition): Effect => ({ kind: 'honour', d, ...(when ? { when } : {}) });
const flag = (f: string, v = true): Effect => ({ kind: 'flag', flag: f, v });
const money = (d: number, when?: Condition): Effect => ({ kind: 'money', d, ...(when ? { when } : {}) });
const reg = (npc: string, d: number, when?: Condition): Effect => ({ kind: 'regard', npc, d, ...(when ? { when } : {}) });
const st = (key: 'authority' | 'stability' | 'loyalty' | 'cooperation' | 'treasury', d: number): Effect => ({ kind: 'state', key, d });
const tag = (en: string, ko: string): Text => T(en, ko);
type C = GameEvent['choices'][number];
const choice = (id: string, label: [string, string], say: [string, string], tags: Text[], reaction: Line[], effects: Effect[], more: Partial<C> = {}): C => ({
  id, label: T(label[0], label[1]), say: T(say[0], say[1]), tags, reaction, effects, ...more,
});

export const MORE_EVENTS: GameEvent[] = [
  // ------------------------------------------------------------------ childhood
  {
    id: 'child-fever', title: T('A fever in the night', '밤중의 열병'), delivery: 'season', place: 'residence', time: 'night', cast: 'mother', child: true,
    when: { maxAge: 12, alive: ['mother'] },
    lines: [
      L('narr', 'You wake burning and shivering at once. The lamp is lit; someone is already wringing out a cloth.', '몸이 불덩이 같은데 이가 덜덜 떨린다. 등잔불이 켜지고, 누군가 벌써 수건을 짜고 있다.'),
      L('mother', 'Hush. Drink this. Your grandmother swore by it, and she lived to eighty.', '쉿. 이걸 마시렴. 할머니께서 이 약이면 된다 하셨지. 여든까지 사셨단다.'),
    ],
    prompt: L('narr', 'What do you remember of that night, years later?', '훗날 그 밤의 무엇을 기억하는가?'),
    choices: [
      choice('mother', ['Your mother’s hand on your forehead until dawn.', '새벽까지 이마에 얹혀 있던 어머니의 손.'], ['(You hold on to her sleeve.)', '(어머니의 소매를 꼭 잡는다.)'], [tag('Mother’s regard', '어머니의 정'), tag('Empathy', '공감력')],
        [L('mother', 'There. The fever is breaking. Sleep now.', '그래, 열이 내리는구나. 이제 자거라.')], [reg('mother', 8), attr('empathy', 2), stat('health', -3)]),
      choice('physician', ['The physician’s needles, and not crying.', '의원의 침, 그리고 울지 않았던 일.'], ['(You bite your lip and do not cry.)', '(입술을 깨물고 울지 않는다.)'], [tag('Courage', '용기'), tag('Health', '건강')],
        [L('narr', 'The physician nods at your mother: a brave one.', '의원이 어머니에게 고개를 끄덕인다. 용감한 아이로군요.')], [attr('courage', 2), stat('health', 2)]),
    ],
  },
  {
    id: 'child-friend', title: T('A friend over the wall', '담 너머의 동무'), delivery: 'season', place: 'residence', time: 'day', cast: 'narr', child: true,
    when: { minAge: 7, maxAge: 13 },
    lines: [
      L('narr', 'A paper kite comes down in your courtyard. A moment later a face appears over the wall: the neighbour’s child, wanting it back.', '종이연 하나가 마당에 떨어진다. 곧 담 너머로 얼굴 하나가 쑥 나온다. 옆집 아이가 연을 돌려 달란다.'),
    ],
    prompt: L('narr', 'What do you do?', '어떻게 하겠는가?'),
    choices: [
      choice('share', ['Climb up and fly it together.', '담에 올라 같이 날리자.'], ['Hold the string. I’ll run.', '줄을 잡아. 내가 뛸게.'], [tag('Charisma', '매력'), tag('Agility', '민첩성')],
        [L('narr', 'The steward finds you both on the roof of the woodshed, and says nothing to your father.', '청지기가 장작광 지붕 위의 두 아이를 발견하지만, 아버지께는 아무 말도 하지 않는다.')], [attr('charisma', 2), attr('agility', 1), rec('Made a friend over the garden wall.', '담 너머 동무를 사귀었다.')]),
      choice('proper', ['Hand it back properly, with a bow.', '예를 갖추어 돌려주자.'], ['Your kite. Please take care of it.', '네 연이야. 잘 간수하렴.'], [tag('Etiquette', '예법')],
        [L('narr', 'The child stares at you as if you were a small magistrate.', '아이는 당신을 꼬마 원님처럼 쳐다본다.')], [attr('etiquette', 2)]),
    ],
  },
  {
    id: 'coming-of-age', title: T('Coming of age', '관례'), delivery: 'season', place: 'residence', time: 'day', cast: 'father',
    when: { minAge: 15, maxAge: 17, flags: { 'started-child': true, 'came-of-age': false } },
    lines: [
      L('narr', 'The family gathers in the main hall. An elder of the clan ties up your hair and sets the cap on your head, as his father once did for him.', '온 집안이 대청에 모였다. 문중 어른이 당신의 머리를 올리고 갓을 씌워 준다. 그분의 아버지가 그분께 그랬듯이.', { gender: 'man' }),
      L('narr', 'The women of the family gather in the inner quarters. Your mother pins up your hair with a jade binyeo, the way her mother did for her.', '집안 여인들이 안채에 모였다. 어머니가 옥비녀로 당신의 머리를 쪽 지어 준다. 외할머니가 어머니께 그랬듯이.', { gender: 'woman' }),
      L('father', 'From today you are counted among the grown. Choose the road you mean to walk.', '오늘부터 너는 어른이다. 어느 길을 걸을지 정하거라.', { alive: ['father'] }),
    ],
    prompt: L('narr', 'What road will you take?', '어느 길을 가겠는가?'),
    choices: [
      choice('scholar', ['The classics, and the examinations.', '경서와 과거의 길.'], ['I will sit the examinations and serve at court.', '과거를 보아 조정에 나가겠습니다.'], [tag('Classics', '경학'), tag('Scholarship', '학식')],
        [L('narr', 'Your father’s library is yours from today.', '오늘부터 아버지의 서재가 당신의 것이다.')], [edu('classics', 6), attr('scholarship', 2), flag('came-of-age'), rec('Came of age and turned to the classics.', '관례를 치르고 학문의 길을 택했다.')]),
      choice('soldier', ['The bow and the horse.', '활과 말의 길.'], ['I would rather command men than copy texts.', '글을 베끼느니 군사를 이끌겠습니다.'], [tag('Military arts', '병학'), tag('Martial ability', '무예')],
        [L('narr', 'A good bow arrives from your uncle in the north.', '북방의 숙부가 좋은 활을 보내왔다.')], [edu('military', 6), attr('martial', 3), flag('came-of-age'), rec('Came of age and took up the bow.', '관례를 치르고 무예의 길을 택했다.')]),
      choice('house', ['The keys of the house, and its accounts.', '집안 살림과 장부.'], ['Someone must keep this family standing.', '누군가는 이 집안을 지탱해야지요.'], [tag('Household', '살림'), tag('Administration', '행정력')],
        [L('steward', 'Then I had better show you where the real ledgers are kept.', '그럼 진짜 장부가 어디 있는지부터 보여 드려야겠군요.')], [edu('practical', 6), attr('administration', 2), flag('came-of-age'), rec('Came of age and took up the household’s affairs.', '관례를 치르고 집안 살림을 익혔다.')]),
      choice('court', ['The court, and its people.', '조정과 그 사람들.'], ['Teach me how the court really works.', '조정이 실제로 어떻게 돌아가는지 가르쳐 주십시오.'], [tag('Etiquette', '예법'), tag('Favour', '총애')],
        [L('narr', 'Within a month you have been presented at the palace.', '한 달 만에 궁궐에 인사를 드렸다.')], [attr('etiquette', 3), attr('persuasion', 2), stat('favour', 3), flag('came-of-age'), rec('Came of age and was presented at court.', '관례를 치르고 궁궐에 인사를 드렸다.')]),
    ],
  },
  // ------------------------------------------------------------------ education
  {
    id: 'lesser-exam', title: T('The lesser examination', '소과'), delivery: 'season', place: 'academy', time: 'day', cast: 'narr',
    when: { season: 0, examYear: true, canExam: true, noQual: 'sogwa', minAge: 15, maxAge: 45 },
    lines: [
      L('narr', 'The lesser examination for the licentiate degree. Pass, and the gates of the National Academy open to you.', '생원·진사시가 열렸다. 붙으면 성균관의 문이 열린다.'),
      L('narr', 'Candidates crowd the yard with mats, brushes and lunch boxes; some have sat this every three years since before you were born.', '수험생들이 돗자리와 붓과 도시락을 들고 마당을 메운다. 당신이 태어나기 전부터 세 해마다 이 시험을 본 이들도 있다.'),
    ],
    prompt: L('narr', 'Will you sit it?', '응시하겠는가?'),
    choices: [
      choice('sit', ['Sit the examination.', '시험을 보자.'], ['(You unroll your mat.)', '(돗자리를 편다.)'], [tag('Needs classics 25', '경학 25 필요'), tag('Licentiate', '생원')],
        [L('narr', 'The list is posted at the Academy gate three days later.', '사흘 뒤 성균관 문에 방이 붙는다.')],
        [
          { kind: 'qual', id: 'sogwa', when: { minEdu: { field: 'classics', min: 25 } } },
          stat('reputation', 3, { minEdu: { field: 'classics', min: 25 } }),
          rec('Passed the lesser examination.', '소과에 합격했다.', { minEdu: { field: 'classics', min: 25 } }),
          note('Your name is not on the list. More study, and three years’ patience.', '방에 이름이 없다. 더 공부하고, 세 해를 기다려야 한다.', { not: { minEdu: { field: 'classics', min: 25 } } }),
          edu('classics', 2),
        ]),
      choice('wait', ['Not yet. Study another three years.', '아직이다. 세 해 더 공부하자.'], ['Next time.', '다음에.'], [tag('Classics', '경학')],
        [L('narr', 'You spend the examination day in the library instead.', '시험 날을 서재에서 보낸다.')], [edu('classics', 3)]),
    ],
  },
  // ------------------------------------------------------------------ the royal household
  {
    id: 'royal-selection', title: T('The royal selection', '간택'), delivery: 'season', place: 'queens-hall', time: 'day', cast: 'queen-dowager',
    when: { gender: 'woman', selection: true, minAge: 15, maxAge: 20, married: false, legal: ['yangban'] },
    lines: [
      L('narr', 'A royal order has gone out: unmarried daughters of good family are to be presented. The crown prince is to take a wife.', '간택령이 내렸다. 혼인하지 않은 양가의 딸들은 단자를 올리라 한다. 세자 저하께서 배필을 맞으신다.'),
      L('narr', 'In the third round, only three remain. You are one of them.', '삼간택에 이르러 셋이 남았다. 당신이 그중 하나다.'),
      L('queen-dowager', 'Sit. Tell me, child: what is the first duty of a crown princess?', '앉거라. 말해 보거라. 세자빈의 첫째 도리가 무엇이냐?'),
    ],
    prompt: L('narr', 'How do you answer the Queen Dowager?', '대비마마께 어떻게 답하겠는가?'),
    choices: [
      choice('modest', ['“To serve the elders of the palace and keep its peace.”', '“웃어른을 섬기고 궁의 평화를 지키는 것입니다.”'], ['To serve the elders of the palace and keep its peace.', '웃어른을 섬기고 궁의 화평을 지키는 것이옵니다.'], [tag('Needs grace 52', '품위 52 필요'), tag('Crown Princess', '세자빈')],
        [L('queen-dowager', 'A careful answer. Careful is what this palace needs.', '조심스러운 대답이구나. 이 궁에 필요한 것이 조심이지.')],
        [{ kind: 'royal', role: 'crownPrincess', when: { quality: { q: 'grace', min: 52 } } },
          note('The order names another girl. You go home with a bolt of silk and a story.', '간택은 다른 규수에게 돌아갔다. 비단 한 필과 이야깃거리를 안고 집으로 돌아온다.', { not: { quality: { q: 'grace', min: 52 } } }),
          stat('reputation', 3)]),
      choice('heir', ['“To give the dynasty an heir.”', '“종사를 이을 후사를 보는 것입니다.”'], ['To give the dynasty an heir.', '종사를 이을 원손을 낳는 것이옵니다.'], [tag('Needs resolve 55', '결단력 55 필요'), tag('Crown Princess', '세자빈')],
        [L('queen-dowager', 'Blunt. The ministers will not like you. I might.', '거침없구나. 대신들은 너를 싫어하겠다. 나는 좋을지도 모르겠다만.')],
        [{ kind: 'royal', role: 'crownPrincess', when: { quality: { q: 'resolve', min: 55 } } },
          note('The order names another girl. The Queen Dowager remembers you, though.', '간택은 다른 규수에게 돌아갔다. 그래도 대비마마는 당신을 기억하신다.', { not: { quality: { q: 'resolve', min: 55 } } }),
          reg('queen-dowager', 8)]),
      choice('withdraw', ['Answer poorly on purpose.', '일부러 서투르게 답하자.'], ['I… I do not know, Your Majesty.', '저… 모르겠사옵니다, 마마.'], [tag('Stay free', '자유로운 몸'), tag('Honour', '명예')],
        [L('queen-dowager', 'Hm. Go home, then.', '흠. 그럼 집으로 가거라.')], [note('You are sent home. Your mother is torn between relief and fury.', '집으로 돌려보내졌다. 어머니는 안도와 분노 사이에서 갈팡질팡하신다.'), honour(-2)]),
    ],
  },
  {
    id: 'heir-designation', title: T('Heir to the throne', '세자 책봉'), delivery: 'season', place: 'throne-hall', time: 'day', cast: 'king',
    when: { heirEligible: true, heirSeat: true, minLegitimacy: 55, minFavour: 55, legal: ['royal'] },
    lines: [
      L('narr', 'The throne has no heir, and the ministers have spoken of nothing else for a year. Today the king summons you.', '보위를 이을 세자가 없어 대신들이 한 해 내내 그 이야기뿐이었다. 오늘 전하께서 당신을 부르셨다.'),
      L('king', 'You have my blood and, they tell me, a head on your shoulders. I mean to name you heir. Do you accept?', '너는 내 핏줄이고, 듣자 하니 생각도 바르다 하더구나. 너를 세자로 삼으려 한다. 받겠느냐?'),
    ],
    prompt: L('narr', 'What do you say?', '무엇이라 답하겠는가?'),
    choices: [
      choice('humble', ['Accept, humbly.', '삼가 받들겠습니다.'], ['I am unworthy, but I will not refuse Your Majesty.', '부족한 몸이오나 전하의 뜻을 거스르지 않겠사옵니다.'], [tag('Crown Prince', '왕세자'), tag('Honour', '명예')],
        [L('king', 'Good. Then learn quickly. I am not as young as I look.', '좋다. 그럼 빨리 배우거라. 나는 보기보다 늙었다.')], [{ kind: 'royal', role: 'crownPrince' }, honour(3)]),
      choice('allies', ['Accept, and thank those who spoke for you.', '받들고, 천거한 이들에게 보답하자.'], ['I will remember everyone who stood by me.', '저를 지지해 준 모든 이를 기억하겠사옵니다.'], [tag('Crown Prince', '왕세자'), tag('Faction', '당파')],
        [L('narr', 'Your allies hear it. So do your enemies.', '당신의 편이 그 말을 들었다. 적들도 들었다.')], [{ kind: 'royal', role: 'crownPrince' }, { kind: 'standing', d: 10 }, { kind: 'influence', side: 'mine', d: 5 }]),
      choice('decline', ['Decline in favour of an elder kinsman.', '연장자 종친에게 양보하자.'], ['There are others with a better claim. I would serve them.', '저보다 나은 분들이 계십니다. 저는 그분들을 섬기겠사옵니다.'], [tag('Honour +10', '명예 +10'), tag('Legitimacy −10', '정통성 −10')],
        [L('king', 'Modesty or cowardice? We will see.', '겸손이냐 비겁이냐. 두고 보자.')], [honour(10), { kind: 'legitimacy', d: -10 }, stat('favour', 4)]),
    ],
  },
  {
    id: 'regency', title: T('Behind the bamboo screen', '수렴청정'), delivery: 'season', place: 'throne-hall', time: 'day', cast: 'chief-councillor',
    when: { royal: ['queenDowager'], flags: { 'regency-offer': true } },
    lines: [
      L('narr', 'The new king is a boy. By custom, the senior lady of the royal house may govern for him from behind a screen until he comes of age.', '새 임금은 어린아이다. 관례에 따라 왕실의 웃어른이 장성할 때까지 발을 드리우고 대신 다스릴 수 있다.'),
      L('chief-councillor', 'The court awaits your decision, Your Majesty. Some of us hope you will. Some of us hope you will not.', '조정이 마마의 결정을 기다리옵니다. 그리하시길 바라는 자도, 그러지 않으시길 바라는 자도 있사옵니다.'),
    ],
    prompt: L('narr', 'Will you rule as regent?', '섭정을 하겠는가?'),
    choices: [
      choice('rule', ['Lower the screen. Govern for him.', '발을 드리우고 대신 다스리자.'], ['Bring the seals.', '국새를 가져오라.'], [tag('Regent', '섭정'), tag('Royal authority', '왕권')],
        [L('narr', 'A bamboo screen is hung behind the young king’s throne. Your voice comes through it.', '어린 임금의 옥좌 뒤에 발이 드리워진다. 그 너머에서 당신의 목소리가 흘러나온다.')], [{ kind: 'royal', role: 'regent' }]),
      choice('decline', ['Let the ministers govern.', '대신들에게 맡기자.'], ['I will guide the boy, not the kingdom.', '나는 아이를 이끌 뿐, 나라는 대신들이 이끌 것이오.'], [tag('Honour', '명예')],
        [L('chief-councillor', 'Your Majesty is wise.', '마마께서는 현명하시옵니다.')], [flag('regency-offer', false), honour(5)]),
    ],
  },
  {
    id: 'first-audience', title: T('The first audience of the reign', '즉위 후 첫 조회'), delivery: 'season', place: 'throne-hall', time: 'day', cast: 'chief-councillor', monarch: true,
    when: { flags: { 'reign-opened': false } },
    lines: [
      L('narr', 'The ministers kneel in their ranks in the courtyard, the civil officials to the east and the military to the west.', '대신들이 마당에 품계대로 엎드렸다. 동쪽에 문반, 서쪽에 무반.'),
      L('chief-councillor', 'Every reign begins with a word. The kingdom waits to hear yours.', '모든 치세는 한마디로 시작하옵니다. 나라가 전하의 말씀을 기다리옵니다.'),
    ],
    prompt: L('narr', 'What will your reign stand for?', '어떤 치세를 열겠는가?'),
    choices: [
      choice('balance', ['Harmony: men of talent from every faction.', '탕평: 당파를 가리지 않고 인재를 쓰겠다.'], ['I will not rule half a court.', '나는 반쪽 조정을 다스리지 않겠다.'], [tag('Cooperation', '조정 협조')],
        [L('narr', 'Both sides bow. Neither believes it yet.', '양쪽 모두 절한다. 아직 어느 쪽도 믿지 않는다.')], [st('cooperation', 8), flag('reign-opened')]),
      choice('firm', ['Order: the throne decides, not the factions.', '기강: 결정은 당파가 아니라 왕이 한다.'], ['Let no one mistake whose court this is.', '이 조정이 누구의 것인지 아무도 착각하지 마라.'], [tag('Royal authority', '왕권')],
        [L('narr', 'A long silence. Then, all together, “We obey.”', '긴 침묵. 그리고 일제히, “성은이 망극하옵니다.”')], [st('authority', 8), flag('reign-opened')]),
      choice('mercy', ['Mercy: an amnesty and lighter taxes this year.', '은혜: 대사면과 올해 세금 감면.'], ['Let the kingdom feel the change of reign.', '백성이 새 치세를 느끼게 하라.'], [tag('Stability', '민심')],
        [L('narr', 'The prisons open and the villages cheer.', '옥문이 열리고 마을마다 환호한다.')], [st('stability', 8), st('treasury', -500), flag('reign-opened')]),
    ],
  },
  {
    id: 'faction-demand', title: T('A demand from the court', '대간의 상소'), delivery: 'season', place: 'throne-hall', time: 'day', cast: 'royal-secretary', monarch: true, yearly: true,
    when: { season: 2 },
    lines: [
      L('royal-secretary', 'A joint memorial, Your Majesty. The censors demand the dismissal of a minister of the other faction. They will not stop until you answer.', '연명 상소이옵니다, 전하. 대간들이 상대 당파의 판서를 파직하라 하옵니다. 답을 내리실 때까지 그치지 않을 것이옵니다.'),
    ],
    prompt: L('narr', 'How do you answer?', '어떻게 답하겠는가?'),
    choices: [
      choice('grant', ['Grant it. Dismiss him.', '들어주자. 파직하라.'], ['So be it.', '그리하라.'], [tag('Cooperation +5', '협조 +5'), tag('Authority −3', '왕권 −3')],
        [L('narr', 'The censors withdraw, pleased. Their rivals do not forget.', '대간들은 흡족해 물러난다. 상대 당파는 잊지 않는다.')], [st('cooperation', 5), st('authority', -3), { kind: 'influence', side: 'A', d: 4 }]),
      choice('refuse', ['Refuse. The throne will not be pushed.', '거절하자. 왕은 떠밀리지 않는다.'], ['I have heard you. The answer is no.', '들었다. 답은 불가다.'], [tag('Authority +3', '왕권 +3'), tag('Cooperation −6', '협조 −6')],
        [L('narr', 'The censors kneel outside the gate for three days.', '대간들이 사흘 동안 대궐 문밖에 엎드려 있다.')], [st('authority', 3), st('cooperation', -6)]),
      choice('middle', ['Transfer him to a provincial post instead.', '대신 외직으로 돌리자.'], ['He will serve the kingdom from Gyeongsang.', '그는 경상도에서 나라를 섬길 것이다.'], [tag('Cooperation +2', '협조 +2')],
        [L('narr', 'No one is happy. That is often the sign of a fair decision.', '아무도 만족하지 않는다. 대개 그것이 공정한 결정의 표시다.')], [st('cooperation', 2)]),
    ],
  },
  {
    id: 'war-council', title: T('A council of war', '어전 군사 회의'), delivery: 'season', place: 'throne-hall', time: 'day', cast: 'chief-councillor', monarch: true, yearly: true,
    when: { war: true },
    lines: [
      L('narr', 'Riders from the border, mud to the knees. The enemy is moving.', '변경에서 온 파발이 무릎까지 진흙투성이다. 적이 움직인다.'),
      L('chief-councillor', 'The generals ask for silver and men. The treasury asks for mercy.', '장수들은 은과 군사를 청하고, 국고는 자비를 청하옵니다.'),
    ],
    prompt: L('narr', 'What do you order?', '무엇을 명하겠는가?'),
    choices: [
      choice('fund', ['Fund the army in full.', '군비를 아낌없이 대라.'], ['Whatever it costs.', '얼마가 들든.'], [tag('Military loyalty +10', '군심 +10'), tag('Treasury −800', '국고 −800')],
        [L('narr', 'The army marches with full bellies.', '군사들이 배불리 먹고 행군한다.')], [st('loyalty', 10), st('treasury', -800), st('stability', 2)]),
      choice('talk', ['Send envoys to negotiate.', '사신을 보내 협상하라.'], ['A war not fought is a war won.', '싸우지 않는 전쟁이 이긴 전쟁이다.'], [tag('Stability', '민심'), tag('Military loyalty −4', '군심 −4')],
        [L('narr', 'The generals call it weakness. The farmers call it wisdom.', '장수들은 나약하다 하고, 농부들은 현명하다 한다.')], [st('stability', 4), st('loyalty', -4)]),
      choice('hold', ['Hold the fortresses and wait.', '성을 지키며 기다리라.'], ['Let them break their teeth on our walls.', '우리 성벽에 이를 부러뜨리게 하라.'], [tag('Treasury −300', '국고 −300')],
        [L('narr', 'The walls hold. For now.', '성벽은 버틴다. 지금은.')], [st('treasury', -300), st('loyalty', 2)]),
    ],
  },
  // ------------------------------------------------------------------ office, intrigue and war
  {
    id: 'bribe', title: T('A gift with a request', '청탁과 선물'), delivery: 'evening', place: 'residence', time: 'night', cast: 'steward',
    when: { office: true, legal: ['yangban', 'royal'], minDay: 120 },
    lines: [
      L('steward', 'A man came while you were out. He left this box, and a name: his nephew wants a clerkship in your office.', '나리 안 계실 때 웬 사람이 왔다 갔습니다. 이 함과 이름 하나를 두고 갔지요. 조카를 나리 관아의 서리로 넣어 달랍니다.'),
      L('narr', 'The box is heavy. Silver, eighty nyang at least.', '함이 묵직하다. 은자로 적어도 여든 냥은 된다.'),
    ],
    prompt: L('narr', 'What will you do with it?', '어찌하겠는가?'),
    choices: [
      choice('take', ['Keep it, and see to the nephew.', '받아 두고 조카를 챙겨 주자.'], ['Everyone does it.', '다들 이렇게 하지.'], [tag('+80 nyang', '+80냥'), tag('Integrity falls', '청렴 하락'), tag('Risk', '위험')],
        [L('steward', 'As you say, sir.', '분부대로 하겠습니다.')], [money(80), flag('corrupt'), attr('integrity', -4), honour(-5)]),
      choice('return', ['Send it back with a polite note.', '정중한 편지와 함께 돌려보내자.'], ['Return it. Say I am honoured, and unable.', '돌려보내라. 영광이나 받을 수 없다 전하고.'], [tag('Honour +4', '명예 +4'), tag('Integrity', '청렴')],
        [L('steward', 'He will not be pleased.', '그 사람, 좋아하지 않겠습니다.')], [honour(4), attr('integrity', 2)]),
      choice('report', ['Report it to the Inspector-General.', '사헌부에 고발하자.'], ['This goes to the Saheonbu tomorrow.', '내일 사헌부로 보내라.'], [tag('Opens an inquiry', '조사 시작'), tag('Makes enemies', '적을 만듦')],
        [L('narr', 'An inquiry is opened; you are asked to lead it.', '조사가 열리고, 당신이 맡게 되었다.')], [{ kind: 'inquiry', inq: 'corruption' }, stat('reputation', 2), { kind: 'standing', d: -4 }]),
    ],
  },
  {
    id: 'anonymous-letter', title: T('A letter without a name', '익명의 투서'), delivery: 'letter', place: 'offices', time: 'day', cast: 'narr',
    when: { office: true, minTier: 2 },
    letter: {
      from: T('Unsigned', '이름 없음'), seal: '密',
      intro: T('A letter slipped under your door at the offices, unsigned.', '관아 방문 아래로 밀어 넣은 서찰 한 통. 이름이 없다.'),
      body: T('It says a senior official is skimming the state granaries, and that the ledgers will prove it if anyone dares to look.', '고위 관리가 국창의 곡식을 빼돌리고 있으며, 누군가 감히 장부를 들여다본다면 증거가 나올 것이라 적혀 있다.'),
      go: T('Look into it.', '조사하자.'), goEffects: [{ kind: 'inquiry', inq: 'accounts' }], goToast: T('An inquiry is opened. You have two seasons.', '조사를 시작했다. 두 철 안에 끝내야 한다.'),
      decline: T('Burn it.', '태워 버리자.'), declineEffects: [honour(-1)], declineToast: T('The ashes go out with the evening fire.', '재는 저녁 불씨와 함께 꺼졌다.'),
    },
    lines: [], choices: [],
  },
  {
    id: 'accused', title: T('Your name in a letter of treason', '역모 투서에 오른 이름'), delivery: 'season', place: 'tribunal', time: 'day', cast: 'inspector',
    when: { office: true, minDay: 720, legal: ['yangban'], losingSide: true, not: { minFavour: 30 } },
    lines: [
      L('narr', 'Guards at the gate at dawn. A letter has been found calling for rebellion, and your name is in it.', '새벽에 군졸들이 대문 앞에 섰다. 역모를 꾀하는 투서가 나왔는데, 거기 당신의 이름이 있다.'),
      L('inspector', 'Whether you wrote it or someone wished it on you, you will answer for it today.', '당신이 썼든 누가 덮어씌웠든, 오늘 그에 대해 답해야 하오.'),
    ],
    prompt: L('narr', 'How do you answer the charge?', '혐의에 어떻게 답하겠는가?'),
    choices: [
      choice('face', ['Demand to face your accuser.', '고발한 자와 대질하게 해 달라.'], ['Bring me the man who wrote this.', '이걸 쓴 자를 데려오시오.'], [tag('Depends on resolve', '결단력에 달림')],
        [L('inspector', 'Bold. We will see if boldness is enough.', '대담하군. 대담함으로 족할지 두고 봅시다.')],
        [{ kind: 'punish', level: 'reprimand', cause: T('Named in a letter of treason', '역모 투서에 이름이 오름'), when: { quality: { q: 'resolve', min: 55 } } },
          { kind: 'punish', level: 'dismissal', cause: T('Named in a letter of treason', '역모 투서에 이름이 오름'), when: { not: { quality: { q: 'resolve', min: 55 } } } }]),
      choice('mercy', ['Beg the king’s mercy.', '전하의 자비를 구하자.'], ['I have served loyally. Let His Majesty judge me.', '충심으로 섬겼사옵니다. 전하께서 판단해 주소서.'], [tag('Exile', '유배'), tag('Honour −5', '명예 −5')],
        [L('narr', 'The king is merciful, by the standards of kings.', '임금은 자비로웠다. 임금들의 기준으로는.')], [{ kind: 'punish', level: 'exile', cause: T('Named in a letter of treason; begged for mercy', '역모 투서에 이름이 올라 선처를 구함') }, honour(-5)]),
      choice('blame', ['Name a rival as the real author.', '맞수가 진짜 범인이라 지목하자.'], ['Ask yourself who gains if I fall.', '내가 쓰러지면 누가 이득을 보는지 생각해 보시오.'], [tag('Needs persuasion 65', '설득력 65 필요'), tag('Everything at stake', '모든 것을 건다')],
        [L('narr', 'The room goes very quiet.', '방 안이 쥐 죽은 듯 조용해진다.')],
        [{ kind: 'inquiry', inq: 'treason', when: { minAttr: { a: 'persuasion', min: 65 } } }, stat('reputation', 2, { minAttr: { a: 'persuasion', min: 65 } }),
          { kind: 'punish', level: 'revocation', cause: T('Convicted of treason after accusing others', '남을 무고하고 역모죄로 몰림'), when: { not: { minAttr: { a: 'persuasion', min: 65 } } } }]),
    ],
  },
  {
    id: 'embassy', title: T('Named to an embassy', '사신단에 뽑히다'), delivery: 'letter', place: 'offices', time: 'day', cast: 'narr',
    when: { office: true, minTier: 2, track: 'civil', minAge: 25 },
    letter: {
      from: T('The Ministry of Rites', '예조'), seal: '禮',
      intro: T('A summons from the Ministry of Rites.', '예조에서 보낸 차출 공문.'),
      body: T('You are named to the next embassy abroad, as secretary to the envoy. The road is long and cold, and the rewards are as large as the risks.', '다음 사행의 서장관으로 차출되었다. 길은 멀고 춥지만, 위험만큼 보상도 크다.'),
      go: T('Accept the commission.', '명을 받들자.'), goEffects: [{ kind: 'mission' }], goToast: T('You will set out with the embassy when the season turns.', '철이 바뀌면 사신단과 함께 떠난다.'),
      decline: T('Plead ill health.', '병을 핑계로 사양하자.'), declineEffects: [stat('favour', -3)], declineToast: T('Another man goes in your place.', '다른 이가 대신 간다.'),
    },
    lines: [], choices: [],
  },
  {
    id: 'war-orders', title: T('Orders from the front', '전선에서 온 명령'), delivery: 'season', place: 'offices', time: 'day', cast: 'narr', yearly: true,
    when: { war: true, office: true, track: 'military' },
    lines: [
      L('narr', 'War. Your company is ordered to the front, and in a week you are looking across a frozen river at the enemy’s fires.', '전쟁이다. 당신의 부대가 전선으로 차출되고, 한 주 만에 얼어붙은 강 너머 적의 모닥불을 바라보고 있다.'),
    ],
    prompt: L('narr', 'How do you fight?', '어떻게 싸우겠는가?'),
    choices: [
      choice('hold', ['Hold the line.', '전선을 지키자.'], ['No one crosses.', '아무도 건너오지 못한다.'], [tag('Leadership and strategy', '통솔과 전략')], [L('narr', 'Dawn comes grey and cold.', '잿빛 새벽이 차갑게 밝는다.')], [{ kind: 'battle', style: 'hold' }]),
      choice('attack', ['Cross the river at night and attack.', '밤에 강을 건너 기습하자.'], ['Muffle the horses.', '말 입을 묶어라.'], [tag('Great risk, great glory', '큰 위험, 큰 공')], [L('narr', 'The ice groans under the horses.', '말발굽 아래 얼음이 신음한다.')], [{ kind: 'battle', style: 'attack' }]),
      choice('flank', ['Hold the ford with half and march the rest around.', '절반으로 여울을 지키고 나머지는 돌아서 친다.'], ['They will watch the river. We will come from the hills.', '저들은 강을 볼 것이다. 우리는 산에서 내려간다.'], [tag('Needs strategy 55', '전략 55 필요'), tag('Glory', '공명')], [L('narr', 'A long cold march, and then their camp from behind.', '길고 추운 행군 끝에 적진의 뒤가 보였다.')], [{ kind: 'battle', style: 'flank' }], { when: { minAttr: { a: 'strategy', min: 55 } } }),
      choice('ambush', ['Fall back and lay an ambush in the pass.', '물러나 고갯길에 매복한다.'], ['Let them think we ran.', '우리가 달아났다고 믿게 하라.'], [tag('Needs military learning 40', '무학 40 필요'), tag('Glory', '공명')], [L('narr', 'They come up the pass in column, laughing.', '적이 줄지어 웃으며 고개를 올라온다.')], [{ kind: 'battle', style: 'ambush' }], { when: { minEdu: { field: 'military', min: 40 } } }),
      choice('reinforce', ['Send for reinforcements first.', '먼저 원군을 청하자.'], ['We wait for the main army.', '본진을 기다린다.'], [tag('Safe', '안전'), tag('Favour −2', '총애 −2')], [L('narr', 'Riders gallop south.', '파발이 남쪽으로 달린다.')], [{ kind: 'battle', style: 'reinforce' }]),
    ],
  },
  {
    id: 'righteous-army', title: T('A righteous army', '의병'), delivery: 'season', place: 'residence', time: 'day', cast: 'narr',
    when: { war: true, office: false, gender: 'man', legal: ['yangban'], minAge: 18 },
    lines: [
      L('narr', 'The regular army has broken. In the villages, scholars and farmers are taking up their fathers’ old bows.', '관군이 무너졌다. 마을마다 선비와 농부들이 아버지의 낡은 활을 집어 든다.'),
    ],
    prompt: L('narr', 'Will you raise men?', '의병을 일으키겠는가?'),
    choices: [
      choice('raise', ['Raise a righteous army.', '의병을 일으키자.'], ['Whoever can hold a bow, follow me.', '활을 잡을 수 있는 자는 나를 따르라.'], [tag('Honour', '명예'), tag('Danger', '위험')],
        [L('narr', 'Two hundred men by the first frost.', '첫서리가 내릴 무렵 이백 명이 모였다.')], [{ kind: 'battle', style: 'attack' }, honour(8), money(-60)]),
      choice('fund', ['Fund the volunteers from the family stores.', '집안 곳간을 열어 의병을 돕자.'], ['Take the rice. Take the cloth.', '쌀도 가져가고 무명도 가져가시오.'], [tag('Treasury −150', '곳간 −150'), tag('Honour', '명예')],
        [L('narr', 'Your name is read out in the volunteers’ camp.', '의병 진중에서 당신의 이름이 불린다.')], [{ kind: 'treasury', d: -150 }, honour(5), stat('reputation', 4)]),
    ],
  },
  // ------------------------------------------------------------------ festivals and gatherings
  {
    id: 'seollal', title: T('The New Year', '설날'), delivery: 'season', place: 'residence', time: 'day', cast: 'narr',
    when: { season: 0, minAge: 15, minDay: 300 },
    lines: [L('narr', 'New Year’s morning. Rice-cake soup, new clothes, and a long line of relatives to bow to.', '설날 아침. 떡국과 설빔, 그리고 세배를 드려야 할 길게 늘어선 친척들.')],
    prompt: L('narr', 'How do you spend the day?', '이날을 어떻게 보내겠는가?'),
    choices: [
      choice('elders', ['Visit every elder of the clan.', '문중 어른들을 빠짐없이 찾아뵙자.'], ['A happy New Year, and many more.', '새해 복 많이 받으십시오.'], [tag('Honour', '명예'), tag('Family', '가족')], [L('narr', 'Your knees ache by evening; your pockets jingle.', '저녁이면 무릎이 쑤시고 주머니는 짤랑거린다.')], [honour(2), reg('father', 3, { alive: ['father'] }), reg('mother', 3, { alive: ['mother'] }), money(10)]),
      choice('games', ['Play yut and fly kites with the children.', '아이들과 윷놀이하고 연을 날리자.'], ['Your throw.', '네 차례다.'], [tag('Health', '건강'), tag('Charisma', '매력')], [L('narr', 'You lose at yut to a seven-year-old, twice.', '일곱 살짜리에게 윷놀이를 두 번 졌다.')], [stat('health', 2), attr('charisma', 1)]),
    ],
  },
  {
    id: 'dano', title: T('The Dano festival', '단오'), delivery: 'season', place: 'market', time: 'day', cast: 'narr',
    when: { season: 1, minAge: 15, minDay: 200 },
    lines: [L('narr', 'The fifth day of the fifth moon. Wrestlers in the market square, girls on swings in the willows, iris water for washing hair.', '오월 단오. 장터에는 씨름판, 버드나무에는 그네 뛰는 처녀들, 창포물에 머리 감는 날.')],
    prompt: L('narr', 'Where do you go?', '어디로 가겠는가?'),
    choices: [
      choice('wrestle', ['Into the wrestling ring.', '씨름판으로.'], ['Who’s next?', '다음은 누구냐?'], [tag('Strength', '근력'), tag('Reputation', '평판')], [L('narr', 'The crowd roars.', '구경꾼들이 함성을 지른다.')], [attr('strength', 2), stat('reputation', 2)], { when: { gender: 'man' } }),
      choice('swing', ['To the swings.', '그네터로.'], ['Higher!', '더 높이!'], [tag('Agility', '민첩성'), tag('Reputation', '평판')], [L('narr', 'For a moment you can see over the city wall.', '한순간 도성 담장 너머가 보인다.')], [attr('agility', 2), stat('reputation', 2)]),
      choice('watch', ['Watch, and listen to the crowd.', '구경하며 사람들 이야기를 듣자.'], ['(You find a shady spot.)', '(그늘진 자리를 찾는다.)'], [tag('Practical knowledge', '실무')], [L('narr', 'You learn the price of rice in six provinces.', '여섯 도의 쌀값을 알게 되었다.')], [edu('practical', 3)]),
    ],
  },
  {
    id: 'chuseok', title: T('Chuseok', '추석'), delivery: 'season', place: 'residence', time: 'night', cast: 'narr',
    when: { season: 2, minAge: 15, minDay: 400 },
    lines: [L('narr', 'The harvest moon. Songpyeon steaming on pine needles, the ancestral tables laid, and the whole household awake past midnight.', '한가위 보름달. 솔잎 위에서 익어 가는 송편, 차려진 차례상, 자정이 넘도록 깨어 있는 온 집안.')],
    prompt: L('narr', 'How do you keep the festival?', '명절을 어떻게 보내겠는가?'),
    choices: [
      choice('rites', ['Keep the rites at the ancestral tombs.', '선산에 성묘하자.'], ['(You bow at each grave.)', '(무덤마다 절한다.)'], [tag('Honour', '명예')], [L('narr', 'You pull the weeds from your grandfather’s grave yourself.', '할아버지 무덤의 잡초를 손수 뽑는다.')], [honour(3)]),
      choice('tenants', ['Feast the tenants and servants.', '소작인과 하인들에게 잔치를 베풀자.'], ['Eat. You worked for it.', '드시오. 당신들이 일군 것이오.'], [tag('Costs 30', '30냥'), tag('Reputation', '평판')], [L('narr', 'Someone starts a farmers’ song and everyone joins in.', '누군가 농부가를 시작하자 모두 따라 부른다.')], [money(-30), stat('reputation', 3), attr('empathy', 1)]),
      choice('poems', ['Hold a poetry gathering under the moon.', '달 아래 시회를 열자.'], ['A line each, and drink if you fail.', '한 구절씩, 못 지으면 벌주요.'], [tag('Arts', '예악'), tag('Charisma', '매력')], [L('narr', 'Your couplet is copied out by three guests.', '손님 셋이 당신의 대구를 베껴 간다.')], [edu('culture', 3), attr('charisma', 1)]),
    ],
  },
  // ------------------------------------------------------------------ a commoner's life
  {
    id: 'commoner-first', title: T('The first night in the lower city', '아랫마을의 첫날 밤'), delivery: 'season', place: 'residence', time: 'night', cast: 'narr', commoner: true,
    when: { legal: ['commoner'] },
    lines: [
      L('narr', 'A rented room with a smoky floor and a door that does not close. Through the wall, a family argues about the price of millet.', '연기 새는 구들에 닫히지 않는 문이 달린 셋방. 벽 너머에서 한 식구가 조 값으로 다툰다.'),
      L('narr', 'Your fine robes were sold the first week. Your hands, you notice, have already changed.', '고운 옷은 첫 주에 팔았다. 문득 보니 손이 벌써 달라졌다.'),
    ],
    prompt: L('narr', 'What keeps you going?', '무엇이 당신을 버티게 하는가?'),
    choices: [
      choice('justice', ['The truth of what was done to you.', '내게 일어난 일의 진실.'], ['Someone did this. I will find out who.', '누군가 이 짓을 했다. 누군지 밝혀내리라.'], [tag('Resilience', '회복력'), tag('Proof', '증거')], [L('narr', 'You begin a list, by lamplight.', '등잔불 아래서 명단을 적기 시작한다.')], [attr('resilience', 3), { kind: 'proof', d: 5 }]),
      choice('family', ['The people still with you.', '아직 곁에 있는 사람들.'], ['We are still a family.', '우린 아직 한 식구다.'], [tag('Resilience', '회복력'), tag('Empathy', '공감력')], [L('narr', 'Someone laughs through the wall, and you laugh too.', '벽 너머에서 누군가 웃고, 당신도 따라 웃는다.')], [attr('resilience', 2), attr('empathy', 2)]),
    ],
  },
  {
    id: 'old-friend', title: T('An old friend at night', '밤에 찾아온 옛 벗'), delivery: 'evening', place: 'residence', time: 'night', cast: 'narr', commoner: true,
    when: { legal: ['commoner'], minDay: 200 },
    lines: [
      L('narr', 'A knock after curfew. A former colleague, hooded, who should not be here.', '통금 뒤의 노크. 두건을 쓴 옛 동료다. 여기 있으면 안 될 사람.'),
      L('narr', '“I can’t stay. But I copied something from the records of your case. You should see it.”', '“오래 못 있네. 자네 사건 기록에서 베껴 온 게 있네. 봐야 할 걸세.”'),
    ],
    prompt: L('narr', 'Do you take it?', '받겠는가?'),
    choices: [
      choice('take', ['Take it, and thank him.', '받고, 고마움을 전하자.'], ['I will not forget this.', '이 은혜 잊지 않겠네.'], [tag('Proof +15', '증거 +15')], [L('narr', 'A page with the wrong seal on it. It is a beginning.', '엉뚱한 인장이 찍힌 종이 한 장. 시작이다.')], [{ kind: 'proof', d: 15 }]),
      choice('refuse', ['Send him away before he is ruined too.', '그마저 망하기 전에 돌려보내자.'], ['Go home. Forget me.', '돌아가게. 나를 잊게.'], [tag('Honour +5', '명예 +5')], [L('narr', 'He hesitates, then goes.', '그는 머뭇거리다 떠난다.')], [honour(5)]),
    ],
  },
  {
    id: 'informer', title: T('A servant who knows', '진실을 아는 하인'), delivery: 'season', place: 'market', time: 'day', cast: 'narr', commoner: true,
    when: { legal: ['commoner'], minDay: 400 },
    lines: [L('narr', 'A servant from a great house stops you in the market. He worked for the man who ruined you, and he was not paid either.', '장터에서 대갓집 하인 하나가 당신을 붙잡는다. 당신을 망친 자의 집에서 일했는데, 그도 품삯을 떼였다고 한다.')],
    prompt: L('narr', 'He wants fifty nyang for what he knows.', '아는 것을 말해 주는 대가로 쉰 냥을 원한다.'),
    choices: [
      choice('pay', ['Pay him.', '돈을 주자.'], ['Talk.', '말해 보게.'], [tag('Costs 50', '50냥'), tag('Proof +20', '증거 +20')], [L('narr', 'Names, dates, a letter burned too late.', '이름들, 날짜들, 너무 늦게 태운 편지 한 통.')], [money(-50), { kind: 'proof', d: 20 }], { when: { minMoney: 50 } }),
      choice('trust', ['Promise to pay him when your name is cleared.', '누명을 벗으면 갚겠다고 약속하자.'], ['You have my word.', '내 말을 믿게.'], [tag('Needs charisma 55', '매력 55 필요')], [L('narr', 'He looks at you a long time.', '그가 오랫동안 당신을 바라본다.')], [{ kind: 'proof', d: 12, when: { minAttr: { a: 'charisma', min: 55 } } }, note('He shakes his head and walks off.', '그는 고개를 젓고 가 버린다.', { not: { minAttr: { a: 'charisma', min: 55 } } })]),
    ],
  },
];
