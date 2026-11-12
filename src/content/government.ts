import type { Text } from '../model/schemas';
import { T } from '../engine/text';

/**
 * GSDD Part II §5–6: institutions and posts. A post has a tier (the game's five steps of a career)
 * and a grade in the nine-grade system. Years limit posts and institutions to when they existed.
 * Historical details should be reviewed by a specialist before release.
 */
export type Institution = { id: string; name: Text; role: Text; track: 'civil' | 'military' | 'royal'; from?: number; to?: number };
export type Post = { id: string; inst: string; tier: number; track: 'civil' | 'military'; title: Text; grade: Text; duty: Text; from?: number; to?: number };

export const INSTITUTIONS: Institution[] = [
  { id: 'uijeongbu', name: T('State Council (Uijeongbu)', '의정부'), role: T('Highest deliberation on affairs of state', '나라의 큰일을 의논하는 최고 기관'), track: 'civil' },
  { id: 'ijo', name: T('Ministry of Personnel', '이조'), role: T('Appointments, ranks and evaluations of officials', '관리의 임명과 고과'), track: 'civil' },
  { id: 'hojo', name: T('Ministry of Taxation', '호조'), role: T('Land, households, taxes and the treasury', '토지, 호구, 조세, 재정'), track: 'civil' },
  { id: 'yejo', name: T('Ministry of Rites', '예조'), role: T('Ceremonies, examinations and foreign envoys', '의례, 과거, 외교 사절'), track: 'civil' },
  { id: 'byeongjo', name: T('Ministry of Military Affairs', '병조'), role: T('Military appointments, posts and defence', '무관 인사와 국방'), track: 'military' },
  { id: 'hyeongjo', name: T('Ministry of Punishments', '형조'), role: T('Law, trials and punishments', '법률, 재판, 형벌'), track: 'civil' },
  { id: 'gongjo', name: T('Ministry of Public Works', '공조'), role: T('Building, roads, crafts and mines', '토목, 도로, 공예, 광산'), track: 'civil' },
  { id: 'seungjeongwon', name: T('Royal Secretariat (Seungjeongwon)', '승정원'), role: T('Carries the king’s orders and the court’s memorials', '왕명 출납과 상소 전달'), track: 'civil' },
  { id: 'saheonbu', name: T('Office of the Inspector-General (Saheonbu)', '사헌부'), role: T('Watches over the conduct of officials', '관리의 기강을 살핌'), track: 'civil' },
  { id: 'saganwon', name: T('Office of the Censor-General (Saganwon)', '사간원'), role: T('Remonstrates with the king himself', '임금에게 간언함'), track: 'civil' },
  { id: 'hongmungwan', name: T('Office of Special Advisers (Hongmungwan)', '홍문관'), role: T('Scholarship, the royal library and advice to the king', '학문 연구와 경연, 왕에 대한 자문'), track: 'civil' },
  { id: 'seungmunwon', name: T('Office of Diplomatic Correspondence', '승문원'), role: T('Letters to the Chinese court and Japan', '사대교린 문서 작성'), track: 'civil' },
  { id: 'chunchugwan', name: T('Office for Annals Compilation', '춘추관'), role: T('Records of the court for the annals', '실록 편찬을 위한 사초 기록'), track: 'civil' },
  { id: 'owi', name: T('Five Military Commands', '오위도총부'), role: T('Command of the capital guards', '도성 수비군 지휘'), track: 'military' },
  { id: 'naegeumwi', name: T('Royal Guard (Naegeumwi)', '내금위'), role: T('The king’s personal guard', '임금의 호위'), track: 'military' },
  { id: 'hullyeon', name: T('Military Training Command', '훈련도감'), role: T('Standing army of the capital', '도성의 상비군'), track: 'military', from: 1593, to: 1882 },
  { id: 'provinces', name: T('Provincial commands', '지방 병영'), role: T('Border forts and provincial armies', '변경 진보와 지방군'), track: 'military' },
  { id: 'jiphyeonjeon', name: T('Hall of Worthies (Jiphyeonjeon)', '집현전'), role: T('Royal research institute of scholars; closed after the 1456 plot', '학자들의 왕립 연구 기관. 1456년 단종 복위 운동 뒤 폐지'), track: 'civil', from: 1420, to: 1456 },
  { id: 'bibyeonsa', name: T('Border Defence Council (Bibyeonsa)', '비변사'), role: T('Began as a war council; came to overshadow the State Council', '국방 회의로 시작해 의정부를 능가하는 최고 기구가 되었다'), track: 'civil', from: 1555, to: 1865 },
  { id: 'gyujanggak', name: T('Royal Library (Gyujanggak)', '규장각'), role: T('Jeongjo’s library and institute for reform-minded scholars', '정조가 세운 도서관이자 개혁 학자들의 연구 기관'), track: 'civil', from: 1776 },
  { id: 'jongchinbu', name: T('Office of the Royal Clan', '종친부'), role: T('Honours and affairs of the king’s kin, who may not hold office', '왕실 종친의 예우와 사무. 종친은 관직에 나갈 수 없다'), track: 'royal' },
];
export const institutionById = (id: string) => INSTITUTIONS.find((i) => i.id === id) ?? INSTITUTIONS[0];

const P = (id: string, inst: string, tier: number, track: 'civil' | 'military', en: string, ko: string, gen: string, gko: string, den: string, dko: string, span: { from?: number; to?: number } = {}): Post => ({
  id, inst, tier, track, title: T(en, ko), grade: T(gen, gko), duty: T(den, dko), ...span,
});

export const POSTS: Post[] = [
  // civil, tier 1: junior officials
  P('seungmunwon-jeongja', 'seungmunwon', 1, 'civil', 'Proofreader, Office of Diplomatic Correspondence', '승문원 정자', 'Senior 9th grade', '정9품', 'Copy and check letters to foreign courts', '외교 문서를 베끼고 교정한다'),
  P('hongmungwan-jeongja', 'hongmungwan', 1, 'civil', 'Junior Copyist, Office of Special Advisers', '홍문관 정자', 'Senior 9th grade', '정9품', 'Fetch texts for the royal lectures', '경연에 쓸 책을 챙긴다'),
  P('sagwan', 'chunchugwan', 1, 'civil', 'Historiographer', '예문관 검열(사관)', 'Senior 9th grade', '정9품', 'Write down everything said before the king', '임금 앞에서 오간 말을 모두 적는다'),
  // tier 2: mid-ranking
  P('hongmungwan-gyori', 'hongmungwan', 2, 'civil', 'Counsellor, Office of Special Advisers', '홍문관 교리', 'Senior 5th grade', '정5품', 'Lecture on the classics to the king', '임금께 경서를 강론한다'),
  P('ijo-jwarang', 'ijo', 2, 'civil', 'Assistant Section Chief, Ministry of Personnel', '이조 좌랑', 'Senior 6th grade', '정6품', 'Recommend men for posts', '관직 후보를 천거한다'),
  P('gamchal', 'saheonbu', 2, 'civil', 'Inspector, Office of the Inspector-General', '사헌부 감찰', 'Senior 6th grade', '정6품', 'Audit offices and question officials', '관아를 감찰하고 관리를 신문한다'),
  P('jeongeon', 'saganwon', 2, 'civil', 'Correct Counsellor, Office of the Censor-General', '사간원 정언', 'Senior 6th grade', '정6품', 'Write remonstrances against error', '그릇된 일에 간언을 올린다'),
  P('hyeongjo-jwarang', 'hyeongjo', 2, 'civil', 'Assistant Section Chief, Ministry of Punishments', '형조 좌랑', 'Senior 6th grade', '정6품', 'Hear petitions and review cases', '소송을 듣고 사건을 검토한다'),
  // tier 3: senior
  P('seungji', 'seungjeongwon', 3, 'civil', 'Royal Secretary', '승정원 승지', 'Senior 3rd grade (dangsang)', '정3품 당상관', 'Carry the king’s orders and read him the memorials', '왕명을 전하고 상소를 아뢴다'),
  P('daesagan', 'saganwon', 3, 'civil', 'Censor-General', '사간원 대사간', 'Senior 3rd grade (dangsang)', '정3품 당상관', 'Lead the censors in remonstrance', '간관들을 이끌어 간쟁한다'),
  P('bujehak', 'hongmungwan', 3, 'civil', 'Deputy Director, Office of Special Advisers', '홍문관 부제학', 'Senior 3rd grade (dangsang)', '정3품 당상관', 'Guide the king’s learning', '임금의 학문을 보필한다'),
  P('hojo-champan', 'hojo', 3, 'civil', 'Deputy Minister of Taxation', '호조 참판', 'Junior 2nd grade', '종2품', 'Balance the granaries and the tax rolls', '창고와 조세 장부를 맞춘다'),
  // tier 4: ministers
  P('yejo-panseo', 'yejo', 4, 'civil', 'Minister of Rites', '예조 판서', 'Senior 2nd grade', '정2품', 'Order the rites, the examinations and the envoys', '의례와 과거와 사신 접대를 주관한다'),
  P('ijo-panseo', 'ijo', 4, 'civil', 'Minister of Personnel', '이조 판서', 'Senior 2nd grade', '정2품', 'Decide who rises and who falls', '누가 오르고 누가 내려갈지 정한다'),
  P('hojo-panseo', 'hojo', 4, 'civil', 'Minister of Taxation', '호조 판서', 'Senior 2nd grade', '정2품', 'Keep the kingdom’s accounts', '나라의 살림을 맡는다'),
  P('hyeongjo-panseo', 'hyeongjo', 4, 'civil', 'Minister of Punishments', '형조 판서', 'Senior 2nd grade', '정2품', 'Judge the gravest cases', '중대한 옥사를 다스린다'),
  P('gongjo-panseo', 'gongjo', 4, 'civil', 'Minister of Public Works', '공조 판서', 'Senior 2nd grade', '정2품', 'Build walls, bridges and palaces', '성곽과 다리와 궁궐을 짓는다'),
  P('daesaheon', 'saheonbu', 4, 'civil', 'Inspector-General', '사헌부 대사헌', 'Junior 2nd grade', '종2품', 'Impeach corrupt officials, however high', '지위 고하를 막론하고 탐관을 탄핵한다'),
  // tier 5: state councillors
  P('ujeongseung', 'uijeongbu', 5, 'civil', 'Third State Councillor', '우의정', 'Senior 1st grade', '정1품', 'Deliberate the affairs of state', '국정을 논의한다'),
  P('jwauijeong', 'uijeongbu', 5, 'civil', 'Second State Councillor', '좌의정', 'Senior 1st grade', '정1품', 'Deliberate the affairs of state', '국정을 논의한다'),
  P('yeonguijeong', 'uijeongbu', 5, 'civil', 'Chief State Councillor', '영의정', 'Senior 1st grade', '정1품', 'Lead the government in the king’s name', '임금의 이름으로 조정을 이끈다'),
  // military
  P('naegeumwi', 'naegeumwi', 1, 'military', 'Officer of the Royal Guard', '내금위 군관', 'Junior 9th to 6th grade', '종9품~종6품', 'Stand guard at the king’s door', '임금의 문을 지킨다'),
  P('bongsa', 'owi', 1, 'military', 'Junior Officer, Military Training Office', '훈련원 봉사', 'Junior 8th grade', '종8품', 'Drill recruits in archery', '신병에게 활쏘기를 가르친다'),
  P('hullyeon-chogwan', 'hullyeon', 2, 'military', 'Commander of a capital company', '훈련도감 초관', 'Junior 9th grade', '종9품', 'Lead a company of the standing army', '상비군 한 초를 이끈다', { from: 1593, to: 1882 }),
  P('bujang', 'owi', 2, 'military', 'Company Commander, Five Guards', '오위 부장', 'Junior 6th grade', '종6품', 'Lead a company of the capital guards', '도성 수비군 한 부를 이끈다'),
  P('manho', 'provinces', 2, 'military', 'Garrison Commander', '만호', 'Junior 4th grade', '종4품', 'Hold a coastal fort against raiders', '해안 진보를 지켜 왜구를 막는다'),
  P('naegeumwijang', 'naegeumwi', 3, 'military', 'Captain of the Royal Guard', '내금위장', 'Junior 2nd grade', '종2품', 'Answer for the king’s safety', '임금의 안위를 책임진다'),
  P('cheomsa', 'provinces', 3, 'military', 'Fortress Commander', '첨절제사', 'Junior 3rd grade', '종3품', 'Command a border fortress', '변경의 진을 지휘한다'),
  P('hullyeon-daejang', 'hullyeon', 4, 'military', 'Commander of the Capital Garrison', '훈련대장', 'Junior 2nd grade', '종2품', 'Command the capital’s standing army', '도성의 상비군을 지휘한다', { from: 1593, to: 1882 }),
  P('byeongsa', 'provinces', 4, 'military', 'Provincial Army Commander', '병마절도사', 'Junior 2nd grade', '종2품', 'Command a province’s army', '한 도의 군사를 지휘한다'),
  P('byeongjo-panseo', 'byeongjo', 5, 'military', 'Minister of War', '병조 판서', 'Senior 2nd grade', '정2품', 'Direct the kingdom’s defence', '나라의 방비를 총괄한다'),
  P('dochonggwan', 'owi', 5, 'military', 'Commander-in-Chief, Five Military Commands', '오위도총부 도총관', 'Senior 2nd grade', '정2품', 'Command every guard of the capital', '도성의 모든 군사를 통솔한다'),
];
export const postById = (id: string | undefined) => POSTS.find((p) => p.id === id);
const inYear = (x: { from?: number; to?: number }, year: number) => (x.from === undefined || year >= x.from) && (x.to === undefined || year <= x.to);
export const postsFor = (track: 'civil' | 'military', tier: number, year: number) => POSTS.filter((p) => p.track === track && p.tier === tier && inYear(p, year));
export const institutionsIn = (year: number) => INSTITUTIONS.filter((i) => inYear(i, year));

/** The post a tier usually means, matching the titles the story uses. */
export const DEFAULT_POST: Record<'civil' | 'military', string[]> = {
  civil: ['seungmunwon-jeongja', 'hongmungwan-gyori', 'seungji', 'yejo-panseo', 'ujeongseung'],
  military: ['naegeumwi', 'hullyeon-chogwan', 'naegeumwijang', 'hullyeon-daejang', 'byeongjo-panseo'],
};
export function defaultPost(track: 'civil' | 'military', tier: number, year: number): Post {
  const p = postById(DEFAULT_POST[track][tier - 1]);
  if (p && inYear(p, year)) return p;
  return postsFor(track, tier, year)[0] ?? p ?? POSTS[0];
}

export const TIER_NAMES: Record<'civil' | 'military', Text[]> = {
  civil: [T('Junior official', '하급 관리'), T('Mid-ranking official', '중견 관리'), T('Senior official', '당상관'), T('Minister', '판서'), T('State Councillor', '정승')],
  military: [T('Officer', '군관'), T('Senior officer', '중견 무관'), T('Commander', '지휘관'), T('General', '대장'), T('High commander', '최고 지휘관')],
};

/** Court officials of the cast, and the institution each sits in. */
export const NPC_POSTS: Record<string, string> = {
  'chief-councillor': 'yeonguijeong',
  'left-councillor': 'jwauijeong',
  'royal-secretary': 'seungji',
  historian: 'sagwan',
  inspector: 'gamchal',
};

/** §5 Master: regular examinations came every third year (식년), with special ones besides. */
export const isRegularExamYear = (year: number) => year % 3 === 1;

/** Diplomacy, GSDD Part II §13: who Joseon sent envoys to, by period. */
export function missionsFor(year: number): { id: string; name: Text; to: Text; seasons: number }[] {
  const list: { id: string; name: Text; to: Text; seasons: number }[] = [];
  if (year < 1644) list.push({ id: 'ming', name: T('Winter solstice embassy to Beijing', '동지사 연행'), to: T('the Ming court', '명나라 조정'), seasons: 2 });
  else list.push({ id: 'qing', name: T('Winter solstice embassy to Beijing', '동지사 연행'), to: T('the Qing court', '청나라 조정'), seasons: 2 });
  if ((year < 1592 || year >= 1607) && year < 1876) list.push({ id: 'japan', name: T('Communication embassy to Japan', '통신사'), to: T(year < 1603 ? 'the Japanese court' : 'the Tokugawa shogunate', year < 1603 ? '일본' : '에도 막부'), seasons: 3 });
  if (year < 1636) list.push({ id: 'jurchen', name: T('Mission to the Jurchen chiefs', '여진 회유 사행'), to: T('the Jurchen tribes', '여진 부족'), seasons: 1 });
  return list;
}

/** Wars and border troubles a military career can be drawn into (GSDD Part II §14 military events). */
export const CONFLICTS: { from: number; to: number; name: Text; text: Text }[] = [
  { from: 1392, to: 1449, name: T('The northern frontier', '북방 개척'), text: T('Jurchen raids along the Tumen and Yalu as the Four Commanderies and Six Garrisons are built.', '4군 6진을 개척하는 동안 두만강과 압록강 일대에 여진의 침입이 잦다.') },
  { from: 1510, to: 1555, name: T('Japanese pirates in the south', '삼포왜란과 을묘왜변'), text: T('Japanese settlers and raiders rise along the southern coast.', '남해안에서 왜인과 왜구가 난을 일으킨다.') },
  { from: 1592, to: 1598, name: T('The Imjin War', '임진왜란'), text: T('Japan invades. The king flees north and the kingdom fights for its life.', '일본이 쳐들어왔다. 임금은 북으로 피난하고 나라는 존망의 싸움을 벌인다.') },
  { from: 1627, to: 1627, name: T('The first Manchu invasion', '정묘호란'), text: T('The Later Jin crosses the Yalu.', '후금이 압록강을 건너왔다.') },
  // The invasion came in the last moon of 1636; by the year, the war belongs to 1637.
  { from: 1637, to: 1637, name: T('The second Manchu invasion', '병자호란'), text: T('The Qing army reaches the capital; the king holds out at Namhansanseong.', '청군이 도성에 이르고 임금은 남한산성에서 버틴다.') },
  { from: 1811, to: 1812, name: T('Hong Gyeong-rae’s rebellion', '홍경래의 난'), text: T('Rebels seize the towns of Pyeongan.', '반란군이 평안도 고을들을 장악했다.') },
  { from: 1866, to: 1866, name: T('The French expedition', '병인양요'), text: T('French warships attack Ganghwa Island.', '프랑스 함대가 강화도를 공격했다.') },
  { from: 1871, to: 1871, name: T('The American expedition', '신미양요'), text: T('American ships force their way up to Ganghwa.', '미국 함대가 강화도로 밀고 들어왔다.') },
  { from: 1894, to: 1895, name: T('The Donghak uprising', '동학 농민 운동'), text: T('Peasant armies rise in Jeolla, and foreign troops follow.', '전라도에서 농민군이 일어나고 외국 군대가 뒤따른다.') },
];
/** The war of a year, if any. A campaign whose player averted the 1636 crisis skips the second Manchu invasion. */
export const conflictIn = (year: number, flags: Record<string, boolean> = {}) =>
  CONFLICTS.find((c) => year >= c.from && year <= c.to && !(c.from === 1637 && flags['iv-1636-averted'])) ?? null;
