import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '../save/diagnostics';
import { useSettings } from '../store/settings';
import { useUi } from '../store/ui';

type Props = { children?: ReactNode };
type State = { failed: boolean; message: string };

/**
 * GSDD Part VI §13: a failure in one screen must not take the game down with it. The error is kept in a
 * small local log (Settings → Diagnostics) and the player can go back to the main menu; the autosave
 * written before the failure is untouched.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { failed: false, message: '' };
  }
  static getDerivedStateFromError(e: unknown): State {
    return { failed: true, message: e instanceof Error ? e.message : String(e) };
  }
  componentDidCatch(e: unknown, info: ErrorInfo) {
    logError(e, info.componentStack ?? '');
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const ko = useSettings.getState().lang === 'ko';
    return (
      <main className="paper-screen" role="alert">
        <div className="wrap kit-wrap" style={{ maxWidth: 680 }}>
          <h1 className="kit-title">{ko ? '문제가 생겼다' : 'Something went wrong'}</h1>
          <p className="kit-note">{ko ? '이 화면을 그리다 오류가 났다. 자동 저장은 그대로 남아 있다. 주 메뉴로 돌아가 이어 하면 된다.' : 'This screen failed to draw. Your autosave is safe: go back to the main menu and continue from there.'}</p>
          <p className="kit-sub" style={{ fontFamily: 'monospace' }}>{this.state.message}</p>
          <div className="kit-actions" style={{ marginTop: 16 }}>
            <button className="btn btn-wine" type="button" onClick={() => { this.setState({ failed: false, message: '' }); useUi.getState().go('menu'); }}>{ko ? '주 메뉴' : 'Main menu'}</button>
          </div>
        </div>
      </main>
    );
  }
}
