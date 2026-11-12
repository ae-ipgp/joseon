import type { Condition, Effect, GameEvent, Line } from '../model/content';
import type { Quality, Text } from '../model/schemas';
import { T } from '../engine/text';
import { MORE_EVENTS } from './events3';
import { HISTORY_EVENTS } from './events4';
import { CULTURE_EVENTS } from './events5';

/*
 * Story events in English and Korean. The Korean is a working draft for review by a native speaker.
 * Tokens such as {player}, {father}, {king}, {factionA} are filled from the game at read time.
 */

const L = (who: string, en: string, ko?: string, when?: Condition, aside?: Text): Line => ({ who, text: T(en, ko), ...(when ? { when } : {}), ...(aside ? { aside } : {}) });
const q = (q: Quality, d: number, when?: Condition): Effect => ({ kind: 'quality', q, d, ...(when ? { when } : {}) });
const stat = (stat: 'health' | 'reputation' | 'favour' | 'prestige', d: number, when?: Condition): Effect => ({ kind: 'stat', stat, d, ...(when ? { when } : {}) });
const reg = (npc: string, d: number, when?: Condition): Effect => ({ kind: 'regard', npc, d, ...(when ? { when } : {}) });
const flag = (f: string, v = true, when?: Condition): Effect => ({ kind: 'flag', flag: f, v, ...(when ? { when } : {}) });
const note = (en: string, ko?: string, when?: Condition): Effect => ({ kind: 'note', text: T(en, ko), ...(when ? { when } : {}) });
const rec = (en: string, ko?: string, when?: Condition): Effect => ({ kind: 'record', text: T(en, ko), ...(when ? { when } : {}) });
const trait = (id: string, when?: Condition): Effect => ({ kind: 'trait', id, ...(when ? { when } : {}) });
const moment = (npc: string, en: string, ko?: string, when?: Condition): Effect => ({ kind: 'moment', npc, text: T(en, ko), ...(when ? { when } : {}) });
const bond = (npc: string, to: 'none' | 'romance' | 'lover', when?: Condition): Effect => ({ kind: 'bond', npc, to, ...(when ? { when } : {}) });
const W: Condition = { gender: 'woman' };
const M: Condition = { gender: 'man' };

export const EVENTS: GameEvent[] = [
  // ------------------------------------------------------------------ the opening
  {
    id: 'opening', title: T('First day at court', '입궐 첫날'), delivery: 'arrive', place: 'rear-garden', time: 'day', cast: 'han',
    when: { generation: 1, flags: { opened: false } },
    lines: [
      L('narr', '{intro1}', '{intro1}'),
      L('narr', '{intro2}', '{intro2}'),
      L('han', 'There you are. Half the court is in this garden today, and the other half is pretending not to watch them.', '왔구려. 오늘 조정의 절반은 이 정원에 나와 있고, 나머지 절반은 그들을 보지 않는 척하고 있소.'),
      L('han', '{factionA} keep to the west pavilion. Our people, {factionB}, stay by the pond. Nobody crosses the bridge.', '{factionA_eun} 서쪽 정자를 차지하고 있소. 우리 쪽 {factionB_eun} 연못가에 머물지요. 다리를 건너는 사람은 아무도 없소.'),
      L('han', 'They will all be judging you today, {given}. Decide now how you want to be remembered.', '오늘 저들 모두가 그대를 저울질할 거요, {given}. 어떻게 기억되고 싶은지 지금 정하시오.'),
    ],
    prompt: L('narr', 'How will you carry yourself at court?', '조정에서 어떻게 처신하겠는가?'),
    choices: [
      {
        id: 'modest', label: T('With modesty. Let them underestimate me.', '겸손하게. 얕보게 내버려 두자.'),
        say: T('I will listen more than I speak. Let them underestimate me.', '말하기보다 듣겠소. 저들이 나를 얕보게 두겠소.'), tags: [T('Grace', '품위'), T('Fewer enemies', '적이 줄어듦')],
        reaction: [L('han', 'Wise. The ones who speak first are usually the first to fall.', '현명하오. 먼저 입을 여는 자가 대개 먼저 쓰러지는 법이오.')],
        effects: [q('grace', 3), reg('baek', 6), trait('composed'), flag('opened')], title: T('A quiet entrance', '조용한 등장'),
      },
      {
        id: 'witty', label: T('With wit. I will make them laugh.', '재치 있게. 웃게 만들자.'),
        say: T('With wit. If they are going to judge me, they can at least enjoy it.', '재치로 맞서겠소. 어차피 나를 저울질할 거라면 즐겁기라도 해야지.'), tags: [T('Wit', '재치'), T('Draws attention', '눈에 띔')],
        reaction: [L('han', 'Then I will stand close. Laughter at this court is either a shield or a target.', '그럼 내가 곁에 있겠소. 이 조정에서 웃음은 방패가 되거나 과녁이 되오.')],
        effects: [q('wit', 3), stat('reputation', 2), reg('baek', -5), trait('quick-witted'), flag('opened')], title: T('A clever entrance', '재치 있는 등장'),
      },
      {
        id: 'proud', label: T('With pride. My family has nothing to hide.', '당당하게. 우리 집안은 숨길 게 없다.'),
        say: T('With my head up. My family has nothing to hide.', '고개를 들고 가겠소. 우리 집안은 숨길 것이 없소.'), tags: [T('Resolve', '결단력'), T('{factionA} will notice', '{factionA_i} 주목함')],
        reaction: [L('han', 'Brave words, while your father’s name is being whispered in every hall.', '용감한 말이오. 아버님의 이름이 궁 안 곳곳에서 수군거림을 타는 이때에.')],
        effects: [q('resolve', 3), reg('ryu', -5), stat('favour', 2), trait('proud'), flag('opened')], title: T('A proud entrance', '당당한 등장'),
      },
    ],
  },
  {
    id: 'meet-kang', title: T('The captain of the guard', '내금위장'), delivery: 'arrive', arrivePhase: 'afternoon', fallbackEvening: true,
    place: 'rear-garden', time: 'day', cast: 'kang',
    when: { generation: 1, flags: { opened: true, 'met-kang': false }, alive: ['kang'] },
    lines: [
      L('narr', 'A gust off the pond tears the fan from your hand. It skims the water’s edge and stops at a guardsman’s boot.', '연못에서 불어온 바람이 손에서 부채를 낚아챈다. 부채는 물가를 스치더니 한 무관의 신발 앞에서 멈춘다.', W),
      L('kang', 'Yours, my lady.', '여기 있습니다.', W),
      L('narr', 'He holds it out by the frame, careful not to touch your fingers. The insignia on his chest is a captain’s.', '그는 손가락이 닿지 않도록 부채 테두리를 잡아 내민다. 가슴의 흉배를 보니 내금위장이다.', W),
      L('narr', 'At the archery butts beyond the pond, a guardsman puts five arrows into the black, one after another, and does not look pleased.', '연못 너머 활터에서 한 무관이 과녁 한가운데에 다섯 발을 연달아 꽂고도 흡족하지 않은 얼굴이다.', M),
      L('kang', 'You have been watching for some time.', '꽤 오래 지켜보셨구려.', M),
      L('kang', 'Kang Mu-yeol, Royal Guard. And you are {player}. Your father’s {child}.', '내금위의 강무열이오. 그리고 그대는 {player}. 아버님의 {child}이시지요.'),
      L('kang', 'A word of advice. The court is counting who your father speaks to. Be careful who they count you speaking to.', '한마디 드리리다. 조정은 지금 아버님께서 누구와 말을 나누는지 세고 있소. 그대가 누구와 말을 나누는지도 셀 것이니 조심하시오.'),
    ],
    prompt: L('narr', 'What do you say to him?', '그에게 뭐라고 하겠는가?'),
    choices: [
      {
        id: 'thank', label: T('Thank him, and nothing more.', '고맙다고만 하자.'), say: T('Thank you, Captain.', '고맙소.'), tags: [T('Courteous', '예의 바름')],
        reaction: [L('kang', 'Good. Nothing more is the safest thing anyone can say here.', '좋소. 이곳에서는 그 이상 말하지 않는 것이 가장 안전하오.')],
        effects: [{ kind: 'meet', npc: 'kang' }, reg('kang', 5), flag('met-kang')], title: T('A careful courtesy', '조심스러운 예의'),
      },
      {
        id: 'why', label: T('Ask why he is warning you.', '왜 경고하는지 묻자.'), say: T('Why would a captain of the guard warn me of anything?', '내금위장께서 어찌 내게 경고를 하시오?'), tags: [T('Curious', '호기심'), T('Kang Mu-yeol', '강무열')],
        reaction: [L('kang', 'Because your father was kind to mine once, when kindness was not safe. I don’t forget debts.', '그대 아버님께서 예전에 내 아버지께 친절을 베푸신 적이 있소. 친절이 위험하던 시절에. 나는 빚을 잊지 않소.')],
        effects: [{ kind: 'meet', npc: 'kang' }, reg('kang', 10), moment('kang', 'He warned you about the court, for your father’s sake.', '아버지를 생각해 조정을 조심하라고 일러 주었다.'), flag('met-kang')], title: T('An old debt', '오래된 빚'),
      },
      {
        id: 'challenge', label: T('Tell him you can look after yourself.', '내 몸은 내가 지킨다고 하자.'), say: T('I can look after myself, Captain.', '내 몸은 내가 지킬 수 있소.'), tags: [T('Resolve', '결단력')],
        reaction: [
          L('kang', 'I believe it. That is what worries me.', '그 말을 믿소. 그래서 걱정이오.', W),
          L('kang', 'Then come to the butts tomorrow and prove it. Losing to you would be a pleasure I’d rather not have.', '그럼 내일 활터로 와서 증명해 보시오. 그대에게 지는 즐거움은 사양하고 싶지만.', M),
        ],
        effects: [{ kind: 'meet', npc: 'kang' }, q('resolve', 2), reg('kang', 7), flag('met-kang')], title: T('A challenge', '도전'),
      },
    ],
  },
  // ------------------------------------------------------------------ the letter
  {
    id: 'letter', title: T('The letter at the lotus pond', '연못가의 서신'), delivery: 'letter', place: 'rear-garden', time: 'night', cast: 'kang',
    when: { generation: 1, flags: { 'met-kang': true, 'letter-done': false }, since: { flag: 'met-kang', days: 1 }, alive: ['kang'] },
    letter: {
      from: T('Kang Mu-yeol', '강무열'), seal: '강',
      intro: T('As the evening drum sounds, a young guard presses a folded note into your hand and is gone before you can ask his name.', '저녁 북이 울릴 무렵, 젊은 군졸 하나가 접힌 쪽지를 손에 쥐여 주고는 이름을 묻기도 전에 사라진다.'),
      body: T('The lotus pond, after the second drum. Come alone.', '이경이 지나면 연못가로. 혼자 오십시오.'),
      note: T('The seal reads Kang. You know only one Kang who would dare.', '도장에는 ‘강’이라 찍혀 있다. 감히 이럴 강씨는 한 사람뿐이다.'),
      go: T('Go to the pond', '연못으로 간다'),
      decline: T('Burn the note and stay in', '쪽지를 태우고 집에 머문다'),
      declineEffects: [flag('letter-done'), flag('letter-handed'), flag('tribunal-open'), reg('kang', -5), stat('prestige', -1), rec('Ignored a note from Kang Mu-yeol. By morning, a letter with your father’s seal was at the State Tribunal.', '강무열의 쪽지를 외면했다. 아침이 되자 아버지의 도장이 찍힌 서신이 의금부에 들어갔다.')],
      declineToast: T('You burn the note and stay in. Somewhere by the pond, a lantern burns down.', '쪽지를 태우고 집에 머문다. 연못 어딘가에서 등불이 꺼져 간다.'),
    },
    lines: [
      L('kang', 'You came. I wasn’t sure you would.', '오셨구려. 오실지 몰랐소.'),
      L('kang', 'A courier was stopped at the West Gate tonight. He was carrying this letter, sealed with your father’s seal.', '오늘 밤 서대문에서 파발 하나를 붙잡았소. 그가 지닌 이 서신에 그대 아버님의 낙관이 찍혀 있었소.'),
      L('narr', 'He holds it out to you. The wax is cracked. {accusation}', '그가 서신을 내민다. 봉랍이 깨져 있다. {accusation}'),
      L('kang', 'By law it belongs to the State Tribunal before dawn. I have brought it to you instead.', '법대로라면 날이 밝기 전에 의금부로 가야 할 서신이오. 그런데 나는 그대에게 가져왔소.'),
    ],
    prompt: L('narr', 'The lantern hisses. What will you do with the letter?', '등불이 지직거린다. 이 서신을 어찌하겠는가?'),
    choices: [
      {
        id: 'burn', label: T('Burn it. Here, now.', '태우자. 여기서, 지금.'), say: T('Burn it. Here, now, before anyone else can read it.', '태우시오. 지금 여기서, 다른 누가 읽기 전에.'),
        tags: [T('Protects your family', '가족을 지킴'), T('Kang Mu-yeol shares the risk', '강무열도 위험을 나눔')],
        reaction: [L('kang', 'Then we were never here.', '그럼 우리는 여기 온 적이 없는 거요.', undefined, T('He holds the lantern steady while the paper curls and blackens. Neither of you speaks until it is ash.', '종이가 말려 들며 검게 타는 동안 그는 등불을 흔들림 없이 들고 있다. 재가 될 때까지 둘 다 말이 없다.'))],
        effects: [reg('kang', 12), flag('secret-with-kang'), flag('letter-done'), flag('letter-burned'), trait('discreet'),
          moment('kang', 'You burned your father’s letter together at the lotus pond.', '연못가에서 함께 아버지의 서신을 태웠다.'),
          rec('Burned a letter that would have destroyed your father.', '아버지를 무너뜨렸을 서신을 태웠다.'),
          note('A secret shared with Kang Mu-yeol', '강무열과 비밀을 나눔'), note('Your father is safe, for now', '아버지는 당분간 무사함')],
        title: T('The letter is ash', '서신은 재가 되었다'),
      },
      {
        id: 'tribunal', label: T('Take me to the State Tribunal.', '의금부로 데려가 주시오.'), say: T('Take me to the State Tribunal. I will hand it over myself.', '의금부로 데려가 주시오. 내 손으로 넘기겠소.'),
        tags: [T('Loyal to the crown', '왕실에 충성'), T('Your father will be questioned', '아버지가 심문받음')],
        reaction: [L('kang', 'As you wish. I will walk you to the gate.', '뜻대로 하시오. 문까지 모셔다 드리리다.', undefined, T('He does not look at you again on the way.', '가는 길 내내 그는 다시 당신을 보지 않는다.'))],
        effects: [stat('favour', 8), reg('kang', -5), stat('prestige', -1), flag('letter-done'), flag('letter-handed'), flag('handed-by-player'), flag('tribunal-open'), trait('loyal'),
          rec('Handed a letter bearing your father’s seal to the State Tribunal.', '아버지의 도장이 찍힌 서신을 의금부에 넘겼다.'),
          note('Your father will be summoned for questioning', '아버지가 심문을 받게 됨')],
        title: T('The letter goes to the Tribunal', '서신은 의금부로'),
      },
      {
        id: 'ask', again: true, label: T('Why would you risk your post for me?', '어찌 나를 위해 자리를 걸었소?'), say: T('Why would you risk your post for me?', '어찌 나를 위해 벼슬을 걸려 하시오?'),
        tags: [T('Ask before deciding', '결정 전에 묻기'), T('Kang Mu-yeol', '강무열')],
        reaction: [
          L('kang', 'Because I have watched you at every banquet this season. And because I do not believe your father wrote it.', '이번 철 연회마다 그대를 지켜보았기 때문이오. 그리고 그대 아버님께서 이 서신을 쓰셨다고 믿지 않기 때문이오.', W, T('The lantern flickers between you. He is still holding out the letter.', '등불이 두 사람 사이에서 일렁인다. 그는 여전히 서신을 내밀고 있다.')),
          L('kang', 'Because I do not believe your father wrote it. And because someone wants us to think he did.', '그대 아버님께서 쓰셨다고 믿지 않기 때문이오. 그리고 누군가 우리가 그렇게 믿기를 바라기 때문이오.', M, T('The lantern flickers between you. He is still holding out the letter.', '등불이 두 사람 사이에서 일렁인다. 그는 여전히 서신을 내밀고 있다.')),
        ],
        effects: [reg('kang', 8), bond('kang', 'romance', W), note('Kang Mu-yeol confided in you', '강무열이 속내를 털어놓음')],
      },
      {
        id: 'keep', label: T('Give it to me. I’ll keep it.', '내게 주시오. 내가 간직하겠소.'), say: T('Give it to me. I will keep it somewhere safe.', '내게 주시오. 안전한 곳에 두겠소.'),
        tags: [T('Leverage', '쥐고 있을 패'), T('Dangerous if found', '들키면 위험')],
        reaction: [L('kang', 'Then keep it close. Paper burns, but it also remembers.', '그럼 몸에 지니고 계시오. 종이는 타지만, 기억하기도 하오.')],
        effects: [q('resolve', 2), reg('kang', -3), flag('letter-done'), flag('letter-kept'),
          rec('Took a letter that could hang your father, and hid it.', '아버지를 죽음으로 몰 서신을 받아 숨겼다.'),
          note('You hold a letter that could hang your father', '아버지를 죽음으로 몰 서신을 쥠')],
        title: T('The letter is yours', '서신은 그대의 손에'),
      },
    ],
  },
  {
    id: 'father-questioned', title: T('Your father is summoned', '부친의 소환'), delivery: 'evening', place: 'residence', time: 'night', cast: 'father',
    when: { flags: { 'letter-handed': true }, since: { flag: 'letter-handed', days: 1 }, alive: ['father'] },
    lines: [
      L('narr', 'Your father comes home after dark, escorted by two officers of the Tribunal. They leave him at the gate. He does not take off his hat.', '아버지께서 의금부 관원 둘의 호송을 받으며 날이 저물어서야 돌아오신다. 그들은 대문 앞에서 물러가고, 아버지는 갓도 벗지 않으신다.'),
      L('father', 'They showed me a letter today, with my seal on it. I have never seen it before in my life.', '오늘 그들이 내게 서신 한 장을 보여 주더구나. 내 낙관이 찍혀 있었다. 평생 처음 보는 서신이었다.'),
      L('father', 'They asked who could have taken my seal. I gave them no names. Now I am asking you.', '누가 내 낙관을 가져갈 수 있었느냐고 묻더구나. 나는 아무 이름도 대지 않았다. 이제 너에게 묻는다.'),
    ],
    prompt: L('narr', 'He is waiting. What do you tell him?', '아버지가 기다리고 있다. 뭐라고 말하겠는가?'),
    choices: [
      {
        id: 'truth', when: { flags: { 'handed-by-player': true } }, label: T('Tell him you handed it over yourself.', '내가 직접 넘겼다고 말하자.'), say: T('I took it to the Tribunal myself, Father.', '제가 직접 의금부에 가져갔습니다, 아버님.'),
        tags: [T('Honest', '정직'), T('Your father is hurt', '아버지가 상처받음')],
        reaction: [L('father', 'Then you chose the throne over your father. Perhaps that is what saves us both.', '그렇다면 너는 아비보다 왕실을 택한 것이구나. 어쩌면 그것이 우리 둘을 살릴지도 모르겠다.')],
        effects: [reg('father', -10), q('resolve', 2), trait('honest'), flag('father-done'), note('Your father knows what you did', '아버지가 당신이 한 일을 앎')],
        title: T('The truth, at a price', '값비싼 진실'),
      },
      {
        id: 'confess-ignored', when: { flags: { 'handed-by-player': false } }, label: T('Tell him you ignored a warning.', '경고를 무시했다고 털어놓자.'), say: T('Someone tried to warn me last night, Father. I did not go.', '어젯밤 누군가 제게 경고하려 했습니다, 아버님. 저는 가지 않았습니다.'),
        tags: [T('Honest', '정직')],
        reaction: [L('father', 'Then next time, go. Whoever it was risked more than you did.', '다음에는 가거라. 그게 누구였든 너보다 더 큰 위험을 무릅쓴 것이다.')],
        effects: [reg('father', -3), trait('honest'), flag('father-done')], title: T('A warning ignored', '외면한 경고'),
      },
      {
        id: 'lie', label: T('Say you know nothing.', '아무것도 모른다고 하자.'), say: T('I know nothing about it, Father.', '저는 아무것도 모릅니다, 아버님.'), tags: [T('Keeps the peace', '평화를 지킴')],
        reaction: [L('father', 'Good. Then there is nothing for them to find.', '좋다. 그렇다면 그들이 찾아낼 것도 없겠지.')],
        effects: [reg('father', 3), flag('lied-to-father'), flag('father-done')], title: T('Silence', '침묵'),
      },
      {
        id: 'forger', label: T('Say someone forged it, and you will find out who.', '누군가 위조했고, 내가 밝혀내겠다고 하자.'), say: T('Someone forged it, Father. I mean to find out who.', '누군가 위조한 것입니다, 아버님. 누구인지 제가 밝혀내겠습니다.'),
        tags: [T('Resolve', '결단력'), T('A dangerous hunt', '위험한 추적')],
        reaction: [L('father', 'Then be careful. Whoever can forge my seal can forge yours.', '그렇다면 조심하거라. 내 낙관을 위조할 수 있는 자라면 네 것도 위조할 수 있다.')],
        effects: [q('resolve', 2), reg('father', 6), flag('hunt-forger'), flag('father-done')], title: T('A hunt begins', '추적의 시작'),
      },
    ],
  },
  {
    id: 'search', title: T('The search', '수색'), delivery: 'evening', place: 'residence', time: 'night', cast: 'mother',
    when: { flags: { 'letter-kept': true, 'search-done': false }, since: { flag: 'letter-kept', days: 2 }, alive: ['mother'] },
    lines: [
      L('narr', 'You come home to find your chest of drawers open and your mother standing over it, very pale.', '집에 돌아오니 반닫이가 열려 있고, 그 앞에 어머니가 창백한 얼굴로 서 계신다.'),
      L('mother', 'Lady Baek’s maid was here this afternoon with a gift of persimmons. She asked to see your embroidery. I found her in your room.', '오늘 오후에 백씨 부인의 몸종이 감을 선물로 들고 왔더구나. 네 자수를 보고 싶다기에 두었더니, 네 방에 들어가 있더구나.'),
      L('mother', 'She found nothing. I made sure of it. But whatever you are hiding, she will be back.', '아무것도 찾지 못했다. 내가 그렇게 했다. 하지만 네가 무엇을 숨기든, 그 아이는 다시 올 게다.'),
    ],
    prompt: L('narr', 'The letter is still sewn inside your sleeve. What now?', '서신은 아직 소매 안에 꿰매져 있다. 이제 어쩌겠는가?'),
    choices: [
      {
        id: 'burn-now', label: T('Burn it tonight.', '오늘 밤 태우자.'), say: T('I will burn it tonight, Mother. There will be nothing to find.', '오늘 밤 태워 버리겠습니다, 어머님. 찾을 것이 아무것도 없게요.'), tags: [T('Safe', '안전')],
        reaction: [L('mother', 'Do it in the kitchen fire. Smoke from there surprises no one.', '부엌 아궁이에 넣거라. 그곳 연기는 아무도 이상하게 여기지 않는다.')],
        effects: [flag('search-done'), flag('letter-burned'), reg('mother', 5), trait('discreet'), rec('Burned the letter at last.', '마침내 서신을 태웠다.')], title: T('Ash, at last', '마침내 재로'),
      },
      {
        id: 'to-kang', when: { alive: ['kang'] }, label: T('Give it to Kang Mu-yeol for safekeeping.', '강무열에게 맡기자.'), say: T('I know someone who can keep it where no maid will look.', '어떤 몸종도 들여다보지 못할 곳에 맡아 줄 사람을 알고 있습니다.'),
        tags: [T('Kang Mu-yeol', '강무열'), T('A shared secret', '나눈 비밀')],
        reaction: [L('mother', 'A soldier? I will not ask which one. Do not tell me.', '무관이냐? 누구인지는 묻지 않으마. 말하지 말거라.')],
        effects: [flag('search-done'), flag('secret-with-kang'), reg('kang', 8), moment('kang', 'He agreed to hide your father’s letter.', '아버지의 서신을 숨겨 주기로 했다.')], title: T('In safer hands', '안전한 손에'),
      },
      {
        id: 'confront', label: T('Let Lady Baek know you know.', '백 부인에게 다 알고 있다고 알리자.'), say: T('I will call on Lady Baek tomorrow. She should know I know.', '내일 백씨 부인을 찾아가겠습니다. 제가 알고 있다는 걸 알게 해야지요.'),
        tags: [T('Resolve', '결단력'), T('Lady Baek becomes an enemy', '백 부인과 원수가 됨')],
        reaction: [L('mother', 'You are your grandmother’s child. Heaven help us.', '너는 영락없는 네 할머니 손주로구나. 하늘이시여.')],
        effects: [flag('search-done'), flag('baek-warned'), reg('baek', -15), q('resolve', 3), stat('reputation', 2), trait('bold')], title: T('A warning delivered', '전해진 경고'),
      },
    ],
  },
  // ------------------------------------------------------------------ romance and friendship
  {
    id: 'lanterns', title: T('Lanterns on the bridge', '다리 위의 등불'), delivery: 'evening', place: 'rear-garden', time: 'night', cast: 'kang',
    when: { gender: 'woman', married: false, alive: ['kang'], regard: [{ npc: 'kang', min: 55 }], bond: { npc: 'kang', is: ['none', 'romance'] }, flags: { 'secret-with-kang': true } },
    lines: [
      L('narr', 'The palace lights its lanterns for the full moon. Kang Mu-yeol is on the bridge, off duty for once, without his sword.', '보름달을 맞아 궁에 등불이 켜진다. 강무열이 다리 위에 서 있다. 웬일로 번을 서지 않고, 칼도 차지 않았다.'),
      L('kang', 'I have stood guard at a hundred banquets. I have never once watched the ruler.', '백 번이 넘는 연회에서 경계를 섰지만, 단 한 번도 임금을 보고 있지 않았소.'),
      L('kang', 'I know what I am. A soldier’s son. Your family will want a minister’s son, and they will be right to.', '내가 무엇인지 알고 있소. 무관의 아들이오. 그대 집안은 대신의 아들을 원할 것이고, 그게 옳은 일이오.'),
      L('kang', 'But I would rather say it badly than not at all.', '그래도 아무 말 않느니 서툴게라도 말하겠소.'),
    ],
    prompt: L('narr', 'He is waiting for your answer.', '그가 대답을 기다린다.'),
    choices: [
      {
        id: 'accept', label: T('Then say it, and I will answer.', '그럼 말하시오. 대답하리다.'), say: T('Then say it, and I will answer you.', '그럼 말하시오. 내가 답하리다.'), tags: [T('Romance', '연모'), T('Your family does not know', '집안은 모름')],
        reaction: [L('narr', 'He says it badly. You answer well. The lanterns burn down and neither of you notices.', '그는 서툴게 말한다. 당신은 잘 답한다. 등불이 다 타도록 둘 다 알아채지 못한다.')],
        effects: [bond('kang', 'lover'), reg('kang', 15), trait('devoted'), moment('kang', 'On the lantern bridge, you became his.', '등불 다리 위에서 그의 사람이 되었다.'), rec('Gave your heart to Kang Mu-yeol, in secret.', '남몰래 강무열에게 마음을 주었다.'), note('Kang Mu-yeol is now your lover', '강무열과 연인이 됨')],
        title: T('Under the lanterns', '등불 아래서'),
      },
      {
        id: 'wait', label: T('Not yet. Not while my father is in danger.', '아직은 아니오. 아버지가 위태로운 동안은.'), say: T('Not yet. Not while my father is in danger.', '아직은 아니오. 아버님이 위험에 처해 계신 동안은.'), tags: [T('Patience', '인내')],
        reaction: [L('kang', 'Then I will wait. I am good at standing still.', '그럼 기다리겠소. 가만히 서 있는 것만은 자신 있소.')],
        effects: [bond('kang', 'romance'), reg('kang', 3)], title: T('Not yet', '아직은'),
      },
      {
        id: 'refuse', label: T('We cannot. You know we cannot.', '안 되오. 당신도 알지 않소.'), say: T('We cannot. You know we cannot.', '우리는 안 되오. 그대도 알지 않소.'), tags: [T('A door closed', '닫힌 문')],
        reaction: [L('kang', 'I know. I wanted to hear you say it.', '알고 있소. 그대 입으로 듣고 싶었을 뿐이오.')],
        effects: [bond('kang', 'none'), reg('kang', -10)], title: T('A door closed', '닫힌 문'),
      },
    ],
  },
  {
    id: 'sworn', title: T('Sworn brothers', '의형제'), delivery: 'evening', place: 'rear-garden', time: 'night', cast: 'kang',
    when: { gender: 'man', alive: ['kang'], regard: [{ npc: 'kang', min: 55 }] },
    lines: [
      L('narr', 'Kang Mu-yeol finds you by the pond after the guard changes, carrying two cups and a jar of rice wine he is not supposed to have.', '번이 바뀐 뒤 강무열이 연못가로 당신을 찾아온다. 잔 두 개와, 지녀서는 안 될 탁주 한 병을 들고.'),
      L('kang', 'My father had a sworn brother. When my father was accused, that man was the only one who stood beside him.', '내 아버지께는 의형제가 있었소. 아버지가 고발당했을 때 곁에 선 사람은 그분 하나뿐이었소.'),
      L('kang', 'I have no brother. I would like one I can trust.', '나는 형제가 없소. 믿을 수 있는 형제를 하나 두고 싶소.'),
    ],
    prompt: L('narr', 'He fills both cups.', '그가 두 잔을 채운다.'),
    choices: [
      {
        id: 'swear', label: T('Drink, and swear.', '마시고 맹세하자.'), say: T('Then we swear it. Brothers, whatever comes.', '그럼 맹세합시다. 무슨 일이 닥치든 형제로.'), tags: [T('Loyalty', '의리'), T('Kang Mu-yeol', '강무열')],
        reaction: [L('kang', 'Whatever comes.', '무슨 일이 닥치든.')],
        effects: [reg('kang', 15), trait('loyal'), flag('secret-with-kang'), moment('kang', 'You swore brotherhood by the pond.', '연못가에서 의형제를 맺었다.')], title: T('Brothers', '형제'),
      },
      {
        id: 'decline', label: T('Drink, but swear nothing.', '마시되 맹세는 하지 말자.'), say: T('I will drink with you. I will not swear what I cannot promise.', '술은 함께 하겠소. 하지만 지킬 수 없는 맹세는 하지 않겠소.'), tags: [T('Caution', '신중')],
        reaction: [L('kang', 'Honest. That is almost as good.', '정직하구려. 그것도 거의 그만큼 좋소.')],
        effects: [reg('kang', 4)], title: T('A cup between friends', '벗 사이의 한 잔'),
      },
    ],
  },
  {
    id: 'han-poem', title: T('Verses at dusk', '황혼의 시'), delivery: 'evening', place: 'rear-garden', time: 'night', cast: 'han',
    when: { gender: 'woman', married: false, alive: ['han'], regard: [{ npc: 'han', min: 74 }], bond: { npc: 'han', is: ['none', 'romance'] } },
    lines: [
      L('narr', 'Han Seon-woo hands you a folded poem and looks anywhere but at you.', '한선우가 접은 시 한 장을 건네며 당신만 빼고 아무 데나 바라본다.'),
      L('han', 'Read it later. Or never. It is not a very good poem.', '나중에 읽으시오. 아니면 영영 읽지 않아도 되오. 썩 좋은 시도 아니오.'),
      L('narr', 'You read it at once. It is a very good poem. It is about you.', '당신은 그 자리에서 읽는다. 썩 좋은 시다. 당신에 대한 시다.'),
    ],
    prompt: L('narr', 'He is studying the pond with great attention.', '그는 연못만 뚫어지게 바라보고 있다.'),
    choices: [
      {
        id: 'answer', label: T('Write a verse back, on the same page.', '같은 종이에 답시를 쓰자.'), say: T('Lend me your brush.', '붓을 좀 빌려주시오.'), tags: [T('Romance', '연모'), T('Han Seon-woo', '한선우')],
        reaction: [L('narr', 'He reads your answer twice, folds the paper very small, and puts it inside his robe, over his heart.', '그는 당신의 답시를 두 번 읽고, 종이를 아주 작게 접어 가슴께 도포 안에 넣는다.')],
        effects: [bond('han', 'lover'), reg('han', 12), moment('han', 'You answered his poem with one of your own.', '그의 시에 답시를 써 주었다.'), rec('Answered Han Seon-woo’s poem, and his heart.', '한선우의 시와 마음에 답했다.'), note('Han Seon-woo is now your lover', '한선우와 연인이 됨')],
        title: T('An answering verse', '답시'),
      },
      {
        id: 'friend', label: T('Tell him you will treasure it, as a friend.', '벗으로서 소중히 간직하겠다고 하자.'), say: T('It is a beautiful poem, Seon-woo. I will keep it always, as your friend.', '아름다운 시요, 선우. 벗으로서 평생 간직하겠소.'), tags: [T('Friendship', '우정')],
        reaction: [L('han', 'As my friend. Yes. That is what I meant, of course.', '벗으로서. 그렇지요. 물론 내 뜻도 그것이었소.')],
        effects: [reg('han', 2), bond('han', 'none')], title: T('As a friend', '벗으로'),
      },
    ],
  },
  {
    id: 'seo-arrows', title: T('Arrows at dusk', '해 질 녘의 활'), delivery: 'evening', place: 'rear-garden', time: 'night', cast: 'seo',
    when: { gender: 'man', married: false, alive: ['seo'], regard: [{ npc: 'seo', min: 52 }], bond: { npc: 'seo', is: ['none', 'romance'] } },
    lines: [
      L('narr', 'Seo Ha-eun is alone at the butts when you arrive, unstringing her bow by lantern light.', '당신이 도착했을 때 서하은은 홀로 활터에서 등불 아래 활시위를 풀고 있다.'),
      L('seo', 'You’re late. I’ve already beaten everyone else today.', '늦으셨네요. 오늘은 벌써 다른 사람들을 다 이겼어요.'),
      L('seo', 'My father says you would make a good match. He says it as if it were a complaint.', '아버지는 당신이 좋은 혼처가 될 거래요. 무슨 불평이라도 하듯이요.'),
      L('seo', 'So. Would you?', '그래서요. 그럴 건가요?'),
    ],
    prompt: L('narr', 'She does not look up from the bowstring.', '그녀는 시위에서 눈을 떼지 않는다.'),
    choices: [
      {
        id: 'yes', label: T('Tell her yes.', '그렇다고 하자.'), say: T('Yes. If you will have someone who loses to you at the butts.', '그러겠소. 활터에서 늘 그대에게 지는 사내라도 괜찮다면.'), tags: [T('Romance', '연모'), T('Seo Ha-eun', '서하은')],
        reaction: [L('seo', 'Every time. Good. Then it is settled.', '매번 지실 거예요. 좋아요. 그럼 정해졌네요.')],
        effects: [bond('seo', 'lover'), reg('seo', 14), moment('seo', 'She asked, and you said yes.', '그녀가 묻고, 당신이 답했다.'), rec('Gave your word to Seo Ha-eun, without asking anyone.', '아무에게도 묻지 않고 서하은에게 약조했다.'), note('Seo Ha-eun is now your beloved', '서하은과 정을 나눈 사이가 됨')],
        title: T('Settled', '정해진 일'),
      },
      {
        id: 'not-yet', label: T('Say you need time.', '시간이 필요하다고 하자.'), say: T('Ask me again in spring.', '봄에 다시 물어 주시오.'), tags: [T('Patience', '인내')],
        reaction: [L('seo', 'In spring, then. I will be a better shot by then. Be warned.', '그럼 봄에요. 그때는 활 솜씨가 더 늘어 있을 테니 각오하세요.')],
        effects: [bond('seo', 'romance'), reg('seo', 2)], title: T('In spring', '봄에'),
      },
    ],
  },
  {
    id: 'seoyeon-poem', title: T('A poem returned', '돌아온 시'), delivery: 'evening', place: 'rear-garden', time: 'night', cast: 'han-sister',
    when: { gender: 'man', married: false, alive: ['han-sister'], regard: [{ npc: 'han-sister', min: 55 }], bond: { npc: 'han-sister', is: ['none', 'romance'] } },
    lines: [
      L('narr', 'Han Seo-yeon returns the book you lent her. A slip of paper marks a page.', '한서연이 빌려 간 책을 돌려준다. 한 장 사이에 쪽지가 끼워져 있다.'),
      L('han-sister', 'I wrote an answer to the poem on that page. My brother doesn’t know. Please don’t tell him.', '그 장에 있는 시에 답을 써 두었어요. 오라버니는 몰라요. 말하지 말아 주세요.'),
      L('narr', 'The answer is not about the poem.', '그 답은 시에 관한 것이 아니다.'),
    ],
    prompt: L('narr', 'She is already walking away, very fast.', '그녀는 벌써 빠른 걸음으로 멀어지고 있다.'),
    choices: [
      {
        id: 'follow', label: T('Catch up with her.', '뒤따라가자.'), say: T('Seo-yeon. Wait.', '서연. 잠깐만.'), tags: [T('Romance', '연모'), T('Han Seo-yeon', '한서연')],
        reaction: [L('han-sister', 'You read it, then. Well. You can stop looking at me like that, or you can keep doing it.', '읽으셨군요. 그럼, 그렇게 바라보시는 걸 그만두셔도 되고, 계속하셔도 돼요.')],
        effects: [bond('han-sister', 'lover'), reg('han-sister', 12), moment('han-sister', 'She answered a poem, and you followed her.', '그녀가 시로 답했고, 당신이 뒤따랐다.'), note('Han Seo-yeon is now your beloved', '한서연과 정을 나눈 사이가 됨')],
        title: T('A poem answered', '답이 된 시'),
      },
      {
        id: 'keep-quiet', label: T('Keep the paper, and say nothing.', '쪽지를 간직하고 아무 말도 하지 말자.'), say: T('(You fold the slip of paper and keep it.)', '(쪽지를 접어 간직한다.)'), tags: [T('Caution', '신중')],
        reaction: [L('narr', 'She does not mention it again. Neither do you.', '그녀는 다시 그 이야기를 꺼내지 않는다. 당신도 마찬가지다.')],
        effects: [reg('han-sister', 1)], title: T('Unspoken', '말하지 않은 것'),
      },
    ],
  },
  // ------------------------------------------------------------------ court
  {
    id: 'rumour', title: T('A rumour at court', '조정의 소문'), delivery: 'evening', place: 'rear-garden', time: 'night', cast: 'baek',
    when: { generation: 1, alive: ['baek'], since: { flag: 'opened', days: 3 } },
    lines: [
      L('narr', 'By evening, the court ladies have stopped talking when you pass.', '저녁이 되자, 당신이 지나가면 궁녀들이 입을 다문다.'),
      L('baek', 'Oh, don’t look so worried. It’s only that people are saying such things.', '어머, 그렇게 걱정스러운 얼굴 하지 마세요. 그저 사람들이 이런저런 말을 하는 것뿐이니.'),
      L('baek', 'That you meet a guardsman by the pond after dark. I’m sure it isn’t true.', '해가 지면 연못가에서 무관을 만난다더군요. 설마 사실은 아니겠지요.', { gender: 'woman', flags: { 'secret-with-kang': true } }),
      L('baek', 'That your family has sold its rice land to pay your father’s debts. I’m sure it isn’t true.', '아버님 빚을 갚으려고 집안의 논을 팔았다더군요. 설마 사실은 아니겠지요.', { not: { gender: 'woman', flags: { 'secret-with-kang': true } } }),
      L('baek', 'Rumours are like smoke. They go wherever there is a fire.', '소문은 연기와 같지요. 불이 있는 곳이면 어디든 피어오르니까요.'),
    ],
    prompt: L('narr', 'Lady Baek smiles, waiting to see what you will do.', '백 부인이 웃으며 당신이 어떻게 나올지 기다린다.'),
    choices: [
      {
        id: 'laugh', label: T('Laugh it off, in front of everyone.', '모두 앞에서 웃어넘기자.'), say: T('How kind of people to take such an interest in me.', '사람들이 내게 그리 관심을 가져 주다니 고마운 일이구려.'), tags: [T('Grace', '품위')],
        reaction: [L('baek', 'How charming. They will remember that you laughed.', '참 재미있으시네. 다들 당신이 웃었다는 걸 기억할 거예요.')],
        effects: [q('grace', 2), stat('reputation', 2, { quality: { q: 'grace', min: 48 } }), stat('reputation', -1, { not: { quality: { q: 'grace', min: 48 } } })], title: T('Laughed off', '웃어넘김'),
      },
      {
        id: 'ask-who', label: T('Ask her, loudly, who told her.', '누가 그러더냐고 크게 묻자.'), say: T('Who told you that, Lady Baek? Say the name, so we can all hear it.', '누가 그런 말을 했소, 백씨 부인? 이름을 말해 보시오. 다 같이 들을 수 있게.'), tags: [T('Resolve', '결단력'), T('Makes a scene', '소란')],
        reaction: [L('baek', 'Everyone did. That is how rumours work.', '모두가요. 소문이란 원래 그런 거지요.')],
        effects: [q('resolve', 2), stat('reputation', -2), reg('baek', -10)], title: T('A scene', '소란'),
      },
      {
        id: 'counter', label: T('Start a rumour of your own about her husband.', '그녀 남편에 대한 소문을 퍼뜨리자.'), say: T('(You say nothing now. Tomorrow you will say a great deal, about her husband’s gambling debts.)', '(지금은 아무 말도 하지 않는다. 내일은 그녀 남편의 노름빚에 대해 아주 많은 말을 할 것이다.)'),
        tags: [T('Wit', '재치'), T('Lady Baek becomes an enemy', '백 부인과 원수가 됨')],
        reaction: [L('narr', 'Within a week the court talks of nothing else. Lady Baek stops smiling at you.', '이레도 지나지 않아 조정은 그 이야기뿐이다. 백씨 부인은 더는 당신에게 웃어 보이지 않는다.')],
        effects: [q('wit', 2), stat('reputation', 3), reg('baek', -20), trait('ruthless'), flag('rumour-war')], title: T('Smoke for smoke', '연기에는 연기로'),
      },
    ],
  },
  {
    id: 'summons', title: T('A royal summons', '어명'), delivery: 'letter', place: 'throne-hall', time: 'day', cast: 'king',
    when: { generation: 1, flags: { 'audience-done': false }, any: [{ minFavour: 24 }, { flags: { 'letter-handed': true } }], since: { flag: 'opened', days: 2 } },
    letter: {
      from: T('The Royal Secretariat', '승정원'), seal: '어',
      intro: T('A eunuch of the Royal Secretariat waits at your gate with a scroll tied in yellow silk.', '승정원 내관이 노란 비단으로 묶은 두루마리를 들고 대문 앞에 서 있다.'),
      body: T('{player} will attend the Throne Hall. The ruler wishes to see the face that goes with the name.', '{player}은(는) 인정전으로 들라. 이름의 주인을 직접 보고자 하신다.'),
      note: T('A summons cannot be refused. The Throne Hall is open to you until you have been received.', '어명은 거절할 수 없다. 알현을 마칠 때까지 인정전이 열려 있다.'),
      go: T('Obey the summons', '어명을 받든다'),
      goEffects: [flag('summoned')],
      goToast: T('Go to the Throne Hall when you are ready. It is marked on your map.', '준비되면 인정전으로 가라. 지도에 표시되어 있다.'),
    },
    lines: [], choices: [],
  },
  {
    id: 'audience', title: T('An audience with {king}', '{king} 알현'), delivery: 'arrive', place: 'throne-hall', time: 'day', cast: 'king',
    when: { flags: { summoned: true, 'audience-done': false } },
    lines: [
      L('narr', 'The throne hall is cold and very large. Officials line the courtyard by rank, and every one of them watches you cross it.', '정전은 차갑고 아주 넓다. 관리들이 품계대로 마당에 늘어서 있고, 그 모두가 당신이 마당을 건너는 모습을 지켜본다.'),
      L('king', 'So this is {father}’s {child}.', '그래, 네가 {father}의 {child}로구나.'),
      L('king', 'I am told you are clever. I am told a great many things. Most of them are lies, and the rest are dangerous.', '영리하다고 들었다. 과인은 많은 말을 듣는다. 대부분은 거짓이고, 나머지는 위험하지.'),
      L('king', 'You gave the Tribunal a letter that named your own father. Tell me why.', '네 아비의 이름이 적힌 서신을 의금부에 넘겼다지. 까닭을 말해 보라.', { flags: { 'handed-by-player': true } }),
      L('king', '{factionA} tell me I should not trust {factionB}. Tell me why I should.', '{factionA_i} 과인에게 {factionB_eul} 믿지 말라 하는구나. 어째서 믿어야 하는지 말해 보라.', { flags: { 'handed-by-player': false } }),
    ],
    prompt: L('narr', 'The whole court is listening. What do you say?', '온 조정이 귀를 기울인다. 무어라 답하겠는가?'),
    choices: [
      {
        id: 'throne', label: T('My loyalty is to the throne, before any faction.', '제 충성은 어느 당파보다 먼저 왕실에 있습니다.'), say: T('My loyalty is to the throne, before any faction, Your Majesty.', '신의 충심은 어느 당파보다 먼저 왕실에 있사옵니다, 전하.'),
        tags: [T('Royal favour', '왕의 총애'), T('Your father is uneasy', '아버지가 불편해함')],
        reaction: [L('king', 'A good answer. I have heard it before, from men I later exiled.', '좋은 대답이로다. 전에도 들은 적이 있지. 훗날 과인이 귀양 보낸 자들에게서.')],
        effects: [stat('favour', 10), reg('father', -5, { alive: ['father'] }), reg('king', 8), trait('loyal'), flag('audience-done'), flag('summoned', false), rec('Received in audience. Swore loyalty to the throne before the whole court.', '알현하여 온 조정 앞에서 왕실에 충성을 맹세했다.')],
        title: T('Loyal to the throne', '왕실에 충성'),
      },
      {
        id: 'father', label: T('My father is innocent. I would stake my life on it.', '아버지는 결백합니다. 목숨을 걸겠습니다.'), say: T('My father is innocent, Your Majesty. I would stake my life on it.', '신의 아비는 결백하옵니다, 전하. 목숨을 걸겠사옵니다.'),
        tags: [T('Resolve', '결단력'), T('Your father', '아버지')],
        reaction: [L('king', 'Then I will hold you to that stake. Do not make me collect it.', '그렇다면 그 목숨을 걸어 둔 것으로 하마. 과인이 그것을 거두게 하지 마라.')],
        effects: [q('resolve', 3), stat('favour', 3), reg('father', 10, { alive: ['father'] }), reg('king', 4), flag('audience-done'), flag('summoned', false), flag('staked-life'), rec('Staked your life on your father’s innocence, before the throne.', '어전에서 아버지의 결백에 목숨을 걸었다.')],
        title: T('A life at stake', '목숨을 건 말'),
      },
      {
        id: 'truth', label: T('A wise ruler needs people who tell the truth.', '현명한 군주에게는 진실을 말하는 자가 필요합니다.'), say: T('A wise ruler needs people who tell the truth, Your Majesty, not only people who agree.', '현명한 임금께는 동의하는 자만이 아니라 진실을 아뢰는 자가 필요하옵니다, 전하.'),
        tags: [T('Wit', '재치'), T('A gamble', '도박')],
        reaction: [L('king', 'Bold. We shall see whether it is also true.', '대담하구나. 그것이 진실이기도 한지 두고 보자.')],
        effects: [q('wit', 3), stat('favour', 8, { quality: { q: 'wit', min: 48 } }), stat('favour', -4, { not: { quality: { q: 'wit', min: 48 } } }), reg('king', 6), trait('bold'), flag('audience-done'), flag('summoned', false), rec('Told the ruler, to his face, that he needed honest servants.', '임금께 정직한 신하가 필요하다고 아뢰었다.')],
        title: T('A bold answer', '대담한 대답'),
      },
    ],
  },
  // ------------------------------------------------------------------ marriage and career (season events)
  {
    id: 'matchmaker', title: T('The matchmaker', '중매'), delivery: 'season', place: 'residence', time: 'day', cast: 'mother', yearly: true,
    when: { married: false, minAge: 16, minDay: 2, flags: { 'proposals-open': false, betrothed: false, 'proposals-wait': false }, alive: ['mother'] },
    lines: [
      L('narr', 'The matchmaker arrives with the new season, carrying a bundle of names wrapped in red silk.', '새 철이 시작되자 중매쟁이가 붉은 비단에 싼 이름 꾸러미를 들고 찾아온다.'),
      L('mother', '{given}, sit. Your father and I have been weighing proposals. It is time.', '{given}, 앉거라. 네 아버지와 내가 혼처를 저울질해 왔다. 때가 되었구나.'),
      L('mother', 'You may tell me which one you favour. I cannot promise your father will listen. But I will.', '마음에 두는 혼처가 있으면 내게 말하거라. 아버지께서 들어 주실지는 약속 못 한다. 하지만 나는 듣겠다.'),
    ],
    prompt: L('narr', 'Your mother lays the names out one by one.', '어머니가 이름들을 하나씩 펼쳐 놓는다.'),
    choices: [
      {
        id: 'look', label: T('Look at the proposals with her.', '어머니와 함께 혼처를 살펴보자.'), say: T('Show me, Mother.', '보여 주세요, 어머님.'), tags: [T('Marriage', '혼인'), T('Your family decides next season', '다음 철에 집안이 결정함')],
        reaction: [L('mother', 'Take your time. Not too much time.', '천천히 보거라. 너무 천천히는 말고.')],
        effects: [{ kind: 'proposals' }, reg('mother', 3), note('Open your Family page to see the proposals and tell your mother which you favour.', '가문 화면에서 혼처를 보고 어머니께 마음에 둔 혼처를 알리세요.')],
        title: T('The proposals', '혼처'),
      },
      {
        id: 'wait', label: T('Ask her to wait another year.', '한 해만 더 기다려 달라고 하자.'), say: T('Not yet, Mother. One more year.', '아직은 아닙니다, 어머님. 한 해만 더요.'), tags: [T('Your mother is displeased', '어머니가 언짢아함')],
        reaction: [L('mother', 'One year. Your father will not give you two.', '한 해다. 네 아버지는 두 해는 주지 않을 게다.')],
        effects: [reg('mother', -5), flag('proposals-wait')], title: T('One more year', '한 해만 더'),
      },
    ],
  },
  {
    id: 'matchmaker-father', title: T('The matchmaker', '중매'), delivery: 'season', place: 'residence', time: 'day', cast: 'father', yearly: true,
    when: { married: false, minAge: 16, minDay: 2, flags: { 'proposals-open': false, betrothed: false, 'proposals-wait': false }, alive: ['father'], not: { alive: ['mother'] } },
    lines: [
      L('narr', 'The matchmaker arrives with the new season, carrying a bundle of names wrapped in red silk.', '새 철이 시작되자 중매쟁이가 붉은 비단에 싼 이름 꾸러미를 들고 찾아온다.'),
      L('father', 'Your mother would have done this better. Sit. We will do it together.', '네 어머니였다면 이 일을 더 잘했을 텐데. 앉거라. 함께 하자꾸나.'),
    ],
    prompt: L('narr', 'Your father unties the red silk.', '아버지가 붉은 비단을 푼다.'),
    choices: [
      { id: 'look', label: T('Look at the proposals with him.', '아버지와 함께 혼처를 살펴보자.'), say: T('Show me, Father.', '보여 주십시오, 아버님.'), tags: [T('Marriage', '혼인')], reaction: [L('father', 'Tell me honestly which one you favour. I will try to listen.', '어느 쪽이 마음에 드는지 솔직히 말하거라. 들으려 애써 보마.')], effects: [{ kind: 'proposals' }, reg('father', 3), note('Open your Family page to see the proposals and say which you favour.', '가문 화면에서 혼처를 보고 마음에 둔 혼처를 알리세요.')], title: T('The proposals', '혼처') },
      { id: 'wait', label: T('Ask him to wait another year.', '한 해만 더 기다려 달라고 하자.'), say: T('Not yet, Father. One more year.', '아직은 아닙니다, 아버님. 한 해만 더 기다려 주십시오.'), tags: [T('Your father is displeased', '아버지가 언짢아함')], reaction: [L('father', 'One year.', '한 해다.')], effects: [reg('father', -5), flag('proposals-wait')], title: T('One more year', '한 해만 더') },
    ],
  },
  {
    id: 'matchmaker-alone', title: T('The matchmaker', '중매'), delivery: 'season', place: 'residence', time: 'day', cast: 'narr', yearly: true,
    when: { married: false, minAge: 16, minDay: 2, flags: { 'proposals-open': false, betrothed: false, 'proposals-wait': false }, not: { any: [{ alive: ['mother'] }, { alive: ['father'] }] } },
    lines: [
      L('narr', 'With your parents gone, the matchmaker comes to you directly, carrying a bundle of names wrapped in red silk.', '부모님이 안 계시니 중매쟁이가 붉은 비단에 싼 이름 꾸러미를 들고 곧장 당신을 찾아온다.'),
      L('narr', 'There is no one left to approve or forbid. That is a freedom, and a loneliness.', '허락하거나 막을 사람이 이제 아무도 없다. 그것은 자유이자 외로움이다.'),
    ],
    prompt: L('narr', 'She waits for you to untie the silk.', '중매쟁이가 당신이 비단을 풀기를 기다린다.'),
    choices: [
      { id: 'look', label: T('Look at the proposals.', '혼처를 살펴보자.'), say: T('Show me.', '보여 주게.'), tags: [T('Marriage', '혼인')], reaction: [L('narr', 'She lays out the names one by one.', '그녀가 이름을 하나씩 펼쳐 놓는다.')], effects: [{ kind: 'proposals' }, note('Open your Family page to see the proposals and choose.', '가문 화면에서 혼처를 보고 고르세요.')], title: T('The proposals', '혼처') },
      { id: 'wait', label: T('Send her away for a year.', '한 해 뒤에 오라고 하자.'), say: T('Come back next year.', '내년에 다시 오게.'), tags: [T('Freedom', '자유')], reaction: [L('narr', 'She bows, and takes the names away.', '그녀는 절을 하고 이름들을 거두어 간다.')], effects: [flag('proposals-wait')], title: T('Not this year', '올해는 아님') },
    ],
  },
  {
    id: 'exam', title: T('The spring examination', '봄 과거'), delivery: 'season', place: 'academy', time: 'day', cast: 'han', yearly: true,
    when: { season: 0, minAge: 16, office: false, examYear: true, canExam: true },
    lines: [
      L('narr', 'The spring examination. Thousands of candidates kneel on straw mats in the palace grounds, brushes ready, waiting for the question to be hung.', '봄 과거. 수천 명의 유생이 궁궐 마당의 짚방석 위에 무릎을 꿇고, 붓을 든 채 시제가 걸리기를 기다린다.'),
      L('han', 'Whatever they ask, don’t write what you think they want. Everyone will write that.', '무엇을 묻든, 저들이 원할 것 같은 답은 쓰지 마시오. 다들 그렇게 쓸 테니.', { alive: ['han'] }),
      L('narr', 'The question unrolls: What should a ruler do when his ministers will not stop quarrelling?', '시제가 펼쳐진다. 신하들이 다툼을 그치지 않을 때 임금은 어찌해야 하는가?'),
    ],
    prompt: L('narr', 'How will you answer?', '어떻게 답을 쓰겠는가?'),
    choices: [
      {
        id: 'safe', label: T('Quote the classics and praise the throne.', '경전을 인용하고 왕실을 칭송하자.'), say: T('(You write a careful essay that offends no one.)', '(아무도 거슬리지 않을 신중한 답안을 쓴다.)'), tags: [T('Depends on wit', '재치에 달림')],
        reaction: [L('narr', 'The examiners read hundreds of essays like yours. A few of them pass.', '시관들은 당신 것과 같은 답안을 수백 장 읽는다. 그중 몇 장만 급제한다.')],
        effects: [{ kind: 'exam', style: 'safe' }], title: T('A careful essay', '신중한 답안'),
      },
      {
        id: 'bold', label: T('Argue that the factions should be abolished.', '당파를 없애야 한다고 논하자.'), say: T('(You write that the court’s factions are a disease, and name the cure.)', '(조정의 당파는 병이라 쓰고, 그 처방을 적는다.)'), tags: [T('Wit and resolve', '재치와 결단력'), T('Royal favour if you pass', '급제하면 총애')],
        reaction: [L('narr', 'One examiner reads it twice. Another tears it, then pieces it back together.', '한 시관은 두 번 읽는다. 다른 시관은 찢었다가 다시 이어 붙인다.')],
        effects: [{ kind: 'exam', style: 'bold' }, reg('ryu', -5, { alive: ['ryu'] })], title: T('A bold essay', '대담한 답안'),
      },
      {
        id: 'faction', label: T('Defend {factionB} openly.', '{factionB_eul} 공공연히 옹호하자.'), say: T('(You write in defence of {factionB}, and sign it proudly.)', '({factionB_eul} 옹호하는 글을 쓰고 당당히 이름을 적는다.)'), tags: [T('Depends on resolve', '결단력에 달림'), T('Your father approves', '아버지가 흡족해함')],
        reaction: [L('narr', 'Your essay is passed hand to hand in the examiners’ tent. Not all the hands are friendly.', '당신의 답안이 시관들의 장막 안에서 손에서 손으로 건네진다. 모두가 우호적인 손은 아니다.')],
        effects: [{ kind: 'exam', style: 'faction' }, reg('father', 8, { alive: ['father'] }), stat('favour', -3)], title: T('A partisan essay', '당파의 답안'),
      },
      {
        id: 'military', when: { any: [{ background: 'military' }, { quality: { q: 'resolve', min: 50 } }] }, label: T('Sit the military examination instead.', '대신 무과를 보자.'), say: T('(You take up the bow instead of the brush.)', '(붓 대신 활을 잡는다.)'), tags: [T('Depends on resolve', '결단력에 달림'), T('Military career', '무관의 길')],
        reaction: [L('narr', 'Archery, horsemanship, and a written test on the military classics. Your arm is steady.', '활쏘기, 말타기, 그리고 병서에 관한 필기시험. 당신의 팔은 흔들림이 없다.')],
        effects: [{ kind: 'exam', style: 'military' }], title: T('The military examination', '무과'),
      },
    ],
  },
  // ------------------------------------------------------------------ 1728: the Musin rebellion
  {
    id: 'musin', title: T('The southern rebellion', '무신년의 난'), delivery: 'season', place: 'residence', time: 'night', cast: 'father',
    when: { era: 1724, year: { from: 1728, to: 1728 }, flags: { 'musin-done': false } },
    lines: [
      L('narr', 'News comes north faster than the rebels: Yi In-jwa has taken Cheongju, swearing that the king is a usurper and a poisoner.', '반란군보다 소식이 먼저 북으로 올라온다. 이인좌가 청주를 점령하고, 임금이 왕위를 빼앗고 선왕을 독살했다고 외친다고 한다.'),
      L('narr', 'Some of the rebels are {factionB} men. Some of them are men your father once called friends.', '반란군 가운데에는 {factionB} 사람들이 있다. 아버님이 한때 벗이라 부르던 이들도 있다.'),
      L('father', 'Every {factionB} house in the capital will be watched now. Every letter read. Every guest counted.', '이제 도성의 {factionB} 집안은 모두 감시를 받을 게다. 서신은 모두 읽히고, 손님은 모두 헤아려질 게다.', { alive: ['father'] }),
      L('narr', 'At midnight, someone knocks at the back gate. It is a young man from your family’s old circle, wounded, begging to be hidden.', '한밤중에 누군가 뒷문을 두드린다. 집안의 오랜 인연이던 젊은이가 다친 몸으로 숨겨 달라 애원한다.'),
    ],
    prompt: L('narr', 'Your household is waiting for you to decide.', '집안 모두가 당신의 결정을 기다린다.'),
    choices: [
      {
        id: 'hide', label: T('Hide him in the storehouse.', '광에 숨겨 주자.'), say: T('Bring him in. Quietly. The storehouse, behind the rice jars.', '들이거라. 조용히. 광으로, 쌀독 뒤로.'), tags: [T('Compassion', '측은지심'), T('Treason if found', '들키면 역모')],
        reaction: [L('narr', 'He weeps when you close the storehouse door on him. You do not sleep.', '광문을 닫아 주자 그는 눈물을 흘린다. 당신은 잠을 이루지 못한다.')],
        effects: [q('resolve', 3), flag('sheltered-rebel'), flag('musin-done'), rec('Hid a wounded rebel in the storehouse.', '다친 반란군 하나를 광에 숨겼다.')], title: T('Behind the rice jars', '쌀독 뒤에'),
      },
      {
        id: 'turn-in', label: T('Turn him over to the Royal Guard.', '내금위에 넘기자.'), say: T('Send for the Royal Guard. I am sorry. I am.', '내금위를 부르거라. 미안하오. 정말 미안하오.'), tags: [T('Royal favour', '왕의 총애'), T('Your family will not forgive you', '집안이 용서하지 않음')],
        reaction: [L('narr', 'The guard come within the hour. He does not look at you as they take him.', '한 시진도 지나지 않아 내금위가 온다. 끌려가는 동안 그는 당신을 보지 않는다.')],
        effects: [stat('favour', 10), reg('father', -10, { alive: ['father'] }), stat('reputation', -3), trait('loyal'), flag('musin-done'), flag('turned-in-rebel'), rec('Turned a wounded rebel over to the Royal Guard.', '다친 반란군을 내금위에 넘겼다.')], title: T('Loyal, and alone', '충성, 그리고 외로움'),
      },
      {
        id: 'send-away', label: T('Give him money and send him away.', '노자를 주어 보내자.'), say: T('Take this, and be gone before dawn. You were never here.', '이걸 가지고 날이 밝기 전에 떠나시오. 그대는 여기 온 적이 없소.'), tags: [T('Wit', '재치'), T('A small risk', '작은 위험')],
        reaction: [L('narr', 'He is gone before the cock crows. You burn the bloodied cloth he left behind.', '닭이 울기 전에 그는 사라진다. 당신은 그가 남긴 피 묻은 천을 태운다.')],
        effects: [q('wit', 1), reg('father', 3, { alive: ['father'] }), flag('musin-done')], title: T('Gone before dawn', '새벽이 오기 전에'),
      },
    ],
  },
  {
    id: 'caught', title: T('Officers at the gate', '대문 앞의 나졸'), delivery: 'season', place: 'residence', time: 'day', cast: 'kang',
    when: { flags: { 'sheltered-rebel': true, 'caught-done': false } },
    lines: [
      L('narr', 'Officers of the State Tribunal arrive at dawn with a warrant to search the house.', '날이 밝자 의금부 관원들이 집을 뒤지라는 명을 받고 들이닥친다.'),
      L('narr', 'Kang Mu-yeol leads them. He searches the storehouse himself, alone, and comes out empty-handed.', '강무열이 그들을 이끈다. 그는 홀로 광을 뒤지고는 빈손으로 나온다.', { flags: { 'secret-with-kang': true } }),
      L('kang', 'Nothing here. We are wasting the morning.', '여긴 아무것도 없다. 아침나절만 허비했구나.', { flags: { 'secret-with-kang': true } }),
      L('narr', 'The officers go straight to the storehouse. Someone has told them exactly where to look.', '관원들이 곧장 광으로 간다. 누군가 정확히 어디를 뒤져야 하는지 일러 준 것이다.', { flags: { 'secret-with-kang': false } }),
    ],
    prompt: L('narr', 'What now?', '이제 어쩌겠는가?'),
    choices: [
      {
        id: 'saved', when: { flags: { 'secret-with-kang': true } }, label: T('Say nothing, and thank him later.', '아무 말 말고 나중에 고마움을 전하자.'), say: T('(You stand very still until the officers leave.)', '(관원들이 떠날 때까지 꼼짝 않고 서 있는다.)'), tags: [T('Kang Mu-yeol', '강무열')],
        reaction: [L('kang', 'That was the last time. I mean it.', '이번이 마지막이오. 진심이오.', undefined, T('He says it at the gate, very quietly, and does not wait for an answer.', '그는 대문 앞에서 아주 조용히 그렇게 말하고, 대답을 기다리지 않는다.'))],
        effects: [flag('caught-done'), reg('kang', 6), moment('kang', 'He searched the storehouse himself, and found nothing.', '그가 직접 광을 뒤지고도 아무것도 찾지 못했다.')], title: T('Nothing to find', '찾을 것 없음'),
      },
      {
        id: 'blame-self', when: { flags: { 'secret-with-kang': false } }, label: T('Take the blame yourself.', '죄를 혼자 짊어지자.'), say: T('I hid him. No one else in this house knew.', '내가 숨겼소. 이 집안의 다른 누구도 몰랐소.'), tags: [T('Your life ends here', '이 삶이 여기서 끝남')],
        reaction: [L('narr', 'The sentence comes within the month: exile to Jeju, for life. Your family is spared because you were not.', '한 달이 못 되어 판결이 내려진다. 제주 종신 유배. 당신이 화를 입은 덕에 집안은 화를 면한다.')],
        effects: [flag('caught-done'), { kind: 'end', ending: 'exile', inYears: 8 }, rec('Took the blame for hiding a rebel, and was exiled to Jeju for life.', '반란군을 숨긴 죄를 홀로 지고 제주로 종신 유배되었다.')], title: T('Exile', '유배'),
      },
      {
        id: 'blame-father', when: { flags: { 'secret-with-kang': false }, alive: ['father'] }, label: T('Let your father answer for the house.', '집안의 일은 아버지가 책임지게 하자.'), say: T('(You say nothing. Your father steps forward.)', '(아무 말도 하지 않는다. 아버지가 앞으로 나서신다.)'), tags: [T('Your father is exiled', '아버지가 유배됨')],
        reaction: [L('father', 'It was my house and my storehouse. Take me.', '내 집이고 내 광이다. 나를 데려가라.')],
        effects: [flag('caught-done'), { kind: 'fate', npc: 'father', fate: 'exiled' }, stat('prestige', -2), reg('father', -20), rec('Your father was exiled for the rebel you hid.', '당신이 숨긴 반란군 때문에 아버지가 유배되었다.')], title: T('Your father pays', '아버지가 치른 값'),
      },
    ],
  },
  // ------------------------------------------------------------------ alternative Joseon
  {
    id: 'queen-petition', title: T('A petition against the queen', '여왕을 향한 상소'), delivery: 'season', place: 'throne-hall', time: 'day', cast: 'ryu',
    when: { premise: 'queen', minDay: 60, flags: { 'petition-done': false }, alive: ['ryu'] },
    lines: [
      L('narr', 'Minister Ryu circulates a petition: a queen must marry, and rule through her husband, as heaven intends.', '류 대감이 상소를 돌린다. 여왕은 혼인하여 하늘의 뜻대로 지아비를 통해 다스려야 한다는 내용이다.'),
      L('ryu', 'Every family of standing will sign. Your father has not. I thought you might persuade him.', '지체 있는 집안은 모두 서명할 것이오. 그대 아버님은 아직이시던데, 그대가 설득해 주리라 생각했소.'),
    ],
    prompt: L('narr', 'He holds out the brush.', '그가 붓을 내민다.'),
    choices: [
      { id: 'sign', label: T('Sign it.', '서명하자.'), say: T('(You sign.)', '(서명한다.)'), tags: [T('{factionA}', '{factionA}'), T('The queen will know', '여왕이 알게 됨')], reaction: [L('ryu', 'Wise. Very wise.', '현명하오. 아주 현명하오.')], effects: [stat('favour', -10), reg('ryu', 15), flag('petition-done')], title: T('Signed', '서명함') },
      { id: 'refuse', label: T('Refuse.', '거절하자.'), say: T('Heaven chose her, Minister. I will not argue with heaven.', '하늘이 그분을 택하셨습니다, 대감. 저는 하늘과 다투지 않겠습니다.'), tags: [T('Royal favour', '왕의 총애')], reaction: [L('ryu', 'Heaven changes its mind more often than you think.', '하늘은 그대가 생각하는 것보다 자주 마음을 바꾸지.')], effects: [stat('favour', 10), reg('ryu', -10), flag('petition-done')], title: T('Refused', '거절함') },
      { id: 'counter', label: T('Write a counter-petition.', '반대 상소를 쓰자.'), say: T('I will write one of my own, and see whose has more names.', '저도 상소를 써서, 어느 쪽에 이름이 더 많은지 보겠습니다.'), tags: [T('Wit', '재치'), T('Prestige', '가문의 위세')], reaction: [L('narr', 'Yours has more names. The queen reads it aloud in council.', '당신의 상소에 이름이 더 많다. 여왕이 어전 회의에서 그것을 소리 내어 읽는다.')], effects: [q('wit', 2), stat('favour', 15), stat('reputation', 3), stat('prestige', 1), reg('ryu', -20), flag('petition-done')], title: T('More names', '더 많은 이름') },
    ],
  },
  {
    id: 'two-heirs', title: T('Two heirs, one throne', '두 왕자, 하나의 왕좌'), delivery: 'season', place: 'rear-garden', time: 'day', cast: 'han',
    when: { premise: 'heirs', minDay: 60, flags: { 'heirs-done': false } },
    lines: [
      L('narr', 'Both princes send gifts to your family in the same week: a celadon vase from the elder, a set of brushes from the younger.', '같은 주에 두 왕자가 모두 당신 집안에 선물을 보낸다. 큰 왕자는 청자 꽃병을, 작은 왕자는 붓 한 벌을.'),
      L('han', 'Everyone is choosing. The ones who choose late will be remembered as the ones who chose wrong.', '다들 줄을 서고 있소. 늦게 고르는 자는 잘못 고른 자로 기억될 거요.', { alive: ['han'] }),
    ],
    prompt: L('narr', 'Which gift will your family keep?', '어느 선물을 받겠는가?'),
    choices: [
      { id: 'elder', label: T('The elder prince’s vase.', '큰 왕자의 청자.'), say: T('We will keep the vase.', '꽃병을 두겠습니다.'), tags: [T('{factionA}', '{factionA}')], reaction: [L('narr', 'The younger prince’s servant takes back the brushes without a word.', '작은 왕자의 하인이 말없이 붓을 도로 가져간다.')], effects: [reg('ryu', 10), stat('favour', 5), flag('heirs-done'), flag('chose-elder')], title: T('The elder', '큰 왕자') },
      { id: 'younger', label: T('The younger prince’s brushes.', '작은 왕자의 붓.'), say: T('We will keep the brushes.', '붓을 두겠습니다.'), tags: [T('{factionB}', '{factionB}')], reaction: [L('narr', 'The elder prince’s servant takes back the vase, and looks at your house for a long time.', '큰 왕자의 하인이 꽃병을 도로 가져가며, 오래도록 당신의 집을 바라본다.')], effects: [reg('father', 5, { alive: ['father'] }), stat('favour', -3), q('resolve', 2), flag('heirs-done'), flag('chose-younger')], title: T('The younger', '작은 왕자') },
      { id: 'neither', label: T('Return both, with thanks.', '둘 다 정중히 돌려보내자.'), say: T('Return them both, with our deepest thanks.', '둘 다 깊은 감사와 함께 돌려보내십시오.'), tags: [T('Wit', '재치'), T('Neither forgets', '둘 다 잊지 않음')], reaction: [L('narr', 'Both princes are offended. Neither can say so.', '두 왕자 모두 언짢아한다. 둘 다 그렇다고 말할 수는 없다.')], effects: [q('wit', 2), stat('reputation', 2), flag('heirs-done')], title: T('Neither', '어느 쪽도') },
    ],
  },
  {
    id: 'royal-wedding', title: T('The crown prince’s wedding', '세자의 가례'), delivery: 'season', place: 'queens-hall', time: 'day', cast: 'choi',
    when: { premise: 'peace', minDay: 60, flags: { 'wedding-done': false } },
    lines: [
      L('narr', 'The crown prince is to marry, and the palace needs every steady hand it can find.', '세자의 가례가 열린다. 궁궐은 믿을 만한 손이라면 하나라도 아쉽다.'),
      L('choi', 'The queen has asked for you by name. Do not make me regret it.', '중전마마께서 직접 너를 찾으셨다. 내가 후회하지 않게 하거라.'),
    ],
    prompt: L('narr', 'How will you serve?', '어떻게 섬기겠는가?'),
    choices: [
      { id: 'serve', label: T('Serve flawlessly, and say nothing.', '흠 없이 섬기고 말을 아끼자.'), say: T('I will not make you regret it.', '후회하지 않게 해 드리겠습니다.'), tags: [T('Grace', '품위'), T('Royal favour', '왕의 총애')], reaction: [L('choi', 'You did not. That is the highest praise I give.', '후회하지 않았다. 내가 줄 수 있는 가장 큰 칭찬이다.')], effects: [q('grace', 3), stat('favour', 6), reg('choi', 8), flag('wedding-done')], title: T('Flawless', '흠 없이') },
      { id: 'notice', label: T('Make sure the queen notices you.', '중전께서 알아보시도록 하자.'), say: T('Perhaps I could carry the queen’s cup.', '중전마마의 찻잔은 제가 받들면 어떨까요?'), tags: [T('Royal favour', '왕의 총애'), T('Court Lady Choi disapproves', '최 상궁이 못마땅해함')], reaction: [L('choi', 'Perhaps you could carry the cushions, as you were told.', '방석이나 나르거라. 이른 대로.')], effects: [stat('favour', 9), reg('choi', -6), stat('reputation', 2), flag('wedding-done')], title: T('Noticed', '눈에 띄다') },
    ],
  },
];

EVENTS.push(...MORE_EVENTS, ...HISTORY_EVENTS, ...CULTURE_EVENTS);

export const eventById = (id: string) => EVENTS.find((e) => e.id === id);
