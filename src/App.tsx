import { useEffect } from 'react';
import { useUi, type Screen } from './store/ui';
import { useGame } from './store/game';
import { useSettings } from './store/settings';
import { Toast } from './ui/parts';
import { LoadSheet, SettingsSheet } from './screens/sheets';
import { MenuScreen } from './screens/MenuScreen';
import { CampaignScreen } from './screens/CampaignScreen';
import { CreateScreen } from './screens/CreateScreen';
import { PlayScreen } from './screens/PlayScreen';
import { SceneScreen } from './screens/SceneScreen';
import { MapScreen } from './screens/MapScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { PeopleScreen } from './screens/PeopleScreen';
import { FamilyScreen } from './screens/FamilyScreen';
import { SavesScreen } from './screens/SavesScreen';
import { LegacyScreen } from './screens/LegacyScreen';
import { HonoursScreen } from './screens/HonoursScreen';
import { HonourNotice } from './ui/Honours';
import { useAudio } from './audio/useAudio';
import { AffairsScreen } from './screens/AffairsScreen';
import { EstateScreen } from './screens/EstateScreen';
import { ArchiveScreen } from './screens/ArchiveScreen';
import { DownfallScreen } from './screens/DownfallScreen';
import { needsDownfallScreen } from './engine/justice';
import { MissionsScreen } from './screens/MissionsScreen';
import { LifeScreen } from './screens/LifeScreen';
import { CultureScreen } from './screens/CultureScreen';
import { ScenarioScreen } from './screens/ScenarioScreen';
import { HandbookScreen, CreditsScreen } from './screens/HandbookScreen';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { Floaters } from './ui/Floaters';
import { SeasonCard } from './ui/SeasonCard';

const NEEDS_GAME: Screen[] = ['play', 'map', 'scene', 'profile', 'people', 'family', 'legacy', 'affairs', 'estate', 'archive', 'missions', 'life', 'culture'];

export function App() {
  const screen = useUi((s) => s.screen);
  const sheet = useUi((s) => s.sheet);
  const go = useUi((s) => s.go);
  const game = useGame((s) => s.game);
  const sceneResult = useGame((s) => s.sceneResult);
  const calm = useSettings((s) => s.calm);
  const lang = useSettings((s) => s.lang);
  const textSize = useSettings((s) => s.textSize);
  const contrast = useSettings((s) => s.contrast);
  const theme = useSettings((s) => s.theme);
  useAudio();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // The screen follows the game: scenes take over the screen, and a life that ends goes to its legacy.
  useEffect(() => {
    if (!game) {
      if (NEEDS_GAME.includes(screen)) go('menu');
      return;
    }
    if (!game.player.alive && !game.active && !game.report && !['legacy', 'menu', 'saves', 'honours'].includes(screen)) go('legacy');
    else if (game.active && (screen === 'play' || screen === 'map' || screen === 'life' || screen === 'culture')) go('scene');
    else if (!game.active && !sceneResult && screen === 'scene') go(game.player.alive ? 'play' : 'legacy');
  }, [game, sceneResult, screen, go]);

  let view;
  switch (screen) {
    case 'campaign': view = <CampaignScreen />; break;
    case 'create': view = <CreateScreen />; break;
    case 'play': view = game ? <PlayScreen /> : null; break;
    case 'scene': view = game ? <SceneScreen /> : null; break;
    case 'map': view = game ? <MapScreen /> : null; break;
    case 'profile': view = game ? <ProfileScreen /> : null; break;
    case 'people': view = game ? <PeopleScreen /> : null; break;
    case 'family': view = game ? <FamilyScreen /> : null; break;
    case 'saves': view = <SavesScreen />; break;
    case 'legacy': view = game ? <LegacyScreen /> : null; break;
    case 'honours': view = <HonoursScreen />; break;
    case 'affairs': view = game ? <AffairsScreen /> : null; break;
    case 'estate': view = game ? <EstateScreen /> : null; break;
    case 'archive': view = game ? <ArchiveScreen /> : null; break;
    case 'missions': view = game ? <MissionsScreen /> : null; break;
    case 'life': view = game ? <LifeScreen /> : null; break;
    case 'culture': view = game ? <CultureScreen /> : null; break;
    case 'scenarios': view = <ScenarioScreen />; break;
    case 'handbook': view = <HandbookScreen />; break;
    case 'credits': view = <CreditsScreen />; break;
    default: view = <MenuScreen />;
  }

  return (
    <div className={[calm ? 'calm' : '', contrast ? 'hc' : '', textSize !== 'normal' ? `text-${textSize}` : '', `theme-${theme}`, 'app-root'].filter(Boolean).join(' ') || undefined}>
      <ErrorBoundary key={screen}><div className="screen-in" key={screen}>{view}</div></ErrorBoundary>
      <Floaters />
      <SeasonCard />
      {needsDownfallScreen(game) && !game?.active && !game?.report && <DownfallScreen />}
      {sheet === 'settings' && <SettingsSheet />}
      {sheet === 'load' && <LoadSheet />}
      <Toast />
      <HonourNotice />
    </div>
  );
}
