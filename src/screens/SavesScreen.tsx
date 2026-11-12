import { useEffect, useState } from 'react';
import { ChevronLeft, LogOut, SlidersHorizontal } from 'lucide-react';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useT } from '../i18n/useT';
import { Fibre, Medallion } from '../ui/parts';
import { SAVE_VERSION, SLOTS, deleteSlot, exportSlot, importSave, listSlots, readSlot, renameSlot, type SlotId } from '../save/storage';
import { checkpointGame, listCheckpoints, type Checkpoint } from '../save/checkpoints';
import { useL } from '../ui/kit';
import { slotLine, slotName } from './sheets';
import { playerName, playerPortrait } from '../engine/world';
import { seasonYear } from '../engine/time';
import { placeName } from './PlayScreen';

export function SavesScreen() {
  const { t, tx, lang } = useT();
  const g = useGame((s) => s.game);
  const saveTo = useGame((s) => s.saveTo);
  const load = useGame((s) => s.load);
  const quit = useGame((s) => s.quit);
  const go = useUi((s) => s.go);
  const openSheet = useUi((s) => s.openSheet);
  const [tab, setTab] = useState<'save' | 'load'>(g?.player.alive ? 'save' : 'load');
  const [views, setViews] = useState(() => listSlots());
  const [confirm, setConfirm] = useState<{ slot: SlotId; kind: 'overwrite' | 'delete' } | null>(null);
  const [note, setNote] = useState('');
  const refresh = () => setViews(listSlots());
  const { L } = useL();
  const [naming, setNaming] = useState<{ slot: SlotId; text: string } | null>(null);
  const [importTo, setImportTo] = useState<SlotId>(1);
  const [cps, setCps] = useState<Checkpoint[]>([]);
  useEffect(() => { void listCheckpoints(g?.seed).then(setCps); }, [g?.seed]);
  const download = async (slot: SlotId) => {
    const text = exportSlot(slot);
    if (!text) return;
    const filename = `joseon-save-${slot}-${new Date().toISOString().slice(0, 10)}.json`;
    // Inside the claude.ai artifact viewer a page may not download by itself; it asks the viewer through the
    // platform's downloads capability. Everywhere else (the standalone file, a deployed site) a plain link works.
    type Downloads = { save: (r: { filename: string; data: string }) => Promise<unknown> };
    const host = (window as unknown as { claude?: { use?: (name: string) => Promise<Downloads | null> } }).claude;
    const dl = host?.use ? await host.use('downloads').catch(() => null) : null;
    if (dl) {
      try {
        await dl.save({ filename, data: text });
        setNote(L('The save file is on its way to your downloads.', '저장 파일을 내려받는 중이다.'));
      } catch (e) {
        const code = (e as { code?: string }).code;
        setNote(code === 'declined' ? L('Not saved: the download was declined.', '내려받기를 취소했다.') : L('This view cannot hand over files.', '이 화면에서는 파일을 내려받을 수 없다.'));
      }
      return;
    }
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setNote(L('The save file is on its way to your downloads.', '저장 파일을 내려받는 중이다.'));
    } catch {
      setNote(L('This browser would not hand over the file.', '이 브라우저에서는 파일을 내려받을 수 없다.'));
    }
  };
  const bring = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8_000_000) { setNote(L('That file is far too large to be a save.', '저장 파일이라기엔 너무 크다.')); return; }
    file.text().then((text) => {
      const r = importSave(text, importTo);
      setNote(r.ok ? L('Save imported and checked.', '저장을 가져와 검사를 마쳤다.') : r.reason === 'newer' ? L('That save comes from a newer version of the game.', '더 새로운 판의 게임에서 만든 저장이다.') : r.reason === 'broken' ? L('That file is not a readable save.', '읽을 수 있는 저장 파일이 아니다.') : t(r.reason === 'quota' ? 'storageFull' : 'storageOff'));
      refresh();
    }).catch(() => setNote(L('The file could not be read.', '파일을 읽을 수 없다.')));
  };
  const openCp = (cp: Checkpoint) => {
    const game = checkpointGame(cp);
    if (!game) { setNote(L('That checkpoint can no longer be used.', '그 체크포인트는 더 쓸 수 없다.')); return; }
    load(game);
    go(game.player.alive ? (game.active ? 'scene' : 'play') : 'legacy');
  };
  const nameOf = (slot: SlotId) => {
    const v = views.find((x) => x.slot === slot);
    return v && v.state === 'ok' ? (lang === 'ko' ? v.summary.name.ko ?? v.summary.name.en : v.summary.name.en) : '';
  };

  const write = (slot: SlotId) => {
    const r = saveTo(slot);
    setConfirm(null);
    setNote(r.ok ? t('saved', { slot: slotName(slot, t) }) : t(r.reason === 'quota' ? 'storageFull' : 'storageOff'));
    refresh();
  };
  const erase = (slot: SlotId) => {
    deleteSlot(slot);
    setConfirm(null);
    setNote(t('slotEmptied', { slot: slotName(slot, t) }));
    refresh();
  };
  const open = (slot: SlotId) => {
    const r = readSlot(slot);
    if (!r.game) return;
    load(r.game);
    go(r.game.player.alive ? (r.game.active ? 'scene' : 'play') : 'legacy');
  };
  const back = () => go(g ? (g.player.alive ? 'play' : 'legacy') : 'menu');

  return (
    <main className="paper-screen">
      <Fibre seed={3} />
      <header className="bar">
        <button className="bar-link" type="button" onClick={back} style={{ paddingLeft: 0 }}><ChevronLeft size={20} strokeWidth={1.6} />{g ? t('returnToGame') : t('mainMenu')}</button>
        <div className="bar-nav">
          <button className="bar-link" type="button" onClick={() => openSheet('settings')}><SlidersHorizontal size={18} strokeWidth={1.6} />{t('settingsTitle')}</button>
          {g && <button className="bar-link" type="button" onClick={() => { quit(); go('menu'); }}><LogOut size={18} strokeWidth={1.6} />{t('quit')}</button>}
        </div>
      </header>

      <div className="wrap" style={{ maxWidth: 1040, paddingTop: 'clamp(28px, 5vh, 52px)', paddingBottom: 56, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p className="ko echo" lang="ko" style={{ marginBottom: 8, fontSize: 22, color: 'var(--jaju)' }}>저장과 불러오기</p>
            <h1 style={{ fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 300, lineHeight: 1.1 }}>{t('savesTitle')}</h1>
          </div>
          <div className="tabs" role="group" aria-label={t('savesTitle')}>
            <button type="button" aria-pressed={tab === 'save'} disabled={!g?.player.alive} onClick={() => { setTab('save'); setConfirm(null); setNote(''); }}>{t('saveTab')}</button>
            <button type="button" aria-pressed={tab === 'load'} onClick={() => { setTab('load'); setConfirm(null); setNote(''); }}>{t('loadTab')}</button>
          </div>
        </div>

        {tab === 'save' && g && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 20px', background: 'var(--ink)', color: 'var(--hanji)' }}>
            <Medallion spec={playerPortrait(g)} size={60} ring="0 0 0 2px var(--gold-light)" />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, color: 'var(--gold-light)' }}>{t('nowLiving')}</p>
              <p style={{ marginTop: 2, fontSize: 19, color: 'var(--text-ink)' }}>{tx(playerName(g))}, {tx(seasonYear(g)).toLowerCase()}</p>
              <p style={{ marginTop: 2, fontSize: 14, color: 'var(--muted-ink)' }}>{tx(placeName(g, g.place))}</p>
            </div>
          </div>
        )}
        {tab === 'save' && !g && <p style={{ fontSize: 16 }}>{t('noGameToSave')}</p>}
        {note && <p role="status" style={{ padding: '12px 16px', background: 'rgba(47,94,85,.12)', fontSize: 15 }}>{note}</p>}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderBottom: '1px solid var(--rule)' }}>
          {views.map((v) => {
            const auto = v.slot === 'auto';
            const filled = v.state === 'ok';
            const c = confirm?.slot === v.slot ? confirm.kind : null;
            return (
              <li key={String(v.slot)} className="slot">
                {filled ? <Medallion spec={v.summary.portrait} size={60} gone={!v.summary.alive} /> : <Medallion size={60} />}
                <div className="slot-text">
                  <p style={{ fontSize: 13, color: 'var(--jaju)' }}>{slotName(v.slot, t)}{filled && v.label ? ` · ${v.label}` : ''}{filled && v.restored ? ` · ${L('restored from backup', '예비본에서 복구')}` : ''}</p>
                  {filled && (
                    <>
                      <p style={{ fontSize: 19, fontWeight: 500 }}>{lang === 'ko' ? v.summary.name.ko ?? v.summary.name.en : v.summary.name.en}</p>
                      <p style={{ fontSize: 15, color: 'var(--text-paper-2)' }}>{slotLine(v, lang).a}</p>
                      <p style={{ fontSize: 13, color: 'var(--muted-paper)' }}>{v.summary.alive ? slotLine(v, lang).b : t('ended')}</p>
                    </>
                  )}
                  {v.state === 'empty' && (
                    <>
                      <p style={{ fontSize: 19, fontWeight: 500 }}>{t('emptySlot')}</p>
                      <p style={{ fontSize: 15, color: 'var(--text-paper-2)' }}>{tab === 'save' ? t('emptySlotSave') : t('emptySlotLoad')}</p>
                    </>
                  )}
                  {v.state === 'unreadable' && (
                    <>
                      <p style={{ fontSize: 19, fontWeight: 500 }}>{t('unreadable')}</p>
                      <p style={{ fontSize: 15, color: 'var(--text-paper-2)' }}>{t(v.reason === 'newer' ? 'unreadableNewer' : 'unreadableBroken')}</p>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {tab === 'save' && !auto && g && v.state !== 'unreadable' && (
                    <button className="btn btn-wine btn-small" type="button" onClick={() => (filled ? setConfirm({ slot: v.slot, kind: 'overwrite' }) : write(v.slot))}>{filled ? t('overwrite') : t('saveHere')}</button>
                  )}
                  {tab === 'save' && auto && <span style={{ fontSize: 14, color: 'var(--muted-paper)' }}>{t('updatedAuto')}</span>}
                  {tab === 'load' && filled && <button className="btn btn-wine btn-small" type="button" onClick={() => open(v.slot)}>{t('load')}</button>}
                  {filled && <button className="btn-text" type="button" onClick={() => setNaming({ slot: v.slot, text: v.label ?? '' })}>{L('Rename', '이름 짓기')}</button>}
                  {filled && <button className="btn-text" type="button" onClick={() => { void download(v.slot); }}>{L('Export', '내보내기')}</button>}
                  {filled && !auto && <button className="btn-text" type="button" onClick={() => setConfirm({ slot: v.slot, kind: 'delete' })}>{t('delete')}</button>}
                </div>
                {naming?.slot === v.slot && (
                  <form className="confirm" onSubmit={(e) => { e.preventDefault(); renameSlot(v.slot, naming.text); setNaming(null); refresh(); }}>
                    <label style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>{L('A name for this save', '이 저장의 이름')}
                      <input className="text-in" value={naming.text} maxLength={60} onChange={(e) => setNaming({ slot: v.slot, text: e.currentTarget.value })} />
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-wine btn-small" type="submit">{L('Save name', '이름 저장')}</button>
                      <button className="btn btn-line btn-small" type="button" onClick={() => setNaming(null)}>{t('cancel')}</button>
                    </div>
                  </form>
                )}
                {c && (
                  <div className="confirm" role="alertdialog" aria-label={c === 'overwrite' ? t('overwriteAsk', { name: nameOf(v.slot) }) : t('deleteAsk', { name: nameOf(v.slot), slot: slotName(v.slot, t) })}>
                    <p style={{ flex: '1 1 280px', fontSize: 15, lineHeight: 1.5 }}>{c === 'overwrite' ? t('overwriteAsk', { name: nameOf(v.slot) }) : t('deleteAsk', { name: nameOf(v.slot), slot: slotName(v.slot, t) })}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-wine btn-small" type="button" onClick={() => (c === 'delete' ? erase(v.slot) : write(v.slot))}>{c === 'delete' ? t('delete') : t('overwrite')}</button>
                      <button className="btn btn-line btn-small" type="button" onClick={() => setConfirm(null)}>{t('cancel')}</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <section className="kit-card">
          <header className="kit-card-head"><h3>{L('Import a save file', '저장 파일 가져오기')}<span className="ko" lang="ko">導入</span></h3></header>
          <p className="kit-note">{L('Bring back a file you exported. It is checked in full before it replaces the slot you choose.', '내보냈던 파일을 다시 가져온다. 고른 칸에 쓰기 전에 전부 검사한다.')}</p>
          <div className="kit-actions" style={{ marginTop: 10 }}>
            <label style={{ fontSize: 14 }}>{L('Into', '넣을 칸')}{' '}
              <select className="kit-select" value={String(importTo)} onChange={(e) => setImportTo((e.currentTarget.value === 'auto' ? 'auto' : Number(e.currentTarget.value)) as SlotId)}>
                {SLOTS.filter((x) => x !== 'auto').map((x) => <option key={String(x)} value={String(x)}>{slotName(x, t)}</option>)}
              </select>
            </label>
            <label className="btn btn-line btn-small file-btn">{L('Choose file…', '파일 고르기…')}<input type="file" accept="application/json,.json" onChange={(e) => bring(e.currentTarget.files?.[0])} /></label>
          </div>
        </section>
        {g && (
          <section className="kit-card">
            <header className="kit-card-head"><h3>{L('Checkpoints', '체크포인트')}<span className="ko" lang="ko">里程</span></h3></header>
            <p className="kit-note">{L('Taken automatically at each new season and generation of this family, in this browser only. The last twelve are kept.', '이 집안의 철과 대가 바뀔 때마다 이 브라우저에 저절로 남긴다. 최근 열두 개를 보관한다.')}</p>
            <ul className="kit-list">
              {cps.map((c) => (
                <li key={c.id} className="kit-line">
                  <div><span>{lang === 'ko' ? c.summary.name.ko ?? c.summary.name.en : c.summary.name.en} · {c.summary.year} · {c.reason === 'generation' ? L('new generation', '새 세대') : L('new season', '새 철')}</span><span className="kit-sub">{new Date(c.at).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-GB')}</span></div>
                  <button className="btn btn-line btn-small" type="button" onClick={() => openCp(c)}>{t('load')}</button>
                </li>
              ))}
              {cps.length === 0 && <li className="kit-note">{L('None yet: the first is taken when this season ends.', '아직 없다. 이번 철이 끝나면 첫 체크포인트가 생긴다.')}</li>}
            </ul>
          </section>
        )}
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted-paper)' }}>{t('saveFormat', { v: SAVE_VERSION })}</p>
      </div>
    </main>
  );
}
