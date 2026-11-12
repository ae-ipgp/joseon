import type { Game } from '../model/schemas';
import { useT } from '../i18n/useT';
import { WEALTH } from '../content/lists';
import { WEALTH_ORDER, formatMoney, seasonAccounts, wealthBar, wealthOf } from '../engine/money';

/** A Joseon coin: round, with a square hole for the string. */
export function Coin({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" style={{ flex: 'none', display: 'inline-block', verticalAlign: '-2px' }}>
      <circle cx="8" cy="8" r="7" style={{ fill: 'var(--gold-light)', stroke: 'var(--gold)', strokeWidth: 1 }} />
      <circle cx="8" cy="8" r="5.2" style={{ fill: 'none', stroke: 'var(--gold)', strokeWidth: 0.6, opacity: 0.8 }} />
      <rect x="5.6" y="5.6" width="4.8" height="4.8" style={{ fill: 'var(--ink)', stroke: 'var(--gold)', strokeWidth: 0.6 }} />
    </svg>
  );
}

/**
 * The household purse on a four-band bar, from poor to rich, with the amount in nyang
 * and, on paper pages, the season's income and costs.
 */
export function WealthBar({ g, tone = 'paper', accounts = true }: { g: Game; tone?: 'paper' | 'ink'; accounts?: boolean }) {
  const { t, tx, lang } = useT();
  const money = g.player.money;
  const tier = wealthOf(money);
  const pct = wealthBar(money);
  const a = seasonAccounts(g);
  const ink = tone === 'ink';
  const muted = ink ? 'var(--muted-ink)' : 'var(--muted-paper)';
  return (
    <div className={'wealth' + (ink ? ' ink' : '')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>{t('wealth')}: {tx(WEALTH[tier])}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}><Coin size={15} />{formatMoney(money, lang)}</span>
      </div>
      <div className="wealth-bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`${t('wealth')}: ${tx(WEALTH[tier])}, ${formatMoney(money, lang)}`}>
        <span className="fill" style={{ width: `${Math.max(2, pct)}%` }} />
        {[25, 50, 75].map((x) => <i key={x} style={{ left: `${x}%` }} />)}
      </div>
      <div className="wealth-bands" aria-hidden="true">
        {WEALTH_ORDER.map((w) => <span key={w} className={w === tier ? 'on' : undefined}>{tx(WEALTH[w])}</span>)}
      </div>
      {accounts && (
        <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: muted }}>
          {t('accountsLine', { total: `${a.total >= 0 ? '+' : '−'}${Math.abs(a.total)}`, household: a.household, salary: a.salary, upkeep: a.upkeep })}
        </p>
      )}
    </div>
  );
}
