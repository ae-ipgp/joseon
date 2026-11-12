import { memo, useMemo } from 'react';
import { ell, hips, peak, range, rects, ridge, rng, roof } from './kit';

/** The main menu's night: the five peaks of the Irworobongdo screen behind a palace hall, under a full moon. */
function Backdrop() {
  const d = useMemo(() => {
    const r = rng(11);
    let stars = '';
    for (let i = 0; i < 52; i++) {
      const rad = 0.6 + r() * 1.2;
      stars += ell(Math.round(r() * 1600), Math.round(r() * 320), rad, rad);
    }
    const base = 660;
    const contour = (x: number, top: number, w: number) =>
      peak(x, base, w * 0.72, top + 28).replace('Z', '') + peak(x, base, w * 0.46, top + 62).replace('Z', '');
    return {
      stars,
      p1: peak(560, base, 210, 350), p2: peak(1520, base, 210, 350), p1c: contour(560, 350, 210), p2c: contour(1520, 350, 210),
      p3: peak(780, base, 232, 262), p4: peak(1300, base, 232, 262), p3c: contour(780, 262, 232), p4c: contour(1300, 262, 232),
      p5: peak(1040, base, 272, 148), p5c: contour(1040, 148, 272),
      corL: roof(520, 628, 460, 44), corR: roof(1500, 628, 300, 44),
      roofLow: roof(1040, 470, 720, 96), hipLow: hips(1040, 470, 720, 96), ridgeLow: ridge(1040, 470, 720),
      roofUp: roof(1040, 322, 560, 110), hipUp: hips(1040, 322, 560, 110), ridgeUp: ridge(1040, 322, 560),
      winLow: rects(range(800, 1300, 50), 604, 34, 80), winUp: rects(range(924, 1164, 48), 428, 30, 44),
    };
  }, []);
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="mm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0D0A0E" /><stop offset="0.45" stopColor="#2A0C15" /><stop offset="0.72" stopColor="#5A1A24" /><stop offset="1" stopColor="#2A0E14" />
        </linearGradient>
        <radialGradient id="mm-halo"><stop offset="0" stopColor="#EDE3CC" stopOpacity="0.32" /><stop offset="0.45" stopColor="#C9A86A" stopOpacity="0.1" /><stop offset="1" stopColor="#C9A86A" stopOpacity="0" /></radialGradient>
        <linearGradient id="mm-glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A0503E" stopOpacity="0" /><stop offset="0.6" stopColor="#A0503E" stopOpacity="0.32" /><stop offset="1" stopColor="#A0503E" stopOpacity="0" /></linearGradient>
        <linearGradient id="mm-peak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B1A22" /><stop offset="1" stopColor="#170C10" /></linearGradient>
        <pattern id="mm-lat" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#C08A4C" /><path d="M0 0H7M0 0V7" stroke="#1A1012" strokeWidth="1.3" /></pattern>
        <filter id="mm-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>
      <rect width="1600" height="900" fill="url(#mm-sky)" />
      <path d={d.stars} fill="#EDE3CC" opacity="0.55" />
      <circle cx="840" cy="250" r="330" fill="url(#mm-halo)" />
      <circle cx="840" cy="250" r="118" fill="#EDE3CC" opacity="0.94" />
      <circle cx="806" cy="226" r="20" fill="#D9CCB0" opacity="0.35" />
      <circle cx="872" cy="292" r="13" fill="#D9CCB0" opacity="0.3" />
      <rect x="0" y="430" width="1600" height="300" fill="url(#mm-glow)" />
      <path d={d.p1} fill="#2E141B" /><path d={d.p2} fill="#2E141B" />
      <path d={d.p1c + d.p2c} fill="none" stroke="#B08D57" strokeWidth="1.4" opacity="0.28" />
      <path d={d.p3} fill="url(#mm-peak)" /><path d={d.p4} fill="url(#mm-peak)" />
      <path d={d.p3c + d.p4c} fill="none" stroke="#B08D57" strokeWidth="1.5" opacity="0.38" />
      <path d={d.p5} fill="url(#mm-peak)" />
      <path d={d.p5c} fill="none" stroke="#C9A86A" strokeWidth="1.6" opacity="0.45" />
      <g className="mm-mist">
        <ellipse cx="880" cy="600" rx="560" ry="34" fill="#EDE3CC" opacity="0.07" />
        <ellipse cx="1240" cy="566" rx="420" ry="22" fill="#EDE3CC" opacity="0.06" />
        <ellipse cx="560" cy="640" rx="520" ry="28" fill="#EDE3CC" opacity="0.08" />
      </g>
      <path d="M1590,900 C1566,770 1526,650 1534,530 C1542,440 1506,368 1474,306 L1488,300 C1522,362 1560,440 1552,530 C1544,650 1588,770 1616,900 Z" fill="#2A1512" />
      <path d="M1512,400 L1440,420 M1546,470 L1610,452 M1506,360 L1600,330" stroke="#2A1512" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="1462" cy="296" rx="96" ry="22" fill="#0E0B0B" /><ellipse cx="1580" cy="330" rx="84" ry="18" fill="#0E0B0B" />
      <ellipse cx="1430" cy="418" rx="74" ry="17" fill="#0E0B0B" /><ellipse cx="1600" cy="450" rx="70" ry="16" fill="#0E0B0B" />
      <path d={d.corL} fill="#120C0E" /><path d={d.corR} fill="#120C0E" />
      <rect x="300" y="662" width="440" height="62" fill="#0D090A" /><rect x="1360" y="662" width="260" height="62" fill="#0D090A" />
      <rect x="660" y="722" width="760" height="40" fill="#140E10" /><rect x="716" y="698" width="648" height="26" fill="#181113" />
      <path d="M660,722H1420M716,698H1364" stroke="#3A2C30" strokeWidth="1.5" />
      <rect x="780" y="546" width="520" height="154" fill="#0E0A0B" />
      <path d={d.winLow} fill="url(#mm-lat)" opacity="0.42" />
      <rect x="902" y="398" width="276" height="92" fill="#0E0A0B" />
      <path d={d.winUp} fill="url(#mm-lat)" opacity="0.32" />
      <path d={d.roofLow} fill="#130D0F" /><path d={d.hipLow} fill="none" stroke="#3A2E33" strokeWidth="3" strokeLinecap="round" />
      <path d={d.roofUp} fill="#130D0F" /><path d={d.hipUp} fill="none" stroke="#3A2E33" strokeWidth="3" strokeLinecap="round" />
      <path d={d.ridgeUp + d.ridgeLow} fill="#2C2228" />
      <rect x="0" y="760" width="1600" height="140" fill="#0C0809" />
      <rect width="1600" height="900" filter="url(#mm-grain)" opacity="0.07" />
    </svg>
  );
}

export const MenuBackdrop = memo(Backdrop);
