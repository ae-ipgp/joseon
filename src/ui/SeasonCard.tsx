import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';
import { seasonOf } from '../engine/time';
import { playerAge } from '../engine/time';

/**
 * v0.6: when the season turns, the turn is shown: a wash of ink, the season's character brushed in,
 * the year and the player's age. It never blocks play (no pointer events) and is skipped under "Reduce motion".
 */
const HANJA = ['春', '夏', '秋', '冬'];
const EN = ['Spring', 'Summer', 'Autumn', 'Winter'];
const KO = ['봄', '여름', '가을', '겨울'];
const LINE_EN = ['Plum and azalea; the swallows return.', 'Rains, cicadas and the long light.', 'Harvest, red maples and the clear moon.', 'Snow on the tiles; red-bean porridge.'];
const LINE_KO = ['매화와 진달래, 제비가 돌아온다.', '장마와 매미, 긴 해.', '추수와 단풍, 맑은 달.', '기와에 쌓인 눈, 동지 팥죽.'];

export function SeasonCard() {
  const g = useGame((s) => s.game);
  const calm = useSettings((s) => s.calm);
  const lang = useSettings((s) => s.lang);
  const last = useRef<string | null>(null);
  const [show, setShow] = useState<{ key: string; season: number; year: number; age: number } | null>(null);
  const life = g ? `${g.seed}:${g.generation}` : '';
  const season = g ? seasonOf(g.date.moon) : 0;
  const stamp = g && g.player.alive ? `${life}|${g.date.year}|${season}` : null;

  useEffect(() => {
    if (!g || !stamp) { last.current = stamp; return; }
    const prev = last.current;
    last.current = stamp;
    // Only a turn within the same life is announced: not a load, a new game or a new generation.
    if (!prev || prev === stamp || prev.split('|')[0] !== life) return;
    setShow({ key: stamp, season, year: g.date.year, age: playerAge(g) });
    const t = setTimeout(() => setShow(null), 2300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamp]);

  if (!show || calm) return null;
  const ko = lang === 'ko';
  return (
    <div className={`season-card sc-${show.season}`} key={show.key} aria-hidden="true">
      <div className="sc-wash" />
      <div className="sc-body">
        <span className="sc-hanja ko" lang="ko">{HANJA[show.season]}</span>
        <span className="sc-name">{ko ? KO[show.season] : EN[show.season]}<i>{ko ? `${show.year}년` : show.year}</i></span>
        <span className="sc-line">{ko ? LINE_KO[show.season] : LINE_EN[show.season]}</span>
        <span className="sc-age">{ko ? `${show.age}세` : `Age ${show.age}`}</span>
      </div>
    </div>
  );
}
