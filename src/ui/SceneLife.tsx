/**
 * v0.6: small living things above an illustrated scene: a skein of birds and drifting cloud by day,
 * slanting light in the morning, a falling star now and then at night. Pure SVG and CSS, no canvas;
 * all of it stops under "Reduce motion".
 */
export function SceneLife({ night, morning }: { night: boolean; morning: boolean }) {
  const bird = 'M0,0 q6,-7 12,0 q6,-7 12,0';
  return (
    <div className={'scene-life' + (night ? ' sl-night' : '')} aria-hidden="true">
      {!night && (
        <>
          <div className="sl-cloud sl-cloud-a" />
          <div className="sl-cloud sl-cloud-b" />
          {morning && <div className="sl-rays" />}
          <svg className="sl-birds" viewBox="0 0 200 80" preserveAspectRatio="xMidYMid meet">
            {[[20, 40, 1], [52, 26, 0.85], [56, 52, 0.8], [88, 14, 0.7], [94, 62, 0.72], [128, 34, 0.6]].map(([x, y, s], i) => (
              <g key={i} transform={`translate(${x},${y}) scale(${s})`}>
                <path d={bird} className="sl-bird" style={{ animationDelay: `${i * -0.17}s` }} />
              </g>
            ))}
          </svg>
          <svg className="sl-birds sl-birds-far" viewBox="0 0 200 80" preserveAspectRatio="xMidYMid meet">
            {[[30, 30, 0.5], [50, 22, 0.45], [54, 40, 0.45], [78, 14, 0.4]].map(([x, y, s], i) => (
              <g key={i} transform={`translate(${x},${y}) scale(${s})`}>
                <path d={bird} className="sl-bird" style={{ animationDelay: `${i * -0.23}s` }} />
              </g>
            ))}
          </svg>
        </>
      )}
      {night && (
        <>
          <span className="sl-star sl-star-a" />
          <span className="sl-star sl-star-b" />
          <div className="sl-moonhaze" />
        </>
      )}
    </div>
  );
}
