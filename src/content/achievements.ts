import type { Effect } from '../model/content';
import type { Game, Quality, Text } from '../model/schemas';
import { T } from '../engine/text';
import { ENDINGS, QUALITY_NAMES, STAT_NAMES, giftName } from './lists';
import { playerAge } from '../engine/time';
import { spouseId } from '../engine/world';

/**
 * Achievements, kept in a record that lasts across lives. Each one is earned once per life,
 * and earning it pays its reward into that life: money, standing, a quality or a gift.
 */

export type Category = 'office' | 'court' | 'family' | 'life' | 'wealth' | 'legacy' | 'ending';
export type Reward = { money?: number; reputation?: number; favour?: number; prestige?: number; health?: number; quality?: [Quality, number]; gift?: string };
export type AchievementDef = { id: string; cat: Category; seal: string; title: Text; how: Text; reward: Reward | null; test: (g: Game) => boolean };

export const CATEGORIES: { id: Category; name: Text }[] = [
  { id: 'office', name: T('Office', '벼슬') },
  { id: 'court', name: T('Court', '조정') },
  { id: 'family', name: T('Family', '가족') },
  { id: 'life', name: T('A long life', '일생') },
  { id: 'wealth', name: T('Wealth', '재물') },
  { id: 'legacy', name: T('The family line', '가문') },
  { id: 'ending', name: T('Endings', '결말') },
];

const rank = (g: Game, track: 'civil' | 'military') => (g.player.office?.track === track ? g.player.office.rank : 0);
const regard = (g: Game, id: string) => (g.npcs[id]?.alive ? g.rel[id]?.regard ?? -999 : -999);
const ownChildren = (g: Game) => Object.values(g.npcs).filter((n) => n.kin === 'child' && n.parents.includes('player'));
const metCount = (g: Game) => Object.entries(g.rel).filter(([id, r]) => r.met && !g.npcs[id]?.kin && id !== 'king').length;

const office = (id: string, seal: string, track: 'civil' | 'military', r: number, title: Text, how: Text, reward: Reward): AchievementDef =>
  ({ id, cat: 'office', seal, title, how, reward, test: (g) => rank(g, track) >= r });

export const ACHIEVEMENTS: AchievementDef[] = [
  // ---------------------------------------------------------------- office
  { id: 'exam', cat: 'office', seal: '급', title: T('Passed the gwageo', '과거 급제'), how: T('Pass the state examination, civil or military.', '문과나 무과에 급제한다.'), reward: { money: 100, reputation: 2 }, test: (g) => !!g.player.office || g.player.quals.includes('munkwa') || g.player.quals.includes('mukwa') },
  office('civil-3', '승', 'civil', 3, T('A senior official', '당상관'), T('Rise to the third tier of civil office, a hall-ascending official.', '문관으로 당상관에 오른다.'), { money: 150, favour: 3 }),
  office('civil-4', '판', 'civil', 4, T('A minister', '판서'), T('Rise to head a ministry.', '육조의 판서에 오른다.'), { money: 250, reputation: 3 }),
  office('civil-5', '정', 'civil', 5, T('A State Councillor', '정승'), T('Rise to the State Council, the three highest offices.', '삼정승의 반열에 오른다.'), { money: 400, reputation: 5 }),
  office('military-3', '위', 'military', 3, T('Captain of the Royal Guard', '내금위장'), T('Rise to Captain of the Royal Guard as a military officer.', '무관으로 내금위장에 오른다.'), { money: 150, favour: 3 }),
  office('military-4', '훈', 'military', 4, T('Commander of the Capital Garrison', '훈련대장'), T('Rise to Commander of the Capital Garrison.', '훈련대장에 오른다.'), { money: 250, reputation: 3 }),
  office('military-5', '병', 'military', 5, T('Minister of War', '병조 판서'), T('Rise to Minister of War.', '병조 판서에 오른다.'), { money: 400, reputation: 5 }),

  // ---------------------------------------------------------------- court
  { id: 'audience', cat: 'court', seal: '알', title: T('Before the throne', '어전에 서다'), how: T('Be summoned to the Throne Hall.', '어명을 받고 정전에 든다.'), reward: { reputation: 2 }, test: (g) => !!g.flags.summoned },
  { id: 'favourite', cat: 'court', seal: '총', title: T('The ruler’s favourite', '임금의 총애'), how: T('Raise royal favour to 70.', '왕의 총애를 70까지 올린다.'), reward: { money: 120, reputation: 3 }, test: (g) => g.player.favour >= 70 },
  { id: 'queen-trust', cat: 'court', seal: '중', title: T('Trusted by the Queen', '중전의 신임'), how: T('Reach 60 regard with the Queen.', '중전마마의 호감을 60까지 쌓는다.'), reward: { favour: 4, quality: ['grace', 2] }, test: (g) => regard(g, 'queen-consort') >= 60 },
  { id: 'dowager', cat: 'court', seal: '비', title: T('The dowager’s blessing', '대비의 축복'), how: T('Reach 60 regard with the Queen Dowager.', '대비마마의 호감을 60까지 쌓는다.'), reward: { favour: 4, health: 5 }, test: (g) => regard(g, 'queen-dowager') >= 60 },
  { id: 'east-palace', cat: 'court', seal: '동', title: T('Friend of the East Palace', '동궁의 벗'), how: T('Reach 50 regard with the Crown Prince.', '세자 저하의 호감을 50까지 쌓는다.'), reward: { favour: 5 }, test: (g) => regard(g, 'crown-prince') >= 50 },
  { id: 'known', cat: 'court', seal: '교', title: T('Known to everyone', '장안의 마당발'), how: T('Get to know 20 people outside your family.', '집안 밖의 스무 명과 안면을 튼다.'), reward: { reputation: 3 }, test: (g) => metCount(g) >= 20 },
  { id: 'generous', cat: 'court', seal: '덕', title: T('An open hand', '후한 인심'), how: T('Give 10 gifts in one life.', '한평생 선물을 열 번 건넨다.'), reward: { money: 50, reputation: 2 }, test: (g) => (g.counts.gifts ?? 0) >= 10 },
  { id: 'true-friend', cat: 'court', seal: '벗', title: T('A true friend', '지기'), how: T('Become close friends with someone.', '누군가와 막역한 벗이 된다.'), reward: { quality: ['resolve', 2] }, test: (g) => Object.entries(g.rel).some(([id, r]) => r.regard >= 75 && r.bond === 'none' && !g.npcs[id]?.kin && g.npcs[id]?.alive) },
  { id: 'enemy', cat: 'court', seal: '원', title: T('A sworn enemy', '철천지원수'), how: T('Make someone hate you with all their heart.', '누군가 뼛속까지 당신을 미워하게 만든다.'), reward: { quality: ['resolve', 2] }, test: (g) => Object.values(g.rel).some((r) => r.regard <= -80) },
  { id: 'ashes', cat: 'court', seal: '재', title: T('Ash and silence', '재와 침묵'), how: T('Burn a dangerous letter before anyone else can read it.', '남이 읽기 전에 위험한 서신을 태운다.'), reward: { quality: ['wit', 2] }, test: (g) => !!g.flags['letter-burned'] },

  // ---------------------------------------------------------------- family
  { id: 'romance', cat: 'family', seal: '연', title: T('A matter of the heart', '연모'), how: T('Fall in love with someone at court.', '궁의 누군가와 사랑에 빠진다.'), reward: { health: 3 }, test: (g) => Object.values(g.rel).some((r) => r.bond === 'lover' || (r.bond === 'spouse' && !!g.flags['love-match'])) },
  { id: 'married', cat: 'family', seal: '혼', title: T('Two houses joined', '두 집안의 혼인'), how: T('Marry.', '혼인한다.'), reward: { money: 100 }, test: (g) => !!spouseId(g) },
  { id: 'love-match', cat: 'family', seal: '정', title: T('Married for love', '사랑으로 맺은 혼인'), how: T('Marry the person you love.', '사랑하는 사람과 혼인한다.'), reward: { quality: ['grace', 2], health: 4 }, test: (g) => !!g.flags['love-match'] && !!spouseId(g) },
  { id: 'first-child', cat: 'family', seal: '자', title: T('The first child', '첫아이'), how: T('Have a child.', '자식을 얻는다.'), reward: { money: 50 }, test: (g) => ownChildren(g).length >= 1 },
  { id: 'full-house', cat: 'family', seal: '복', title: T('A full house', '다복한 집'), how: T('Have five children.', '자식 다섯을 둔다.'), reward: { money: 80, health: 3 }, test: (g) => ownChildren(g).length >= 5 },
  { id: 'grandchild', cat: 'family', seal: '손', title: T('A grandchild', '손주를 보다'), how: T('Live to see a grandchild born.', '손주가 태어나는 것을 본다.'), reward: { health: 5 }, test: (g) => Object.values(g.npcs).some((n) => n.kin === 'grandchild') },

  // ---------------------------------------------------------------- a long life
  { id: 'hwangap', cat: 'life', seal: '갑', title: T('Hwangap', '환갑'), how: T('Reach sixty, when the cycle of years comes round again.', '육십갑자가 한 바퀴 도는 예순 살이 된다.'), reward: { money: 60, reputation: 3 }, test: (g) => g.player.alive && playerAge(g) >= 60 },
  { id: 'gohui', cat: 'life', seal: '희', title: T('Rare since ancient times', '고희'), how: T('Reach seventy.', '일흔 살이 된다.'), reward: { reputation: 5 }, test: (g) => g.player.alive && playerAge(g) >= 70 },
  { id: 'eighty', cat: 'life', seal: '수', title: T('A long life', '장수'), how: T('Reach eighty.', '여든 살이 된다.'), reward: { health: 5 }, test: (g) => g.player.alive && playerAge(g) >= 80 },
  { id: 'learned', cat: 'life', seal: '학', title: T('Learned', '학식'), how: T('Raise wit to 80.', '재치를 80까지 올린다.'), reward: { reputation: 2 }, test: (g) => g.player.qualities.wit >= 80 },
  { id: 'graceful', cat: 'life', seal: '품', title: T('Perfect manners', '품격'), how: T('Raise grace to 80.', '품위를 80까지 올린다.'), reward: { favour: 2 }, test: (g) => g.player.qualities.grace >= 80 },
  { id: 'resolute', cat: 'life', seal: '결', title: T('Iron will', '굳은 뜻'), how: T('Raise resolve to 80.', '결단력을 80까지 올린다.'), reward: { health: 3 }, test: (g) => g.player.qualities.resolve >= 80 },
  { id: 'revered', cat: 'life', seal: '존', title: T('Revered', '추앙'), how: T('Raise your reputation to 80.', '평판을 80까지 올린다.'), reward: { money: 100 }, test: (g) => g.player.reputation >= 80 },
  { id: 'disgraced', cat: 'life', seal: '실', title: T('Fallen from grace', '추락'), how: T('Let your reputation fall below 15.', '평판이 15 아래로 떨어진다.'), reward: { quality: ['resolve', 3] }, test: (g) => g.player.reputation < 15 },

  // ---------------------------------------------------------------- wealth
  { id: 'thousand', cat: 'wealth', seal: '천', title: T('A thousand nyang', '천 냥'), how: T('Hold 1,000 nyang.', '천 냥을 모은다.'), reward: { reputation: 1 }, test: (g) => g.player.money >= 1000 },
  { id: 'rich', cat: 'wealth', seal: '부', title: T('A rich house', '부잣집'), how: T('Hold 5,000 nyang.', '오천 냥을 모은다.'), reward: { reputation: 3 }, test: (g) => g.player.money >= 5000 },
  { id: 'ship', cat: 'wealth', seal: '상', title: T('A ship comes in', '만선'), how: T('Make money on a silk shipment.', '비단 배에서 이문을 남긴다.'), reward: { quality: ['wit', 1] }, test: (g) => (g.counts['invest-wins'] ?? 0) >= 1 },
  { id: 'penniless', cat: 'wealth', seal: '빈', title: T('Not a coin to spare', '빈털터리'), how: T('Run out of money.', '돈이 바닥난다.'), reward: { quality: ['resolve', 2] }, test: (g) => g.player.money <= 0 && g.dayCount > 0 },

  // ---------------------------------------------------------------- the family line
  { id: 'great-house', cat: 'legacy', seal: '세', title: T('A great house', '세도가'), how: T('Raise your family’s prestige to five.', '가문의 위세를 다섯까지 올린다.'), reward: { money: 200 }, test: (g) => g.house.prestige >= 5 },
  { id: 'heir', cat: 'legacy', seal: '대', title: T('The line continues', '대를 잇다'), how: T('Continue the family as an heir.', '후손으로 가문을 잇는다.'), reward: { money: 100 }, test: (g) => g.generation >= 2 },
  { id: 'third-gen', cat: 'legacy', seal: '삼', title: T('Three generations', '삼대'), how: T('Reach the third generation.', '삼대째에 이른다.'), reward: { prestige: 1 }, test: (g) => g.generation >= 3 },
  { id: 'fifth-gen', cat: 'legacy', seal: '오', title: T('Five generations', '오대'), how: T('Reach the fifth generation.', '오대째에 이른다.'), reward: { money: 500, prestige: 1 }, test: (g) => g.generation >= 5 },

  // ---------------------------------------------------------------- endings
  ...Object.values(ENDINGS).map((e): AchievementDef => ({
    id: `ending:${e.key}`, cat: 'ending', seal: e.ko.slice(0, 1), title: e.title,
    how: T('Reach this ending.', '이 결말에 이른다.'), reward: null, test: (g) => !g.player.alive && g.ending === e.key,
  })),
  // ---------------------------------------------------------------- v0.3: the wider life
  { id: 'licentiate', cat: 'office', seal: '생', title: T('A licentiate', '생원'), how: T('Pass the lesser examination.', '소과에 합격한다.'), reward: { reputation: 2 }, test: (g) => g.player.quals.includes('sogwa') },
  { id: 'envoy', cat: 'office', seal: '사', title: T('Sent abroad', '사행'), how: T('Return from an embassy to a foreign court.', '외국 사행에서 돌아온다.'), reward: { money: 60, favour: 2 }, test: (g) => g.player.quals.includes('envoy') },
  { id: 'victory', cat: 'office', seal: '승', title: T('Victory in the field', '전공'), how: T('Win a battle as an officer.', '무관으로 싸움에서 이긴다.'), reward: { reputation: 3 }, test: (g) => (g.counts.victories ?? 0) > 0 },
  { id: 'inquiry', cat: 'court', seal: '안', title: T('Case closed', '옥사 해결'), how: T('Solve an inquiry or clear the falsely accused.', '조사를 해결하거나 억울한 이를 풀어 준다.'), reward: { reputation: 2, favour: 2 }, test: (g) => (g.counts.solved ?? 0) > 0 },
  { id: 'selected', cat: 'court', seal: '빈', title: T('Chosen by the palace', '간택'), how: T('Be chosen in a royal selection.', '간택에 뽑힌다.'), reward: { prestige: 1 }, test: (g) => (g.counts.selected ?? 0) > 0 },
  { id: 'crown-heir', cat: 'court', seal: '세', title: T('Heir to the throne', '세자 책봉'), how: T('Be named crown prince.', '세자로 책봉된다.'), reward: { favour: 5 }, test: (g) => (g.counts.heir ?? 0) > 0 },
  { id: 'reign', cat: 'court', seal: '왕', title: T('Sovereign of Joseon', '보위에 오르다'), how: T('Take the throne.', '보위에 오른다.'), reward: null, test: (g) => (g.counts.reigned ?? 0) > 0 },
  { id: 'regent', cat: 'court', seal: '렴', title: T('Behind the screen', '수렴청정'), how: T('Govern as regent for a young king.', '어린 임금을 대신해 섭정한다.'), reward: null, test: (g) => g.player.royal === 'regent' },
  { id: 'coming-of-age', cat: 'life', seal: '관', title: T('Coming of age', '관례'), how: T('Grow up from childhood to your coming-of-age ceremony.', '어린 시절부터 자라 관례를 치른다.'), reward: { health: 3 }, test: (g) => !!g.flags['came-of-age'] },
  { id: 'traveller', cat: 'life', seal: '행', title: T('The eight provinces', '팔도 유람'), how: T('Make three journeys to the provinces.', '지방으로 세 번 길을 떠난다.'), reward: { money: 40 }, test: (g) => (g.counts.journeys ?? 0) >= 3 },
  { id: 'shrine', cat: 'wealth', seal: '사', title: T('A shrine for the ancestors', '사당 건립'), how: T('Have an ancestral shrine at the family residence.', '본가에 사당을 갖춘다.'), reward: { reputation: 2 }, test: (g) => g.econ.estates.some((e) => e.buildings.includes('shrine')) && (g.counts.built ?? 0) > 0 },
  { id: 'enterprise', cat: 'wealth', seal: '상', title: T('An enterprise of one’s own', '창업'), how: T('Open a business.', '사업을 연다.'), reward: { money: 30 }, test: (g) => (g.counts.businesses ?? 0) > 0 },
  { id: 'landlord', cat: 'wealth', seal: '전', title: T('Lands in many places', '여러 고을의 땅'), how: T('Hold five estates at once.', '전장 다섯 곳을 거느린다.'), reward: { prestige: 1 }, test: (g) => g.econ.estates.length >= 5 && (g.counts.estates ?? 0) > 0 },
  { id: 'fallen', cat: 'legacy', seal: '서', title: T('Fallen, and still standing', '몰락 그 후'), how: T('Choose to go on living after losing your status.', '신분을 잃고도 살아가기를 택한다.'), reward: { health: 5 }, test: (g) => !!g.pol.downfall?.continued && g.player.alive },
  { id: 'restored', cat: 'legacy', seal: '복', title: T('Name restored', '신원 회복'), how: T('Win back your status after a downfall.', '몰락 뒤 신분을 되찾는다.'), reward: { reputation: 5 }, test: (g) => (g.counts.restorations ?? 0) > 0 },
  { id: 'history', cat: 'legacy', seal: '史', title: T('History rewritten', '바뀐 역사'), how: T('Change the course of recorded history.', '기록된 역사의 흐름을 바꾼다.'), reward: null, test: (g) => g.pol.divergence.length > 0 },
  // ---------------------------------------------------------------- v0.5 and v0.6: the personal life, culture and belief
  { id: 'first-brush', cat: 'life', seal: '筆', title: T('First brush', '첫 붓'), how: T('Become competent at any pastime.', '어떤 취미든 익숙한 솜씨가 된다.'), reward: { reputation: 1 }, test: (g) => Object.values(g.player.skills).some((v) => v >= 25) },
  { id: 'three-arts', cat: 'life', seal: '三', title: T('Three perfections', '시서화 삼절'), how: T('Be accomplished in poetry, calligraphy and ink painting.', '시작, 서예, 서화에 모두 능숙해진다.'), reward: { reputation: 5 }, test: (g) => ['poetry', 'calligraphy', 'painting'].every((k) => (g.player.skills[k] ?? 0) >= 50) },
  { id: 'contest-won', cat: 'life', seal: '魁', title: T('First place', '장원'), how: T('Win a contest in any pastime.', '어떤 취미든 겨루기에서 으뜸을 한다.'), reward: { money: 30 }, test: (g) => (g.counts.contests ?? 0) > 0 },
  { id: 'author', cat: 'life', seal: '著', title: T('An author', '저자'), how: T('Finish your first work.', '첫 작품을 완성한다.'), reward: { reputation: 2 }, test: (g) => g.player.works.length > 0 },
  { id: 'masterpiece', cat: 'life', seal: '名', title: T('A celebrated work', '명작'), how: T('Finish a work that the capital copies by hand.', '도성에서 필사해 돌려 읽는 작품을 쓴다.'), reward: { reputation: 4, favour: 2 }, test: (g) => g.player.works.some((w) => w.quality >= 80) },
  { id: 'collected', cat: 'life', seal: '集', title: T('Collected works', '문집'), how: T('Finish five works in one life.', '한 생에 작품 다섯 편을 완성한다.'), reward: { prestige: 1 }, test: (g) => g.player.works.length >= 5 },
  { id: 'patron', cat: 'wealth', seal: '施', title: T('A patron', '후원자'), how: T('Make three acts of patronage.', '세 번 후원한다.'), reward: { reputation: 3 }, test: (g) => (g.counts.patronage ?? 0) >= 3 },
  { id: 'companion', cat: 'family', seal: '伴', title: T('A companion', '벗 삼은 짐승'), how: T('Take in a dog, a cat, a falcon or a crane.', '개나 고양이, 매나 학을 식구로 들인다.'), reward: { health: 2 }, test: (g) => !!g.player.pet },
  { id: 'settled-way', cat: 'life', seal: '道', title: T('A settled way', '정한 길'), how: T('Hold a conviction of 70 in your way of belief.', '믿음의 길에서 신념 70에 이른다.'), reward: { health: 3 }, test: (g) => g.player.belief.conviction >= 70 },
  { id: 'healed', cat: 'life', seal: '癒', title: T('Through the fever', '병을 이기다'), how: T('Be treated for illness five times in one life.', '한 생에 다섯 번 치료를 받는다.'), reward: { health: 4 }, test: (g) => (g.counts.treatments ?? 0) >= 5 },
  { id: 'contented', cat: 'life', seal: '樂', title: T('Contentment', '안락'), how: T('Reach happiness 90.', '행복 90에 이른다.'), reward: { health: 3 }, test: (g) => g.player.happiness >= 90 },
  { id: 'good-parent', cat: 'family', seal: '育', title: T('A child well raised', '잘 기른 자식'), how: T('Raise a child’s learning to 60.', '자녀의 배움을 60까지 기른다.'), reward: { reputation: 2 }, test: (g) => Object.values(g.npcs).some((n) => n.parents.includes('player') && (n.upbringing?.progress ?? 0) >= 60) },
  { id: 'polyglot', cat: 'office', seal: '譯', title: T('No interpreter needed', '통역이 필요 없다'), how: T('Become accomplished in spoken Chinese.', '한어에 능숙해진다.'), reward: { favour: 2 }, test: (g) => (g.player.skills.language ?? 0) >= 50 },
  { id: 'tactician', cat: 'office', seal: '謀', title: T('The tactician', '지장'), how: T('Win three victories in the field.', '전장에서 세 번 이긴다.'), reward: { reputation: 5, favour: 3 }, test: (g) => (g.counts.victories ?? 0) >= 3 },
  { id: 'memorials', cat: 'court', seal: '疏', title: T('The work of a reign', '치세의 일'), how: T('Decide twenty memorials as monarch or regent.', '임금이나 섭정으로 상소 스무 건을 결재한다.'), reward: null, test: (g) => (g.counts.memorials ?? 0) >= 20 },
  { id: 'retired-king', cat: 'court', seal: '上', title: T('The retired king', '상왕'), how: T('Abdicate in favour of your heir.', '후계에게 양위한다.'), reward: null, test: (g) => !!g.flags.abdicated },
  { id: 'scenario', cat: 'legacy', seal: '志', title: T('What you set out to do', '뜻한 바'), how: T('Complete a scenario.', '시나리오 하나를 달성한다.'), reward: { reputation: 5 }, test: (g) => g.scenario?.status === 'won' },
  { id: 'devout', cat: 'life', seal: '誠', title: T('Firm in the way', '굳은 믿음'), how: T('Reach conviction 80 in your way of belief.', '믿음의 굳기 80에 이른다.'), reward: { health: 3 }, test: (g) => g.player.belief.conviction >= 80 },
  { id: 'old-companion', cat: 'family', seal: '老', title: T('Old companions', '오랜 벗'), how: T('Keep a companion animal for ten years.', '반려 동물과 십 년을 함께한다.'), reward: { health: 2 }, test: (g) => !!g.player.pet && g.date.year - g.player.pet.born >= 10 },
  { id: 'open-handed', cat: 'wealth', seal: '仁', title: T('Open-handed', '후덕'), how: T('Give patronage four times.', '네 번 후원한다.'), reward: { reputation: 3 }, test: (g) => (g.counts.patronage ?? 0) >= 4 },
  { id: 'letter-writer', cat: 'life', seal: '翰', title: T('A tireless correspondent', '편지의 달인'), how: T('Write twenty letters.', '편지 스무 통을 쓴다.'), reward: { reputation: 2 }, test: (g) => (g.counts.letters ?? 0) >= 20 },
  { id: 'web-of-allies', cat: 'court', seal: '盟', title: T('A web of allies', '동맹의 그물'), how: T('Make three alliances.', '동맹을 세 번 맺는다.'), reward: { favour: 2 }, test: (g) => (g.counts.alliances ?? 0) >= 3 },
  { id: 'hale', cat: 'life', seal: '健', title: T('Hale at sixty', '정정한 환갑'), how: T('Reach sixty with health 80 or more.', '건강 80 이상으로 환갑을 맞는다.'), reward: { health: 3 }, test: (g) => g.player.alive && g.date.year - g.player.birthYear >= 60 && g.player.health >= 80 },
  { id: 'matters-settled', cat: 'office', seal: '決', title: T('Nothing left undone', '일 처리의 달인'), how: T('Settle ten matters.', '과업 열 건을 해결한다.'), reward: { reputation: 3 }, test: (g) => (g.counts.missions ?? 0) >= 10 },
  { id: 'four-victories', cat: 'office', seal: '捷', title: T('Four victories', '사전사승'), how: T('Win four battles.', '전투에서 네 번 이긴다.'), reward: { favour: 4 }, test: (g) => (g.counts.victories ?? 0) >= 4 },
  { id: 'eight-roads', cat: 'life', seal: '遊', title: T('The eight roads', '팔도 유람객'), how: T('Make eight journeys to the provinces.', '지방으로 여덟 번 길을 떠난다.'), reward: { health: 3 }, test: (g) => (g.counts.journeys ?? 0) >= 8 },
  { id: 'many-arts', cat: 'life', seal: '藝', title: T('A person of many arts', '다재다능'), how: T('Be accomplished (50) in five pastimes.', '다섯 가지 취미에서 능숙(50)에 이른다.'), reward: { reputation: 3 }, test: (g) => Object.values(g.player.skills).filter((v) => v >= 50).length >= 5 },
  { id: 'milestones', cat: 'life', seal: '程', title: T('A full life', '꽉 찬 삶'), how: T('Reach ten life milestones.', '삶의 이정표 열 개에 이른다.'), reward: { health: 3 }, test: (g) => g.milestones.length >= 10 },
];

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);

/** A reward as effects, so it goes through the same rules as everything else. */
export function rewardEffects(r: Reward): Effect[] {
  const out: Effect[] = [];
  if (r.money) out.push({ kind: 'money', d: r.money });
  if (r.reputation) out.push({ kind: 'stat', stat: 'reputation', d: r.reputation });
  if (r.favour) out.push({ kind: 'stat', stat: 'favour', d: r.favour });
  if (r.prestige) out.push({ kind: 'stat', stat: 'prestige', d: r.prestige });
  if (r.health) out.push({ kind: 'stat', stat: 'health', d: r.health });
  if (r.quality) out.push({ kind: 'quality', q: r.quality[0], d: r.quality[1] });
  if (r.gift) out.push({ kind: 'gift', id: r.gift });
  return out;
}

/** The reward in words, for the achievements page. */
export function rewardText(r: Reward | null): Text | null {
  if (!r) return null;
  const en: string[] = [];
  const ko: string[] = [];
  const add = (a: string, b: string) => { en.push(a); ko.push(b); };
  if (r.money) add(`${r.money} nyang`, `${r.money}냥`);
  for (const k of ['reputation', 'favour', 'prestige', 'health'] as const) {
    if (r[k]) add(`${STAT_NAMES[k].en} +${r[k]}`, `${STAT_NAMES[k].ko} +${r[k]}`);
  }
  if (r.quality) add(`${QUALITY_NAMES[r.quality[0]].en} +${r.quality[1]}`, `${QUALITY_NAMES[r.quality[0]].ko} +${r.quality[1]}`);
  if (r.gift) add(giftName(r.gift).en, giftName(r.gift).ko ?? giftName(r.gift).en);
  return T(en.join(', '), ko.join(', '));
}
