import type { Quality, Status, Text } from '../model/schemas';
import { T } from '../engine/text';

export const GIFTS: { id: string; name: Text }[] = [
  { id: 'pouch', name: T('Embroidered silk pouch', '수놓은 비단 주머니') },
  { id: 'poems', name: T('Book of Tang poems', '당시집') },
  { id: 'paper', name: T('Fine hanji paper', '고급 한지') },
  { id: 'fan', name: T('Painted fan', '그림 부채') },
];
export const giftName = (id: string) => GIFTS.find((g) => g.id === id)?.name ?? T(id);
export const MAX_GIFTS = 4;

export const TRAITS: Record<string, { ko: string; name: Text; text: Text }> = {
  composed: { ko: '침착', name: T('Composed', '침착함'), text: T('You rarely show fear in public.', '사람들 앞에서 좀처럼 두려움을 드러내지 않는다.') },
  'quick-witted': { ko: '재치', name: T('Quick-witted', '재치'), text: T('You always have an answer, sometimes too quickly.', '늘 대답이 준비되어 있다. 때로는 너무 빨리.') },
  proud: { ko: '자존', name: T('Proud', '자존심'), text: T('You find slights hard to forgive.', '모욕을 쉽게 잊지 못한다.') },
  discreet: { ko: '신중', name: T('Discreet', '신중함'), text: T('You keep secrets, including your own.', '비밀을 지킨다. 자기 비밀까지도.') },
  loyal: { ko: '충직', name: T('Loyal', '충직함'), text: T('The throne can count on you, even against your own.', '자기 사람에게 등을 돌려서라도 왕실 편에 선다.') },
  honest: { ko: '정직', name: T('Honest', '정직함'), text: T('You tell the truth when a lie would be easier.', '거짓말이 쉬울 때에도 진실을 말한다.') },
  ruthless: { ko: '냉정', name: T('Ruthless', '냉정함'), text: T('You answer a blow with a harder one.', '한 대 맞으면 더 세게 돌려준다.') },
  devoted: { ko: '정성', name: T('Devoted', '지극함'), text: T('Once you give your heart, you do not take it back.', '한번 마음을 주면 거두지 않는다.') },
  bold: { ko: '대담', name: T('Bold', '대담함'), text: T('You say aloud what others only whisper.', '남들이 속삭이는 말을 소리 내어 한다.') },
  diligent: { ko: '근면', name: T('Diligent', '근면함'), text: T('You finish what you start, and then start again.', '시작한 일은 끝내고, 다시 시작한다.') },
  generous: { ko: '후덕', name: T('Generous', '후덕함'), text: T('No one leaves your gate empty-handed.', '당신 집 대문을 빈손으로 나서는 사람은 없다.') },
  courageous: { ko: '용감', name: T('Courageous', '용감함'), text: T('You step forward when others step back.', '남들이 물러설 때 앞으로 나선다.') },
  diplomatic: { ko: '원만', name: T('Diplomatic', '원만함'), text: T('You can make enemies sit at one table.', '원수끼리도 한 상에 앉힐 줄 안다.') },
  principled: { ko: '강직', name: T('Principled', '강직함'), text: T('There are things you will not do, whatever the price.', '어떤 대가를 치러도 하지 않을 일이 있다.') },
  reserved: { ko: '과묵', name: T('Reserved', '과묵함'), text: T('You speak little and remember everything.', '말은 적고 기억은 많다.') },
  curious: { ko: '호기심', name: T('Curious', '호기심'), text: T('You ask why, and then you ask again.', '왜냐고 묻고, 또 묻는다.') },
  traditional: { ko: '전통', name: T('Traditional', '전통을 따름'), text: T('The old ways are old for a reason.', '옛 법도가 오래된 데는 까닭이 있다.') },
  independent: { ko: '독립', name: T('Independent', '독립적'), text: T('You would rather be wrong alone than right in a crowd.', '무리 속에서 옳기보다 홀로 틀리는 편을 택한다.') },
  competitive: { ko: '승부', name: T('Competitive', '승부욕'), text: T('Second place is a kind of losing.', '이등은 진 것이나 마찬가지다.') },
  arrogant: { ko: '오만', name: T('Arrogant', '오만함'), text: T('You expect the room to rise when you enter.', '당신이 들어서면 모두 일어서야 한다고 여긴다.') },
  greedy: { ko: '탐욕', name: T('Greedy', '탐욕스러움'), text: T('Enough is a word for other people.', '넉넉함이란 남의 이야기다.') },
  jealous: { ko: '시기', name: T('Jealous', '시기심'), text: T('Another’s rise feels like your fall.', '남이 오르면 내가 떨어지는 것 같다.') },
  deceitful: { ko: '간교', name: T('Deceitful', '간교함'), text: T('The truth is one tool among many.', '진실은 여러 도구 가운데 하나일 뿐이다.') },
  impulsive: { ko: '경솔', name: T('Impulsive', '경솔함'), text: T('You act first and think on the way.', '먼저 움직이고 가면서 생각한다.') },
  vindictive: { ko: '앙심', name: T('Vindictive', '앙심'), text: T('You keep a list, and you keep it current.', '원한의 목록을 늘 새로 고쳐 쓴다.') },
};

export const QUALITY_NAMES: Record<Quality, Text> = {
  wit: T('Wit', '재치'),
  grace: T('Grace', '품위'),
  resolve: T('Resolve', '결단력'),
};
export const QUALITY_TEXT: Record<Quality, Text> = {
  wit: T('Learning, poetry and the quick answer at court.', '학문과 시, 조정에서의 재빠른 대답.'),
  grace: T('Etiquette, beauty and the art of being admired.', '예법과 아름다움, 존경받는 기술.'),
  resolve: T('Courage, ambition and the will to act when it costs you.', '용기와 야망, 대가를 치르더라도 행동하는 의지.'),
};
export const STAT_NAMES: Record<'health' | 'reputation' | 'favour' | 'prestige', Text> = {
  health: T('Health', '건강'),
  reputation: T('Reputation', '평판'),
  favour: T('Royal favour', '왕의 총애'),
  prestige: T('Family prestige', '가문의 위세'),
};

export const STATUS_NAMES: Record<Status, Text> = {
  stranger: T('Stranger', '낯선 사람'),
  acquaintance: T('Acquaintance', '아는 사이'),
  friend: T('Friend', '벗'),
  closeFriend: T('Close friend', '막역한 벗'),
  romanticInterest: T('Romantic interest', '연모하는 사이'),
  lover: T('Lover', '연인'),
  betrothed: T('Betrothed', '정혼자'),
  spouse: T('Spouse', '배우자'),
  rival: T('Rival', '맞수'),
  enemy: T('Enemy', '원수'),
};

export function reputationWord(v: number): Text {
  if (v >= 80) return T('Revered', '추앙받음');
  if (v >= 60) return T('Admired', '존경받음');
  if (v >= 40) return T('Well regarded', '평판이 좋음');
  if (v >= 20) return T('Doubted', '의심받음');
  return T('Disgraced', '추락함');
}
export function reputationText(v: number): Text {
  if (v >= 80) return T('The court speaks of you as an example to others.', '조정은 당신을 본보기로 삼는다.');
  if (v >= 60) return T('Polite society seeks your company.', '양반 사회가 당신과 어울리고 싶어 한다.');
  if (v >= 40) return T('Polite society speaks of you kindly, for now.', '아직은 다들 당신을 좋게 말한다.');
  if (v >= 20) return T('People lower their voices when you pass.', '당신이 지나가면 사람들이 목소리를 낮춘다.');
  return T('Doors close before you knock.', '두드리기도 전에 문이 닫힌다.');
}
export function healthWord(v: number): Text {
  if (v >= 80) return T('Excellent', '아주 좋음');
  if (v >= 60) return T('Good', '좋음');
  if (v >= 40) return T('Unwell', '편찮음');
  if (v >= 20) return T('Frail', '쇠약함');
  return T('Gravely ill', '위중함');
}
export function prestigeWord(v: number): Text {
  return [T('Fallen', '몰락'), T('Minor', '한미함'), T('Respected', '존중받음'), T('Distinguished', '명망 높음'), T('Great', '세도가')][Math.max(1, Math.min(5, v)) - 1];
}
export const WEALTH: Record<'poor' | 'modest' | 'comfortable' | 'rich', Text> = {
  poor: T('Poor', '가난함'), modest: T('Modest', '넉넉지 않음'), comfortable: T('Comfortable', '넉넉함'), rich: T('Rich', '부유함'),
};

/** Offices for the simplified career: rank 1 to 5. */
export const OFFICES: Record<'civil' | 'military', Text[]> = {
  civil: [
    T('Proofreader, Office of Diplomatic Correspondence', '승문원 정자'),
    T('Counsellor, Office of Special Advisers', '홍문관 교리'),
    T('Royal Secretary', '승정원 승지'),
    T('Minister of Rites', '예조 판서'),
    T('Third State Councillor', '우의정'),
  ],
  military: [
    T('Officer of the Royal Guard', '내금위 군관'),
    T('Commander of a capital company', '훈련도감 초관'),
    T('Captain of the Royal Guard', '내금위장'),
    T('Commander of the Capital Garrison', '훈련대장'),
    T('Minister of War', '병조 판서'),
  ],
};

export type EndingDef = { key: string; title: Text; ko: string };
export const ENDINGS: Record<string, EndingDef> = {
  monarch: { key: 'monarch', title: T('Reigned over Joseon', '보위에 올라 나라를 다스리다'), ko: '군왕' },
  regent: { key: 'regent', title: T('Ruled from behind the screen', '수렴청정으로 나라를 이끌다'), ko: '섭정' },
  consort: { key: 'consort', title: T('A queen of Joseon', '조선의 왕비'), ko: '왕비' },
  statesman: { key: 'statesman', title: T('A pillar of the state', '나라의 기둥'), ko: '재상' },
  general: { key: 'general', title: T('A general of renown', '이름난 장수'), ko: '장수' },
  merchant: { key: 'merchant', title: T('A fortune built in the market', '저잣거리에서 일군 부'), ko: '거부' },
  commoner: { key: 'commoner', title: T('A commoner to the end', '끝내 평민으로'), ko: '평민' },
  restored: { key: 'restored', title: T('Name restored', '신원을 회복하다'), ko: '신원' },
  avenged: { key: 'avenged', title: T('Justice without restoration', '복권 없는 설욕'), ko: '설욕' },
  exile: { key: 'exile', title: T('Exiled to Jeju', '제주 유배'), ko: '유배' },
  condemned: { key: 'condemned', title: T('Condemned by royal order', '어명으로 사약을 받다'), ko: '사약' },
  keeper: { key: 'keeper', title: T('The keeper of secrets', '비밀을 지킨 사람'), ko: '비밀' },
  loyal: { key: 'loyal', title: T('Loyal to the throne', '충신'), ko: '충신' },
  favourite: { key: 'favourite', title: T('The ruler’s favourite', '임금의 총애를 받은 이'), ko: '총애' },
  heart: { key: 'heart', title: T('A marriage of the heart', '마음으로 맺은 혼인'), ko: '연분' },
  house: { key: 'house', title: T('The founder of a great house', '가문을 일으킨 사람'), ko: '가문' },
  quiet: { key: 'quiet', title: T('A quiet life', '조용한 한평생'), ko: '평생' },
  dynasty: { key: 'dynasty', title: T('The last years of Joseon', '조선의 마지막 해'), ko: '황혼' },
};
