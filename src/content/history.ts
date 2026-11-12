import type { Text } from '../model/schemas';
import { T } from '../engine/text';

/**
 * Kings of Joseon with the year and lunar month each reign began.
 * Months are approximate. Have this list reviewed before release.
 */
export type Reign = { title: Text; from: [number, number]; born: number };
export const KINGS: Reign[] = [
  { title: T('King Taejo', '태조'), from: [1392, 7], born: 1335 },
  { title: T('King Jeongjong', '정종'), from: [1398, 9], born: 1357 },
  { title: T('King Taejong', '태종'), from: [1400, 11], born: 1367 },
  { title: T('King Sejong', '세종'), from: [1418, 8], born: 1397 },
  { title: T('King Munjong', '문종'), from: [1450, 2], born: 1414 },
  { title: T('King Danjong', '단종'), from: [1452, 5], born: 1441 },
  { title: T('King Sejo', '세조'), from: [1455, 6], born: 1417 },
  { title: T('King Yejong', '예종'), from: [1468, 9], born: 1450 },
  { title: T('King Seongjong', '성종'), from: [1469, 11], born: 1457 },
  { title: T('Yeonsangun', '연산군'), from: [1494, 12], born: 1476 },
  { title: T('King Jungjong', '중종'), from: [1506, 9], born: 1488 },
  { title: T('King Injong', '인종'), from: [1544, 11], born: 1515 },
  { title: T('King Myeongjong', '명종'), from: [1545, 7], born: 1534 },
  { title: T('King Seonjo', '선조'), from: [1567, 6], born: 1552 },
  { title: T('Gwanghaegun', '광해군'), from: [1608, 2], born: 1575 },
  { title: T('King Injo', '인조'), from: [1623, 3], born: 1595 },
  { title: T('King Hyojong', '효종'), from: [1649, 5], born: 1619 },
  { title: T('King Hyeonjong', '현종'), from: [1659, 5], born: 1641 },
  { title: T('King Sukjong', '숙종'), from: [1674, 8], born: 1661 },
  { title: T('King Gyeongjong', '경종'), from: [1720, 6], born: 1688 },
  { title: T('King Yeongjo', '영조'), from: [1724, 8], born: 1694 },
  { title: T('King Jeongjo', '정조'), from: [1776, 3], born: 1752 },
  { title: T('King Sunjo', '순조'), from: [1800, 7], born: 1790 },
  { title: T('King Heonjong', '헌종'), from: [1834, 11], born: 1827 },
  { title: T('King Cheoljong', '철종'), from: [1849, 6], born: 1831 },
  { title: T('King Gojong', '고종'), from: [1863, 12], born: 1852 },
];

const key = (y: number, m: number) => y * 12 + (m - 1);

export function reignIndex(year: number, moon: number): number {
  const k = key(year, moon);
  let idx = 0;
  KINGS.forEach((r, i) => { if (key(r.from[0], r.from[1]) <= k) idx = i; });
  return idx;
}

export type PalaceKey = 'gbg' | 'cdg';
/** Gyeongbokgung burned in 1592 and was rebuilt in the 1860s; the court lived at Changdeokgung in between. */
export const palaceKey = (year: number): PalaceKey => (year < 1592 || year >= 1868 ? 'gbg' : 'cdg');
export const PALACES: Record<PalaceKey, Text> = { gbg: T('Gyeongbokgung', '경복궁'), cdg: T('Changdeokgung', '창덕궁') };

/** The two sides of the court in each period: A holds power, B is the player's family's side. */
export function factionsFor(year: number): { a: Text; b: Text } {
  if (year < 1468) return { a: T('the merit subjects', '공신'), b: T('the Hall of Worthies scholars', '집현전 학사') };
  if (year < 1575) return { a: T('the Hungu', '훈구파'), b: T('the Sarim', '사림파') };
  if (year < 1680) return { a: T('the Westerners', '서인'), b: T('the Easterners', '동인') };
  if (year < 1762) return { a: T('the Noron', '노론'), b: T('the Soron', '소론') };
  if (year < 1800) return { a: T('the Byeokpa', '벽파'), b: T('the Sipa', '시파') };
  if (year < 1863) return { a: T('the Andong Kim clan', '안동 김씨'), b: T('the Pungyang Jo clan', '풍양 조씨') };
  if (year < 1874) return { a: T('the in-law clans', '외척'), b: T('the regent’s men', '대원군 측근') };
  return { a: T('the Min clan', '민씨 척족'), b: T('the reformers', '개화파') };
}

/** Seasonal letters for the historical campaign. Have dates and wording reviewed before release. */
export const HISTORY: { year: number; moon: number; text: Text }[] = [
  { year: 1419, moon: 6, text: T('Joseon’s fleet sails against the pirate bases on Tsushima.', '조선 수군이 대마도 정벌에 나섰다.') },
  { year: 1420, moon: 3, text: T('The king founds the Hall of Worthies, a court of young scholars.', '임금께서 집현전을 설치하셨다.') },
  { year: 1443, moon: 12, text: T('The king completes a new script for the Korean language.', '임금께서 새 글자를 만드셨다.') },
  { year: 1446, moon: 9, text: T('The new script is proclaimed to the people as Hunminjeongeum.', '훈민정음이 반포되었다.') },
  { year: 1453, moon: 10, text: T('Prince Suyang kills Chief State Councillor Kim Jong-seo and seizes the government.', '수양대군이 김종서를 죽이고 권력을 잡았다.') },
  { year: 1456, moon: 6, text: T('Six officials are executed for plotting to restore the deposed young king.', '상왕 복위를 꾀한 신하 여섯이 처형되었다.') },
  { year: 1510, moon: 4, text: T('Japanese residents of the three southern ports rise in revolt.', '삼포의 왜인들이 난을 일으켰다.') },
  { year: 1519, moon: 11, text: T('The reformer Jo Gwang-jo and his scholars are purged.', '조광조와 사림이 화를 입었다.') },
  { year: 1592, moon: 4, text: T('Japanese armies land at Busan. The king flees north, and the palaces burn.', '왜군이 부산에 상륙했다. 임금은 북으로 피란하고 궁궐이 불탔다.') },
  { year: 1598, moon: 11, text: T('The war ends. Admiral Yi Sun-sin falls in the last battle.', '전쟁이 끝났다. 이순신 장군이 마지막 싸움에서 전사했다.') },
  { year: 1627, moon: 1, text: T('The Later Jin invade from the north.', '후금이 북쪽에서 쳐들어왔다.') },
  { year: 1636, moon: 12, text: T('The Qing invade. The king takes refuge in Namhansanseong fortress.', '청이 쳐들어와 임금이 남한산성으로 피했다.') },
  { year: 1637, moon: 1, text: T('The king surrenders to the Qing emperor at Samjeondo.', '임금이 삼전도에서 청 황제에게 항복했다.') },
  { year: 1728, moon: 3, text: T('Yi In-jwa’s rebels take Cheongju, calling the king a usurper. The rising is crushed within weeks.', '이인좌의 난이 일어나 청주가 함락되었으나 곧 진압되었다.') },
  { year: 1750, moon: 7, text: T('The king halves the military cloth tax that weighs on the poor.', '임금께서 군포를 반으로 줄이셨다.') },
  { year: 1762, moon: 5, text: T('Crown Prince Sado dies, sealed in a rice chest by his father’s order.', '사도세자가 뒤주에 갇혀 세상을 떠났다.') },
  { year: 1776, moon: 9, text: T('The king founds the Gyujanggak royal library.', '임금께서 규장각을 세우셨다.') },
  { year: 1796, moon: 9, text: T('Hwaseong fortress is completed at Suwon.', '수원 화성이 완공되었다.') },
  { year: 1801, moon: 1, text: T('The Catholic faith is outlawed, and its followers persecuted.', '천주교가 금지되고 신자들이 박해를 받았다.') },
  { year: 1811, moon: 12, text: T('Hong Gyeong-rae leads a revolt in the northwest.', '홍경래가 평안도에서 난을 일으켰다.') },
  { year: 1862, moon: 2, text: T('Farmers rise against corrupt officials at Jinju and across the south.', '진주를 비롯한 남쪽 고을에서 농민들이 들고일어났다.') },
  { year: 1865, moon: 4, text: T('The regent orders Gyeongbokgung rebuilt.', '대원군이 경복궁 중건을 명했다.') },
  { year: 1866, moon: 9, text: T('French warships attack Ganghwa Island and are driven off.', '프랑스 함대가 강화도를 공격했으나 물러갔다.') },
  { year: 1871, moon: 4, text: T('American ships attack Ganghwa Island and are driven off.', '미국 함대가 강화도를 공격했으나 물러갔다.') },
  { year: 1873, moon: 11, text: T('The king takes power in his own name. The regent retires.', '임금께서 친정을 시작하시고 대원군이 물러났다.') },
  { year: 1876, moon: 2, text: T('Joseon signs a treaty opening its ports to Japan.', '조선이 일본과 조약을 맺고 항구를 열었다.') },
  { year: 1882, moon: 6, text: T('Soldiers unpaid for a year riot in the capital.', '봉급을 받지 못한 군인들이 난을 일으켰다.') },
  { year: 1884, moon: 10, text: T('Reformers seize the palace for three days before Qing troops end the coup.', '개화파가 사흘 동안 정권을 잡았으나 청군에 밀려났다.') },
  { year: 1894, moon: 1, text: T('The Donghak farmers rise in Jeolla.', '동학 농민군이 전라도에서 일어났다.') },
  { year: 1895, moon: 8, text: T('The queen is murdered in Gyeongbokgung by Japanese agents.', '왕비가 경복궁에서 일본인들에게 시해되었다.') },
  { year: 1897, moon: 10, text: T('The king proclaims the Korean Empire and takes the title of emperor.', '임금께서 대한제국을 선포하고 황제가 되셨다.') },
];

/** Seasonal letters for the alternative campaign, counted in years from the start. */
export const ALT_HISTORY: Record<'queen' | 'heirs' | 'peace', { after: number; moon: number; text: Text }[]> = {
  queen: [
    { after: 1, moon: 3, text: T('Envoys from the Qing court ask, politely, when the queen intends to marry.', '청나라 사신이 여왕의 혼사를 넌지시 물었다.') },
    { after: 3, moon: 6, text: T('The queen appoints the first women to the Office of Special Advisers.', '여왕이 처음으로 여인을 홍문관에 임명했다.') },
    { after: 6, moon: 9, text: T('A son is born to the queen. The court argues over whose name he will carry.', '여왕이 아들을 낳았다. 조정은 그 아이의 성을 두고 다툰다.') },
  ],
  heirs: [
    { after: 1, moon: 2, text: T('The king’s illness worsens. His physicians are forbidden to speak of it.', '임금의 병이 깊어졌다. 어의들은 입을 다물라는 명을 받았다.') },
    { after: 4, moon: 8, text: T('The king recovers enough to ride again, and both princes pretend to be glad.', '임금이 다시 말을 탈 만큼 회복했다. 두 왕자는 기쁜 척한다.') },
  ],
  peace: [
    { after: 2, moon: 7, text: T('A good harvest. The granaries are full for the first time in ten years.', '풍년이 들었다. 십 년 만에 창고가 가득 찼다.') },
    { after: 5, moon: 10, text: T('The crown prince marries. The capital celebrates for three days.', '세자가 혼례를 올렸다. 도성이 사흘 동안 잔치를 벌였다.') },
  ],
};
