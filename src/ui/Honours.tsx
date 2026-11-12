import { useEffect } from 'react';
import { useUi } from '../store/ui';
import { useT } from '../i18n/useT';
import { achievementById } from '../content/achievements';
import { Seal } from './parts';

/** Announces each achievement as it is earned: a seal pressed onto a strip of paper, then gone. */
export function HonourNotice() {
  const { t, tx } = useT();
  const queue = useUi((s) => s.honours);
  const shift = useUi((s) => s.shiftHonour);
  const go = useUi((s) => s.go);
  const head = queue[0];
  const def = head ? achievementById(head.id) : undefined;

  useEffect(() => {
    if (!head) return;
    const id = setTimeout(shift, 6000);
    return () => clearTimeout(id);
  }, [head, shift]);
  useEffect(() => {
    if (head && !def) shift();
  }, [head, def, shift]);

  return (
    <div aria-live="polite" role="status" className="honour-wrap">
      {head && def && (
        <div key={head.id + queue.length} className="honour paper">
          <Seal text={def.seal} size={52} stamp tilt={-8} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 13, letterSpacing: '0.04em', color: 'var(--jaju)' }}>{t('achievementEarned')}</p>
            <p style={{ marginTop: 2, fontSize: 19, lineHeight: 1.3 }}>{tx(def.title)}</p>
            {head.notes.length > 0 && <p style={{ marginTop: 3, fontSize: 14, lineHeight: 1.45, color: 'var(--muted-paper)' }}>{t('rewardIs', { reward: head.notes.map(tx).join(', ') })}</p>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <button className="link-paper" type="button" onClick={() => { shift(); go('honours'); }}>{t('seeAll')}</button>
            <button className="link-paper" type="button" onClick={shift} style={{ color: 'var(--muted-paper)' }}>{t('dismiss')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
