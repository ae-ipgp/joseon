import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { Fibre } from '../ui/parts';
import { Card, Tabs, useL } from '../ui/kit';
import { SOURCES } from '../content/monarchs';
import { GLOSSARY, GROUPS } from '../content/glossary';

/** GSDD Part V §28: help that is always there, in plain words, for both languages. */
const TOPICS: { id: string; en: [string, string[]]; ko: [string, string[]] }[] = [
  { id: 'start', en: ['Getting started', [
    'You live one life at a time, in a noble or royal family of Joseon. Each day has a morning, an afternoon and an evening; most things you do take one part of the day.',
    'Tap a person in the scene to talk, give a gift or try something more: compliments, debate, asking for help, alliances. People remember what you did.',
    'When nothing more needs doing, let the season pass. A season report tells you what happened, and a scene may be waiting.',
  ]], ko: ['시작하기', [
    '조선의 양반 또는 왕실 집안에서 한 번에 한 삶을 산다. 하루는 아침, 오후, 저녁으로 나뉘고 대부분의 일은 그중 한 때를 쓴다.',
    '장면 속 인물을 누르면 이야기하거나 선물하거나 칭찬, 논쟁, 도움 청하기, 동맹 같은 일을 할 수 있다. 사람들은 당신이 한 일을 기억한다.',
    '더 할 일이 없으면 철을 넘긴다. 철 보고가 그동안의 일을 알려 주고, 장면이 기다리고 있을 수도 있다.',
  ]] },
  { id: 'routine', en: ['Routines and condition', [
    'Set a daily routine at a place you go often, then follow it for one day or several. It stops as soon as anything needs you.',
    'Every activity tires you; a night’s sleep restores you. Worry builds from debts, inquiries, exile and open troubles, and eases with a settled house. High stress wears down health.',
  ]], ko: ['일과와 몸 상태', [
    '자주 가는 곳에서 하루 일과를 정해 두고 하루 또는 여러 날 그대로 따를 수 있다. 당신이 필요한 일이 생기면 바로 멈춘다.',
    '일을 할 때마다 피로가 쌓이고 밤잠으로 풀린다. 빚, 조사, 유배, 풀리지 않은 일이 근심을 쌓고 안정된 집안이 근심을 덜어 준다. 근심이 크면 건강이 상한다.',
  ]] },
  { id: 'life', en: ['Feelings, health and pastimes', [
    'Your mood comes from your life: a warm marriage, children, a calling, security, standing, time for the arts. Events move it too: a promotion makes you proud, a death leaves you grieving. Happiness drifts toward what your life gives you.',
    'Illnesses have names: colds, fevers, a lingering cough, smallpox, and in old age aching joints or failing eyes. Send for a physician, buy herbal medicine, rest, or hold a rite for comfort. Grave illnesses can kill at any age; the physicians will warn you.',
    'Pastimes (calligraphy, poetry, the zither, ink painting, baduk, archery, horsemanship, embroidery, herbal lore) improve with practice and fade a little if left for a year. Compete once a year to win renown. Some help in the examinations; herbal lore helps against illness.',
    'When a parent dies you mourn for twenty-seven months: no weddings, no banquets, and an official leaves his post. The king may recall a favourite early.',
  ]], ko: ['마음, 건강, 취미', [
    '기분은 삶에서 나온다. 다정한 혼인, 자녀, 소임, 넉넉한 살림, 명성, 재주를 즐길 여유. 일어나는 일도 마음을 움직인다. 승진하면 뿌듯하고 사람을 잃으면 애통하다. 행복은 삶이 주는 만큼으로 서서히 옮겨 간다.',
    '병에는 이름이 있다. 고뿔, 열병, 해수, 마마, 늙어서는 관절통과 안질. 의원을 부르거나 탕약을 짓거나 조리하거나 굿을 할 수 있다. 위중한 병은 나이를 가리지 않으며, 의원이 미리 일러 준다.',
    '취미(서예, 시작, 거문고·가야금, 서화, 바둑, 궁술, 마술, 자수, 의약 지식)는 연습할수록 늘고 한 해를 놓으면 조금 녹슨다. 한 해에 한 번 겨루어 이름을 얻을 수 있다. 과거에 도움이 되는 것도, 병을 막는 데 도움이 되는 것도 있다.',
    '부모가 세상을 떠나면 27개월 상을 치른다. 혼례도 잔치도 없고, 관원은 벼슬을 내려놓는다. 임금이 아끼는 신하는 일찍 불러들이기도 한다.',
  ]] },
  { id: 'children', en: ['Raising children', [
    'On the Family page, choose what each child learns (the classics, the military arts, poetry and music, household management, or practical learning) and how strictly. Strict children learn faster and like you less; gentle ones the reverse.',
    'Once a season you can spend time with each child, praise them, teach them yourself or scold them. Around twelve their character shows. When a child becomes your heir, their upbringing comes with them.',
  ]], ko: ['자녀 양육', [
    '가문 화면에서 자녀마다 배울 것(경서, 무예, 시서화와 음악, 살림, 실용 학문)과 엄하기를 정한다. 엄하게 키우면 빨리 배우지만 정이 멀어지고, 자애롭게 키우면 그 반대다.',
    '자녀마다 한 철에 한 번 함께 시간을 보내거나, 칭찬하거나, 몸소 가르치거나, 꾸짖을 수 있다. 열두 살 무렵 성품이 드러난다. 자녀가 후계자가 되면 자란 모습 그대로 이어진다.',
  ]] },
  { id: 'reign', en: ['Ruling as monarch', [
    'On the throne, memorials arrive from the ministries each season. Approve, refuse or put them off once; each choice moves the treasury, the people, the court, the army or the factions. A weak throne sees its orders stall.',
    'The reign is recorded in words, not a score. A king with a grown heir may abdicate and live on as the retired king.',
  ]], ko: ['임금으로 다스리기', [
    '보위에 오르면 철마다 각 관청에서 상소가 올라온다. 윤허하거나 물리치거나 한 번 미룰 수 있으며, 그에 따라 국고, 민심, 조정, 군심, 당파가 움직인다. 왕권이 약하면 어명이 막힌다.',
    '치세는 점수가 아니라 말로 기록된다. 장성한 후계가 있는 임금은 양위하고 상왕으로 물러날 수 있다.',
  ]] },
  { id: 'culture', en: ['Culture, belief and scenarios', [
    'The Culture page holds four things. Belief: keep a practice (the ancestral rite, quiet sitting, a temple lantern, a fortune reading, practical or Western learning) and after three times it becomes your way; conviction steadies the mind. Writing: finish poems, essays, travel records, a family chronicle and more, and print them. Patronage: support a scholar, a school, a temple or the poor. Companions: a dog, a cat, a falcon or a garden crane.',
    'Beliefs are shown as people of the time held them. Fortune readings are what the mudang says, not a promise from the game.',
    'Scenarios, on the main menu, are lives begun with a goal: pass first on the list, enter the inner palace, restore a fallen house, survive the war. The goal shows on the Culture page and at the end of the life.',
    'An officer can ask for a posting (field army, navy, royal guard, border) and chooses tactics in battle. Speaking Chinese helps an envoy. Lawsuits and arrests arrive as matters with more than one way through.',
    'In Settings you can change the theme: Ink & Hanji, Dancheong, Celadon or Lantern night.',
  ]], ko: ['풍류, 믿음, 시나리오', [
    '풍류 화면에는 네 가지가 있다. 믿음: 수행(제사, 정좌, 연등, 점, 실학서나 서학서 읽기)을 세 번 하면 그것이 당신의 길이 되고, 믿음이 굳으면 마음이 안정된다. 저술: 시집, 수필, 기행문, 가승 등을 완성하고 간행한다. 후원: 선비, 서당, 절, 가난한 이들을 돕는다. 벗 삼은 짐승: 개, 고양이, 매, 정원의 학.',
    '믿음은 그 시대 사람들이 믿던 대로 보여 준다. 점괘는 무당의 말일 뿐, 게임이 보장하는 것이 아니다.',
    '주 메뉴의 시나리오는 목표를 품고 시작하는 삶이다. 장원 급제, 내전에 드는 길, 기운 가문 일으키기, 전란에서 살아남기. 목표는 풍류 화면과 삶의 끝에서 볼 수 있다.',
    '무관은 보직(육군, 수군, 금군, 변방)을 청할 수 있고 전투에서 전술을 고른다. 중국어를 하면 사행에 도움이 된다. 송사와 체포는 여러 길이 있는 과업으로 찾아온다.',
    '설정에서 테마를 바꿀 수 있다: 먹과 한지, 단청, 청자, 등불의 밤.',
  ]] },
  { id: 'matters', en: ['Matters, letters and notices', [
    'Matters arise from your circumstances: an ally wants your name on a memorial, a neighbour moves the boundary stones, a child needs a teacher. Each has several ways through and a deadline.',
    'Write letters to people you know; some will write to you. Notices collect everything important, by category; the bell shows how many you have not read.',
  ]], ko: ['과업, 서신, 알림', [
    '과업은 당신의 처지에서 생긴다. 동지가 연명 상소를 청하고, 이웃이 경계석을 옮기고, 아이에게 스승이 필요하다. 길은 여럿이고 기한이 있다.',
    '아는 사람에게 편지를 쓸 수 있고, 편지가 오기도 한다. 알림은 중요한 일을 분류해 모아 두며, 종 모양 단추에 읽지 않은 수가 뜬다.',
  ]] },
  { id: 'career', en: ['Study, examinations and office', [
    'Study builds your education fields; the examinations test them. Passing qualifies you; a post depends on vacancies and on who speaks for you.',
    'At court you choose a faction or stay neutral, seek posts, serve, and face evaluations, inquiries and purges.',
    'In the historical campaign the rules follow the period: the examinations end in 1894, women may not hold office, and royal kin may not serve in government.',
  ]], ko: ['학업, 과거, 관직', [
    '공부로 학문 분야를 쌓고 과거가 그것을 시험한다. 급제는 자격일 뿐, 자리는 빈자리와 천거에 달려 있다.',
    '조정에서는 당을 고르거나 중립을 지키며, 자리를 구하고, 봉직하고, 고과와 조사와 사화를 견뎌야 한다.',
    '역사 캠페인에서는 시대의 규칙을 따른다. 과거는 1894년에 끝나고, 여성은 관직에 나갈 수 없으며, 종친은 조정 관직을 맡지 못한다.',
  ]] },
  { id: 'history', en: ['History and continuity', [
    'The historical campaign runs on the recorded calendar: kings, institutions, factions and events arrive when they did. The archive marks how well each fact is attested.',
    'At a few moments a player in the right place may try to turn history. How far it can bend is set when the campaign begins: strict keeps the record, limited allows moderate changes, dynamic allows anything. Every change is recorded with its class.',
  ]], ko: ['역사와 연속성', [
    '역사 캠페인은 기록된 연표를 따른다. 임금, 관청, 붕당, 사건이 실제 시기에 나타난다. 사록에는 사실마다 근거의 확실성이 표시된다.',
    '몇몇 순간에는 그 자리에 있는 사람이 역사를 바꾸려 할 수 있다. 얼마나 바뀔 수 있는지는 캠페인을 시작할 때 정한다. 엄격은 기록을 지키고, 제한은 중간 정도의 변화를, 역동은 무엇이든 허용한다. 모든 변화는 그 정도와 함께 기록된다.',
  ]] },
  { id: 'downfall', en: ['Downfall and legacy', [
    'A family can fall: dismissal, exile, confiscation, and at worst the loss of noble status. Life goes on as a commoner, with a long road back if you want to take it.',
    'When a life ends, you can continue as an heir. The family archive keeps each generation.',
  ]], ko: ['몰락과 유산', [
    '집안은 몰락할 수 있다. 파직, 유배, 적몰, 최악에는 양반 신분을 잃는다. 평민으로 삶은 이어지고, 원한다면 먼 회복의 길이 있다.',
    '삶이 끝나면 후계자로 이어 갈 수 있다. 가문의 기록은 대대로 남는다.',
  ]] },
  { id: 'saves', en: ['Saves and safety', [
    'The game saves itself as you play, and you have three slots of your own. Each slot keeps the previous version as a backup. A checkpoint is kept at each new season, in this browser only.',
    'Export a save to keep it as a file, and import it again later; the file is checked before it is used. Nothing leaves your device.',
  ]], ko: ['저장과 안전', [
    '게임은 하는 동안 저절로 저장되고, 따로 세 칸을 쓸 수 있다. 칸마다 이전 저장을 예비로 남긴다. 철이 바뀔 때마다 이 브라우저에 체크포인트를 남긴다.',
    '저장을 파일로 내보내 두었다가 다시 가져올 수 있다. 가져온 파일은 쓰기 전에 검사한다. 어떤 것도 기기 밖으로 나가지 않는다.',
  ]] },
  { id: 'access', en: ['Display and accessibility', [
    'In Settings you can enlarge text, raise contrast, reduce motion, turn tips off and set music, effects and ambience separately.',
    'Every button and choice can be reached with the keyboard: Tab to move, Enter or Space to choose, Escape to close a sheet.',
  ]], ko: ['화면과 접근성', [
    '설정에서 글자 크기, 대비, 움직임 줄이기, 도움말 끄기, 음악과 효과음과 주변음을 따로 정할 수 있다.',
    '모든 단추와 선택지는 키보드로도 쓸 수 있다. Tab으로 옮기고 Enter나 Space로 고르며 Escape로 창을 닫는다.',
  ]] },
];

function Back() {
  const go = useUi((s) => s.go);
  const g = useGame((s) => s.game);
  const { L } = useL();
  return (
    <header className="bar">
      <button className="bar-link" type="button" onClick={() => go(g ? (g.player.alive ? 'play' : 'legacy') : 'menu')} style={{ paddingLeft: 0 }}>
        <ChevronLeft size={20} strokeWidth={1.6} />{g ? L('Back to the game', '게임으로') : L('Main menu', '주 메뉴')}
      </button>
    </header>
  );
}

export function HandbookScreen() {
  const { L, lang, tx } = useL();
  const [tab, setTab] = useState(TOPICS[0].id);
  const [q, setQ] = useState('');
  const topic = TOPICS.find((x) => x.id === tab) ?? TOPICS[0];
  const [title, paras] = lang === 'ko' ? topic.ko : topic.en;
  const terms = GLOSSARY.filter((x) => !q || (x.term + x.ko + x.text.en + (x.text.ko ?? '')).toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="paper-screen">
      <Fibre seed={13} />
      <Back />
      <div className="wrap kit-wrap" style={{ maxWidth: 900 }}>
        <h1 className="kit-title">{L('Handbook', '길잡이')} <span className="ko" lang="ko">指南</span></h1>
        <Tabs label={L('Topics', '주제')} value={tab} onChange={setTab} tabs={[...TOPICS.map((x) => [x.id, lang === 'ko' ? x.ko[0] : x.en[0]] as [string, string]), ['glossary', L('Glossary', '용어 풀이')]]} />
        {tab === 'glossary' ? (
          <Card title={L('Glossary of the period', '시대 용어 풀이')} ko="用語">
            <label className="kit-search"><span className="sr-only">{L('Search', '검색')}</span><input type="search" value={q} placeholder={L('Search terms', '용어 검색')} onChange={(e) => setQ(e.currentTarget.value)} /></label>
            {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((grp) => {
              const list = terms.filter((x) => x.group === grp);
              if (!list.length) return null;
              return (
                <div key={grp} className="gloss-group">
                  <h4>{tx(GROUPS[grp])}</h4>
                  <dl className="gloss">
                    {list.map((x) => <div key={x.term}><dt><span>{x.term}</span> <span className="ko" lang="ko">{x.ko}</span></dt><dd>{tx(x.text)}</dd></div>)}
                  </dl>
                </div>
              );
            })}
          </Card>
        ) : (
          <Card title={title}>
            {paras.map((p, i) => <p key={i} className="hb-p">{p}</p>)}
          </Card>
        )}
      </div>
    </main>
  );
}

export function CreditsScreen() {
  const { L, tx } = useL();
  return (
    <main className="paper-screen">
      <Fibre seed={14} />
      <Back />
      <div className="wrap kit-wrap" style={{ maxWidth: 900 }}>
        <h1 className="kit-title">{L('Credits', '만든 이')} <span className="ko" lang="ko">製作</span></h1>
        <Card title={L('The game', '게임')}>
          <p className="hb-p">{L('JOSEON: THE CROWN & THE LEGACY. Concept and design specifications by the project owner; built to the Master Specification v2.0 and the Game System Design Documents (Parts I–XVI), adapted to a 2D life simulation.', 'JOSEON: THE CROWN & THE LEGACY. 기획과 설계 명세는 프로젝트 소유자가 작성했고, 마스터 명세 v2.0과 게임 시스템 설계 문서 1–16부를 2D 인생 시뮬레이션에 맞게 다듬어 만들었다.')}</p>
          <p className="hb-p">{L('Music and sound are synthesised in the browser after Korean court and folk practice. Typefaces: Hahmlet and Song Myung (SIL Open Font License).', '음악과 소리는 한국 궁중·민속 음악의 방식을 따라 브라우저에서 합성한다. 글꼴: 함렛, 송명 (SIL 오픈 폰트 라이선스).')}</p>
        </Card>
        <Card title={L('Open-source software', '오픈 소스 소프트웨어')}>
          <ul className="kit-list">
            {['React (MIT)', 'Zustand (MIT)', 'Zod (MIT)', 'Lucide icons (ISC)', 'Vite (MIT)', 'Vitest (MIT)', 'TypeScript (Apache-2.0)'].map((x) => <li key={x}>{x}</li>)}
          </ul>
        </Card>
        <Card title={L('Historical references', '역사 참고')}>
          <ul className="kit-list">{Object.values(SOURCES).map((s, i) => <li key={i}>{tx(s)}</li>)}</ul>
          <p className="kit-note">{L('The player’s story is fiction. Historical content is labelled by how well it is attested, and should be reviewed by a historian before release.', '플레이어의 이야기는 허구다. 역사 내용은 근거의 확실성에 따라 표시했으며, 출시 전 역사학자의 검토가 필요하다.')}</p>
        </Card>
      </div>
    </main>
  );
}
