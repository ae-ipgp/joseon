import { useEffect } from 'react';
import { useSettings } from '../store/settings';
import { useUi, type Screen } from '../store/ui';
import { useGame } from '../store/game';
import { setAmbience, setMood, setVolumes, sfx, unlock, type Mood, type SfxName } from './sound';
import { seasonOf } from '../engine/time';

function moodFor(screen: Screen, hasGame: boolean, evening: boolean): Mood {
  if (screen === 'scene') return 'scene';
  if (screen === 'legacy') return 'legacy';
  if (!hasGame || screen === 'menu' || screen === 'campaign' || screen === 'create') return 'menu';
  return evening ? 'night' : 'day';
}

/**
 * Connects the sound engine to the app: volumes from the settings, music that follows the screen
 * and the time of day, a soft tap for buttons, and cues for letters and season reports.
 * A button can choose its own sound with data-sfx, or none with data-sfx="none".
 */
export function useAudio() {
  const music = useSettings((s) => s.music);
  const fx = useSettings((s) => s.sfx);
  const screen = useUi((s) => s.screen);
  const hasGame = useGame((s) => !!s.game);
  const evening = useGame((s) => s.game?.date.phase === 'evening');
  const letter = useGame((s) => s.game?.letter ?? null);
  const report = useGame((s) => !!s.game?.report);
  const ambience = useSettings((s) => s.ambience);
  const moon = useGame((s) => s.game?.date.moon ?? 1);
  const raining = useGame((s) => { const w = s.game?.econ.provinces.hanseong?.weather ?? s.game?.econ.provinces.gyeonggi?.weather; return w === 'storm' || w === 'rain'; });

  useEffect(() => setVolumes(music, fx), [music, fx]);

  useEffect(() => {
    const wake = () => unlock();
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('button, a[href], [role="button"]') as HTMLElement | null;
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
      const name = el.dataset.sfx;
      if (name === 'none') return;
      sfx((name as SfxName) || 'tap');
    };
    window.addEventListener('pointerdown', wake, true);
    window.addEventListener('keydown', wake, true);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('pointerdown', wake, true);
      window.removeEventListener('keydown', wake, true);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  useEffect(() => setMood(moodFor(screen, hasGame, evening)), [screen, hasGame, evening]);
  useEffect(() => {
    const outside = hasGame && (screen === 'play' || screen === 'map');
    setAmbience(outside ? (evening ? 'night' : 'day') : 'none', ambience, seasonOf(moon), raining);
  }, [screen, hasGame, evening, ambience, moon, raining]);
  useEffect(() => { if (letter) sfx('paper'); }, [letter]);
  useEffect(() => { if (report) sfx('bell'); }, [report]);
}
