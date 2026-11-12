import type { Premise, Text } from '../model/schemas';
import { T } from '../engine/text';
import { KINGS, PALACES, factionsFor, palaceKey, reignIndex } from './history';

export type Era = {
  year: number;
  moon: number;
  king: Text;
  title: Text;
  text: Text;
  court: Text;
  palace: Text;
  /** Two narration lines that open the first scene. */
  intro: [Text, Text];
  /** What the forged letter says. */
  accusation: Text;
};

const GENERIC_ACCUSATION = T(
  'It names His Majesty’s closest ministers as traitors and calls on loyal men to strike first.',
  '전하의 측근들을 역적이라 부르며, 먼저 들고일어나라고 선동하는 내용이다.',
);

export const ERAS: Era[] = [
  {
    year: 1418, moon: 9, king: T('King Sejong', '세종'), palace: T('Gyeongbokgung', '경복궁'),
    title: T('King Sejong takes the throne', '세종 즉위'),
    text: T('A scholar-king begins his reign. Learning is rewarded, new talent rises quickly, and old families must prove their worth again.', '학자 군주의 치세가 시작된다. 학문이 존중받고 새 인재가 빠르게 떠오르며, 오랜 가문은 다시 실력을 증명해야 한다.'),
    court: T('Favour goes to the learned', '학식 있는 자가 총애를 받는다'),
    intro: [
      T('In the eighth moon, King Taejong gave the throne to his third son. King Sejong is twenty-one, and the old king still watches from his retirement.', '지난 8월, 태종께서 셋째 아들에게 왕위를 물려주셨다. 스물한 살의 새 임금 뒤에서 상왕이 여전히 지켜보고 있다.'),
      T('The men who helped Taejong to power expect to keep it. The new king prefers scholars.', '태종을 도운 공신들은 권세를 놓을 생각이 없다. 그러나 새 임금은 학자들을 아낀다.'),
    ],
    accusation: GENERIC_ACCUSATION,
  },
  {
    year: 1506, moon: 10, king: T('King Jungjong', '중종'), palace: T('Gyeongbokgung', '경복궁'),
    title: T('A king crowned by coup', '반정으로 오른 임금'),
    text: T('Nobles depose the tyrant Yeonsangun and crown his half-brother, Jungjong. The men who led the coup expect their reward, and the new king owes them everything.', '신하들이 폭군 연산군을 몰아내고 이복동생 중종을 세웠다. 반정 공신들은 보상을 기대하고, 새 임금은 그들에게 모든 것을 빚졌다.'),
    court: T('The coup leaders and their rivals', '반정 공신과 그 맞수들'),
    intro: [
      T('Last month, nobles marched into the palace and deposed Yeonsangun. His half-brother, now King Jungjong, was crowned the next day.', '지난달, 신하들이 궁으로 들어가 연산군을 폐위했다. 이튿날 그의 이복동생이 중종으로 즉위했다.'),
      T('The men who led the coup expect their reward, and the new king owes them everything.', '반정 공신들은 보상을 기다리고, 새 임금은 그들에게 모든 것을 빚졌다.'),
    ],
    accusation: GENERIC_ACCUSATION,
  },
  {
    year: 1724, moon: 9, king: T('King Yeongjo', '영조'), palace: T('Changdeokgung', '창덕궁'),
    title: T('King Yeongjo takes the throne', '영조 즉위'),
    text: T('Prince Yeoning becomes King Yeongjo after his half-brother’s sudden death. Whispers of poison follow him into the throne hall, and the Noron and Soron each wait for the other to fall.', '이복형의 갑작스러운 죽음 뒤 연잉군이 영조로 즉위했다. 독살설이 그를 따라 어좌까지 들어왔고, 노론과 소론은 서로가 무너지기를 기다린다.'),
    court: T('Noron and Soron factions', '노론과 소론'),
    intro: [
      T('In the eighth moon, King Gyeongjong died suddenly, and his half-brother Prince Yeoning became King Yeongjo.', '지난 8월, 경종께서 갑자기 승하하시고 이복동생 연잉군이 영조로 즉위하셨다.'),
      T('Whispers of poison followed him into the throne hall. The Noron put him there. The Soron fear what comes next.', '독살설이 새 임금을 따라 어좌까지 들어왔다. 노론은 그를 세웠고, 소론은 다가올 일을 두려워한다.'),
    ],
    accusation: T('The first line accuses His Majesty of poisoning the late king, his own brother.', '첫 줄부터 전하께서 친형인 선왕을 독살했다고 고발하고 있다.'),
  },
  {
    year: 1776, moon: 5, king: T('King Jeongjo', '정조'), palace: T('Changdeokgung', '창덕궁'),
    title: T('The son of Crown Prince Sado is crowned', '사도세자의 아들, 왕위에 오르다'),
    text: T('King Jeongjo, whose father died locked in a rice chest by royal order, takes the throne. The officials who wanted his father dead now kneel before him.', '아버지가 어명으로 뒤주에 갇혀 죽은 정조가 왕위에 올랐다. 그 아버지의 죽음을 바랐던 신하들이 이제 그 앞에 엎드린다.'),
    court: T('Byeokpa and Sipa factions', '벽파와 시파'),
    intro: [
      T('In the third moon, King Yeongjo died after more than fifty years on the throne. His grandson is now King Jeongjo.', '지난 3월, 오십 년 넘게 나라를 다스린 영조께서 승하하시고 손자가 정조로 즉위하셨다.'),
      T('Fourteen years ago the new king’s father died locked in a rice chest. The officials who wanted him dead now kneel before his son.', '열네 해 전, 새 임금의 아버지는 뒤주에 갇혀 죽었다. 그 죽음을 바랐던 신하들이 이제 그 아들 앞에 엎드린다.'),
    ],
    accusation: GENERIC_ACCUSATION,
  },
  {
    year: 1863, moon: 12, king: T('King Gojong', '고종'), palace: T('Changdeokgung', '창덕궁'),
    title: T('A boy king and his regent father', '어린 임금과 섭정 아버지'),
    text: T('Young Gojong is crowned, and his father, the Heungseon Daewongun, rules in his name. The great in-law clans are pushed aside, and the ruined Gyeongbokgung will soon rise again.', '어린 고종이 즉위하고, 아버지 흥선대원군이 그의 이름으로 나라를 다스린다. 세도 가문들은 밀려나고, 폐허가 된 경복궁이 곧 다시 세워질 것이다.'),
    court: T('The regent against the in-law clans', '대원군과 세도 가문'),
    intro: [
      T('This month King Cheoljong died without a son. A boy of eleven has been crowned as King Gojong.', '이달 철종께서 후사 없이 승하하시고, 열한 살 소년이 고종으로 즉위하셨다.'),
      T('His father, the Heungseon Daewongun, rules in his name, and the great in-law clans are about to be pushed aside.', '그 아버지 흥선대원군이 아들의 이름으로 나라를 다스리고, 세도 가문들은 곧 밀려날 참이다.'),
    ],
    accusation: GENERIC_ACCUSATION,
  },
];

export const ALT_START = { year: 1724, moon: 9 };

export type PremiseDef = {
  id: Premise;
  title: Text;
  text: Text;
  ruler: Text;
  intro: [Text, Text];
  accusation: Text;
};

export const PREMISES: PremiseDef[] = [
  {
    id: 'queen',
    title: T('A queen on the throne', '여왕의 치세'),
    text: T('The late king had no son. His daughter has been crowned, and half the court refuses to bow. Women may sit the examinations in her reign.', '선왕에게는 아들이 없었다. 그 딸이 왕위에 올랐고 조정의 절반은 고개를 숙이지 않는다. 여왕의 치세에는 여인도 과거를 볼 수 있다.'),
    ruler: T('Queen Seon', '선 여왕'),
    intro: [
      T('The late king left no son. His daughter has been crowned, the first queen to rule Joseon in her own name.', '선왕은 아들을 남기지 못했다. 그 딸이 왕위에 올라, 제 이름으로 조선을 다스리는 첫 여왕이 되었다.'),
      T('Half the court refuses to bow. The other half is waiting to see who wins.', '조정의 절반은 고개를 숙이지 않고, 나머지 절반은 누가 이길지 지켜보고 있다.'),
    ],
    accusation: T('It calls the queen’s reign an offence against heaven and names the ministers who will end it.', '여왕의 치세를 하늘에 대한 죄라 부르며, 그것을 끝낼 대신들의 이름을 적어 두었다.'),
  },
  {
    id: 'heirs',
    title: T('Two heirs, one throne', '두 왕자, 하나의 왕좌'),
    text: T('The king is gravely ill and has named no successor. Two princes are gathering allies, and every family must choose one.', '임금은 위중하나 후계를 정하지 않았다. 두 왕자가 세력을 모으고, 모든 가문이 한쪽을 골라야 한다.'),
    ruler: T('King Hyeonjo', '현조'),
    intro: [
      T('The king is gravely ill and has named no successor.', '임금은 위중하나 아직 후계를 정하지 않았다.'),
      T('Two princes are gathering allies, and every family at court must choose one.', '두 왕자가 세력을 모으고, 조정의 모든 가문은 한쪽을 골라야 한다.'),
    ],
    accusation: T('It promises the throne to the elder prince and lists the ministers sworn to deliver it.', '큰 왕자에게 왕위를 약속하며, 그 일을 맹세한 대신들의 이름을 적어 두었다.'),
  },
  {
    id: 'peace',
    title: T('A long and peaceful reign', '길고 평화로운 치세'),
    text: T('No crisis at the throne. The drama lives in marriages, careers and family pride.', '왕좌에는 위기가 없다. 이야기는 혼인과 벼슬, 가문의 자존심 속에 있다.'),
    ruler: T('King Hyeonjo', '현조'),
    intro: [
      T('King Hyeonjo has reigned for twenty years without a war, a famine or a purge.', '현조께서는 이십 년 동안 전쟁도 기근도 사화도 없이 나라를 다스리셨다.'),
      T('The drama at this court lives in marriages, careers and family pride.', '이 조정의 이야기는 혼인과 벼슬, 가문의 자존심 속에 있다.'),
    ],
    accusation: T('It accuses His Majesty’s ministers of stealing from the granaries, and names your father as their leader.', '전하의 대신들이 나라 창고를 털었다고 고발하며, 그 우두머리로 아버님의 이름을 적어 두었다.'),
  },
];

export const ALT_FACTIONS = { a: T('the Old Guard', '원로파'), b: T('the Reformers', '개혁파') };

/** Any year from 1392 to 1897: a featured era opens with its own story; other years get a generic opening. */
export function eraOf(year: number): Era {
  const featured = ERAS.find((e) => e.year === year);
  if (featured) return featured;
  if (!Number.isFinite(year) || year < 1392 || year > 1897) return ERAS[2];
  const i = reignIndex(year, 1);
  const k = KINGS[i];
  const reignYear = year - k.from[0] + 1;
  const f = factionsFor(year);
  const pal = PALACES[palaceKey(year)];
  return {
    year, moon: 1, king: k.title, palace: pal,
    title: T(`The ${ordinalEn(reignYear)} year of ${k.title.en}`, `${k.title.ko} ${reignYear}년`),
    text: T(`${k.title.en} reigns from ${pal.en}. ${f.a.en.charAt(0).toUpperCase() + f.a.en.slice(1)} and ${f.b.en} contest the court.`, `${k.title.ko}께서 ${pal.ko}에서 다스리신다. ${f.a.ko}과(와) ${f.b.ko}이(가) 조정을 다툰다.`),
    court: T(`${f.a.en.charAt(0).toUpperCase() + f.a.en.slice(1)} and ${f.b.en}`, `${f.a.ko}과(와) ${f.b.ko}`),
    intro: [
      T(`It is the ${ordinalEn(reignYear)} year of ${k.title.en}’s reign, and the court sits at ${pal.en}.`, `${k.title.ko} ${reignYear}년, 조정은 ${pal.ko}에 있다.`),
      T(`${f.a.en.charAt(0).toUpperCase() + f.a.en.slice(1)} hold the great offices; ${f.b.en} wait for them to stumble.`, `${f.a.ko}이(가) 요직을 쥐고 있고, ${f.b.ko}은(는) 그들이 넘어지기를 기다린다.`),
    ],
    accusation: GENERIC_ACCUSATION,
  };
}
const ordinalEn = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
export const premiseOf = (id: Premise | null) => PREMISES.find((p) => p.id === id) ?? PREMISES[0];
