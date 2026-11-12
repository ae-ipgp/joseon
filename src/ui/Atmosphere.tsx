import { useEffect, useRef } from 'react';
import { useSettings } from '../store/settings';

/**
 * v0.6: the air of a scene, drawn on a 2D canvas above the illustration: cherry petals in spring, fireflies on
 * summer nights, falling leaves in autumn, snow in winter, rain when the weather calls for it and drifting
 * dust motes indoors. Purely decorative: it never takes clicks, stops when the tab is hidden, and is not
 * drawn at all when "reduce motion" is on.
 */
export type Air = 'petals' | 'fireflies' | 'leaves' | 'snow' | 'rain' | 'motes' | 'embers' | 'none';
/** Which air a season, time and weather call for. */
export function airFor(season: number, night: boolean, weather?: string): Air {
  if (weather === 'rain' || weather === 'storm') return season === 3 ? 'snow' : 'rain';
  if (weather === 'snow' || season === 3) return 'snow';
  if (season === 0) return 'petals';
  if (season === 1) return night ? 'fireflies' : 'motes';
  return 'leaves';
}

type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; spin: number; rot: number; hue: number; life: number };
const COUNT: Record<Air, number> = { petals: 46, fireflies: 26, leaves: 30, snow: 90, rain: 150, motes: 34, embers: 30, none: 0 };
const LEAF = ['#C0682E', '#D9A93A', '#A5482A', '#B88A2E'];
const PETAL = ['#F4C9CF', '#F7DDE0', '#EFB3BD', '#FBEDEE'];

export function Atmosphere({ air, className, strength = 1 }: { air: Air; className?: string; strength?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const calm = useSettings((s) => s.calm);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || air === 'none' || calm) return;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const n = Math.round(COUNT[air] * strength * Math.min(1.3, Math.max(0.5, (w * h) / 900000)));
    const rnd = Math.random;
    const make = (fresh: boolean): P => {
      const p: P = { x: rnd() * w, y: fresh ? rnd() * h : -12, vx: 0, vy: 0, r: 1, a: 1, spin: 0, rot: rnd() * 6.28, hue: Math.floor(rnd() * 4), life: rnd() * 6.28 };
      if (air === 'petals') { p.vx = 14 + rnd() * 26; p.vy = 22 + rnd() * 30; p.r = 3 + rnd() * 3.5; p.spin = (rnd() - 0.5) * 3; p.a = 0.75 + rnd() * 0.25; }
      else if (air === 'leaves') { p.vx = -10 + rnd() * 40; p.vy = 30 + rnd() * 38; p.r = 4 + rnd() * 4; p.spin = (rnd() - 0.5) * 4; p.a = 0.85; }
      else if (air === 'snow') { p.vx = -8 + rnd() * 16; p.vy = 26 + rnd() * 44; p.r = 1 + rnd() * 2.6; p.a = 0.55 + rnd() * 0.45; }
      else if (air === 'rain') { p.vx = -60; p.vy = 620 + rnd() * 280; p.r = 9 + rnd() * 14; p.a = 0.18 + rnd() * 0.22; }
      else if (air === 'fireflies') { p.y = h * (0.45 + rnd() * 0.5); p.vx = (rnd() - 0.5) * 16; p.vy = (rnd() - 0.5) * 10; p.r = 1.4 + rnd() * 1.4; }
      else if (air === 'embers') { p.y = fresh ? rnd() * h : h + 10; p.vx = (rnd() - 0.5) * 12; p.vy = -(12 + rnd() * 26); p.r = 1 + rnd() * 1.8; p.a = 0.5 + rnd() * 0.5; }
      else { p.y = rnd() * h; p.vx = 3 + rnd() * 8; p.vy = -2 + rnd() * 5; p.r = 0.8 + rnd() * 1.8; p.a = 0.18 + rnd() * 0.3; }
      return p;
    };
    const ps: P[] = Array.from({ length: n }, () => make(true));
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const sway = Math.sin(t * 1.3 + p.life) * (air === 'rain' ? 0 : 14);
        p.x += (p.vx + sway) * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        if (air === 'fireflies') {
          p.vx += (rnd() - 0.5) * 20 * dt;
          p.vy += (rnd() - 0.5) * 16 * dt;
          const glow = 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.6 + p.life));
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
          g.addColorStop(0, `rgba(232, 240, 150, ${0.9 * glow})`);
          g.addColorStop(0.25, `rgba(210, 230, 120, ${0.35 * glow})`);
          g.addColorStop(1, 'rgba(210, 230, 120, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 7, 0, 6.28);
          ctx.fill();
          if (p.x < -20 || p.x > w + 20 || p.y < h * 0.3 || p.y > h + 20) ps[i] = make(true);
          continue;
        }
        if (air === 'rain') {
          ctx.strokeStyle = `rgba(214, 226, 236, ${p.a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.r * 0.1, p.y - p.r);
          ctx.stroke();
        } else if (air === 'snow' || air === 'motes') {
          ctx.fillStyle = air === 'snow' ? `rgba(255, 255, 255, ${p.a})` : `rgba(255, 240, 205, ${p.a * (0.6 + 0.4 * Math.sin(t + p.life))})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.28);
          ctx.fill();
        } else if (air === 'embers') {
          ctx.fillStyle = `rgba(242, 178, 96, ${p.a * (0.5 + 0.5 * Math.sin(t * 3 + p.life))})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.28);
          ctx.fill();
        } else {
          // Petals and leaves: a small tumbling almond shape.
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.cos(t * 1.7 + p.life)));
          ctx.globalAlpha = p.a;
          ctx.fillStyle = (air === 'petals' ? PETAL : LEAF)[p.hue];
          ctx.beginPath();
          ctx.moveTo(-p.r, 0);
          ctx.quadraticCurveTo(0, -p.r * (air === 'petals' ? 0.9 : 0.7), p.r, 0);
          ctx.quadraticCurveTo(0, p.r * (air === 'petals' ? 0.9 : 0.7), -p.r, 0);
          ctx.fill();
          ctx.restore();
        }
        if (p.y > h + 16 || p.y < -30 || p.x > w + 30 || p.x < -40) ps[i] = make(false), (ps[i].x = air === 'rain' ? rnd() * (w + 80) : ps[i].x);
      }
      raf = requestAnimationFrame(draw);
    };
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(draw); }
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', vis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [air, calm, strength]);
  if (air === 'none' || calm) return null;
  return <canvas ref={ref} className={'atmosphere ' + (className ?? '')} aria-hidden="true" />;
}
