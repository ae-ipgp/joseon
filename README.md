# Joseon: The Crown & the Legacy

A browser-based historical life simulation set in Joseon, in the spirit of BitLife (similar in a few aspects, not a copy): one life at a time, in detail, then the next generation. It is a 2D game and has no 3D. Version 0.6 takes what fits from GSDD Parts XI, XII, XIII, XV and XVI, adds scenarios, culture and belief, and a visual upgrade (themes, weather and season effects, a living scene, the turn of the season). Earlier versions brought in the Master Specification v2.0 and GSDD Parts I–X, all at the depth the Simplified Scope v1.0 sets.

Single-player and local-first. No backend, no accounts, no AI services. English and Korean.

## Run it

```bash
npm install
npm run dev        # local development
npm run build      # type check + production build into dist/
npm test           # engine, content and save tests (vitest)
```

Deploys to Vercel as a standard Vite project (framework preset: Vite, output: `dist`).

## Stack

React 19, TypeScript, Vite, plain CSS with design tokens, Lucide icons, Zustand for state, Zod for content and save validation, LocalStorage for saves and settings.

## Layout

| Folder | What lives there |
| --- | --- |
| `src/model` | Zod schemas for the game state (`schemas.ts`) and for content (`content.ts`). |
| `src/content` | Everything a writer edits: eras and premises, families, cast, places and activities, story events, history, word lists. |
| `src/engine` | Pure functions over the game state: time, days, effects, events, seasons, legacy, tokens. No React. |
| `src/store` | Zustand stores: `game` (the life in play), `ui` (screen, sheets, toasts), `settings` (language, text speed, audio). |
| `src/save` | Save slots (auto + 3) with versioning and migration, and the achievement record kept across lives. |
| `src/screens` | One file per screen: menu, campaign, character creation, play, scene, map, profile, people, family, saves, legacy. |
| `src/scenes` | The illustrated SVG backdrops for each kind of place, by season and time of day. |
| `src/ui` | Shared parts: portraits, medallions, seals, meters, sheets. |
| `src/i18n` | Interface strings in both languages and the `useT` hook. |
| `src/audio` | Music and sound, synthesized with the Web Audio API: no audio files. |
| `public` | The favicon, the web app manifest and the service worker (`sw.js`). |
| `src/styles` | `tokens.css` (palette, type, spacing) and `app.css`. |

Prefer not to install anything? `standalone/joseon.html` is the whole game in one file: open it in a browser.

## How the game moves

- Every change to the state goes through an **effect** (`engine/effects.ts`), so content never edits state directly.
- A day has three phases (morning, afternoon, evening); a moon has 30 days; seasons follow the moons.
- **Letting time pass** jumps to the next season and stops early when a story event is waiting or the player dies. Each season ends with a report.
- Random outcomes use a seeded roll keyed by the day, so a save replays the same way.
- When the player dies, the legacy screen offers living children or grandchildren as heirs. Continuing re-keys the family around the heir and starts the next generation.

## Systems added in version 0.2

- **The wider court** (`src/content/court.ts`, `src/engine/royals.ts`): the queen dowager, grand queen dowager, queen, crown prince and princess, royal consort, princess, the princes of the "Two heirs" premise, the three state councillors' offices, the royal secretary, a historian, the royal physician, the chief eunuch, an inspector, a matchmaking matriarch, a silk merchant, and the family's steward and maid. Royals are known by title and pass their titles on by succession: when a king dies, the queen becomes the queen dowager and keeps the regard the player built with her. In historical campaigns the crown prince appears only in the years Joseon had a named heir (`HEIR_YEARS`, to be reviewed). Officials and servants hold posts; when one dies, a successor takes the post. People can be met by finding them: strangers show at their places and can be introduced to. A new place, the Palace Offices, holds the officials.
- **Money** (`src/engine/money.ts`): a purse in nyang, with household income, office salary, upkeep, autumn ancestral rites and the occasional windfall or loss each season. Gifts, the royal physician and weddings cost money; a silk shipment can be bought into and pays back, or not, the next season. The house's wealth band follows the purse.
- **Achievements** (`src/content/achievements.ts`, `src/engine/achieve.ts`): 48 milestones in office, at court, in the family, in a long life, in wealth, along the family line, and for each ending. Each is earned once per life and pays its reward into that life. The record of every achievement earned in this browser lives under `joseon:honours`, separate from save slots.
- **Names in both scripts** (`src/engine/names.ts`): a name typed in Latin letters gets a hangul spelling (Giseok → 기석, Hikmah → 히크마); a name typed in hangul gets a romanization (기석 → Gi-seok). The player can correct the hangul on the creation screen.
- **Sound** (`src/audio/sound.ts`): music in the two pentatonic modes on gayageum, daegeum and haegeum voices with janggu and buk, changing with the screen and the time of day; sounds for buttons, sealed choices, letters, time passing, coins and achievements. Volumes come from Settings. Nothing plays until the player first taps or presses a key.


## Systems added in version 0.3 (the v2.0 specifications)

The 2D illustrated game stays the main view. Where a specification asked for more than the Simplified Scope allows, the system is here in the form that serves the story loop; notes below say what was simplified.

**Character (GSDD Part I)** — `content/attributes.ts`, `engine/character.ts`
- 25 attributes in five groups (intellect, social, leadership, physical, character), 0–100, shown as words. Wit, grace and resolve, which the story uses, are now the averages of their groups, so a story effect moves every attribute in the group.
- Seven tendencies (introverted–outgoing, cautious–adventurous and so on) and up to two starting traits from good, neutral and flawed lists.
- Life stages from infancy to old age. Ageing each spring: the young grow stronger, the old slow down, judgement keeps improving.
- Starting ages 8 to 40. Children live at home: lessons, play and family, with the palace closed until the coming-of-age ceremony at fifteen.
- Education in five fields: classics, administration, military arts, arts and rites, household and commerce. A child concentrates on one each season. Tutors, a study hall and a library speed learning.
- Examinations: the regular examination every third year, special ones in some other years, and the lesser examination (licentiate). Period rules apply: women may not sit in historical campaigns, and close royal kin are barred from office. Passing qualifies you; a post depends on vacancies and backing.
- Status is kept in separate parts: birth status, legal status now, royal standing, office, family standing, means, prestige, reputation, honour, influence, formal authority and legitimacy.
- Character creation: any year from 1392 to 1897, eight houses (civil, military, political, scholarly, landed, declining, royal, collateral royal), a custom house with checks for historical campaigns, royal standing, stage of life, tendencies and traits, and a summary of the starting position.
- Current objectives on the profile, drawn from stage and station. A chronicle of the life by heading in the Archive.

**Politics (GSDD Part II)** — `content/government.ts`, `engine/politics.ts`, `engine/justice.ts`
- Institutions: State Council, Six Ministries, Royal Secretariat, Inspector-General, Censor-General, Office of Special Advisers and more, with dated existence where it matters. 31 posts across five tiers, each with its grade in the nine-grade system and a duty.
- Vacancies each spring and autumn. Seeking a post weighs favour, reputation, skill, service record and faction. Duties at the Palace Offices build a service record; a year-end evaluation decides promotion, a reprimand, or after two bad years dismissal.
- Two great factions by period (merit subjects and scholars, Hungu and Sarim, Westerners and Easterners, Noron and Soron, and so on). Influence moves each season, reversals of power and purges happen, and the player can join, change sides (at a cost in honour), stay neutral, attend gatherings or broker truces.
- The royal household: the player can be named crown prince (royal lineage, legitimacy and favour, an empty seat), chosen in a royal selection as crown princess (or queen for a widowed king), rise to queen and queen dowager, and govern as regent for a boy king.
- Taking the throne opens governance: state treasury, privy purse, taxation, royal authority with its parts (stability, cooperation, military loyalty), one great decree a season (relief, public works, the army, appointing from both factions, a purge, an audit, an embassy, moving state funds to the privy purse with consequences), and naming an heir. A weak throne finds its orders stalled; a collapsed one can be deposed.
- Investigations: lines of inquiry (witnesses, records, letters, informants, confrontation, the Ministry of Punishments) yield evidence of different reliability. Findings can establish misconduct, expose a conspiracy, disprove the charge, prove inconclusive, accuse the wrong person, be obstructed, or implicate the investigator.
- Punishments kept distinct: reprimand, demotion, dismissal, exile, confiscation, loss of status, death.
- **YOU ARE NOW A COMMONER**: when status is formally revoked, the game pauses on its own screen with Continue this life or End this campaign. Commoner life is restricted: work for wages, keep the family, gather proof, petition at the sinmungo drum. Restoration can be full, partial, refused or closed for ever; descendants inherit the family's circumstances.
- History and divergence: once the player takes the throne, or a purge or regency changes things, the Archive records how the campaign departs from recorded history and who reigns instead.
- Diplomacy and war, simplified: embassies to Ming or Qing, Japan and the Jurchen by period; military officers face orders from the front in years of war (the Imjin War, the Manchu invasions and others), resolved by leadership, strategy and arms. No real-time battles.

**Economy and world (GSDD Part III)** — `content/economy.ts`, `engine/econ.ts`
- A family treasury separate from the player's purse. Whoever holds the keys (head of the household, or its mistress) manages it; a member lives on an allowance and can ask for more.
- Estates with location, size, value, condition and productivity: the capital residence, farm estates, woodland, shop fronts and country houses. Maintenance, managers, inspection journeys, buying and selling.
- Construction: ancestral shrine, library, study hall, pavilion, lotus pond garden, guest hall, storehouse, stable, walls, irrigation weir, mill, tenant cottages. Each has a cost, a time to build, upkeep and an effect. 
- The household: steward, estate manager, clerk, tutor, physician, attendant, cook, guards, messenger, and servants as a count. Wages and loyalty; the unpaid steal or leave.
- Businesses (inn, cloth shop, merchant broker, river boats, brassware workshop, ginseng fields) with capital, aim, manager, reputation and risks: fraud, theft, shortages, fire. Nobles in trade lose a little face unless the sandbox makes trade respectable.
- The eight provinces and the capital, with weather each season, disasters with warnings a season ahead (drought, flood, typhoon, crop failure, epidemic, great cold), regional prices for seven goods, consignments sent from one market to another, and journeys that take days and cost money.
- Debts with seasonal interest, creditors who force the sale of land, grain stores against bad years, and a ledger of each season's lines.
- Inheritance: the treasury, land, buildings and family debts pass to the heir; a daughter who married out runs her husband's household instead.

**Alternative Joseon sandbox** — rules for the whole kingdom: succession (eldest son, designated, eldest child), women in examinations and office, social mobility, nobles in trade, strength of the throne, and factional strife.

*(Version 0.3 also had an optional 3D view; it was removed in 0.5 so the game stays 2D.)*

**Not done, by design or for later**
- Saves stay in LocalStorage, and text stays in the game's own bilingual system, as the Simplified Technical Architecture binds; IndexedDB/Dexie and i18next from the Master Specification are not used.
- No detailed accounting, trade routes, production chains, national budget, real-time battles or individually managed servants (Simplified Scope §7).
- Historical details (posts, grades, dates, factions, exam years, reign data) and the Korean text still need review by a specialist and a native speaker.

## Systems added in version 0.4 (GSDD Parts IV–VI)

**History (Part IV)** — `content/monarchs.ts`, `content/annals.ts`, `content/figures.ts`, `engine/chronicle2.ts`
- A profile for each of the 26 reigns: temple and personal names, dates, lineage, character and policies. The Court shows the reigning monarch; the Archive lists them all.
- About fifty dated events across the dynasty, in eight periods, each with a category, its evidence class and its consequences for provincial stability, factions and the player's standing. They run on the calendar alongside the older chronicle.
- Period rules that switch on and off with the year: the examinations (ended 1894), legal status, the bar on royal kin and on women in office, the great code, the uniform land tax, the equal service law, the freeing of state slaves. Institutions now include the Hall of Worthies (1420–1456), the Border Defence Council (1555–1865) and the Royal Library (from 1776).
- Eleven historical factions with their dates, leaders and base, shown with the two sides of play.
- 26 historical figures with documented lives. In their years the player can seek them out from the Court; the meeting is labelled a reconstruction, teaches from their field, and gives them no invented words.
- Evidence classes on everything historical: verified, well-supported, reconstructed, fictional, alternate history. Scenes carry a label: historical setting (with its class) or fictional story.
- Continuity, chosen with the campaign: **strict** keeps the record (no royal paths for the player), **limited** allows moderate changes and the player's own royal path, **dynamic** allows anything. Three turning points can be met in play: the 1591 envoys (preparing for the Imjin War), the 1636 answer to the Qing (averting the second Manchu invasion) and the 1762 crisis (sparing Crown Prince Sado, who then reigns from 1776). Every departure is recorded with its class: minor, moderate, major or structural.
- Seven sandbox scenarios (the Unbroken Dynasty, the Reformist Monarch, the Rise of a New Royal House, the Great Factional Struggle, the Military Ascendancy, the Equal Court, the Divided Kingdom) and four more kingdom rules: royal house, military strength, foreign relations and the weight of taxation.

**Experience (Part V)** — `engine/missions.ts`, `engine/social.ts`, `engine/routine.ts`, `engine/difficulty.ts`, `screens/MissionsScreen.tsx`
- Matters (missions) that arise from the player's circumstances: a faction memorial, a boundary dispute, an illness in the family, a business in trouble, a royal audience, a child's schooling, a rumour, storm damage. Each has a deadline and two or three ways through with their own costs; ignored, they resolve themselves, usually badly.
- Relationships with trust, respect, gratitude, resentment, rivalry and fear alongside regard, and a tie (friend, rival, colleague, ally…). New interactions from the person card: compliment, debate, ask for help, invite, apologise, challenge, propose an alliance, break off ties. People remember what was done; a resentful official may speak against you.
- Letters: write greetings, requests for support, invitations and condolences; friends write back on their own.
- Reputation read across seven domains (family, scholarly, political, military, commercial, court, personal conduct) from what the player has done.
- Condition: fatigue from each activity, eased by sleep and by the seasons; stress that settles toward what the player's circumstances warrant and wears down health when high. A tired mind learns less.
- Daily routines: choose the morning and afternoon at a place and follow them for a day or six; they stop as soon as something needs the player.
- An older start arrives with a past: examinations passed, a first post, a faction and acquaintances, within what a life of that age could have reached.
- Difficulty as separate dials: illness and death, harvests and trade, court intrigue, and a steward who handles routine repairs.
- Notifications with categories and priorities, a bell with the unread count on the play screen, and official documents (appointment certificates, examination certificates, deeds, marriage letters, decrees of exoneration) kept in the Archive. A biography written only from what happened, and the lives of earlier generations in the Archive and on the Family page.
- Main menu: continue with the saved life's details, separate new historical and sandbox campaigns, the campaign archive, a handbook and credits. Contextual tips the first time each part of the game opens.
- Settings: text size, high contrast, reduced motion, tips and ambience volume.

**Technical architecture (Part VI)** — `engine/bus.ts`, `save/checkpoints.ts`, `save/diagnostics.ts`, `ui/ErrorBoundary.tsx`, `public/sw.js`, `vercel.json`

| Part VI asks for | Where it is |
| --- | --- |
| Layered architecture: content, simulation, presentation | `src/content` (data), `src/engine` (pure functions, no React), `src/screens` and `src/ui` |
| Deterministic simulation, seeded randomness | `roll(g, key)` from the save's seed and the day; `v04.test.ts` replays a campaign twice and compares |
| Event bus | `engine/bus.ts`: systems `emit` typed events; listeners turn them into notices, documents and memories |
| Historical data separate from campaign state | `content/monarchs.ts`, `annals.ts`, `figures.ts` are read-only; the save holds only flags and the divergence record |
| Saves: validation, migration, atomic writes, backup | `save/storage.ts`: Zod on every read, version 4 with migration from 1–3, write-verify-replace with the previous file kept as a backup |
| Checkpoints | IndexedDB, one per season and generation, the last twelve kept (`save/checkpoints.ts`) |
| Export and import | Saves screen: JSON file out, checked in full on the way back in |
| Error handling and diagnostics | an error boundary per screen and a local error log, readable in Settings → Diagnostics; nothing is sent anywhere |
| Offline play | a service worker, registered only in the production build, only over https, only in a top-level window |
| Deployment and security | `vercel.json`: content security policy, no framing, no sniffing, strict transport, cache headers for hashed assets |

**What 0.4 simplifies, and why**
- LocalStorage stays the primary save store, as the Simplified Technical Architecture binds; IndexedDB holds only the automatic checkpoints.
- No AI-generated dialogue: Part V allows it as optional, and the game must stay deterministic and offline. All dialogue is authored.
- The architecture's multiplayer, cloud saves, analytics and telemetry hooks are not built: the game is single-player and local-first.
- Historical figures are not simulated NPCs with their own schedules; they are people to seek out in their years. The annals summarise; they do not replay every event of a reign.

## Version 0.5: what was taken from GSDD Parts VII–X, and what was left

The four new documents (Part VII art and audio, Part VIII narrative and content, Part IX core life simulation, Part X royal court and governance) were written for a large 3D production. This game is a detailed 2D life simulation in the manner of BitLife, so each part was read for what makes a single life richer to live, and the rest was left out.

**Taken**

| From | What it became | Where |
| --- | --- | --- |
| IX §3.3, §12.4, §15.3 | Happiness (0–100) and a named mood (content, happy, proud, grieving, anxious, angry, afraid, exhausted…), shown on the play screen. Happiness drifts toward what the life gives: marriage, children, a calling, security, standing, health, the arts; events move it directly. | `engine/life.ts`, `content/life.ts` |
| IX §12.1–12.5, §13.4–13.5 | Named illnesses: colds, fever, indigestion, a lingering cough, falls, smallpox, consumption, and in later life aching joints, failing eyes, a weak heart. Treatment by physician, the royal physicians (for the royal house and its favourites), herbal medicine, rest, or a shaman’s rite for comfort. Grave illness can kill at any age, and the player is warned when life is in danger, never told when it will end. | `engine/life.ts` |
| IX §4, §14.2 | Nine pastimes with levels that rise with practice and fade a little after a year untouched: calligraphy, poetry, the zither, ink painting, baduk, archery, horsemanship, embroidery, herbal lore. A contest once a year. Calligraphy and poetry help the literary examinations, archery and riding the military one, herbal lore helps against illness; painting and embroidery make gifts. Four simple pleasures: a walk in the hills, a temple, wine with friends, tending the graves. | `screens/LifeScreen.tsx` (Pastimes & health) |
| IX §11.2–11.4, X §7.3 | Raising children: what each child learns, how strictly, and once a season time together, praise, a lesson or a scolding. Children grow each season; a trait shows around twelve; the heir you continue as carries the upbringing. | Family page |
| VIII §12, VII §3.2 | Mourning: twenty-seven months for a parent, a year for a spouse. No weddings or banquets, mourning dress in portraits, and an official leaves his post without salary until the king recalls him early (gibok) or the mourning ends. | `engine/life.ts`, `engine/season.ts` |
| VIII §5.6 | People in the player’s life marry and have children on their own; their news reaches the player, and a romance can be lost to someone else. Never within the same clan. | `engine/life.ts` |
| IX §15.4, §17.5, VIII §13 | Life milestones (first lessons, coming of age, examinations, first post, marriage, first child, estate, royal recognition, mastery, the throne, sixty years…), a BitLife-style ribbon that names each life when it ends (16 of them, collected across lives on the Honours page), and a description of how the life will be remembered, in words rather than a score. | Pastimes & health, Legacy, Honours |
| X §13, §22, §23.3, §8.4 | For a reigning monarch or regent: memorials from the ministries each season to approve, refuse or put off, each with its consequences; the reign recorded in words; abdication to a grown heir, living on as the retired king; the line of succession, marked as recorded practice or sandbox rule. | `engine/reign.ts`, Court page |
| VII §2.6, §3 | Faces: portraits show the mood (calm, smiling, sad, stern, worried), and people look warmer or colder as their regard changes. Officials are painted in the robe of their grade (green, blue, red), royals in royal robes, mourners in hemp. | `ui/Portrait.tsx`, `engine/world.ts` |
| IX §18.4 | People page filters for friends and allies, and the life news of each person. | `screens/PeopleScreen.tsx` |
| VIII §8.5, VII §12.3 | A glossary of 46 period terms in English and Korean, searchable, in the handbook; new handbook topics for feelings and health, raising children and ruling. | `content/glossary.ts` |

**Left out**

- Everything 3D in Part VII: models, rigging, the animation library, cloth simulation, GLB and KTX2 assets, level of detail, streaming, building interiors, the walkable peninsula, cinematic cameras. The existing 3D view was removed as well.
- Voice acting and recorded music (VII §10–12); the game keeps its synthesised music, effects and ambience.
- Asset naming conventions, metadata and the production pipeline (VII §13–16), which belong to a studio, not to the game.
- AI-assisted dialogue (VIII §8.6): optional in the spec, and the game stays offline and deterministic.
- The content-database tooling and narrative causality engine of Part VIII §15–16, beyond what the game already has (evidence labels, divergence records, memories).
- Replacing the 24 attributes with Part IX’s ten (they map onto ours, and changing them would break saves), a separate 50-skill system, an examination quiz, and minute-by-minute scheduling.
- Most of Part X: palace districts and access clearance, household staffing, separate royal and state budgets, six ministry dashboards, the management of every official, military logistics, diplomatic relations per country, national crisis dashboards and delegation risks. These would turn a life simulation into a management game; the monarch gets memorials, decrees, taxation, an heir and abdication instead.
- Real-time anything: the game stays turn-based by parts of the day and seasons.

## Version 0.6: what was taken from GSDD Parts XI, XII, XIII, XV and XVI, and what was left

These five documents (military, diplomacy, culture, law, religion) were again written for a very large 3D production. The test for each idea was the same as in 0.5: does it make one life more interesting to live, in a 2D game played by choices? If it only makes sense as a separate strategy or management game, it was left out.

**Taken**

| From | What it became | Where |
| --- | --- | --- |
| XIII §7, §10 (arts, literature, patronage) | **Writing**: finish poems, essays, travel records, a family chronicle, a commentary, medical notes or a painting album, each with a title and a quality; print them. **Patronage**: support a poor scholar, commission a screen, endow a village school, repair a temple hall, give relief rice. | `content/culture.ts`, `engine/culture.ts`, Culture page |
| XVI §2–3, §12, XIII §8 (belief and ritual) | **Belief as a personal way**: the Way of the sages, Buddhist devotion, household spirits, practical learning, Western learning (each only in the years it existed). Keep a practice three times and it becomes yours; conviction steadies the mind. Fortune readings are reported as what the mudang says, never as fact. | Culture page |
| XIII §12 (festivals and seasons) | A line for one festival of the year in each season's report: Daeboreum, the lantern festival, Chilseok, Dongji and others. | `engine/culture.ts` |
| XIII (daily life) | **Companion animals**: a sapsali, a Jindo dog, a cat, a hunting falcon or a garden crane, with a name and a lifespan. A **mountain temple** to visit, with its own illustrated scene. | Culture page, `scenes/PlaceScene.tsx` |
| XI §3–5, §9 (military careers and battle) | A **posting** for officers (field army, navy, royal guard, border garrison), each training a different strength, and two more **battle tactics** (a flanking march, an ambush) beside hold, attack and reinforce. | `engine/culture.ts`, `engine/politics.ts`, Court page |
| XII §6, §9 (envoys, trade, languages) | **Spoken Chinese** as a pastime, which helps on an embassy; four **foreign-affairs memorials** for a reigning player (a border market, castaways on Jeju, tribute demands, trade through the Japan House). | `content/life.ts`, `engine/reign.ts` |
| XV §5–9 (lawsuits, trials, punishment) | The law reaches a life as **matters** with several ways through (an inheritance suit, an arrest) and as scenes: a bribery trial, a forged deed and its discovery. | `engine/missions.ts`, `content/events5.ts` |
| All five | **Eleven new scenes** (a monk at the gate, a book from Beijing, the moon-viewing party, a stray dog, the night of lanterns, the interpreter is ill, fires across the river, the village archery meet and the three law scenes) and **28 new achievements**. | `content/events5.ts`, `content/achievements.ts` |

**Added beyond the documents (asked for with this version)**

- **Twelve scenarios** on the main menu: lives begun with a goal, such as First on the List, The Road to the Inner Palace, The House That Fell, The Northern Frontier, The Year of the Black Dragon, A Life of Letters, Silk and Silver, Three Generations, The Crown, Healing Hands, Friends in Every Hall and The Open Hand. The goal and progress show on the Culture page and at the end of the life.
- **This life in numbers** on the Pastimes & health page: people known, friends, letters, gifts, works, journeys and more.
- **Four themes** (Settings → Theme): Ink & Hanji, Dancheong, Celadon, Lantern night.
- **Weather and season in the air** (`ui/Atmosphere.tsx`): petals in spring, fireflies on summer nights, falling leaves, snow, rain, embers at the end of a life.
- **A living scene** (`ui/SceneLife.tsx`): birds and drifting cloud by day, slanting light in the morning, a falling star at night, and a slight parallax when the pointer moves.
- **The turn of the season** (`ui/SeasonCard.tsx`): a wash of ink with the season's character, the year and your age.
- **Pop-ups for what changed** (`ui/Floaters.tsx`): money, health, happiness, reputation and favour rise from the corner as they move.
- **Motion and ornament**: screens and cards ease in, titles are brushed in, buttons shimmer, seals stamp, lanterns sway on the menu, a dancheong stripe runs under every bar. Everything animated stops under Settings → Reduce motion and under the system setting.

**Left out**

- Part XI as a war game: armies with unit counts, logistics and supply lines, fortress building, naval fleet management, campaign maps, national defence budgets, real-time or turn-based battles on a field. Battle stays one decision with consequences.
- Part XII as a diplomacy game: a relations score for every foreign state, treaty negotiation screens, intelligence networks and spies, foreign trade simulation, geopolitical strategy. Foreign affairs stay embassies, memorials and scenes.
- Part XV as a legal simulator: court procedure step by step, a prison system, a full criminal code, police and patrol management, judicial administration for a monarch. The existing inquiries and punishments already cover a single life's brush with the law.
- Part XVI and XIII as institutions: managing temples, shrines and academies, a religious-policy system for the state, royal ritual calendars with attendance tracking, ceremonial processions, philosophical-school faction mechanics beyond the factions the game already has.
- Anything that presents the supernatural as real, and anything 3D, voiced or online in all five parts.

## Offline build used during development

This project was built where the npm registry was unreachable. `npm install` and the scripts above are the normal way to run it. The folder `tools/offline` holds what was used instead: esbuild with small stand-ins for zustand, lucide-react and vitest that have the same API, and `sh tools/offline/check.sh` type-checks, tests and bundles the single-file `standalone/joseon.html`. It expects esbuild, TypeScript, React and Zod under `/opt/npm-tools/node_modules`; you do not need it if npm works for you.

## Writing content

Story events live in `src/content/events.ts`. Each one says where and when it can happen, who is in it, the lines, and the choices with their effects. Text is written with `T('English', '한국어')` and lines with `L('speaker', 'English', '한국어')`.

Names and factions are tokens: `{player}`, `{given}`, `{father}`, `{mother}`, `{sibling}`, `{king}`, `{palace}`, `{factionA}`, `{factionB}`, `{spouse}`, `{child}`. In Korean, add the particle to the token so it agrees with the name: `{factionA_i}` (이/가), `{factionB_eul}` (을/를), `{player_eun}` (은/는), `{father_wa}` (과/와). Interface strings can write `(으)로`, `이(가)`, `을(를)`, `은(는)`, `과(와)` after a name and they settle automatically.

`npm test` checks that every event and place matches its schema, every speaker exists, every story text has Korean, and every token resolves in both languages in every campaign. `src/engine/v06.test.ts` covers the v0.6 systems (belief, writing, patronage, companions, postings, scenarios, the v5 save upgrade), `src/engine/systems.test.ts` the v0.3 systems, `src/engine/v05.test.ts` the v0.5 ones (mood, illness, pastimes, mourning, upbringing, milestones, ribbons, memorials, abdication, the v4 save upgrade), and `src/engine/v04.test.ts` the v0.4 ones: historical data validation (monarch dates, figures, annals, institutions, periods), continuity, determinism, a multi-generation run, missions, interactions, letters, routines, the event bus and the save safeguards. Events may set `child`, `commoner` or `monarch` to say who they are for; by default they are for adult nobles.

## Saves

Saves are JSON in LocalStorage under `joseon:save:auto` and `joseon:save:1` to `3`, each with a version number (now 6; older saves are upgraded) and the previous version kept under `:bak`. Checkpoints are in IndexedDB (`joseon` → `checkpoints`). A save from a newer version, or one that fails validation, shows as unreadable and is never overwritten silently. Add a step to `migrate()` in `src/save/storage.ts` whenever the state shape changes, and raise `SAVE_VERSION`.

## Still to do

- The Korean story text is a working draft and needs review by a native speaker, especially speech registers.
- Historical details (offices, ranks, dates, court customs) need a review by someone who knows the period.
- Portraits and scenes are drawn in code as placeholders for commissioned art in the same style.
- The music and sounds are synthesized placeholders; recorded traditional instruments would sound better.
- Have the crown prince years, royal titles and office salaries reviewed by someone who knows the period.
- Have the monarch profiles, annals, figures and faction dates of version 0.4 reviewed by a historian; they follow standard references but are summaries.
- Have the glossary, the illness names and the mourning rules of version 0.5 checked the same way.
- Have the belief paths, festival lines and legal scenes of version 0.6 checked by a historian, and all Korean text by a native speaker.
