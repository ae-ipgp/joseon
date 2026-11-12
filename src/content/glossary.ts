import type { Text } from '../model/schemas';
import { T } from '../engine/text';

/**
 * GSDD Part VIII §8.5 and Part VII §12.3: one place for the period's terms, so titles and institutions
 * read the same everywhere and a player new to Joseon can look them up. Korean is given as it is used in play.
 */
export type Term = { term: string; ko: string; group: 'society' | 'court' | 'office' | 'learning' | 'family' | 'daily'; text: Text };
const G = (term: string, ko: string, group: Term['group'], en: string, kot: string): Term => ({ term, ko, group, text: T(en, kot) });

export const GROUPS: Record<Term['group'], Text> = {
  society: T('Society and status', '신분과 사회'), court: T('The royal court', '왕실'), office: T('Government', '관직과 관청'),
  learning: T('Learning and examinations', '학문과 과거'), family: T('Family and rites', '가족과 의례'), daily: T('Daily life', '일상'),
};

export const GLOSSARY: Term[] = [
  G('yangban', '양반', 'society', 'The hereditary elite: the “two orders” of civil and military officials, and the families that produced them.', '문반과 무반, 곧 관료와 그들을 낸 집안으로 이루어진 지배 신분.'),
  G('jungin', '중인', 'society', '“Middle people”: interpreters, physicians, clerks and other technical officials.', '역관, 의관, 서리 같은 기술직 관원과 그 집안.'),
  G('sangmin', '상민', 'society', 'Commoners: farmers, artisans and merchants, who paid most taxes and served in the army.', '농민, 장인, 상인. 세금과 군역의 대부분을 졌다.'),
  G('cheonmin', '천민', 'society', 'The lowborn, including slaves (nobi), butchers, shamans and entertainers.', '노비, 백정, 무당, 광대 등 가장 낮은 신분.'),
  G('nobi', '노비', 'society', 'Slaves, owned by the state or by families; their status passed to their children.', '나라나 집안에 속한 노비. 신분이 자식에게 대물림되었다.'),
  G('seoja', '서자', 'society', 'A son by a concubine. Barred from high office for most of the dynasty.', '첩의 아들. 조선 대부분의 시기에 높은 벼슬에 나가지 못했다.'),
  G('wang', '왕', 'court', 'The king. Addressed as jeonha (전하), “Your Majesty”.', '임금. “전하”라 부른다.'),
  G('wangbi', '왕비', 'court', 'The queen consort, head of the inner court.', '임금의 정실. 내명부의 으뜸.'),
  G('daebi', '대비', 'court', 'Queen dowager: the late king’s queen. Often a great power at court.', '선왕의 왕비. 조정에서 큰 영향력을 가졌다.'),
  G('wangdaebi', '대왕대비', 'court', 'Grand queen dowager: the queen of two reigns ago.', '두 대 앞 임금의 왕비.'),
  G('seja', '세자', 'court', 'The crown prince, formally invested as heir.', '책봉된 왕위 계승자.'),
  G('sejabin', '세자빈', 'court', 'The crown princess, the crown prince’s wife.', '세자의 부인.'),
  G('daegun / gun', '대군 · 군', 'court', 'Princes: daegun for the queen’s sons, gun for a consort’s sons and royal kinsmen.', '왕자. 왕비의 아들은 대군, 후궁의 아들과 종친은 군.'),
  G('gongju / ongju', '공주 · 옹주', 'court', 'Princesses: gongju for the queen’s daughters, ongju for a consort’s.', '공주는 왕비의 딸, 옹주는 후궁의 딸.'),
  G('hugung', '후궁', 'court', 'A royal consort, ranked in the inner court below the queen.', '내명부에서 왕비 아래 품계를 받은 임금의 여인.'),
  G('gungnyeo', '궁녀', 'court', 'Palace women who served the royal household, with ranks of their own.', '왕실을 섬기는 궁중 여인. 따로 품계가 있었다.'),
  G('naegwan', '내관', 'court', 'Eunuchs of the palace, who carried messages and kept the royal quarters.', '궁중의 환관. 명을 전하고 침전을 지켰다.'),
  G('suryeom cheongjeong', '수렴청정', 'court', 'Regency “from behind the bamboo screen”, by a dowager for a young king.', '대비가 어린 임금을 대신해 발을 드리우고 하는 섭정.'),
  G('sangwang', '상왕', 'court', 'A king who has abdicated and still lives: the retired king.', '양위하고 물러난 임금.'),
  G('Uijeongbu', '의정부', 'office', 'The State Council of the three state councillors (jeongseung).', '세 정승으로 이루어진 최고 기관.'),
  G('yukjo', '육조', 'office', 'The Six Ministries: Personnel, Taxation, Rites, Military Affairs, Punishments and Works.', '이조, 호조, 예조, 병조, 형조, 공조.'),
  G('Seungjeongwon', '승정원', 'office', 'The Royal Secretariat, which carried the king’s orders and the court’s memorials.', '왕명을 전하고 상소를 올리는 관청.'),
  G('Saheonbu / Saganwon', '사헌부 · 사간원', 'office', 'The censorate: inspectors and remonstrators who could impeach officials and criticise the king.', '관리를 탄핵하고 임금에게 간언하는 대간.'),
  G('dangsanggwan', '당상관', 'office', 'Senior officials of the upper third grade and above, who sat in the hall with the king.', '정3품 이상의 고위 관원. 임금과 같은 당에 앉았다.'),
  G('pum', '품', 'office', 'Official grade, from the first (highest) to the ninth, each in a senior and junior step.', '관직의 등급. 정1품에서 종9품까지.'),
  G('gyoji', '교지', 'office', 'A royal certificate of appointment.', '임명장으로 내리는 왕의 문서.'),
  G('sangso', '상소', 'office', 'A memorial: a written petition or proposal to the throne.', '임금에게 올리는 글.'),
  G('gwageo', '과거', 'learning', 'The state examinations for office, held every three years and on special occasions.', '관리를 뽑는 시험. 3년마다, 경사가 있을 때도 열렸다.'),
  G('sogwa', '소과', 'learning', 'The lesser examination; success made one a licentiate (saengwon or jinsa).', '생원·진사를 뽑는 작은 과거.'),
  G('mungwa / mukwa', '문과 · 무과', 'learning', 'The great civil and military examinations, the gate to office.', '관직으로 들어가는 대과.'),
  G('Seonggyungwan', '성균관', 'learning', 'The National Confucian Academy in the capital.', '도성의 최고 교육 기관.'),
  G('seowon', '서원', 'learning', 'Private academies in the provinces, centres of scholarship and of faction.', '지방의 사립 학교. 학문과 붕당의 근거지.'),
  G('seodang', '서당', 'learning', 'The village school where children learned their first characters.', '아이들이 처음 글을 배우는 마을 학당.'),
  G('hongpae', '홍패', 'learning', 'The red certificate given to those who passed the great examination.', '대과 급제자에게 주는 붉은 증서.'),
  G('jokbo', '족보', 'family', 'The clan genealogy, kept over centuries.', '여러 대에 걸쳐 기록한 집안의 계보.'),
  G('jesa', '제사', 'family', 'Ancestral rites, held on death anniversaries and holidays by the eldest son’s line.', '기일과 명절에 장손 집안이 지내는 조상 제례.'),
  G('samnyeonsang', '삼년상', 'family', 'Three-year mourning for a parent (in practice twenty-seven months). Officials left office for it.', '부모의 상을 삼 년(실제로는 27개월) 치르는 일. 관원은 벼슬을 내려놓았다.'),
  G('gibok', '기복', 'family', 'A royal order recalling an official from mourning leave early.', '상중인 관원을 임금이 불러 다시 벼슬하게 하는 일.'),
  G('gwallye / gyerye', '관례 · 계례', 'family', 'Coming-of-age rites: the cap for a young man, the hairpin for a young woman.', '성인식. 남자는 갓을 쓰고 여자는 비녀를 꽂는다.'),
  G('honseo', '혼서', 'family', 'The marriage letter sent from the groom’s family to the bride’s.', '신랑 집에서 신부 집에 보내는 혼인 문서.'),
  G('hanbok', '한복', 'daily', 'Korean dress: jeogori jacket with chima skirt or baji trousers.', '저고리에 치마나 바지를 입는 우리 옷.'),
  G('gat', '갓', 'daily', 'The black horsehair hat of a married or adult man.', '성인 남자가 쓰는 검은 말총 모자.'),
  G('sarangchae / anchae', '사랑채 · 안채', 'daily', 'The men’s outer quarters for guests and study; the women’s inner quarters.', '손님과 학문의 바깥채, 여인들의 안채.'),
  G('nyang', '냥', 'daily', 'A unit of money, reckoned in strings of copper coins (sangpyeong tongbo).', '돈의 단위. 상평통보 꿰미로 셈했다.'),
  G('gut', '굿', 'daily', 'A shaman’s rite for healing, fortune or the dead.', '병을 낫게 하거나 복을 빌거나 넋을 달래는 무당의 의식.'),
  G('baduk', '바둑', 'daily', 'The board game of black and white stones, a gentleman’s pastime.', '흑백 돌로 두는 놀이. 선비의 취미.'),
];
