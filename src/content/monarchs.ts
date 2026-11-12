import type { Text } from '../model/schemas';
import { T } from '../engine/text';

/**
 * GSDD Part IV §3: the monarch database. One profile per reign, in the order of KINGS in history.ts.
 * Dates are by the Gregorian year. Characteristics and policies are summaries of standard scholarship
 * (confidence: well-supported); names and reign dates are from the Annals (confidence: verified).
 * To be reviewed by a historian before release.
 */
export type Confidence = 'verified' | 'well-supported' | 'reconstructed' | 'fictional' | 'alternate';
export const CONFIDENCE: Record<Confidence, Text> = {
  verified: T('Verified', '사료 확인'),
  'well-supported': T('Well-supported', '학계 통설'),
  reconstructed: T('Reconstructed', '재구성'),
  fictional: T('Fictional', '창작'),
  alternate: T('Alternate history', '대체 역사'),
};
export const SOURCES = {
  annals: T('Annals of the Joseon Dynasty (Joseon wangjo sillok)', '조선왕조실록'),
  secretariat: T('Diaries of the Royal Secretariat (Seungjeongwon ilgi)', '승정원일기'),
  nikh: T('National Institute of Korean History, Korean History Database', '국사편찬위원회 한국사데이터베이스'),
  aks: T('Encyclopedia of Korean Culture (Academy of Korean Studies)', '한국민족문화대백과사전 (한국학중앙연구원)'),
};

export type Monarch = {
  temple: Text;
  personal: Text;
  born: number;
  from: number;
  to: number;
  died: number;
  lineage: Text;
  traits: Text;
  policies: Text;
  /** Deposed kings have no temple name and are known as princes (gun). */
  deposed?: boolean;
};

const M = (temple: [string, string], personal: [string, string], born: number, from: number, to: number, died: number, lineage: [string, string], traits: [string, string], policies: [string, string], deposed = false): Monarch => ({
  temple: T(...temple), personal: T(...personal), born, from, to, died, lineage: T(...lineage), traits: T(...traits), policies: T(...policies), ...(deposed ? { deposed } : {}),
});

export const MONARCHS: Monarch[] = [
  M(['Taejo', '태조'], ['Yi Seong-gye', '이성계'], 1335, 1392, 1398, 1408, ['Founder of the dynasty; a general of late Goryeo', '왕조의 창업자. 고려 말의 장수'], ['A soldier-king who relied on his ministers, above all Jeong Do-jeon.', '정도전 등 신하들에게 크게 의지한 무장 출신의 임금.'], ['Founded Joseon; moved the capital to Hanyang (1394); abdicated after the first strife of the princes (1398).', '조선을 세우고 한양으로 천도(1394), 제1차 왕자의 난 뒤 물러났다(1398).']),
  M(['Jeongjong', '정종'], ['Yi Bang-gwa', '이방과'], 1357, 1398, 1400, 1419, ['Second son of Taejo', '태조의 둘째 아들'], ['A reluctant king in his brother’s shadow.', '아우의 그늘 아래 있던 마지못한 임금.'], ['Moved the court back to Gaegyeong; abdicated to his brother Bang-won (1400).', '개경으로 환도했다가 아우 방원에게 양위했다(1400).']),
  M(['Taejong', '태종'], ['Yi Bang-won', '이방원'], 1367, 1400, 1418, 1422, ['Fifth son of Taejo', '태조의 다섯째 아들'], ['Ruthless in securing the throne, determined to make the crown stronger than any clan.', '왕권을 지키는 데 냉혹했고, 어떤 가문보다 강한 왕실을 만들려 했다.'], ['Abolished private armies; the hopae identity tag; curbed royal in-laws; installed the sinmungo petition drum.', '사병을 혁파하고 호패법을 시행했으며 외척을 견제하고 신문고를 설치했다.']),
  M(['Sejong', '세종'], ['Yi Do', '이도'], 1397, 1418, 1450, 1450, ['Third son of Taejong', '태종의 셋째 아들'], ['A scholar-king who drew talent to the Hall of Worthies and governed by consultation.', '집현전에 인재를 모으고 의논으로 다스린 학자 군주.'], ['Promulgated the Korean alphabet (1446); rain gauges and water clocks; the northern frontier garrisons.', '훈민정음 반포(1446), 측우기와 자격루, 4군 6진 개척.']),
  M(['Munjong', '문종'], ['Yi Hyang', '이향'], 1414, 1450, 1452, 1452, ['Eldest son of Sejong', '세종의 맏아들'], ['Learned and in poor health.', '학식이 깊었으나 몸이 약했다.'], ['A short reign continuing his father’s projects.', '부왕의 사업을 이은 짧은 치세.']),
  M(['Danjong', '단종'], ['Yi Hong-wi', '이홍위'], 1441, 1452, 1455, 1457, ['Only son of Munjong', '문종의 외아들'], ['A boy king dominated by his ministers and then his uncle.', '대신들과 숙부에게 휘둘린 어린 임금.'], ['Lost power in the 1453 coup of Prince Suyang; abdicated in 1455; demoted and killed in 1457.', '1453년 수양대군의 정변으로 실권을 잃고 1455년 양위, 1457년 강등되어 죽임을 당했다.']),
  M(['Sejo', '세조'], ['Yi Yu', '이유'], 1417, 1455, 1468, 1468, ['Second son of Sejong (Prince Suyang)', '세종의 둘째 아들(수양대군)'], ['Took the throne by force and ruled with a strong hand through his merit subjects.', '무력으로 왕위에 올라 공신들과 함께 강하게 다스렸다.'], ['Executed the six martyred ministers (1456) and closed the Hall of Worthies; began the Gyeongguk daejeon code.', '사육신을 처형하고(1456) 집현전을 폐지했으며 경국대전 편찬을 시작했다.']),
  M(['Yejong', '예종'], ['Yi Hwang', '이황'], 1450, 1468, 1469, 1469, ['Second son of Sejo', '세조의 둘째 아들'], ['Reigned barely a year.', '1년 남짓 재위했다.'], ['The Nam I treason case (1468).', '남이의 옥사(1468).']),
  M(['Seongjong', '성종'], ['Yi Hyeol', '이혈'], 1457, 1469, 1494, 1494, ['Grandson of Sejo', '세조의 손자'], ['Came to the throne at twelve; grew into a patient, bookish ruler.', '열두 살에 즉위해 학문을 좋아하는 차분한 군주로 자랐다.'], ['Completed the Gyeongguk daejeon (1485); brought Sarim scholars into office.', '경국대전을 완성하고(1485) 사림을 등용했다.']),
  M(['Prince Yeonsan', '연산군'], ['Yi Yung', '이융'], 1476, 1494, 1506, 1506, ['Son of Seongjong and the deposed Queen Yun', '성종과 폐비 윤씨의 아들'], ['Remembered as a tyrant; turned on the scholars and the censors.', '폭군으로 기억된다. 선비와 언관을 탄압했다.'], ['The literati purges of 1498 and 1504; deposed in the coup of 1506.', '무오사화(1498)와 갑자사화(1504), 1506년 중종반정으로 폐위.'], true),
  M(['Jungjong', '중종'], ['Yi Yeok', '이역'], 1488, 1506, 1544, 1544, ['Half-brother of Prince Yeonsan', '연산군의 이복동생'], ['Raised by a coup and often hemmed in by those who raised him.', '반정으로 즉위해 반정공신들에게 자주 휘둘렸다.'], ['Jo Gwang-jo’s reforms, ended by the purge of 1519.', '조광조의 개혁과 기묘사화(1519).']),
  M(['Injong', '인종'], ['Yi Ho', '이호'], 1515, 1544, 1545, 1545, ['Eldest son of Jungjong', '중종의 맏아들'], ['Filial and gentle; reigned under a year.', '효성스럽고 온화했다. 1년이 못 되어 승하했다.'], ['Little time to act.', '뜻을 펼 시간이 없었다.']),
  M(['Myeongjong', '명종'], ['Yi Hwan', '이환'], 1534, 1545, 1567, 1567, ['Son of Jungjong and Queen Munjeong', '중종과 문정왕후의 아들'], ['Overshadowed by his mother’s regency and her brother Yun Won-hyeong.', '어머니의 수렴청정과 외숙 윤원형의 그늘에 가렸다.'], ['The Eulsa purge (1545); the Border Defence Council made permanent (1555).', '을사사화(1545), 비변사 상설화(1555).']),
  M(['Seonjo', '선조'], ['Yi Yeon', '이연'], 1552, 1567, 1608, 1608, ['Grandson of Jungjong through a collateral prince', '중종의 서손'], ['The first king from a collateral line; patron of scholars, tested by war.', '방계에서 처음 즉위한 임금. 학자를 아꼈으나 전쟁의 시험을 받았다.'], ['The split into Easterners and Westerners (1575); the Imjin War (1592–1598).', '동서 분당(1575), 임진왜란(1592–1598).']),
  M(['Prince Gwanghae', '광해군'], ['Yi Hon', '이혼'], 1575, 1608, 1623, 1641, ['Son of Seonjo by a royal consort', '선조와 후궁의 아들'], ['Pragmatic and harsh; steered between Ming and the rising Jurchen.', '실리적이고 가혹했다. 명과 후금 사이에서 줄타기를 했다.'], ['The uniform land tax in Gyeonggi (1608); postwar rebuilding; deposed in 1623 and died in exile on Jeju.', '경기 대동법(1608), 전후 복구, 1623년 폐위되어 제주 유배 중 사망.'], true),
  M(['Injo', '인조'], ['Yi Jong', '이종'], 1595, 1623, 1649, 1649, ['Grandson of Seonjo', '선조의 손자'], ['Raised by the Westerners’ coup; his reign was shaped by two invasions.', '서인의 반정으로 즉위했고 두 차례 침입이 치세를 결정했다.'], ['Yi Gwal’s rebellion (1624); the Manchu invasions (1627, 1636); surrender at Samjeondo (1637).', '이괄의 난(1624), 정묘·병자호란, 삼전도 항복(1637).']),
  M(['Hyojong', '효종'], ['Yi Ho', '이호'], 1619, 1649, 1659, 1659, ['Second son of Injo', '인조의 둘째 아들'], ['Eight years a hostage in Shenyang; dreamed of revenge on the Qing.', '심양에서 8년간 볼모로 지냈고 청에 대한 설욕을 꿈꿨다.'], ['Plans for a northern expedition; military build-up.', '북벌 계획과 군비 확충.']),
  M(['Hyeonjong', '현종'], ['Yi Yeon', '이연'], 1641, 1659, 1674, 1674, ['Son of Hyojong', '효종의 아들'], ['A reign consumed by debates over mourning rites.', '상복 논쟁으로 점철된 치세.'], ['The rites controversies of 1659 and 1674; famine relief in the Gyeongsin famine (1670–71).', '예송 논쟁(1659, 1674), 경신 대기근 구휼(1670–71).']),
  M(['Sukjong', '숙종'], ['Yi Sun', '이순'], 1661, 1674, 1720, 1720, ['Son of Hyeonjong', '현종의 아들'], ['Used sudden changes of government to keep every faction off balance.', '갑작스러운 환국으로 모든 당파를 흔들어 왕권을 지켰다.'], ['Changes of power in 1680, 1689 and 1694; the Paektu boundary stele (1712).', '경신·기사·갑술환국, 백두산정계비(1712).']),
  M(['Gyeongjong', '경종'], ['Yi Yun', '이윤'], 1688, 1720, 1724, 1724, ['Son of Sukjong and Lady Jang (Hui-bin)', '숙종과 희빈 장씨의 아들'], ['Frail; a pawn between the Noron and the Soron.', '병약했고 노론과 소론 사이에서 흔들렸다.'], ['The Sinim purges (1721–22).', '신임옥사(1721–22).']),
  M(['Yeongjo', '영조'], ['Yi Geum', '이금'], 1694, 1724, 1776, 1776, ['Son of Sukjong by Royal Consort Suk of the Choe clan', '숙종과 숙빈 최씨의 아들'], ['Frugal and long-lived; insisted on balance among the factions.', '검소하고 장수했으며 당파의 균형을 고집했다.'], ['The tangpyeong policy; the equal service law (1750); the death of Crown Prince Sado (1762).', '탕평책, 균역법(1750), 사도세자의 죽음(1762).']),
  M(['Jeongjo', '정조'], ['Yi San', '이산'], 1752, 1776, 1800, 1800, ['Son of Crown Prince Sado; grandson of Yeongjo', '사도세자의 아들, 영조의 손자'], ['A scholar-reformer who built his own institutions to free the throne from factions.', '독자적인 기구를 세워 왕권을 당파로부터 지키려 한 개혁 군주.'], ['The Gyujanggak library (1776); the Hwaseong fortress at Suwon (1794–96).', '규장각 설치(1776), 수원 화성 축조(1794–96).']),
  M(['Sunjo', '순조'], ['Yi Gong', '이공'], 1790, 1800, 1834, 1834, ['Son of Jeongjo', '정조의 아들'], ['Came to the throne at ten; in-law families ruled in his name.', '열 살에 즉위했고 외척 가문이 그의 이름으로 다스렸다.'], ['The Catholic persecution of 1801; Hong Gyeong-rae’s rebellion (1811); Andong Kim in-law government.', '신유박해(1801), 홍경래의 난(1811), 안동 김씨 세도정치.']),
  M(['Heonjong', '헌종'], ['Yi Hwan', '이환'], 1827, 1834, 1849, 1849, ['Grandson of Sunjo', '순조의 손자'], ['A child king caught between the Andong Kim and the Pungyang Jo.', '안동 김씨와 풍양 조씨 사이에 낀 어린 임금.'], ['The Catholic persecution of 1839.', '기해박해(1839).']),
  M(['Cheoljong', '철종'], ['Yi Won-beom', '이원범'], 1831, 1849, 1863, 1863, ['Great-great-grandson of Yeongjo, raised on Ganghwa Island', '영조의 고손, 강화도에서 자람'], ['Brought from obscurity to reign while the Andong Kim governed.', '안동 김씨가 다스리는 동안 초야에서 불려 와 즉위했다.'], ['The Imsul peasant uprisings (1862).', '임술 농민 봉기(1862).']),
  M(['Gojong', '고종'], ['Yi Myeong-bok (later Yi Hui)', '이명복 (뒤에 이희)'], 1852, 1863, 1897, 1919, ['Son of the Heungseon Daewongun', '흥선대원군의 아들'], ['Came to the throne at eleven under his father’s regency; reigned through the opening of the country.', '열한 살에 즉위해 아버지의 섭정을 받았고 개항기를 통치했다.'], ['The Daewongun’s reforms; the Treaty of Ganghwa (1876); the Gabo reforms (1894); proclaimed the Korean Empire (1897).', '대원군의 개혁, 강화도 조약(1876), 갑오개혁(1894), 대한제국 선포(1897).']),
];

export const monarchAt = (index: number) => MONARCHS[Math.max(0, Math.min(MONARCHS.length - 1, index))];
