import { ChevronLeft } from 'lucide-react';
import { useUi, type Screen } from '../store/ui';
import { useGame } from '../store/game';
import { useT } from '../i18n/useT';
import { placeName } from './PlayScreen';
import { useL } from '../ui/kit';

/** The bar shared by the profile, people, family and map pages. */
export function RecordsBar({ current }: { current: Screen }) {
  const { t, nm } = useT();
  const go = useUi((s) => s.go);
  const g = useGame((s) => s.game);
  const { L } = useL();
  const links: [Screen, string][] = [
    ['profile', t('profile')], ['life', L('Pastimes & health', '취미와 건강')], ['culture', L('Culture', '풍류')], ['people', t('people')], ['family', t('family')], ['affairs', L('Court', '조정')], ['estate', L('House & wealth', '살림')],
    ['missions', L('Matters', '처리할 일')], ['map', t('map')], ['archive', L('Archive', '사록')], ['honours', t('achievementsShort')],
  ];
  return (
    <header className="bar">
      <button className="bar-link" type="button" onClick={() => go(g ? (g.player.alive ? 'play' : 'legacy') : 'menu')} style={{ paddingLeft: 0 }}>
        <ChevronLeft size={20} strokeWidth={1.6} />{g ? (g.player.alive ? t('returnTo', { place: nm(placeName(g, g.place)) }) : t('back')) : t('mainMenu')}
      </button>
      <nav className="bar-nav" aria-label={t('game')}>
        {links.map(([s, label]) => (
          <button key={s} className="bar-link" type="button" aria-current={current === s ? 'page' : undefined} onClick={() => go(s)}>{label}</button>
        ))}
      </nav>
    </header>
  );
}
