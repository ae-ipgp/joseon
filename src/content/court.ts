import type { Campaign, Npc, PortraitSpec, Rel, Text } from '../model/schemas';
import { T } from '../engine/text';
import { makeNpc, makeRel } from './cast';

/**
 * The wider court: the royal household, the great officials, the city and the family's servants.
 * Royal women and heirs are known by their titles, as they were at court, so each entry stands for
 * whoever holds the title at the time. Officials and servants hold posts: when one dies, someone new
 * takes the post under the same id, so places and activities keep working.
 */

export type RosterEntry = {
  id: string;
  /** Royal titles change hands by succession, not by death. */
  royal?: boolean;
  /** Which campaigns have this person at all. Default: every campaign. */
  in?: (c: Campaign) => boolean;
  places: string[];
  regard: number;
  /** The player already knows them. */
  known?: boolean;
  make: (y: number, woman: boolean, c: Campaign) => Npc;
  /** How a successor in the post is named: title and name. */
  successor?: { title: Text; minister?: boolean; servant?: boolean; ages: [number, number] };
};

/** The id and places are filled in from the roster entry. */
const npc = (p: Partial<Npc> & Pick<Npc, 'name' | 'role' | 'gender' | 'birthYear' | 'portrait'>) => makeNpc({ id: '', ...p });
const P = (kind: PortraitSpec['kind'], o: Partial<PortraitSpec> = {}): PortraitSpec => ({ kind, ...o });
const isAlt = (c: Campaign) => c.mode === 'alternative';
const premise = (...ps: string[]) => (c: Campaign) => isAlt(c) && ps.includes(c.premise ?? '');

export const ROSTER: RosterEntry[] = [
  // ---------------------------------------------------------------- the royal household
  {
    id: 'queen-dowager', royal: true, places: ['queens-hall'], regard: 0,
    make: (y) => npc({
      name: T('The Queen Dowager', '대비마마'), role: T('Widow of a former king, eldest of the royal women', '선왕의 왕비, 왕실 여인들의 큰 어른'),
      gender: 'woman', birthYear: y - 58, portrait: P('queen', { robe: '#5E6E64', under: '#3A3048', accent: '#A99A7A', grey: true }),
      faction: 'crown', likes: ['paper'], meet: true, post: 'queen-dowager',
      sees: T('A young face at court. She has seen many come and go.', '궁에 들어온 젊은 얼굴. 수많은 이가 오고 가는 것을 보아 왔다.'),
      wants: T('Peace in the inner court, and the royal ancestral rites kept without error.', '내명부의 평안, 그리고 종묘 제사가 어긋남 없이 받들어지는 것.'),
      talk: [
        T('“I have outlived one king. I intend to see this one well advised.”', '“나는 임금 한 분을 먼저 보내드렸소. 이번 임금께서는 좋은 보필을 받으시도록 지켜볼 것이오.”'),
        T('“Copy this sutra for me, if your hand is steady. Mine is not, these days.”', '“손이 떨리지 않거든 이 경을 대신 베껴 주오. 요즘은 내 손이 예전 같지 않구려.”'),
        T('“The young queen is kind. Kindness is not enough in this palace.”', '“중전은 어질지. 허나 이 궁에서는 어진 것만으로는 모자라오.”'),
      ],
    }),
  },
  {
    id: 'grand-queen-dowager', royal: true, places: ['queens-hall'], regard: -5,
    make: (y) => npc({
      name: T('The Grand Queen Dowager', '대왕대비마마'), role: T('Grandmother of the royal house, who has seen three reigns', '세 임금의 치세를 지켜본 왕실의 웃어른'),
      gender: 'woman', birthYear: y - 74, portrait: P('queen', { robe: '#7A7466', under: '#2C2A33', accent: '#A99A7A', grey: true }),
      faction: 'crown', likes: ['pouch'], meet: true, post: 'grand-queen-dowager',
      sees: T('Someone young enough to be useful, and sharp enough to be dangerous.', '쓸모 있을 만큼 젊고, 위험할 만큼 영리한 사람.'),
      wants: T('That the throne passes as she decides, as it has before.', '전에도 그랬듯 왕위가 자기 뜻대로 이어지는 것.'),
      talk: [
        T('“Sit closer. My ears are old, but they still hear everything.”', '“더 가까이 앉으라. 귀는 늙었어도 들을 건 다 듣느니라.”'),
        T('“Kings have bowed to me. Do not imagine you will be the first to fool me.”', '“임금들도 내게 절을 올렸느니라. 네가 처음으로 나를 속이리라 생각지 마라.”'),
      ],
    }),
  },
  {
    id: 'queen-consort', royal: true, places: ['queens-hall', 'rear-garden'], regard: 0,
    make: (y) => npc({
      name: T('The Queen', '중전마마'), role: T('Queen consort, first lady of the inner court', '왕비, 내명부의 으뜸'),
      gender: 'woman', birthYear: y - 30, portrait: P('queen'), faction: 'crown', likes: ['fan', 'pouch'], meet: true, post: 'queen-consort',
      sees: T('A new face among her ladies. Perhaps a friend; the palace has few.', '내명부의 새 얼굴. 어쩌면 벗이 될지도 모른다. 궁에는 벗이 드물다.'),
      wants: T('A quiet inner court, and the king’s trust kept from those who would spend it.', '고요한 내명부, 그리고 전하의 믿음을 함부로 쓰려는 이들에게서 그 믿음을 지키는 것.'),
      talk: [
        T('“Walk with me. The ladies-in-waiting hear less when we keep moving.”', '“나와 같이 걷자꾸나. 걸으면서 이야기하면 나인들이 덜 듣는다.”'),
        T('“The peonies opened early this year. The court ladies say it is an omen. They say everything is an omen.”', '“올해는 모란이 일찍 피었구나. 상궁들은 길조라 하더라. 무엇이든 다 징조라 하지.”'),
        T('“You may tell me the truth. Everyone else tells me what pleases the king.”', '“내게는 바른 말을 해도 좋다. 다들 전하께서 기뻐하실 말만 하니.”'),
      ],
    }),
  },
  {
    id: 'crown-prince', royal: true, places: ['rear-garden', 'academy'], regard: 5,
    make: (y) => npc({
      name: T('The Crown Prince', '세자 저하'), role: T('Heir to the throne', '왕위를 이을 세자'),
      gender: 'man', birthYear: y - 16, portrait: P('king', { robe: '#26324F', beard: 'none' }), faction: 'crown', likes: ['poems'], meet: true, post: 'crown-prince',
      sees: T('One of the few people at court who does not talk to him like a tutor.', '스승처럼 훈계하지 않는, 궁에서 몇 안 되는 사람.'),
      wants: T('To be judged worthy of the throne by his father, which has not happened yet.', '아버지께 왕위를 이을 만하다는 인정을 받는 것. 아직은 받지 못했다.'),
      talk: [
        T('“My tutors want the Great Learning by heart. I would rather learn how my father decides things.”', '“스승들은 대학을 외우라 하오. 나는 차라리 아바마마께서 어떻게 결정하시는지 배우고 싶소.”'),
        T('“They tell me a prince must never be seen to hurry. So I walk slowly, and think quickly.”', '“세자는 서두르는 모습을 보이면 안 된다 하더이다. 그래서 천천히 걷고 빨리 생각하오.”'),
      ],
    }),
  },
  {
    id: 'crown-princess', royal: true, places: ['queens-hall'], regard: 5,
    make: (y) => npc({
      name: T('The Crown Princess', '세자빈 마마'), role: T('Wife of the crown prince', '세자의 아내'),
      gender: 'woman', birthYear: y - 16, portrait: P('queen', { robe: '#2F5E55', under: '#8E2230', accent: '#B08D57' }), faction: 'crown', likes: ['fan'], meet: true, post: 'crown-princess',
      sees: T('Someone near her own age, which is rare in the palace.', '궁에서 보기 드문, 또래인 사람.'),
      wants: T('To be trusted by the queen and the dowagers, who watch her every step.', '걸음걸음을 지켜보는 중전과 대비들에게 믿음을 얻는 것.'),
      talk: [
        T('“I am still learning which corridor leads where. Everyone here pretends they were born knowing.”', '“아직도 어느 행각이 어디로 이어지는지 익히는 중이에요. 여기선 다들 태어날 때부터 안 것처럼 굴지요.”'),
        T('“The dowager corrected my bow three times today. I think she likes me.”', '“오늘 대비마마께서 제 절을 세 번이나 고쳐 주셨어요. 저를 좋아하시는 것 같아요.”'),
      ],
    }),
  },
  {
    id: 'elder-prince', royal: true, in: premise('heirs'), places: ['rear-garden'], regard: 0,
    make: (y) => npc({
      name: T('The Elder Prince', '큰 왕자'), role: T('The king’s eldest son, not yet named heir', '아직 세자로 책봉되지 못한 임금의 맏아들'),
      gender: 'man', birthYear: y - 28, portrait: P('minister', { robe: '#8C1C26', accent: '#B08D57', beard: 'short' }), faction: 'A', likes: ['paper'], meet: true, post: 'elder-prince',
      sees: T('A family that has not yet chosen a side.', '아직 편을 고르지 않은 집안.'),
      wants: T('The crown his birth promised him.', '태어날 때부터 약속된 왕관.'),
      talk: [
        T('“My brother is charming. Charm is not the same as a claim.”', '“아우는 매력이 있지. 허나 매력이 곧 명분은 아니오.”'),
        T('“Remember who spoke to you first, when the time comes.”', '“때가 오면, 누가 먼저 그대에게 말을 걸었는지 기억하시오.”'),
      ],
    }),
  },
  {
    id: 'younger-prince', royal: true, in: premise('heirs'), places: ['rear-garden', 'academy'], regard: 0,
    make: (y) => npc({
      name: T('The Younger Prince', '작은 왕자'), role: T('Son of the royal consort, favoured by half the court', '후궁의 아들, 조정 절반의 지지를 받는 왕자'),
      gender: 'man', birthYear: y - 23, portrait: P('minister', { robe: '#2F5E55', accent: '#B08D57', beard: 'none' }), faction: 'B', likes: ['poems'], meet: true, post: 'younger-prince',
      sees: T('Someone worth winning over, if it can be done gracefully.', '품위 있게 끌어들일 수만 있다면 얻을 만한 사람.'),
      wants: T('To prove that a younger son can be the better king.', '작은 아들이 더 나은 임금이 될 수 있음을 보이는 것.'),
      talk: [
        T('“My brother counts allies. I prefer to count friends; they last longer.”', '“형님은 편을 세시지요. 나는 벗을 세는 쪽이 좋소. 벗이 더 오래가니까.”'),
        T('“Do you hunt? No? Then come and watch me miss.”', '“사냥을 하시오? 안 하신다고? 그럼 내가 빗맞히는 걸 구경하러 오시오.”'),
      ],
    }),
  },
  {
    id: 'royal-consort', royal: true, in: (c) => !(isAlt(c) && c.premise === 'queen'), places: ['rear-garden'], regard: -5,
    make: (y, _w, c) => npc({
      name: T('Royal Consort Mun', '숙의 문씨'),
      role: isAlt(c) && c.premise === 'heirs' ? T('Royal consort, mother of the Younger Prince', '후궁, 작은 왕자의 어머니') : T('Royal consort of the second rank, the king’s favourite', '종2품 숙의, 임금의 총애를 받는 후궁'),
      gender: 'woman', birthYear: y - (isAlt(c) && c.premise === 'heirs' ? 44 : 26), portrait: P('queen', { robe: '#B86A80', under: '#3A3048', accent: '#B08D57' }),
      faction: 'A', likes: ['fan'], meet: true, post: 'royal-consort',
      sees: T('A new piece on the board. She has not yet decided which side it plays for.', '판 위의 새 말. 어느 편 말로 쓸지는 아직 정하지 않았다.'),
      wants: T('Her place at the king’s side secured, whatever it costs others.', '남이 무엇을 잃든, 전하 곁의 자리를 굳히는 것.'),
      talk: [
        T('“The queen is gracious. I am merely useful. Useful lasts longer.”', '“중전마마는 너그러우시지요. 저는 그저 쓸모가 있을 뿐이에요. 쓸모가 더 오래가는 법이고요.”'),
        T('“His Majesty laughed at my story yesterday. Half the court will hate me for it by tonight.”', '“어제 전하께서 제 이야기에 웃으셨어요. 오늘 밤이면 조정 절반이 그 일로 저를 미워하겠지요.”'),
      ],
    }),
  },
  {
    id: 'princess', royal: true, places: ['rear-garden', 'queens-hall'], regard: 5,
    make: (y, _w, c) => npc({
      name: T('The Princess', '공주 마마'),
      role: isAlt(c) && c.premise === 'queen' ? T('The queen’s younger sister', '여왕의 아우인 공주') : T('The king’s youngest daughter', '임금의 막내 공주'),
      gender: 'woman', birthYear: y - 15, portrait: P('lady', { robe: '#E6C65A', under: '#8E2230', accent: '#8E2230' }), faction: 'crown', likes: ['fan', 'poems'], meet: true, post: 'princess',
      sees: T('Someone who might be interesting, unlike her tutors.', '스승들과 달리 재미있을지도 모르는 사람.'),
      wants: T('To leave the palace, just once, and see the market.', '딱 한 번이라도 궁을 나가 저잣거리를 보는 것.'),
      talk: [
        T('“Is it true the market sells sugar tigers? Bring me one. Don’t tell the court ladies.”', '“저잣거리에서 설탕으로 만든 호랑이를 판다는 게 정말이야? 하나 갖다 줘. 상궁들한텐 비밀이야.”'),
        T('“Court Lady Choi says I walk like a boy. I walk like someone with somewhere to go.”', '“최 상궁은 내가 사내아이처럼 걷는대. 나는 갈 데가 있는 사람처럼 걷는 거야.”'),
      ],
    }),
  },

  // ---------------------------------------------------------------- the great officials
  {
    id: 'chief-councillor', places: ['offices', 'throne-hall'], regard: -10,
    successor: { title: T('Chief State Councillor', '영의정'), minister: true, ages: [58, 68] },
    make: (y) => npc({
      name: T('Minister Jo Gyeong-ho', '조경호 대감'), given: T('Gyeong-ho', '경호'), role: T('Chief State Councillor, first among the ministers', '영의정, 백관의 우두머리'),
      gender: 'man', birthYear: y - 66, portrait: P('minister', { robe: '#8C1C26', beard: 'long' }), faction: 'A', likes: ['paper'], meet: true, post: 'chief-councillor',
      house: { surname: T('Jo', '조'), prestige: 5, faction: 'A', background: 'political' },
      sees: T('The child of a lesser house, polite enough so far.', '지체 낮은 집안의 자식. 아직까지는 예의를 안다.'),
      wants: T('A quiet court, a full treasury, and {factionA} kept in power.', '조용한 조정, 넉넉한 국고, 그리고 {factionA_i} 권세를 지키는 것.'),
      talk: [
        T('“The king asks my opinion every morning. Every afternoon, others try to change it.”', '“전하께서는 아침마다 내 의견을 물으시지. 오후마다 다른 이들이 그걸 바꾸려 들고.”'),
        T('“Young people want reform. Old people want dinner. Both are reasonable.”', '“젊은이는 개혁을 원하고 늙은이는 저녁밥을 원하지. 둘 다 이치에 맞는 말일세.”'),
      ],
    }),
  },
  {
    id: 'left-councillor', places: ['offices', 'throne-hall'], regard: 20,
    successor: { title: T('Left State Councillor', '좌의정'), minister: true, ages: [55, 64] },
    make: (y) => npc({
      name: T('Minister Yi Jong-hun', '이종훈 대감'), given: T('Jong-hun', '종훈'), role: T('Left State Councillor, the voice of {factionB} at court', '좌의정, 조정에서 {factionB}의 목소리'),
      gender: 'man', birthYear: y - 58, portrait: P('minister', { robe: '#7A2230', beard: 'long' }), faction: 'B', likes: ['poems'], meet: true, post: 'left-councillor',
      house: { surname: T('Yi', '이'), prestige: 4, faction: 'B', background: 'political' },
      sees: T('An old friend’s child, and perhaps the next generation of {factionB}.', '옛 벗의 자식, 어쩌면 {factionB}의 다음 세대.'),
      wants: T('To keep {factionB} at court long enough to matter.', '{factionB_eul} 힘을 쓸 수 있을 때까지 조정에 붙들어 두는 것.'),
      talk: [
        T('“Your father and I sat the examination in the same year. He wrote better. I flattered better.”', '“자네 부친과 나는 같은 해에 과거를 보았지. 글은 그 사람이 나았고, 아첨은 내가 나았네.”'),
        T('“In this court, a friend who speaks too early is worse than an enemy.”', '“이 조정에서는 너무 일찍 입을 여는 벗이 원수보다 못하네.”'),
      ],
    }),
  },
  {
    id: 'royal-secretary', places: ['offices', 'throne-hall'], regard: 0,
    successor: { title: T('Royal Secretary', '도승지'), ages: [42, 52] },
    make: (y) => npc({
      name: T('Royal Secretary Hwang In-seok', '도승지 황인석'), given: T('In-seok', '인석'), role: T('Chief Royal Secretary, who carries every word to and from the throne', '도승지, 임금께 오가는 모든 말을 전하는 이'),
      gender: 'man', birthYear: y - 45, portrait: P('minister', { robe: '#8C1C26', beard: 'short' }), likes: ['paper'], meet: true, post: 'royal-secretary',
      sees: T('A name he has started to see in the petitions.', '상소문에서 보이기 시작한 이름.'),
      wants: T('Never to be blamed for a message, only thanked for it.', '전한 말로 탓을 듣지 않고, 오직 고맙다는 말만 듣는 것.'),
      talk: [
        T('“Every petition crosses my desk. Most of them should not have been written.”', '“상소란 상소는 다 내 책상을 거치지. 대부분은 쓰지 말았어야 할 글이야.”'),
        T('“If you wish His Majesty to read something, keep it short. If you wish him to remember it, keep it shorter.”', '“전하께서 읽으시길 바라거든 짧게 쓰게. 기억하시길 바라거든 더 짧게.”'),
      ],
    }),
  },
  {
    id: 'historian', places: ['offices', 'market'], regard: 5,
    successor: { title: T('Historian', '사관'), ages: [24, 32] },
    make: (y) => npc({
      name: T('Historian Nam Yun-jae', '사관 남윤재'), given: T('Yun-jae', '윤재'), role: T('Royal historian of the Office of Annals', '춘추관 사관'),
      gender: 'man', birthYear: y - 25, portrait: P('minister', { robe: '#3E5274', beard: 'none' }), likes: ['paper', 'poems'], meet: true, post: 'historian',
      sees: T('A person who might one day appear in the annals.', '언젠가 실록에 이름이 오를지도 모르는 사람.'),
      wants: T('To write down what happened, even when the king would rather he did not.', '임금께서 원치 않으셔도, 일어난 일을 그대로 적는 것.'),
      talk: [
        T('“The king once asked to read the annals. We said no. That is the whole point of us.”', '“전하께서 실록을 보자 하신 적이 있소. 우리는 안 된다고 했지. 그게 사관이 있는 까닭이오.”'),
        T('“Careful what you say near me. I have a very good memory and a very fine brush.”', '“내 앞에서는 말조심하시오. 기억력은 좋고 붓은 아주 가늘거든.”'),
      ],
    }),
  },
  {
    id: 'physician', places: ['offices'], regard: 5,
    successor: { title: T('Royal Physician', '어의'), ages: [48, 58] },
    make: (y) => npc({
      name: T('Royal Physician Bae Su-man', '어의 배수만'), given: T('Su-man', '수만'), role: T('Royal physician of the Palace Infirmary', '내의원 어의'),
      gender: 'man', birthYear: y - 57, portrait: P('minister', { robe: '#3E5A55', beard: 'short' }), likes: ['paper'], meet: true, post: 'physician',
      sees: T('A patient, eventually. Everyone is.', '언젠가는 환자. 누구나 그렇다.'),
      wants: T('That the king outlives his ministers’ plans for him.', '대신들이 꾸미는 계획보다 전하께서 오래 사시는 것.'),
      talk: [
        T('“Ginseng is not a cure for everything. Tell that to the nobles who eat it like rice.”', '“인삼이 만병통치약은 아니오. 밥처럼 먹어 대는 양반들한테 좀 일러 주시오.”'),
        T('“Sleep, warm food and fewer quarrels. I could cure half the court if they listened.”', '“잠, 따뜻한 밥, 그리고 다툼을 줄이는 것. 다들 내 말만 들으면 조정 절반은 고칠 수 있소.”'),
      ],
    }),
  },
  {
    id: 'eunuch', places: ['throne-hall', 'rear-garden', 'offices'], regard: 0,
    successor: { title: T('Chief Eunuch', '상선'), ages: [45, 55] },
    make: (y) => npc({
      name: T('Chief Eunuch An', '안 상선'), role: T('Chief of the palace eunuchs, keeper of the king’s doors', '내시부의 우두머리, 임금의 문을 지키는 이'),
      gender: 'man', birthYear: y - 50, portrait: P('minister', { robe: '#4A3E5C', beard: 'none' }), faction: 'crown', likes: ['pouch'], meet: true, post: 'eunuch',
      sees: T('Someone who has not yet learned when to stop talking.', '언제 입을 다물어야 하는지 아직 배우지 못한 사람.'),
      wants: T('Order in the palace, and to know everything before anyone else does.', '궁 안의 질서, 그리고 누구보다 먼저 모든 것을 아는 것.'),
      talk: [
        T('“His Majesty is resting. His Majesty is always resting when you wish to see him.”', '“전하께서는 쉬고 계시옵니다. 뵙고 싶으실 때면 늘 쉬고 계시지요.”'),
        T('“I have served in these halls for thirty years. The walls and I are old friends.”', '“이 전각에서 삼십 년을 모셨습니다. 벽과 저는 오랜 벗이지요.”'),
      ],
    }),
  },
  {
    id: 'inspector', places: ['tribunal', 'offices'], regard: -15,
    successor: { title: T('Inspector', '지평'), ages: [34, 44] },
    make: (y) => npc({
      name: T('Inspector Min Tae-gyeong', '지평 민태경'), given: T('Tae-gyeong', '태경'), role: T('Inspector of the Office of the Inspector-General', '사헌부 지평'),
      gender: 'man', birthYear: y - 38, portrait: P('minister', { robe: '#2C3E63', beard: 'short' }), faction: 'A', likes: ['paper'], meet: true, post: 'inspector',
      sees: T('A family worth watching, for the record.', '기록을 위해서라도 지켜볼 만한 집안.'),
      wants: T('Every official’s faults written down before they become crimes.', '모든 관리의 허물이 죄가 되기 전에 적어 두는 것.'),
      talk: [
        T('“I impeach two officials a month. It is nothing personal. Usually.”', '“나는 한 달에 관리 둘을 탄핵하지. 사사로운 감정은 없소. 대개는.”'),
        T('“Your sleeves are silk. Is that within the sumptuary laws? I only ask.”', '“소매가 비단이구려. 사치 금령에 어긋나지는 않소? 그저 묻는 것이오.”'),
      ],
    }),
  },

  // ---------------------------------------------------------------- nobles and the city
  {
    id: 'lady-shin', places: ['queens-hall', 'rear-garden'], regard: 10,
    make: (y) => npc({
      name: T('Lady Shin', '신씨 부인'), role: T('Matriarch of a great house, who arranges half the marriages in Bukchon', '북촌 혼사의 절반을 맺어 주는 명문가의 안주인'),
      gender: 'woman', birthYear: y - 55, portrait: P('noblewoman', { robe: '#B9A88E', under: '#4A2A3E' }), likes: ['pouch', 'fan'], meet: true,
      house: { surname: T('Shin', '신'), prestige: 5, faction: 'none', background: 'noble' },
      sees: T('A candidate. For what, she has not said.', '어떤 자리의 후보. 무슨 자리인지는 말하지 않았다.'),
      wants: T('Good matches for good families, and credit for every one of them.', '좋은 집안끼리의 좋은 혼사, 그리고 그 공을 모두 자기가 차지하는 것.'),
      talk: [
        T('“I arranged your mother’s marriage, you know. She has never thanked me properly.”', '“자네 어머니 혼사도 내가 맺어 준 걸세. 아직도 제대로 고맙다는 말을 못 들었지.”'),
        T('“A good match is like good kimchi. It needs time, salt and a firm hand.”', '“좋은 혼사는 좋은 김치와 같아. 시간과 소금, 그리고 단단한 손이 필요하지.”'),
      ],
    }),
  },
  {
    id: 'merchant', places: ['market'], regard: 10,
    successor: { title: T('Silk merchant', '비단 상인'), servant: true, ages: [36, 48] },
    make: (y) => npc({
      name: T('Heo Dal-su', '허달수'), given: T('Dal-su', '달수'), role: T('Silk merchant of the licensed shops on Unjongga', '운종가 시전의 비단 상인'),
      gender: 'man', birthYear: y - 44, portrait: P('commoner', { robe: '#8A6A4A', under: '#3E3426', beard: 'short' }), likes: ['paper'], meet: true, post: 'merchant',
      sees: T('A customer from a good house, which is the best kind.', '좋은 집안의 손님. 손님 중에 으뜸이다.'),
      wants: T('A ship of Chinese silk that arrives before the rains.', '장마 전에 들어오는 중국 비단 배.'),
      talk: [
        T('“Silk from Hangzhou. The same bolt the queen’s ladies chose. Well, its cousin.”', '“항주 비단입니다요. 중궁전 상궁님들이 고르신 바로 그 필이지요. 음, 그 사촌쯤 됩니다요.”'),
        T('“A ship leaves for the Chinese coast at the new moon. A share could double your purse. Or not.”', '“그믐에 중국으로 배가 떠납니다요. 한몫 넣으시면 곱절이 될 수도 있지요. 아니면 말고요.”'),
      ],
    }),
  },

  // ---------------------------------------------------------------- the household and the palace servants
  {
    id: 'steward', places: ['residence'], regard: 50, known: true,
    successor: { title: T('Steward', '청지기'), servant: true, ages: [38, 50] },
    make: (y, woman) => npc({
      name: T('Bok-dong', '복동'), given: T('Bok-dong', '복동'), role: T('Steward of the family household', '집안의 청지기'),
      gender: 'man', birthYear: y - 56, portrait: P('commoner', { robe: '#CFC3A8', under: '#5A4A3A', beard: 'short' }), likes: ['pouch'], post: 'steward',
      sees: woman ? T('The young mistress he once carried on his shoulders.', '한때 어깨에 태우고 다니던 아씨.') : T('The young master he once carried on his shoulders.', '한때 어깨에 태우고 다니던 도련님.'),
      wants: T('Full storehouses, and a household that runs without anyone noticing him.', '가득 찬 곳간, 그리고 아무도 자기를 의식하지 않아도 굴러가는 살림.'),
      talk: [
        woman
          ? T('“The rice storehouse is half full, young mistress. I mention it only because no one else will.”', '“곳간 쌀이 절반이옵니다, 아씨. 아무도 말씀을 안 드리니 쇤네가 여쭙는 겁니다요.”')
          : T('“The rice storehouse is half full, young master. I mention it only because no one else will.”', '“곳간 쌀이 절반이옵니다, 도련님. 아무도 말씀을 안 드리니 쇤네가 여쭙는 겁니다요.”'),
        T('“The master’s guests drank three jars of wine last night. I have written it in the book.”', '“어젯밤 대감마님 손님들이 술을 세 동이나 드셨습니다요. 장부에 적어 두었습니다요.”'),
        T('“The persimmons are ripe. If you need a gift, a basket of them costs nothing.”', '“감이 다 익었습니다요. 선물하실 데가 있으면 한 바구니 드리셔도 돈 한 푼 안 듭니다요.”'),
      ],
    }),
  },
  {
    id: 'maid', places: ['residence'], regard: 55, known: true,
    successor: { title: T('Maid', '여종'), servant: true, ages: [16, 24] },
    make: (y, woman) => npc({
      name: T('Sun-i', '순이'), given: T('Sun-i', '순이'), role: woman ? T('Your maid since childhood', '어릴 적부터 곁을 지킨 몸종') : T('A maid of the household', '집안의 여종'),
      gender: 'woman', birthYear: y - 17, portrait: P('lady', { robe: '#E9E1CF', under: '#5A6B7A', accent: '#8E7A5A' }), likes: ['fan'], post: 'maid',
      sees: woman ? T('Her young mistress, who tells her everything. Almost.', '모든 것을, 거의 모든 것을 말해 주는 아씨.') : T('The young master, who is kinder than most.', '대개의 양반보다 다정한 도련님.'),
      wants: T('To marry the miller’s son, if the household allows it.', '집안에서 허락해 준다면 방앗간 집 아들에게 시집가는 것.'),
      talk: [
        T('“Lady Baek’s maid was at the well again, asking questions. I told her nothing. Well, almost nothing.”', '“백씨 부인 댁 몸종이 또 우물가에서 이것저것 묻더라고요. 아무 말도 안 했어요. 음, 거의 안 했어요.”'),
        woman
          ? T('“Shall I braid your hair the court way, young mistress? Court Lady Choi will notice.”', '“궁중식으로 머리 땋아 드릴까요, 아씨? 최 상궁님이 알아보실 거예요.”')
          : T('“Your good robe had a tear. I mended it before your mother saw.”', '“도련님 좋은 도포가 터졌길래 마님 보시기 전에 꿰매 놓았어요.”'),
      ],
    }),
  },
  {
    id: 'palace-maid', places: ['queens-hall', 'rear-garden'], regard: 5,
    successor: { title: T('Palace maid', '나인'), servant: true, ages: [14, 18] },
    make: (y) => npc({
      name: T('Ok-bun', '옥분'), given: T('Ok-bun', '옥분'), role: T('A young palace maid of the Queen’s Hall', '중궁전의 어린 나인'),
      gender: 'woman', birthYear: y - 15, portrait: P('lady', { robe: '#6E8560', under: '#263247', accent: '#6B1626' }), likes: ['pouch'], meet: true, post: 'palace-maid',
      sees: T('A noble who once said thank you. She has not forgotten.', '한 번 고맙다고 말해 준 양반. 그 일을 잊지 않았다.'),
      wants: T('To become a court lady one day, and never be sent home in disgrace.', '언젠가 상궁이 되는 것, 그리고 쫓겨나는 일 없이 버티는 것.'),
      talk: [
        T('“I am not supposed to say, but someone cried after the dowager’s visit. Please forget I said that.”', '“말씀드리면 안 되는데요, 대비마마 다녀가신 뒤에 우신 분이 계셨어요. 제가 한 말은 잊어 주세요.”'),
        T('“Court Lady Choi says I will be a court lady in twenty years. Twenty! I will be ancient.”', '“최 상궁님이 이십 년 지나면 저도 상궁이 될 거래요. 이십 년이요! 그땐 할머니잖아요.”'),
      ],
    }),
  },
];

export const rosterEntry = (id: string) => ROSTER.find((r) => r.id === id);
export const ROYAL_IDS = ROSTER.filter((r) => r.royal).map((r) => r.id);

/** The roster as people for a world starting in year y. */
export function courtCast(c: Campaign, y: number, woman: boolean): { npc: Npc; rel: Rel }[] {
  return ROSTER.filter((r) => !r.in || r.in(c)).map((r) => {
    return { npc: { ...r.make(y, woman, c), id: r.id, places: [...r.places] }, rel: makeRel(r.regard, !!r.known) };
  });
}
