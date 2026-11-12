import type { Text } from '../model/schemas';
import { T } from '../engine/text';
import type { Confidence } from './monarchs';

/**
 * GSDD Part IV: periods, the event database with categories and consequences, period rules,
 * faction profiles and historical places. Everything is dated so the simulation can check it.
 * Summaries follow standard scholarship; each entry names its confidence. To be reviewed by a historian.
 */

export type Period = { id: string; from: number; to: number; name: Text; text: Text };
export const PERIODS: Period[] = [
  { id: 'early', from: 1392, to: 1450, name: T('Early Joseon', '조선 전기 건국기'), text: T('The founding of the dynasty, centralisation and its first institutions.', '왕조의 건국, 중앙 집권, 제도의 기틀.') },
  { id: 'consolidation', from: 1450, to: 1506, name: T('Consolidation', '체제 정비기'), text: T('Royal authority, court politics and the great law code.', '왕권, 궁중 정치, 경국대전.') },
  { id: 'middle', from: 1506, to: 1592, name: T('Middle Joseon', '조선 중기'), text: T('Scholarly influence and the first factional struggles.', '사림의 성장과 붕당의 시작.') },
  { id: 'imjin', from: 1592, to: 1637, name: T('The Imjin War and its aftermath', '양란기'), text: T('Japanese invasions, Manchu invasions and a kingdom in crisis.', '왜란과 호란, 위기의 나라.') },
  { id: 'late17', from: 1637, to: 1700, name: T('Late seventeenth century', '17세기 후반'), text: T('Reconstruction, rites controversies and sudden changes of government.', '복구, 예송, 환국.') },
  { id: 'revival', from: 1700, to: 1800, name: T('The eighteenth-century revival', '18세기 중흥기'), text: T('Yeongjo and Jeongjo: balance among factions, reform and learning.', '영조와 정조: 탕평, 개혁, 학문.') },
  { id: 'sedo', from: 1800, to: 1863, name: T('In-law government', '세도 정치기'), text: T('Royal in-law clans rule in the names of young kings; unrest in the provinces.', '외척 가문이 어린 임금의 이름으로 다스리고 지방이 동요한다.') },
  { id: 'opening', from: 1863, to: 1897, name: T('Reform and the opening of the country', '개항과 개혁기'), text: T('The regent’s reforms, foreign pressure, the opening of the ports and the end of the old order.', '대원군의 개혁, 외세의 압력, 개항, 옛 질서의 끝.') },
];
export const periodOf = (year: number) => PERIODS.find((p) => year >= p.from && year < p.to) ?? PERIODS[PERIODS.length - 1];

export type Category = 'royal' | 'political' | 'military' | 'diplomatic' | 'social' | 'economic' | 'legal' | 'dynastic' | 'environmental';
export const CATEGORY_NAMES: Record<Category, Text> = {
  royal: T('Royal', '왕실'), political: T('Political', '정치'), military: T('Military', '군사'), diplomatic: T('Diplomatic', '외교'),
  social: T('Social', '사회'), economic: T('Economic', '경제'), legal: T('Legal', '법제'), dynastic: T('Dynastic', '왕통'), environmental: T('Environmental', '재해'),
};

/** What an event does to the world when it happens (and has not been changed by the player). */
export type Consequence = { stability?: number; provinces?: string[]; faction?: { side: 'A' | 'B'; d: number }; favour?: number; reputation?: number };
export type Annal = {
  id: string;
  year: number;
  moon: number;
  cat: Category;
  title: Text;
  text: Text;
  confidence: Confidence;
  /** The text already appears in the HISTORY chronicle; only the consequences apply. */
  echo?: boolean;
  /** Tied to the recorded royal line: suppressed once the throne has left recorded history. */
  royalLine?: boolean;
  /** A flag that, if set by the player's intervention, changes or cancels this event. */
  averted?: string;
  /** What happens instead, when averted. */
  instead?: Text;
  does?: Consequence;
};

const A = (id: string, year: number, moon: number, cat: Category, title: [string, string], text: [string, string], more: Partial<Annal> = {}): Annal => ({
  id, year, moon, cat, title: T(...title), text: T(...text), confidence: 'verified', ...more,
});

export const ANNALS: Annal[] = [
  A('founding', 1392, 7, 'royal', ['The founding of Joseon', '조선 건국'], ['Yi Seong-gye is enthroned at Gaegyeong; the new dynasty will be called Joseon.', '이성계가 개경 수창궁에서 즉위했다. 새 왕조의 이름은 조선이다.'], { royalLine: true }),
  A('hanyang', 1394, 10, 'political', ['The capital moves to Hanyang', '한양 천도'], ['The court moves to Hanyang, the future Hanseong.', '조정이 한양으로 옮겨 갔다.']),
  A('strife-1', 1398, 8, 'dynastic', ['The first strife of the princes', '제1차 왕자의 난'], ['Prince Bang-won kills Jeong Do-jeon and the crown prince’s faction.', '이방원이 정도전과 세자 일파를 제거했다.'], { royalLine: true, does: { stability: -6, provinces: ['hanseong', 'gyeonggi'] } }),
  A('private-armies', 1400, 4, 'political', ['Private armies abolished', '사병 혁파'], ['Princes and ministers lose their private troops to the crown.', '왕자와 대신들의 사병이 혁파되었다.']),
  A('hopae', 1413, 9, 'legal', ['The identity tag law', '호패법'], ['Every adult man must carry a tag stating his name, status and residence.', '성인 남자는 이름과 신분과 거처를 적은 호패를 차야 한다.'], { confidence: 'well-supported' }),
  A('tsushima', 1419, 6, 'military', ['Expedition to Tsushima', '대마도 정벌'], ['A fleet sails against the pirate bases.', '수군이 왜구의 근거지를 친다.'], { echo: true }),
  A('hangul', 1446, 9, 'social', ['The alphabet promulgated', '훈민정음 반포'], ['The Correct Sounds for the Instruction of the People are proclaimed.', '훈민정음이 반포되었다.'], { echo: true }),
  A('gyeyu', 1453, 10, 'dynastic', ['The coup of Prince Suyang', '계유정난'], ['Prince Suyang kills the boy king’s ministers and takes power.', '수양대군이 어린 임금의 대신들을 죽이고 권력을 잡았다.'], { echo: true, royalLine: true, does: { stability: -8, provinces: ['hanseong'] } }),
  A('gyeongguk', 1485, 1, 'legal', ['The great code in force', '경국대전 시행'], ['The Gyeongguk daejeon, the dynasty’s law code, takes effect in its final form.', '경국대전이 최종 완성되어 시행되었다.']),
  A('muo', 1498, 7, 'political', ['The literati purge of 1498', '무오사화'], ['Sarim scholars are executed and exiled over a historian’s draft.', '사초 문제로 사림이 처형되고 유배되었다.'], { does: { faction: { side: 'B', d: -12 }, stability: -3, provinces: ['hanseong'] } }),
  A('gapja', 1504, 3, 'political', ['The literati purge of 1504', '갑자사화'], ['The king takes revenge on all connected with his mother’s death.', '임금이 생모의 죽음에 관련된 이들에게 보복했다.'], { does: { faction: { side: 'B', d: -10 }, stability: -5, provinces: ['hanseong'] } }),
  A('jungjong-coup', 1506, 9, 'dynastic', ['The restoration coup of 1506', '중종반정'], ['Ministers depose Prince Yeonsan and enthrone his half-brother.', '신하들이 연산군을 폐위하고 그 이복동생을 즉위시켰다.'], { royalLine: true, does: { stability: -4, provinces: ['hanseong'] } }),
  A('gimyo', 1519, 11, 'political', ['The purge of 1519', '기묘사화'], ['Jo Gwang-jo and his reformers fall.', '조광조와 개혁파가 몰락했다.'], { echo: true, does: { faction: { side: 'B', d: -12 } } }),
  A('eulsa', 1545, 8, 'political', ['The Eulsa purge', '을사사화'], ['The queen dowager’s brother destroys his rivals.', '대비의 동생 윤원형이 정적을 숙청했다.'], { does: { faction: { side: 'B', d: -10 }, stability: -3, provinces: ['hanseong'] } }),
  A('bibyeonsa', 1555, 5, 'political', ['The Border Defence Council made permanent', '비변사 상설'], ['After the Eulmyo raids, the Bibyeonsa becomes a standing council.', '을묘왜변 뒤 비변사가 상설 기구가 되었다.'], { confidence: 'well-supported' }),
  A('split', 1575, 7, 'political', ['Easterners and Westerners', '동서 분당'], ['The scholars split into the Easterners and the Westerners.', '사림이 동인과 서인으로 갈라졌다.']),
  A('envoys-1591', 1591, 3, 'diplomatic', ['The envoys return from Japan', '통신사 귀국'], ['Two envoys report on Japan’s intentions and contradict each other.', '두 사신이 일본의 의도에 대해 서로 다른 보고를 올렸다.'], { confidence: 'well-supported' }),
  A('imjin', 1592, 4, 'military', ['The Japanese invasion', '임진왜란 발발'], ['Japanese armies land at Busan and march on the capital.', '일본군이 부산에 상륙해 도성으로 진격한다.'], { echo: true, averted: 'iv-1592-prepared', instead: T('Forewarned, the southern forts are manned and the capital’s walls repaired; the invasion still comes, but it meets resistance from the first day.', '미리 대비한 덕에 남쪽 진보에 군사가 있고 도성 성벽이 보수되었다. 침략은 여전히 왔으나 첫날부터 저항에 부딪혔다.'), does: { stability: -25, provinces: ['gyeongsang', 'chungcheong', 'gyeonggi', 'hanseong', 'jeolla', 'pyeongan', 'hwanghae', 'gangwon', 'hamgyeong'] } }),
  A('hansan', 1592, 7, 'military', ['Victory at Hansan Island', '한산도 대첩'], ['Admiral Yi Sun-sin destroys a Japanese fleet.', '이순신이 일본 함대를 격파했다.'], { does: { stability: 6, provinces: ['jeolla', 'gyeongsang'] } }),
  A('war-end', 1598, 11, 'military', ['The war ends at Noryang', '노량 해전과 종전'], ['The Japanese withdraw; Admiral Yi falls in the last battle.', '일본군이 물러가고 이순신이 마지막 전투에서 전사했다.'], { echo: true }),
  A('daedong', 1608, 5, 'economic', ['The uniform land tax begins', '대동법 시행'], ['Tribute in kind is replaced by a tax in rice in Gyeonggi.', '경기도에서 공납을 쌀로 내는 대동법이 시작되었다.'], { does: { stability: 4, provinces: ['gyeonggi'] } }),
  A('injo-coup', 1623, 3, 'dynastic', ['The Injo restoration', '인조반정'], ['The Westerners depose Prince Gwanghae.', '서인이 광해군을 폐위했다.'], { royalLine: true, does: { faction: { side: 'A', d: 10 }, stability: -4, provinces: ['hanseong'] } }),
  A('yi-gwal', 1624, 1, 'military', ['Yi Gwal’s rebellion', '이괄의 난'], ['A disaffected general marches on the capital; the king flees south.', '불만을 품은 장수가 도성으로 진격해 임금이 남쪽으로 피난했다.'], { does: { stability: -8, provinces: ['pyeongan', 'hwanghae', 'hanseong'] } }),
  A('jeongmyo', 1627, 1, 'military', ['The first Manchu invasion', '정묘호란'], ['The Later Jin cross the Yalu.', '후금이 압록강을 건넜다.'], { echo: true, does: { stability: -12, provinces: ['pyeongan', 'hwanghae'] } }),
  A('byeongja', 1636, 12, 'military', ['The second Manchu invasion', '병자호란'], ['The Qing army reaches the capital; the king holds out at Namhansanseong.', '청군이 도성에 이르러 임금이 남한산성으로 들어갔다.'], { echo: true, averted: 'iv-1636-averted', instead: T('The Qing envoys leave with an answer that gives no pretext for war. The army stays north of the Yalu this winter.', '청의 사신들이 전쟁의 구실을 찾지 못한 채 돌아갔다. 이번 겨울 청군은 압록강을 넘지 않았다.'), does: { stability: -20, provinces: ['pyeongan', 'hwanghae', 'gyeonggi', 'hanseong'] } }),
  A('samjeondo', 1637, 1, 'diplomatic', ['Surrender at Samjeondo', '삼전도의 굴욕'], ['The king bows to the Qing emperor; princes go as hostages.', '임금이 청 황제에게 항복하고 왕자들이 볼모로 끌려갔다.'], { echo: true, averted: 'iv-1636-averted', instead: T('There is no surrender at Samjeondo: the crisis passed without war.', '삼전도의 항복은 없었다. 위기는 전쟁 없이 지나갔다.'), does: { favour: -3, stability: -6, provinces: ['hanseong'] } }),
  A('yesong-1', 1659, 5, 'political', ['The first rites controversy', '기해예송'], ['How long should the queen dowager mourn? The factions go to war over a year.', '대비의 상복 기간을 두고 당파가 다툰다.']),
  A('famine', 1670, 6, 'environmental', ['The Gyeongsin famine', '경신 대기근'], ['Drought, cold and epidemic: one of the worst famines of the dynasty.', '가뭄과 냉해와 역병이 겹친 조선 최악의 기근.'], { confidence: 'well-supported', does: { stability: -15, provinces: ['jeolla', 'gyeongsang', 'chungcheong', 'gyeonggi', 'hwanghae', 'gangwon'] } }),
  A('gyeongsin-hwanguk', 1680, 3, 'political', ['The change of government of 1680', '경신환국'], ['The king drives the Southerners from power in favour of the Westerners.', '임금이 남인을 몰아내고 서인을 등용했다.'], { does: { faction: { side: 'A', d: 15 } } }),
  A('noron-soron', 1683, 6, 'political', ['Noron and Soron', '노론과 소론의 분열'], ['The Westerners split into the Old Doctrine and the Young Doctrine.', '서인이 노론과 소론으로 갈라졌다.'], { confidence: 'well-supported' }),
  A('gisa-hwanguk', 1689, 2, 'political', ['The change of government of 1689', '기사환국'], ['The Southerners return; Song Si-yeol is put to death.', '남인이 다시 집권하고 송시열이 사사되었다.'], { does: { faction: { side: 'B', d: 15 } } }),
  A('gapsul-hwanguk', 1694, 4, 'political', ['The change of government of 1694', '갑술환국'], ['The Westerners return for good; Lady Jang is demoted.', '서인이 다시 집권하고 희빈 장씨가 강등되었다.'], { does: { faction: { side: 'A', d: 15 } } }),
  A('daedong-all', 1708, 1, 'economic', ['The uniform land tax nationwide', '대동법 전국 시행'], ['A century after it began, the tax reaches the last provinces.', '100년 만에 대동법이 전국에 시행되었다.'], { confidence: 'well-supported', does: { stability: 4, provinces: ['hwanghae', 'pyeongan', 'hamgyeong'] } }),
  A('sinim', 1721, 12, 'political', ['The Sinim purges', '신임옥사'], ['The Soron purge the Noron over the question of the heir.', '세제 책봉 문제로 소론이 노론을 숙청했다.'], { does: { faction: { side: 'B', d: 12 } } }),
  A('yi-injwa', 1728, 3, 'military', ['Yi In-jwa’s rebellion', '이인좌의 난'], ['Radical Soron rise in the south against the new king.', '소론 강경파가 남쪽에서 새 임금에 반기를 들었다.'], { echo: true, does: { stability: -8, provinces: ['chungcheong', 'gyeongsang'] } }),
  A('gyunyeok', 1750, 7, 'economic', ['The equal service law', '균역법'], ['The military cloth tax is halved.', '군포가 절반으로 줄었다.'], { echo: true, does: { stability: 6, provinces: ['gyeonggi', 'chungcheong', 'jeolla', 'gyeongsang'] } }),
  A('sado', 1762, 5, 'royal', ['The death of Crown Prince Sado', '임오화변'], ['The crown prince is shut in a rice chest by his father’s order and dies after eight days.', '세자가 부왕의 명으로 뒤주에 갇혀 여드레 만에 숨졌다.'], { echo: true, royalLine: true, averted: 'iv-1762-saved', instead: T('The king relents. The crown prince is stripped of his duties and confined, but he lives.', '임금이 마음을 돌렸다. 세자는 직무를 빼앗기고 연금되었으나 목숨은 건졌다.') }),
  A('gyujanggak', 1776, 9, 'political', ['The Gyujanggak founded', '규장각 설치'], ['The new king founds a royal library and research institute of his own.', '새 임금이 규장각을 세웠다.'], { royalLine: true }),
  A('hwaseong', 1796, 9, 'social', ['Hwaseong completed', '화성 완공'], ['The fortress city at Suwon is finished.', '수원 화성이 완공되었다.'], { echo: true, royalLine: true }),
  A('sinyu', 1801, 1, 'legal', ['The Catholic persecution of 1801', '신유박해'], ['Catholic converts are executed and exiled; Jeong Yak-yong is sent into exile.', '천주교 신자들이 처형·유배되고 정약용이 유배되었다.'], { echo: true, does: { stability: -3, provinces: ['hanseong', 'gyeonggi'] } }),
  A('hong-gyeongrae', 1811, 12, 'military', ['Hong Gyeong-rae’s rebellion', '홍경래의 난'], ['Rebels seize the towns north of the Cheongcheon River.', '반란군이 청천강 이북의 고을들을 장악했다.'], { echo: true, does: { stability: -15, provinces: ['pyeongan'] } }),
  A('cholera', 1821, 8, 'environmental', ['Cholera', '콜레라 창궐'], ['A new epidemic arrives from the west and kills tens of thousands.', '새로운 역병이 서쪽에서 들어와 수만 명이 죽었다.'], { confidence: 'well-supported', does: { stability: -8, provinces: ['pyeongan', 'hwanghae', 'gyeonggi', 'hanseong'] } }),
  A('imsul', 1862, 2, 'social', ['The Imsul uprisings', '임술 농민 봉기'], ['Peasants rise at Jinju and across the south against corrupt officials.', '진주를 비롯한 남부에서 농민들이 탐관오리에 맞서 봉기했다.'], { echo: true, does: { stability: -12, provinces: ['gyeongsang', 'jeolla', 'chungcheong'] } }),
  A('daewongun', 1864, 1, 'political', ['The Daewongun’s regency', '흥선대원군 집권'], ['The boy king’s father governs: seowon closed, Gyeongbokgung rebuilt, borders closed.', '어린 임금의 아버지가 섭정하며 서원 철폐, 경복궁 중건, 통상 거부를 추진했다.'], { confidence: 'well-supported', royalLine: true }),
  A('ganghwa-treaty', 1876, 2, 'diplomatic', ['The Treaty of Ganghwa', '강화도 조약'], ['Japan forces open three ports.', '일본의 강요로 세 항구가 열렸다.'], { echo: true }),
  A('gapsin', 1884, 12, 'political', ['The Gapsin coup', '갑신정변'], ['Reformers seize the palace for three days.', '개화파가 사흘 동안 궁궐을 장악했다.'], { echo: true, does: { stability: -6, provinces: ['hanseong'] } }),
  A('gabo', 1894, 7, 'legal', ['The Gabo reforms', '갑오개혁'], ['The examinations and the legal distinctions of status are abolished.', '과거제와 신분제가 폐지되었다.'], { echo: true }),
  A('empire', 1897, 10, 'royal', ['The Korean Empire', '대한제국 선포'], ['The king proclaims himself emperor; Joseon becomes the Korean Empire.', '임금이 황제로 즉위하고 국호를 대한제국으로 고쳤다.'], { echo: true, royalLine: true }),
];

/** GSDD Part IV §11: period rules that the simulation applies. */
export type HistoricalRule = { id: string; from: number; to: number; name: Text; text: Text; confidence: Confidence };
export const RULES: HistoricalRule[] = [
  { id: 'exams', from: 1392, to: 1894, name: T('Civil and military examinations', '과거제'), text: T('Office through examination; abolished by the Gabo reforms in 1894.', '과거를 통한 관직 진출. 1894년 갑오개혁으로 폐지.'), confidence: 'verified' },
  { id: 'status', from: 1392, to: 1894, name: T('Legal status distinctions', '신분제'), text: T('Yangban, commoners, the lowborn and slaves were distinct in law until 1894.', '1894년까지 양반, 양인, 천민, 노비의 법적 구분이 있었다.'), confidence: 'verified' },
  { id: 'royal-kin', from: 1392, to: 1894, name: T('Royal kin barred from office', '종친의 관직 진출 제한'), text: T('Close royal kinsmen received honours, not government posts.', '가까운 종친은 예우를 받았을 뿐 관직에 나가지 못했다.'), confidence: 'well-supported' },
  { id: 'women-office', from: 1392, to: 1897, name: T('Women and office', '여성과 관직'), text: T('Women could not sit the examinations or hold government office; palace women held posts in the inner court.', '여성은 과거를 보거나 관직에 나갈 수 없었다. 궁녀는 내명부의 품계를 받았다.'), confidence: 'verified' },
  { id: 'code', from: 1485, to: 1897, name: T('The Gyeongguk daejeon', '경국대전'), text: T('The great code governed administration, family law and punishment.', '경국대전이 행정과 가족법과 형벌을 규정했다.'), confidence: 'verified' },
  { id: 'remarriage', from: 1485, to: 1894, name: T('Sons of remarried widows', '재가녀 자손 금고'), text: T('Sons of widows who remarried were barred from high office.', '재가한 여성의 자손은 높은 관직에 나갈 수 없었다.'), confidence: 'verified' },
  { id: 'sinmungo', from: 1401, to: 1897, name: T('The petition drum', '신문고'), text: T('A drum for petitions to the king; often suspended, revived under Yeongjo.', '임금에게 억울함을 호소하는 북. 자주 폐지되었다가 영조 때 다시 설치되었다.'), confidence: 'well-supported' },
  { id: 'daedong', from: 1608, to: 1894, name: T('Uniform land tax', '대동법'), text: T('Tribute converted to rice, province by province until 1708.', '공납을 쌀로 바꾸었고 1708년까지 전국으로 확대되었다.'), confidence: 'verified' },
  { id: 'gyunyeok', from: 1750, to: 1894, name: T('Equal service law', '균역법'), text: T('Military cloth tax halved.', '군포를 절반으로 줄였다.'), confidence: 'verified' },
  { id: 'public-nobi', from: 1801, to: 1897, name: T('Freeing of state slaves', '공노비 해방'), text: T('Most slaves held by state offices were freed in 1801.', '1801년 관아 소속 노비 대부분이 해방되었다.'), confidence: 'verified' },
];
export const ruleActive = (id: string, year: number) => RULES.some((r) => r.id === id && year >= r.from && year < r.to);

/** GSDD Part IV §6: factions in the periods they existed. Side A held power, side B opposed, in the game's terms. */
export type FactionProfile = { id: string; from: number; to: number; name: Text; text: Text; leaders: Text; base: Text };
export const FACTION_PROFILES: FactionProfile[] = [
  { id: 'merit', from: 1392, to: 1470, name: T('Merit subjects', '공신 세력'), text: T('Men rewarded for founding the dynasty or putting a king on the throne.', '건국이나 즉위를 도운 공으로 보상받은 이들.'), leaders: T('Jeong Do-jeon, Han Myeong-hoe', '정도전, 한명회'), base: T('The capital and royal favour', '도성과 왕의 은총') },
  { id: 'hungu', from: 1470, to: 1567, name: T('Hungu', '훈구파'), text: T('Established officials grown rich on merit lands.', '공신전으로 부를 쌓은 기성 관료.'), leaders: T('Yu Ja-gwang, Yun Won-hyeong', '유자광, 윤원형'), base: T('Gyeonggi landholdings', '경기 지역의 토지') },
  { id: 'sarim', from: 1470, to: 1575, name: T('Sarim', '사림파'), text: T('Provincial scholars who demanded moral government.', '도덕 정치를 요구한 지방 선비들.'), leaders: T('Kim Jong-jik, Jo Gwang-jo', '김종직, 조광조'), base: T('Gyeongsang private academies', '영남의 서원') },
  { id: 'dongin', from: 1575, to: 1591, name: T('Easterners (Dongin)', '동인'), text: T('Younger Sarim, followers of Yi Hwang and Jo Sik.', '이황과 조식을 따른 젊은 사림.'), leaders: T('Kim Hyo-won', '김효원'), base: T('Gyeongsang', '영남') },
  { id: 'seoin', from: 1575, to: 1683, name: T('Westerners (Seoin)', '서인'), text: T('Senior Sarim, followers of Yi I and Seong Hon.', '이이와 성혼을 따른 사림.'), leaders: T('Sim Ui-gyeom, Song Si-yeol', '심의겸, 송시열'), base: T('Gyeonggi and Chungcheong', '기호 지방') },
  { id: 'namin', from: 1591, to: 1800, name: T('Southerners (Namin)', '남인'), text: T('The moderate wing of the Easterners.', '동인의 온건파.'), leaders: T('Ryu Seong-ryong, Heo Mok', '유성룡, 허목'), base: T('Gyeongsang', '영남') },
  { id: 'bugin', from: 1591, to: 1623, name: T('Northerners (Bugin)', '북인'), text: T('The hard wing of the Easterners; fell with Prince Gwanghae.', '동인의 강경파. 광해군과 함께 몰락했다.'), leaders: T('Jeong In-hong', '정인홍'), base: T('Southern Gyeongsang', '경상우도') },
  { id: 'noron', from: 1683, to: 1863, name: T('Old Doctrine (Noron)', '노론'), text: T('The Westerners who held to Song Si-yeol’s line.', '송시열의 노선을 지킨 서인.'), leaders: T('Song Si-yeol, Kim Chang-jip', '송시열, 김창집'), base: T('Chungcheong and the capital', '충청과 도성') },
  { id: 'soron', from: 1683, to: 1800, name: T('Young Doctrine (Soron)', '소론'), text: T('The Westerners who broke with Song Si-yeol.', '송시열과 갈라선 서인.'), leaders: T('Yun Jeung', '윤증'), base: T('Gyeonggi', '경기') },
  { id: 'sedo', from: 1800, to: 1863, name: T('In-law clans', '세도 가문'), text: T('The Andong Kim and Pungyang Jo clans ruling through queens.', '왕비를 통해 권력을 쥔 안동 김씨와 풍양 조씨.'), leaders: T('Kim Jo-sun', '김조순'), base: T('The capital', '도성') },
  { id: 'reform', from: 1863, to: 1897, name: T('The regent’s men and the Min clan', '대원군파와 민씨 척족'), text: T('The Daewongun’s supporters against the queen’s clan; later reformers against conservatives.', '대원군 지지 세력과 왕비의 척족, 이후 개화파와 수구파.'), leaders: T('Heungseon Daewongun, Min Gyeom-ho', '흥선대원군, 민겸호'), base: T('The palace', '궁궐') },
];
export const factionsActive = (year: number) => FACTION_PROFILES.filter((f) => year >= f.from && year < f.to);

/** GSDD Part IV §12: historical places with their dates. */
export const PLACES_HISTORY: { name: Text; from: number; to: number | null; text: Text }[] = [
  { name: T('Gyeongbokgung', '경복궁'), from: 1395, to: null, text: T('The main palace; burned in 1592, rebuilt by the Daewongun in 1865–68.', '정궁. 1592년 소실, 1865–68년 대원군이 중건.') },
  { name: T('Changdeokgung', '창덕궁'), from: 1405, to: null, text: T('The detached palace that served as the main seat from 1610 to 1868.', '1610년부터 1868년까지 정궁 구실을 한 이궁.') },
  { name: T('Seonggyungwan', '성균관'), from: 1398, to: null, text: T('The National Confucian Academy in the capital.', '도성의 최고 교육 기관.') },
  { name: T('Namhansanseong', '남한산성'), from: 1626, to: null, text: T('Mountain fortress where the court held out in 1636–37.', '1636–37년 조정이 버틴 산성.') },
  { name: T('Hwaseong', '화성'), from: 1796, to: null, text: T('Jeongjo’s fortress city at Suwon.', '정조가 세운 수원의 성곽 도시.') },
  { name: T('Waegwan at Busan', '부산 왜관'), from: 1407, to: 1876, text: T('The Japanese trading post, closed in war and reopened after.', '일본인 교역 거처. 전쟁 때 닫혔다가 다시 열렸다.') },
];
