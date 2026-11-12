import type { Text } from '../model/schemas';
import { T } from '../engine/text';
import type { Confidence } from './monarchs';

/**
 * GSDD Part IV §7: historical figures. They keep their documented identities; the player can seek them out
 * as teachers and examples. Meetings are reconstructions for gameplay, never quoted as record: these
 * figures are given no invented words. Dates follow standard references; uncertain ones are marked.
 */
export type Figure = {
  id: string;
  name: Text;
  born: number;
  died: number;
  /** Years of public life in which the player can seek them out. */
  active: [number, number];
  role: Text;
  text: Text;
  /** What studying with them develops. */
  field: string;
  attr: string;
  /** Where they can be found. */
  place: 'academy' | 'offices' | 'market' | 'throne-hall' | 'residence';
  confidence: Confidence;
  woman?: boolean;
};

const F = (id: string, name: [string, string], born: number, died: number, active: [number, number], role: [string, string], text: [string, string], field: string, attr: string, place: Figure['place'], more: Partial<Figure> = {}): Figure => ({
  id, name: T(...name), born, died, active, role: T(...role), text: T(...text), field, attr, place, confidence: 'verified', ...more,
});

export const FIGURES: Figure[] = [
  F('jeong-dojeon', ['Jeong Do-jeon', '정도전'], 1342, 1398, [1392, 1398], ['Architect of the new state', '조선의 설계자'], ['Drafted the dynasty’s statecraft and planned the capital.', '왕조의 통치 이념을 세우고 도성을 설계했다.'], 'admin', 'strategy', 'offices'),
  F('hwang-hui', ['Hwang Hui', '황희'], 1363, 1452, [1400, 1449], ['Chief State Councillor', '영의정'], ['Served Sejong for decades; remembered for his modest life.', '세종을 오래 보필했고 청렴한 삶으로 기억된다.'], 'admin', 'integrity', 'offices'),
  F('jang-yeongsil', ['Jang Yeong-sil', '장영실'], 1390, 1450, [1421, 1442], ['Court inventor', '궁중 과학자'], ['Born of low status; built water clocks and astronomical instruments.', '천민 출신으로 자격루와 천문 기구를 만들었다.'], 'practical', 'creativity', 'offices', { confidence: 'well-supported' }),
  F('seong-sammun', ['Seong Sam-mun', '성삼문'], 1418, 1456, [1438, 1456], ['Scholar of the Hall of Worthies', '집현전 학사'], ['Worked on the new alphabet; died for his loyalty to the boy king.', '훈민정음 창제에 참여했고 어린 임금에 대한 충절로 죽었다.'], 'classics', 'integrity', 'academy'),
  F('han-myeonghoe', ['Han Myeong-hoe', '한명회'], 1415, 1487, [1453, 1485], ['Strategist and power broker', '책사이자 실력자'], ['Planned Prince Suyang’s seizure of power and became the court’s great power broker.', '수양대군의 집권을 설계하고 조정의 실력자가 되었다.'], 'admin', 'persuasion', 'offices'),
  F('kim-jongjik', ['Kim Jong-jik', '김종직'], 1431, 1492, [1460, 1492], ['Teacher of the Sarim', '사림의 스승'], ['His students became the core of the scholar faction.', '그의 제자들이 사림의 중심이 되었다.'], 'classics', 'scholarship', 'academy'),
  F('jo-gwangjo', ['Jo Gwang-jo', '조광조'], 1482, 1519, [1515, 1519], ['Reformer', '개혁가'], ['Pressed for a moral government; fell in the purge of 1519.', '도덕 정치를 밀어붙이다 기묘사화로 쓰러졌다.'], 'classics', 'integrity', 'academy'),
  F('shin-saimdang', ['Shin Saimdang', '신사임당'], 1504, 1551, [1525, 1551], ['Painter and poet', '화가이자 시인'], ['Known for paintings of plants and insects, and as the mother of Yi I.', '초충도로 이름나고 이이의 어머니로 알려졌다.'], 'culture', 'creativity', 'residence', { woman: true }),
  F('yi-hwang', ['Yi Hwang (Toegye)', '이황(퇴계)'], 1501, 1570, [1534, 1570], ['Neo-Confucian scholar', '성리학자'], ['Taught at Dosan in Andong; the most revered scholar of his age.', '안동 도산에서 가르쳤고 당대 가장 존경받은 학자다.'], 'classics', 'judgement', 'academy'),
  F('yi-i', ['Yi I (Yulgok)', '이이(율곡)'], 1536, 1584, [1564, 1584], ['Scholar-official', '학자 관료'], ['Passed nine examinations at the top; argued for practical reform.', '아홉 차례 장원을 했고 실질적인 개혁을 주장했다.'], 'admin', 'intelligence', 'offices'),
  F('heo-jun', ['Heo Jun', '허준'], 1539, 1615, [1574, 1615], ['Royal physician', '어의'], ['Compiled the medical encyclopedia Dongui bogam (1610).', '동의보감(1610)을 편찬했다.'], 'practical', 'empathy', 'offices'),
  F('ryu-seongryong', ['Ryu Seong-ryong', '류성룡'], 1542, 1607, [1566, 1598], ['Chief State Councillor in the war', '전시의 영의정'], ['Led the government through the Imjin War and recommended Yi Sun-sin.', '임진왜란 중 조정을 이끌었고 이순신을 천거했다.'], 'admin', 'strategy', 'offices'),
  F('yi-sunsin', ['Yi Sun-sin', '이순신'], 1545, 1598, [1576, 1598], ['Admiral', '수군 장수'], ['Commander of the southern fleet; never lost a sea battle.', '삼도수군통제사. 해전에서 패한 적이 없다.'], 'military', 'leadership', 'offices'),
  F('heo-nanseolheon', ['Heo Nanseolheon', '허난설헌'], 1563, 1589, [1578, 1589], ['Poet', '시인'], ['Her poems were later published in China and Japan.', '그의 시는 훗날 중국과 일본에서 간행되었다.'], 'culture', 'creativity', 'residence', { woman: true }),
  F('gwak-jaeu', ['Gwak Jae-u', '곽재우'], 1552, 1617, [1592, 1610], ['Leader of a righteous army', '의병장'], ['The “Red-Robed General” who raised volunteers in Gyeongsang.', '경상도에서 의병을 일으킨 홍의장군.'], 'military', 'courage', 'market'),
  F('song-siyeol', ['Song Si-yeol', '송시열'], 1607, 1689, [1633, 1689], ['Leader of the Westerners', '서인의 영수'], ['The towering scholar-politician of his century.', '한 세기를 대표하는 학자이자 정치가.'], 'classics', 'command', 'academy'),
  F('chae-jegong', ['Chae Je-gong', '채제공'], 1720, 1799, [1743, 1799], ['Chief State Councillor', '영의정'], ['A Southerner trusted by Jeongjo; oversaw the building of Hwaseong.', '정조가 신임한 남인. 화성 축조를 총괄했다.'], 'admin', 'judgement', 'offices'),
  F('lady-hyegyeong', ['Lady Hyegyeong', '혜경궁 홍씨'], 1735, 1816, [1744, 1816], ['Wife of Crown Prince Sado', '사도세자의 빈'], ['Wrote memoirs of life at court, the Hanjungnok.', '궁중 생활을 담은 한중록을 썼다.'], 'culture', 'etiquette', 'throne-hall', { woman: true }),
  F('park-jiwon', ['Park Ji-won', '박지원'], 1737, 1805, [1765, 1805], ['Writer of the practical learning school', '실학자이자 문장가'], ['His travel diary from Rehe argued for learning from the Qing.', '열하일기에서 청의 문물을 배우자고 주장했다.'], 'practical', 'creativity', 'market'),
  F('kim-mandeok', ['Kim Man-deok', '김만덕'], 1739, 1812, [1770, 1812], ['Merchant of Jeju', '제주의 상인'], ['Made a fortune in trade and spent it feeding Jeju in a famine.', '장사로 큰돈을 벌어 흉년에 제주 백성을 먹였다.'], 'practical', 'empathy', 'market', { woman: true }),
  F('kim-hongdo', ['Kim Hong-do', '김홍도'], 1745, 1806, [1765, 1805], ['Court painter', '도화서 화원'], ['Painted everyday life in the market, the field and the schoolroom.', '장터와 들판과 서당의 일상을 그렸다.'], 'culture', 'creativity', 'market', { confidence: 'well-supported' }),
  F('jeong-yakyong', ['Jeong Yak-yong (Dasan)', '정약용(다산)'], 1762, 1836, [1789, 1836], ['Scholar of practical learning', '실학자'], ['Designed machinery for Hwaseong; wrote on governance in exile.', '화성 축조에 기계를 고안했고 유배지에서 목민심서를 썼다.'], 'admin', 'intelligence', 'academy'),
  F('kim-jeonghui', ['Kim Jeong-hui (Chusa)', '김정희(추사)'], 1786, 1856, [1809, 1856], ['Calligrapher and epigrapher', '서예가이자 금석학자'], ['Created the Chusa style of calligraphy.', '추사체를 완성했다.'], 'culture', 'scholarship', 'academy'),
  F('kim-jeongho', ['Kim Jeong-ho', '김정호'], 1804, 1866, [1834, 1864], ['Mapmaker', '지도 제작자'], ['Made the great map of the kingdom, the Daedong yeojido (1861).', '대동여지도(1861)를 만들었다.'], 'practical', 'memory', 'market', { confidence: 'well-supported' }),
  F('daewongun', ['Heungseon Daewongun', '흥선대원군'], 1820, 1898, [1863, 1873], ['Regent', '섭정'], ['The king’s father; closed the private academies and the borders.', '임금의 아버지. 서원을 철폐하고 문을 닫았다.'], 'admin', 'command', 'throne-hall'),
  F('queen-min', ['Queen Min', '명성황후'], 1851, 1895, [1873, 1895], ['Queen consort', '왕비'], ['A shrewd political player in the years of foreign pressure.', '외세의 압력 속에서 수완을 발휘한 정치가.'], 'practical', 'diplomacy', 'throne-hall', { woman: true }),
];

/** Figures living and in public life in a given year. */
export const figuresIn = (year: number) => FIGURES.filter((f) => year >= f.active[0] && year <= f.active[1] && year <= f.died);
