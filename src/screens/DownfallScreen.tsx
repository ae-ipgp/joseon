import { useGame } from '../store/game';
import { useUi } from '../store/ui';
import { useL } from '../ui/kit';
import { continueAsCommoner, endCampaign } from '../engine/justice';
import { sfx } from '../audio/sound';

/** Master §7.2 and GSDD Part I §14.3: the campaign pauses when noble or royal status is formally revoked. */
export function DownfallScreen() {
  const g = useGame((s) => s.game)!;
  const replace = useGame((s) => s.replace);
  const go = useUi((s) => s.go);
  const { L, tx } = useL();
  const d = g.pol.downfall!;
  return (
    <div className="downfall" role="alertdialog" aria-modal="true" aria-labelledby="df-title" aria-describedby="df-body">
      <div className="downfall-inner">
        <p className="downfall-seal ko" lang="ko" aria-hidden="true">庶人</p>
        <h1 id="df-title">{L('You are now a commoner.', '이제 당신은 평민이다.')}</h1>
        <div id="df-body">
          <p>{L('Your former privileges, position and social standing have been taken away. Your previous life is no longer available in its former form.', '예전의 특권과 지위와 신분을 모두 빼앗겼다. 지난 삶은 더 이상 예전 모습으로 돌아오지 않는다.')}</p>
          <p className="downfall-cause">{tx(d.cause)}</p>
          <p>{L('However, your story does not necessarily have to end here.', '그러나 당신의 이야기가 반드시 여기서 끝나야 하는 것은 아니다.')}</p>
        </div>
        <div className="downfall-choices">
          <button type="button" className="btn btn-gold" onClick={() => { sfx('drum'); replace(continueAsCommoner(g)); go('play'); }}>
            <span className="downfall-btn-title">{L('Continue this life', '이 삶을 이어 가기')}</span>
            <span className="downfall-btn-text">{L('Remain a commoner: work, keep your family, seek justice and perhaps restoration.', '평민으로 남아 일하고, 가족을 지키고, 진실과 복권을 구한다.')}</span>
          </button>
          <button type="button" className="btn btn-line downfall-end" onClick={() => { sfx('bell'); replace(endCampaign(g)); go('legacy'); }}>
            <span className="downfall-btn-title">{L('End this campaign', '이 캠페인을 끝내기')}</span>
            <span className="downfall-btn-text">{L('Close this character’s story and see what they leave behind.', '이 인물의 이야기를 마치고 남긴 것을 돌아본다.')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
